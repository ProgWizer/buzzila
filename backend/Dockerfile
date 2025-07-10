# Стадия сборки
FROM python:3.9-slim AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Используем официальные репозитории Debian bookworm
RUN echo "deb http://deb.debian.org/debian bookworm main" > /etc/apt/sources.list && \
    echo "deb http://security.debian.org/debian-security bookworm-security main" >> /etc/apt/sources.list && \
    echo "deb http://deb.debian.org/debian bookworm-updates main" >> /etc/apt/sources.list && \
    apt-get update && \
    apt-get install -y \
        gcc \
        libpq-dev \
        postgresql-client \
        curl \
        netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# Копируем зависимости отдельно для кеширования слоя
COPY requirements.txt .

# Устанавливаем Python-зависимости
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# --------------------------------------------
# Финальный образ
# --------------------------------------------
FROM python:3.9-slim

WORKDIR /app

# Устанавливаем необходимые runtime зависимости
RUN apt-get update && \
    apt-get install -y \
        libpq5 \
        postgresql-client \
        curl \
        netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# Копируем Python пакеты из builder
COPY --from=builder /usr/local/lib/python3.9/site-packages/ /usr/local/lib/python3.9/site-packages/
COPY --from=builder /usr/local/bin/ /usr/local/bin/

# Копируем остальной код приложения (за исключением папки migrations)
COPY app.py .
COPY config.py .
COPY gunicorn_config.py .
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
