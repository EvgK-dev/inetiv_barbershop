FROM python:3.13-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем зависимости и устанавливаем их
COPY telegram_bot/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем файлы бота
COPY telegram_bot .

# Запуск бота
CMD ["python", "telegram_bot.py"]