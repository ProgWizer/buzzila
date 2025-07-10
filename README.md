# Customer Service Training Platform

**Платформа для тренировки навыков общения с клиентами**  
(Backend: Flask + PostgreSQL + Redis, Frontend: React, Dockerized)

---

## О проекте

Это современное веб-приложение для тренировки навыков общения в различных сценариях обслуживания клиентов.  
Платформа позволяет моделировать диалоги с виртуальным собеседником (ботом), отслеживать прогресс, получать достижения и анализировать статистику.

**Ключевые возможности:**
- Регистрация и аутентификация пользователей (JWT)
- Роли пользователей: USER, ADMIN, MANAGER
- Сценарии диалогов (гостиница, аэропорт, кафе и др.)
- Интеграция с DeepSeek API для генерации ответов бота
- Хранение сессий и кэша в Redis
- Админ-панель для управления сценариями и пользователями
- Docker-окружение для быстрого деплоя

---

## Технологии

- **Backend:** Flask, Flask-SQLAlchemy, Flask-JWT-Extended, PostgreSQL, Redis, Gunicorn
- **Frontend:** React, Axios, Toastify, Nginx (продакшн)
- **DevOps:** Docker, Docker Compose, .env-конфигурация

---

## Быстрый старт (через Docker Compose)

1. **Клонируйте репозиторий:**
   ```sh
   git clone https://github.com/your-username/your-repo.git
   cd your-repo
   ```

2. **Создайте и заполните .env-файлы:**
   - `backend/.env` — основные переменные окружения для backend (см. пример ниже)
   - `frontend/.env` — (опционально) переменные для frontend

3. **Запустите всё через Docker Compose:**
   ```sh
   docker-compose up --build
   ```
   После запуска:
   - Backend будет доступен на [http://localhost:5000](http://localhost:5000)
   - Frontend — на [http://localhost](http://localhost)

---

## Пример .env для backend

```env
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_db_password
POSTGRES_DB=your_db_name
POSTGRES_HOST=db
POSTGRES_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Flask
SECRET_KEY=your_flask_secret
JWT_SECRET_KEY=your_jwt_secret
DEBUG=False

# DeepSeek API
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_API_URL=https://api.deepseek.com/v1
```

---

## Основные команды для разработки

- **Backend локально:**
  ```sh
  cd backend
  python -m venv venv
  source venv/bin/activate  # или venv\Scripts\activate для Windows
  pip install -r requirements.txt
  python app.py
  ```
- **Frontend локально:**
  ```sh
  cd frontend
  npm install
  npm start
  ```

---

## Структура проекта

```
MainTest/
  backend/         # Flask backend (API, модели, сервисы)
  frontend/        # React frontend (src, public, nginx)
  docker-compose.yml
  README.md
```

---

## API

- `POST /api/auth/register` — регистрация пользователя
- `POST /api/auth/login` — вход
- `POST /api/auth/logout` — выход
- `GET  /api/profile` — профиль пользователя
- `POST /api/chat` — диалог с ботом
- ...и другие 

---

## Контакты и поддержка

- Issues и предложения — через [GitHub Issues](https://github.com/your-username/your-repo/issues)

---
