FROM python:3.9-slim

WORKDIR /app

# Устанавливаем системные зависимости
RUN apt-get update && \
    apt-get install -y \
        gcc \
        libpq-dev \
        postgresql-client \
        curl \
        netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# Копируем requirements.txt
COPY requirements.txt .

# Устанавливаем Python-зависимости
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Копируем остальной код приложения
COPY app.py .
COPY config.py .
COPY gunicorn_config.py .
COPY init_db.sh ./init_db.sh
COPY database/ database/
COPY config/ config/
COPY models/ models/
COPY utils/ utils/
COPY services/ services/
COPY routes/ routes/

# Устанавливаем переменные окружения
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

# Открываем порт приложения
EXPOSE 5000

# Запускаем скрипт инициализации через bash
CMD ["/bin/bash", "-c", "./init_db.sh"]
