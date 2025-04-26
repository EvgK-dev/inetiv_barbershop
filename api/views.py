from datetime import timedelta, datetime

from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from barbershop.models import Master, Service, BookedTime


# Подтверждение бронирования
@api_view(['POST'])
def confirm_booking(request):
    booking_data = request.data
    master_id = booking_data.get('master_id')
    date = booking_data.get('date')
    time = booking_data.get('time')
    client_name = booking_data.get('client_name')

    try:
        date_obj = datetime.strptime(date, '%Y-%m-%d').date()
        time_obj = datetime.strptime(time, '%H:%M').time()
    except ValueError:
        return Response({"message": "⚠️ Неверный формат даты или времени."}, status=status.HTTP_400_BAD_REQUEST)

    master = get_object_or_404(Master, id=master_id)

    existing_booking = BookedTime.objects.filter(master=master, date=date_obj, time=time_obj).first()
    if existing_booking:
        return Response(
            {"message": f"👤 На эту дату уже записан <code>{existing_booking.client_name}</code>."},
            status=status.HTTP_400_BAD_REQUEST
        )

    service_queryset = Service.objects.filter(service_name=booking_data.get('service_name'))
    if not service_queryset.exists():
        return Response({"message": "⚠️ Услуга не найдена."}, status=status.HTTP_404_NOT_FOUND)

    service = service_queryset.first()
    cost = ''.join(filter(str.isdigit, booking_data.get('cost', '0')))
    duration = ''.join(filter(str.isdigit, booking_data.get('duration', '30')))

    BookedTime.objects.create(
        master=master,
        date=date_obj,
        time=time_obj,
        service=service,
        cost=cost,
        duration=int(duration),
        client_name=client_name,
        client_contact=booking_data.get('client_contact'),
        client_email=booking_data.get('client_email'),
        client_comment=booking_data.get('client_comment', '-')
    )

    return Response({"message": "✅ Бронирование подтверждено!"}, status=status.HTTP_201_CREATED)


# Отмена бронирования
@api_view(['POST'])
def cancel_booking(request):
    booking_data = request.data
    master_id = booking_data.get('master_id')
    date = booking_data.get('date')
    time = booking_data.get('time')

    try:
        date_obj = datetime.strptime(date, '%Y-%m-%d').date()
        time_obj = datetime.strptime(time, '%H:%M').time()
    except ValueError:
        return Response({"message": "⚠️ Неверный формат даты или времени."}, status=status.HTTP_400_BAD_REQUEST)

    master = get_object_or_404(Master, id=master_id)

    booking = BookedTime.objects.filter(master=master, date=date_obj, time=time_obj).first()
    if not booking:
        return Response({"message": "⛔ Бронирование не найдено."}, status=status.HTTP_404_NOT_FOUND)

    booking.delete()

    return Response({"message": "⛔ Бронирование отменено 🛠"}, status=status.HTTP_200_OK)


# Список мастеров
@api_view(['POST'])
def check_masters(request):
    masters = Master.objects.all().values('id', 'name')
    if not masters:
        return Response({"message": "Мастеров не найдено"}, status=status.HTTP_404_NOT_FOUND)

    return Response(list(masters), status=status.HTTP_200_OK)


# Забронированные даты для мастера
@api_view(['POST'])
def check_booked_dates(request):
    try:
        data = request.data
        master_id = data.get('master_id')
        period = data.get('period')

        if not master_id or not period:
            return Response({'error': 'Отсутствуют обязательные параметры'}, status=status.HTTP_400_BAD_REQUEST)

        current_date = timezone.now().date()
        if period == 'day':
            start_date = end_date = current_date
        elif period == 'week':
            start_date = current_date
            end_date = current_date + timedelta(days=7)
        elif period == 'month':
            start_date = current_date
            end_date = current_date + timedelta(days=30)
        else:
            return Response({'error': 'Неверный период'}, status=status.HTTP_400_BAD_REQUEST)

        booked_times = BookedTime.objects.filter(
            master__id=master_id,
            date__range=[start_date, end_date],
            is_booked=True
        ).order_by('date', 'time')

        master = get_object_or_404(Master, id=master_id)

        result = [{
            'date': booking.date.strftime('%Y-%m-%d'),
            'time': booking.time.strftime('%H:%M'),
            'client_name': booking.client_name,
            'client_contact': booking.client_contact,
        } for booking in booked_times]

        return Response({'master_name': master.name, 'booked_times': result}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
