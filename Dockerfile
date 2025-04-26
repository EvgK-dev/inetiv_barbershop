FROM python:3.13.11-slim

# Устанавливаем необходимые системные зависимости и удаляем кэш
RUN apt-get update && \
    apt-get install -y --no-install-recommends nano && \
    rm -rf /var/lib/apt/lists/*

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем зависимости и устанавливаем их
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Устанавливаем Gunicorn и Gevent
RUN pip install --no-cache-dir gunicorn gevent

# Копируем все файлы проекта
COPY . .

# Экспортируем порт
EXPOSE 8020

# Запуск через Gunicorn
CMD ["gunicorn", "inetiv_barber.wsgi:application", "--bind", "0.0.0.0:8020", "--worker-class=gevent", "--workers=2", "--threads=2", "--timeout=7200"]
