from django.urls import path
from .views import *

urlpatterns = [
    path('confirm_booking/', confirm_booking, name='confirm_booking'),
    path('cancel_booking/', cancel_booking, name='cancel_booking'),
    path('check_masters/', check_masters, name='check_masters'),
    path('check_booked_dates/', check_booked_dates, name='check_booked_dates'),
]
