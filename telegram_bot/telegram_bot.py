import logging
import re
from typing import Dict, Optional
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    MessageHandler,
    ContextTypes,
    filters,
)
import httpx
from dotenv import load_dotenv
import os

# Настройка логирования
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

# Загрузка переменных окружения
load_dotenv()
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN_BARBER")
API_BASE_URL = "http://127.0.0.1:8000/api/"

# Константы
MAX_MESSAGE_LENGTH = 4096
PERIODS = {"day": "День", "week": "Неделя", "month": "Месяц"}
ERROR_MESSAGE = "⚠️ Ошибка: {}"
SUCCESS_STATUS_CODES = {200, 201}

# извлечение данных
BOOKING_FIELDS = {
    "master_name": r"Мастер: (.*)",
    "master_id": r"id: (.*)",
    "date": r"Дата: (.*)",
    "time": r"Время: (.*)",
    "service_name": r"Услуга: (.*)",
    "cost": r"Стоимость: (.*)",
    "duration": r"Длительность: (.*)",
    "client_name": r"Имя клиента: (.*)",
    "client_contact": r"Контакт: (.*)",
    "client_email": r"Email: (.*)",
    "client_comment": r"Комментарий: (.*)",
}


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработка команды /меню."""
    if update.message.text.lower() != "/меню":
        return

    keyboard = [[InlineKeyboardButton("📅 Забронированные даты", callback_data="booked_dates")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text="Выберите опцию:",
        reply_markup=reply_markup,
    )


async def booked_dates(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Запрос списка мастеров."""
    query = update.callback_query
    await query.answer()

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{API_BASE_URL}check_masters/")
            response.raise_for_status()
            masters = response.json()

        buttons = [
            [InlineKeyboardButton(f"{master['name']} {master['id']}", callback_data=f"choose_period_{master['id']}")]
            for master in masters
        ]
        message = "Выберите мастера:"
    except httpx.HTTPStatusError:
        message, buttons = "⚠️ Ошибка при получении данных о мастерах.", []
    except Exception as e:
        message, buttons = ERROR_MESSAGE.format(f"подключение к серверу: {e}"), []

    await query.edit_message_text(
        text=message,
        reply_markup=InlineKeyboardMarkup(buttons),
        parse_mode="HTML",
    )


async def choose_period(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Выбор периода для мастера."""
    query = update.callback_query
    await query.answer()

    master_id = query.data.split("_")[-1]
    logger.info(f"Выбран мастер с ID: {master_id}")

    buttons = [
        [InlineKeyboardButton(period_name, callback_data=f"choice_booked_dates_period_{period_key}_{master_id}")]
        for period_key, period_name in PERIODS.items()
    ]
    await query.edit_message_text(
        text=f"Выберите период получения данных для мастера с ID {master_id}:",
        reply_markup=InlineKeyboardMarkup(buttons),
        parse_mode="HTML",
    )


async def choice_booked_dates_period(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Получение забронированных дат за выбранный период."""
    query = update.callback_query
    await query.answer()

    try:
        period, master_id = query.data.split("_")[4:6]
        if period not in PERIODS:
            raise ValueError("Неверный период")
    except (IndexError, ValueError):
        await query.edit_message_text(text=ERROR_MESSAGE.format("неверные данные периода или мастера"), parse_mode="HTML")
        return

    logger.info(f"Запрос данных: период={period}, мастер={master_id}")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{API_BASE_URL}check_booked_dates/",
                json={"master_id": master_id, "period": period},
            )
            response.raise_for_status()
            data = response.json()

        master_name = data.get("master_name", "Неизвестный мастер")
        booked_times = data.get("booked_times", [])

        if booked_times:
            result = f"Клиенты мастера <b>{master_name}</b>:\n\n" + "\n".join(
                f"{booking['date']} в {booking['time']} - {booking['client_name']} (<code>{booking['client_contact']}</code>)"
                for booking in booked_times
            )
        else:
            result = f"Нет забронированных дат на {period} для мастера {master_name}."

        # Разбиение длинных сообщений
        for chunk in [result[i : i + MAX_MESSAGE_LENGTH] for i in range(0, len(result), MAX_MESSAGE_LENGTH)]:
            await query.edit_message_text(text=chunk, parse_mode="HTML")

    except httpx.HTTPStatusError:
        await query.edit_message_text(text=ERROR_MESSAGE.format("ошибка сервера"), parse_mode="HTML")
    except Exception as e:
        await query.edit_message_text(text=ERROR_MESSAGE.format(f"подключение к серверу: {e}"), parse_mode="HTML")


async def confirm_booking(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Подтверждение бронирования."""
    await process_booking(update, context, endpoint="confirm_booking", action="подтверждение")


async def cancel_booking(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Отмена бронирования."""
    await process_booking(update, context, endpoint="cancel_booking", action="отмена")


async def process_booking(update: Update, context: ContextTypes.DEFAULT_TYPE, endpoint: str, action: str) -> None:
    """Общая логика для подтверждения/отмены бронирования."""
    query = update.callback_query
    await query.answer()

    message_text = query.message.text
    reply_markup = query.message.reply_markup
    booking_data = extract_booking_data(message_text)

    if not booking_data:
        await query.edit_message_text(text=ERROR_MESSAGE.format("извлечение данных"), parse_mode="HTML")
        return

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{API_BASE_URL}{endpoint}/", json=booking_data)
            response.raise_for_status()
            result = response.json().get("message", f"⚠️ Ошибка при {action} бронирования.")
    except Exception as e:
        result = ERROR_MESSAGE.format(f"{action} бронирования: {e}")

    await query.edit_message_text(
        text=f"{message_text}\n\n{result}",
        reply_markup=reply_markup,
        parse_mode="HTML",
    )


def extract_booking_data(message_text: str) -> Optional[Dict[str, str]]:
    """Извлечение данных бронирования из текста сообщения."""
    booking_data = {}
    for key, pattern in BOOKING_FIELDS.items():
        match = re.search(pattern, message_text, re.MULTILINE)
        if match:
            booking_data[key] = match.group(1).strip()
    return booking_data if booking_data else None


def main() -> None:
    """Запуск бота."""
    if not TELEGRAM_BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN не найден в переменных окружения")
        return

    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    # Обработчики
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    application.add_handler(CallbackQueryHandler(confirm_booking, pattern=r"confirm_booking:.*"))
    application.add_handler(CallbackQueryHandler(cancel_booking, pattern=r"cancel_booking:.*"))
    application.add_handler(CallbackQueryHandler(booked_dates, pattern=r"booked_dates:.*"))
    application.add_handler(CallbackQueryHandler(choose_period, pattern=r"choose_period:.*"))
    application.add_handler(CallbackQueryHandler(choice_booked_dates_period, pattern=r"choice_booked_dates_period:.*"))

    application.run_polling()


if __name__ == "__main__":
    main()