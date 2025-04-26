from django.contrib import admin
from django import forms
from django.utils import timezone
from datetime import timedelta
from .models import InitialData, ServiceType, FAQ, SliderImage, Review, Contact, WorkingHours, Service, BookedTime, Master


@admin.register(InitialData)
class InitialDataAdmin(admin.ModelAdmin):
    list_display = ('address', 'phone', 'working_hours')

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('name', 'review_text')

class ContactInline(admin.StackedInline):
    model = Contact
    extra = 1
    max_num = 1  
    verbose_name = "Контакт"
    verbose_name_plural = "Контакты"


class WorkingHoursForm(forms.ModelForm):
    class Meta:
        model = WorkingHours
        fields = '__all__'

class WorkingHoursInline(admin.StackedInline):
    model = WorkingHours
    form = WorkingHoursForm
    extra = 1
    verbose_name = "Рабочее время"
    verbose_name_plural = "Рабочее время"
    max_num = 1  

class ServiceInline(admin.TabularInline):
    model = Service
    extra = 3
    max_num = 6 
    verbose_name = "Услуга"
    verbose_name_plural = "Услуги"

class BookedTimeAdmin(admin.ModelAdmin):
    list_display = ('date', 'time', 'service', 'client_name', 'client_contact')  
    list_filter = ('date', 'master', 'is_booked')  
    fields = ('master', 'date', 'time', 'service', 'client_name', 'client_contact')   


class BookedTimeInline(admin.TabularInline):
    model = BookedTime
    readonly_fields = ('display_info',)  
    extra = 0  
    verbose_name = "Забронированное время"
    verbose_name_plural = "Забронированное время"
    can_delete = True  

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        today = timezone.now().date() 
        end_date = today + timedelta(days=2) 
        return qs.filter(date__gte=today, date__lte=end_date, is_booked=True)

    def display_info(self, instance):
        return f"{instance.date} --- {instance.time.strftime('%H:%M')} --- {instance.service} --- {instance.client_name} {instance.client_contact}"

    display_info.short_description = "Информация о бронировании"

    fields = ('display_info',) 

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Master)
class MasterAdmin(admin.ModelAdmin):
    list_display = ('name', 'specialty')
    inlines = [ContactInline, WorkingHoursInline, ServiceInline, BookedTimeInline]
    search_fields = ['name', 'specialty']

    class Meta:
        verbose_name = "Мастер"
        verbose_name_plural = "Мастера"

admin.site.register(ServiceType)
admin.site.register(FAQ)
admin.site.register(SliderImage)
