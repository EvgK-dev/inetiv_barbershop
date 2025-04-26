from django.urls import path
 
from .views import *
from . import views
 
urlpatterns = [
    path('', barbershop, name='barbershop'), 
    path('barberbooking', barberbooking, name='barberbooking'), 
    path('verify', verify, name='verify'), 

    path('get-master-data/', get_master_data, name='get_master_data'),
    path('verify_record/', verify_record, name='verify_record'),
    path('privacy_policy/', privacy_policy, name='privacy_policy'),
    
    path('confirmation/', views.confirmation_view, name='confirmation'),

    path('send-telegram-message/', send_telegram_message, name='send_telegram_message'), 
    path('send_booking_to_telegram/', send_booking_to_telegram, name='send_booking_to_telegram'),  
]