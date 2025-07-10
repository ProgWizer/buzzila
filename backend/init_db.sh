#!/bin/bash
set -ex

# Функция для проверки ошибок
check_error() {
    if [ $? -ne 0 ]; then
        echo "Error: $1"
        exit 1
    fi
}

# Устанавливаем зависимости
echo "Installing dependencies..."
pip install -r requirements.txt
check_error "Failed to install dependencies"

# Ждем, пока база данных будет готова
echo "Waiting for database to be ready..."
for i in {1..30}; do
    echo "Attempt $i of 30..."
    if nc -z db 5432; then
        echo "Database is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "Database connection timeout"
        exit 1
    fi
    sleep 2
done

# Ждем Redis
echo "Waiting for Redis..."
for i in {1..30}; do
    echo "Attempt $i of 30..."
    if nc -z redis 6379; then
        echo "Redis is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "Redis connection timeout"
        exit 1
    fi
    sleep 2
done

# Проверяем существование базы данных
echo "Checking database existence..."
if PGPASSWORD=$DB_PASSWORD psql -h db -U $DB_USER -d postgres -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "Database already exists"
else
    echo "Creating database..."
    PGPASSWORD=$DB_PASSWORD psql -h db -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" || check_error "Failed to create database"

    echo "Waiting for new database to be ready..."
    for i in {1..10}; do
        echo "Attempt $i of 10..."
        if PGPASSWORD=$DB_PASSWORD psql -h db -U $DB_USER -d $DB_NAME -c "\q"; then
            echo "Database $DB_NAME is ready!"
            break
        fi
        if [ $i -eq 10 ]; then
            echo "Timed out waiting for database $DB_NAME to be ready."
            exit 1
        fi
        sleep 1
    done

    PGPASSWORD=$DB_PASSWORD psql -h db -U $DB_USER -d $DB_NAME -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" || check_error "Failed to grant privileges"
fi

# Запускаем приложение
echo "Starting application..."
if [ -f "gunicorn_config.py" ]; then
    exec gunicorn -c gunicorn_config.py app:app || check_error "Failed to start Gunicorn"
else
    echo "Error: gunicorn_config.py not found" || check_error "Gunicorn config file not found"
    exit 1
fi 