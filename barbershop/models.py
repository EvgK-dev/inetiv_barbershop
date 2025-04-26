from django.db import models
from django.core.exceptions import ValidationError
from multiselectfield import MultiSelectField

# Режим работы и адрес
class InitialData(models.Model):
    address = models.CharField("Адрес", max_length=255)
    phone = models.CharField("Телефон", max_length=20)
    working_hours = models.TextField("Режим работы")

    class Meta:
        verbose_name = "Режим работы и адрес (общие)"
        verbose_name_plural = "Режим работы и адрес (общие)"

    def __str__(self):
        return f'{self.working_hours}'

    def save(self, *args, **kwargs):
        if InitialData.objects.exists() and not self.pk:
            raise ValidationError("Можно добавить только одну запись в таблицу 'Режим работы и адрес'")
        super(InitialData, self).save(*args, **kwargs)


# Услуги
class ServiceType(models.Model):
    service_name = models.CharField("Название услуги", max_length=255)
    service_description = models.TextField("Описание услуги")
    service_price_time = models.CharField("Стоимость и время", max_length=255)
    service_image = models.ImageField("Изображение", upload_to='service_images/')

    class Meta:
        verbose_name = "виды услуг (общие)"
        verbose_name_plural = "виды услуг (общие)"

    def __str__(self):
        return self.service_name
    
# FAQ
class FAQ(models.Model):
    question = models.CharField("Вопрос", max_length=255)
    answer = models.TextField("Ответ")

    class Meta:
        verbose_name = "Часто задаваемый вопрос"
        verbose_name_plural = "Часто задаваемые вопросы"

    def __str__(self):
        return self.question

# Галерея
class SliderImage(models.Model):
    image = models.ImageField("Изображение", upload_to='slider_images/')
    description = models.TextField("Описание", blank=True)

    class Meta:
        verbose_name = "Слайд"
        verbose_name_plural = "Слайды"

    def __str__(self):
        return f"Слайд {self.id}"
    

# Отзывы
class Review(models.Model):
    avatar = models.ImageField("Аватарка", upload_to='review_avatars/')
    name = models.CharField("Имя", max_length=255)
    review_text = models.TextField("Текст отзыва")

    class Meta:
        verbose_name = "Отзыв"
        verbose_name_plural = "Отзывы"

    def __str__(self):
        return f"Отзыв от {self.name}"


# Таблицы для мастеров
class Master(models.Model):
    name = models.CharField(max_length=100, verbose_name="Имя мастера")
    specialty = models.CharField(max_length=100, verbose_name="Специальность мастера")
    large_photo = models.ImageField(upload_to='masters/large_photos/', verbose_name="Большая фотография", blank=True, null=True)
    avatar = models.ImageField(upload_to='masters/avatars/', verbose_name="Аватар", blank=True, null=True)

    class Meta:
        verbose_name = "Мастер"
        verbose_name_plural = "Мастера"

    def __str__(self):
        return self.name


class Contact(models.Model):
    master = models.ForeignKey(Master, on_delete=models.CASCADE, verbose_name="Мастер")
    phone = models.CharField(max_length=20, verbose_name="Мобильный телефон")
    telegram = models.URLField(verbose_name="Телеграм")
    instagram = models.URLField(verbose_name="Инстаграм")
    tiktok = models.URLField(verbose_name="ТикТок")

    class Meta:
        verbose_name = "Контакт"
        verbose_name_plural = "Контакты"

    def __str__(self):
        return f"Контакты мастера {self.master.name}"



class WorkingHours(models.Model):
    master = models.ForeignKey(Master, on_delete=models.CASCADE, verbose_name="Мастер")

    DAYS = [
        ('mon', 'Понедельник'),
        ('tue', 'Вторник'),
        ('wed', 'Среда'),
        ('thu', 'Четверг'),
        ('fri', 'Пятница'),
        ('sat', 'Суббота'),
        ('sun', 'Воскресенье'),
    ]

    # Добавление чекбоксов для каждого дня
    for day, display_name in DAYS:
        locals()[f"{day}_is_working"] = models.BooleanField(default=True, verbose_name=f"{display_name} - рабочий день")
        locals()[f"{day}_start_time"] = models.TimeField(verbose_name=f"Начало дня", default="09:00")
        locals()[f"{day}_end_time"] = models.TimeField(verbose_name=f"Конец дня", default="18:00")

    def save(self, *args, **kwargs):
        # Установка времени начала и окончания на 00:00, если день не рабочий
        for day, display_name in self.DAYS:
            if not getattr(self, f"{day}_is_working"):
                setattr(self, f"{day}_start_time", "00:00")
                setattr(self, f"{day}_end_time", "00:00")

        super(WorkingHours, self).save(*args, **kwargs) 

    def clean(self):
        for day, display_name in self.DAYS:
            self.validate_day_time(day, display_name)

    def validate_day_time(self, day, display_name):
        start_time = getattr(self, f"{day}_start_time")
        end_time = getattr(self, f"{day}_end_time")
        
        # Дополнительная проверка, если день не рабочий
        if not getattr(self, f"{day}_is_working"):
            return 

        if end_time <= start_time:
            raise ValidationError(f'Время окончания рабочего дня в {display_name} должно быть больше времени начала.')

    def __str__(self):
        return f"{self.master.name}: " + ", ".join(
            f"{display_name} - {getattr(self, f'{day}_start_time')} - {getattr(self, f'{day}_end_time')}"
            for day, display_name in self.DAYS
        )

    class Meta:
        verbose_name = "Рабочие часы"
        verbose_name_plural = "Рабочие часы"

class Service(models.Model):
    DURATION_CHOICES = [
        (30, '30'),
        (60, '60'),
        (90, '90'),
    ]
    master = models.ForeignKey(Master, on_delete=models.CASCADE, verbose_name="Мастер")
    service_name = models.CharField(max_length=100, verbose_name="Название услуги")
    price = models.IntegerField(verbose_name="Стоимость")
    duration = models.IntegerField(choices=DURATION_CHOICES, verbose_name="Время выполнения")

    class Meta:
        verbose_name = "Услуга"
        verbose_name_plural = "Услуги"

    def __str__(self):
        return f"{self.service_name}"

# бронирование
class BookedTime(models.Model):
    master = models.ForeignKey(Master, on_delete=models.CASCADE, related_name="booked_times", verbose_name="Мастер")
    date = models.DateField(verbose_name="Дата")
    time = models.TimeField(verbose_name="Время")
    service = models.ForeignKey(Service, on_delete=models.CASCADE, verbose_name="Услуга")  # Изменено на ForeignKey
    cost = models.CharField(max_length=255, verbose_name="Стоимость", blank=True, null=True)
    duration = models.IntegerField(choices=[(30, '30 минут'), (60, '1 час'), (90, '1 час 30 минут')], verbose_name="Длительность", blank=True, null=True)
    is_booked = models.BooleanField(default=True, verbose_name="Забронировано")
    client_name = models.CharField(max_length=255, verbose_name="Имя клиента", blank=True, null=True)  # Новое поле
    client_contact = models.CharField(max_length=255, verbose_name="Контакт клиента", blank=True, null=True)  # Новое поле
    client_email = models.EmailField(verbose_name="Почта клиента", blank=True, null=True)  # Новое поле
    client_comment = models.TextField(verbose_name="Комментарий клиента", blank=True)  # Новое поле

    class Meta:
        verbose_name = "Забронированное время"
        verbose_name_plural = "Забронированное время"
        ordering = ['date', 'time']
 
    def __str__(self): 
        return ''   