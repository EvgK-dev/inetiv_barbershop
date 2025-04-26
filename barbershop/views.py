from django.shortcuts import render, redirect
from django.http import HttpResponseBadRequest, JsonResponse
from django.urls import reverse
from django.utils import timezone
from datetime import date, timedelta
from decouple import config
from telegram import Bot, InlineKeyboardButton, InlineKeyboardMarkup
from asgiref.sync import sync_to_async
from .models import InitialData, ServiceType, FAQ, SliderImage, Review, Master, Service, BookedTime, WorkingHours, Contact


# ссылки
def get_common_links():
    """Возвращает словарь с URL-адресами для навигации."""
    return {
        'location': reverse('barbershop') + '#contacts_info',
        'work_time': reverse('barbershop') + '#masters_block',
        'main_page': reverse('barbershop'),
        'main_services': reverse('barbershop') + '#services_list',
        'main_masters': reverse('barbershop') + '#masters_block',
        'booking': reverse('barberbooking'),
        'main_contact': reverse('barbershop') + '#contacts_info',
        'main_foto': reverse('barbershop') + '#photo_galery',
        'main_feedback': reverse('barbershop') + '#main_feedback',
        'privacy_policy': reverse('privacy_policy'),
    }

# представления
def barbershop(request):
    """Главная страница барбершопа."""
    data = InitialData.objects.first()
    services = ServiceType.objects.all()
    faqs = FAQ.objects.all()
    slider_images = SliderImage.objects.all()
    review = Review.objects.all()
    masters = Master.objects.prefetch_related('service_set', 'contact_set', 'workinghours_set').all()

    context = {
        'data': data,
        'services': services,
        'faqs': faqs,
        'slider_images': slider_images,
        'reviews': review,
        'masters': masters,
    }
    context.update(get_common_links())
    return render(request, 'barbershop/index.html', context)

def barberbooking(request):
    """Страница бронирования."""
    data = InitialData.objects.first()
    masters = Master.objects.prefetch_related('contact_set').only('id', 'name', 'specialty', 'large_photo')

    context = {
        'data': data,
        'masters': masters,
    }
    context.update(get_common_links())
    return render(request, 'barbershop/barberbooking.html', context)

def verify(request):
    """Страница проверки записи."""
    data = InitialData.objects.first()
    context = {
        'data': data,
    }
    context.update(get_common_links())
    return render(request, 'barbershop/verify.html', context)

def confirmation_view(request):
    """Страница подтверждения."""
    data = InitialData.objects.first()
    name = request.GET.get('name')
    phone = request.GET.get('phone')
    context = {
        'data': data,
        'name': name,
        'phone': phone
    }
    return render(request, 'barbershop/confirmation.html', context)

def privacy_policy(request):
    """Страница политики конфиденциальности."""
    data = InitialData.objects.first()
    context = {
        'data': data,
    }
    context.update(get_common_links())
    return render(request, 'barbershop/privacy_policy.html', context)




# AJAX-функции
def get_master_data(request):
    """Возвращает данные мастеров для фронтенда через AJAX."""
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        masters = Master.objects.all()
        master_data = []

        for master in masters:
            working_hours = []
            for wh in master.workinghours_set.all():
                for day, display_name in wh.DAYS:
                    working_hours.append({
                        'day': display_name,
                        'start_time': getattr(wh, f'{day}_start_time').strftime('%H:%M'),
                        'end_time': getattr(wh, f'{day}_end_time').strftime('%H:%M'),
                        'is_working': getattr(wh, f'{day}_is_working'),
                    })

            booked_times = [{
                'date': bt.date,
                'time': bt.time.strftime('%H:%M'),
                'service': bt.service.service_name,
                'service_price': bt.service.price,
                'service_duration': bt.service.get_duration_display(),
                'client_name': bt.client_name,
                'client_contact': bt.client_contact
            } for bt in master.booked_times.filter(date__range=[date.today(), date.today() + timedelta(days=60)])]

            services = [{
                'service_name': service.service_name,
                'price': service.price,
                'duration': service.get_duration_display()
            } for service in master.service_set.all()]

            master_data.append({
                'id': master.id,
                'name': master.name,
                'working_hours': working_hours,
                'booked_times': booked_times,
                'services': services
            })

        return JsonResponse(master_data, safe=False)
    return JsonResponse({'error': 'Invalid request'}, status=400)

def verify_record(request):
    """Проверяет записи по номеру телефона через AJAX."""
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        phone = request.GET.get('phone')

        if not phone or len(phone) < 6:
            return JsonResponse({'success': False, 'message': 'Неверный номер телефона'}, status=200)

        phone_number = f'{phone[-6:]}'
        bookings = BookedTime.objects.filter(client_contact__endswith=phone_number)

        if not bookings.exists():
            return JsonResponse({'success': False, 'message': 'Запись не найдена.'}, status=200)

        now = timezone.now()
        booking_info = []

        for booking in bookings:
            if booking.date >= now.date() and (booking.date > now.date() or booking.time >= now.time()):
                booking_info.append({
                    'date': booking.date.strftime('%Y-%m-%d'),
                    'time': booking.time.strftime('%H:%M'),
                    'master': booking.master.name,
                    'service': booking.service.service_name,
                })

        return JsonResponse({'success': True, 'bookings': booking_info}, safe=False)
    
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=200)



# Telegram-обработчики
@sync_to_async
def set_session_data(session, key, value):
    """Сохраняет данные в сессии."""
    session[key] = value
    session.save()

@sync_to_async
def create_booked_time(master, date, time, service, cost, duration, client_name, client_contact, client_email, client_comment):
    """Создает запись бронирования."""
    return BookedTime.objects.create(
        master=master,
        date=date,
        time=time,
        service=service,
        cost=cost,
        duration=duration,
        client_name=client_name,
        client_contact=client_contact,
        client_email=client_email,
        client_comment=client_comment or '-',
        is_booked=False
    )

async def send_telegram_message(request):
    """Отправляет сообщение в Telegram-группу."""
    if request.method == 'POST':
        name = request.POST.get('name')
        phone = request.POST.get('phone')
        email = request.POST.get('email')
        comment = request.POST.get('comment')

        telegram_bot_token = config('TELEGRAM_BOT_TOKEN')
        telegram_group_chat_id = config('TELEGRAM_GROUP_CHAT_ID')

        bot = Bot(token=telegram_bot_token)
        telegram_message = f"ПИСЬМО \ninetiv-barbershop!\n\nИмя: {name}\nТелефон: {phone}\nПочта: {email}\nКомментарий: {comment}"
        await bot.send_message(chat_id=telegram_group_chat_id, text=telegram_message)

        context = {'name': name, 'phone': phone}
        url = reverse('confirmation') + '?' + '&'.join([f'{key}={value}' for key, value in context.items()])
        return redirect(url)
    return HttpResponseBadRequest("Invalid request method.")

async def send_booking_to_telegram(request):
    """Отправляет бронирование в Telegram и сохраняет в базе."""
    if request.method == 'POST':
        try:
            master_id = request.POST.get('master_id')
            master_name = request.POST.get('master')
            date = request.POST.get('date')
            time = request.POST.get('time')
            service_name = request.POST.get('service')
            cost = request.POST.get('cost')
            duration = request.POST.get('duration')
            client_name = request.POST.get('name')
            client_contact = request.POST.get('phone')
            client_email = request.POST.get('email')
            client_comment = request.POST.get('comment')

            master = await sync_to_async(Master.objects.get)(id=master_id)
            service = await sync_to_async(Service.objects.filter(service_name=service_name).first)()
            if not service:
                raise ValueError("Услуга не найдена.")

            telegram_bot_token = config('TELEGRAM_BOT_TOKEN_BARBER')
            telegram_group_chat_id = config('TELEGRAM_GROUP_CHAT_ID')

            bot = Bot(token=telegram_bot_token)
            telegram_message = (
                f"<b>ЗАПИСЬ!</b>\n\n"
                f"Мастер: <b>{master_name}</b>\n"
                f"id: <b>{master_id}</b>\n\n"
                f"Дата: <u>{date}</u>\n"
                f"Время: <u>{time}</u>\n\n"
                f"Услуга: {service_name}\n"
                f"Стоимость: {cost}\n"
                f"Длительность: {duration}\n\n"
                f"Имя клиента: {client_name}\n"
                f"Контакт: <code>{client_contact}</code>\n"
                f"Email: <code>{client_email}</code>\n"
                f"Комментарий: {client_comment or '-'}"
            )

            keyboard = [
                [
                    InlineKeyboardButton("Подтвердить", callback_data='confirm_booking'),
                    InlineKeyboardButton("Отменить", callback_data='cancel_booking'),
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await bot.send_message(
                chat_id=telegram_group_chat_id,
                text=telegram_message,
                parse_mode='HTML',
                reply_markup=reply_markup
            )

            # Сохранение бронирования
            await create_booked_time(
                master=master,
                date=date,
                time=time,
                service=service,
                cost=cost,
                duration=duration,
                client_name=client_name,
                client_contact=client_contact,
                client_email=client_email,
                client_comment=client_comment
            )

            context = {
                'master_name': master_name,
                'date': date,
                'time': time,
                'service': service_name,
                'cost': cost,
                'duration': duration,
                'client_name': client_name,
                'client_contact': client_contact,
                'client_email': client_email,
                'client_comment': client_comment or '-',
                'name': client_name,
                'phone': client_contact
            }

            url = reverse('confirmation') + '?' + '&'.join([f'{key}={value}' for key, value in context.items()])
            return redirect(url)

        except Exception as e:
            print(f'Ошибка: {str(e)}')
            return redirect('confirmation')

    return HttpResponseBadRequest("Invalid request method.")