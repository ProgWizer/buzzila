from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from config import Config, redis_client
from models.database import db
from utils.redis_client import init_redis
from flask_jwt_extended import JWTManager
from flask_session import Session
import os
import logging
from datetime import timedelta
import sys
from sqlalchemy import text

# Создаем приложение Flask
app = Flask(__name__)

# Загружаем конфигурацию приложения из класса Config
config = Config()
app.config.from_object(config)

# Инициализация базы данных
# (db.init_app регистрирует SQLAlchemy с приложением Flask)
db.init_app(app)

# Импортируем модели ПЕРЕД созданием таблиц
from models.models import *

with app.app_context():
    db.create_all()  # Создаем все таблицы в базе данных
    
    # Автоматическая миграция: добавление колонки analysis_prompt
    try:
        # Проверяем, существует ли колонка analysis_prompt
        result = db.session.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='prompt_templates' AND column_name='analysis_prompt'
        """))
        
        if result.fetchone() is None:
            # Колонка не существует, добавляем её
            app.logger.info("Добавление колонки analysis_prompt в таблицу prompt_templates...")
            
            db.session.execute(text("""
                ALTER TABLE prompt_templates 
                ADD COLUMN analysis_prompt TEXT
            """))
            
            # Устанавливаем дефолтное значение для существующих записей
            default_analysis_prompt = """Ты опытный эксперт по обучению персонала. Проанализируй следующий диалог:

**Контекст сценария:**
- Сценарий: {scenario_description}
- Роль сотрудника: {user_role}
- Роль клиента (ИИ): {ai_role}

**Диалог:**
{dialog_text}

**Задание:**
Проведи детальный анализ диалога (не более 400 слов), структурированный по следующим пунктам:

1. **Общая оценка диалога** (3-4 предложения)
   - Как прошел разговор в целом
   - Была ли достигнута цель коммуникации
   - Общее впечатление от взаимодействия

2. **Сильные стороны сотрудника** (3-4 конкретных примера)
   - Какие навыки общения были продемонстрированы успешно
   - Удачные фразы и подходы
   - Проявление эмпатии, профессионализма

3. **Области для улучшения** (3-4 конкретных момента)
   - Что можно было сделать лучше
   - Упущенные возможности
   - Ошибки в коммуникации

4. **Практические рекомендации** (3-5 конкретных советов)
   - Что делать в следующий раз
   - Какие фразы использовать
   - Как улучшить подход

Отвечай только на {dialog.scenario.language} языке. Будь конструктивен, конкретен и поддерживающ. Приводи примеры из диалога."""
            
            db.session.execute(
                text("UPDATE prompt_templates SET analysis_prompt = :prompt WHERE analysis_prompt IS NULL OR analysis_prompt = ''"),
                {"prompt": default_analysis_prompt}
            )
            
            db.session.commit()
            app.logger.info("Колонка analysis_prompt успешно добавлена и заполнена дефолтным значением")
        else:
            app.logger.info("Колонка analysis_prompt уже существует")
        
        # Миграция 2: Изменение типа колонки description в scenarios на TEXT
        app.logger.info("Проверка типа колонки description в таблице scenarios...")
        result = db.session.execute(text("""
            SELECT data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'scenarios' AND column_name = 'description'
        """))
        column_info = result.fetchone()
        
        if column_info and column_info[0] == 'character varying' and column_info[1] == 500:
            # Колонка имеет ограничение VARCHAR(500), меняем на TEXT
            app.logger.info("Изменение типа колонки description с VARCHAR(500) на TEXT...")
            db.session.execute(text("""
                ALTER TABLE scenarios 
                ALTER COLUMN description TYPE TEXT
            """))
            db.session.commit()
            app.logger.info("Тип колонки description успешно изменен на TEXT")
        else:
            app.logger.info("Колонка description уже имеет тип TEXT или не требует изменений")
            
    except Exception as e:
        app.logger.error(f"Ошибка при миграции analysis_prompt: {e}")
        db.session.rollback()
    
# Настройка логирования (вывод в stdout)
app.logger.handlers.clear()
handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
))
app.logger.addHandler(handler)
app.logger.setLevel(logging.INFO)
app.logger.info('Application startup')

# Настройка CORS для API (разрешаем запросы с указанных доменов)
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://profdailog.com",
            "http://www.profdailog.com",
            
        ],
        "supports_credentials": True,
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "expose_headers": ["Content-Range", "X-Total-Count", "Authorization"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "max_age": 3600,
        "send_wildcard": False
    }
})

# Инициализация JWT-менеджера для работы с токенами доступа
jwt = JWTManager(app)

# Обработчик: неавторизованный доступ по JWT
@jwt.unauthorized_loader
def unauthorized_response(callback):
    """Возвращает ошибку, если пользователь не авторизован по JWT."""
    app.logger.warning(f"JWT Unauthorized Error: {callback}")
    return jsonify({'msg': callback}), 401

# Обработчик: некорректный токен JWT
@jwt.invalid_token_loader
def invalid_token_response(callback):
    """Возвращает ошибку, если токен JWT некорректен."""
    app.logger.warning(f"JWT Invalid Token Error: {callback}")
    return jsonify({'msg': callback}), 401

# Обработчик: истёкший токен JWT
@jwt.expired_token_loader
def expired_token_response(jwt_header, jwt_data):
    """Возвращает ошибку, если токен JWT истёк."""
    app.logger.warning("JWT Expired Token Error: token has expired")
    return jsonify({'msg': 'Token has expired'}), 401

# Обработчик: отозванный токен JWT
@jwt.revoked_token_loader
def revoked_token_response(callback):
    """Возвращает ошибку, если токен JWT был отозван."""
    app.logger.warning(f"JWT Revoked Token Error: {callback}")
    return jsonify({'msg': callback}), 401

# Обработчик: требуется свежий токен JWT
@jwt.needs_fresh_token_loader
def needs_fresh_token_response(callback):
    """Возвращает ошибку, если требуется свежий токен JWT."""
    app.logger.warning(f"JWT Needs Fresh Token Error: {callback}")
    return jsonify({'msg': callback}), 401

# Дополнительные настройки JWT
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
app.config['JWT_TOKEN_LOCATION'] = ['headers', 'cookies']
app.config['JWT_COOKIE_CSRF_PROTECT'] = False  # Отключаем CSRF для HTTP
app.config['JWT_COOKIE_SECURE'] = False  # Для HTTP
app.config['JWT_COOKIE_DOMAIN'] = None  # Автоматически определяется из запроса
app.config['JWT_COOKIE_SAMESITE'] = 'Lax'
app.config['JWT_ACCESS_COOKIE_NAME'] = 'access_token_cookie'
app.config['JWT_REFRESH_COOKIE_NAME'] = 'refresh_token_cookie'
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'
app.config['JWT_ERROR_MESSAGE_KEY'] = 'error'  # Для единообразия ошибок

# Инициализация Redis (для хранения сессий и кэша)
init_redis(app)

# Инициализация Flask-Session (сессии хранятся в Redis)
Session(app)

# Импортируем и регистрируем Blueprints (модули API)
from routes.auth import auth_bp
from routes.scenarios import scenarios_bp
from routes.progress import progress_bp
from routes.profile import profile_bp
from routes.chat import chat_bp
from routes.achievements import achievements_admin_bp
from routes.admin import admin_bp
from routes.uploads import uploads_bp
from routes.activity import activity_bp
from routes.prompt_templates import prompt_templates_bp
from routes.vk_auth import vk_bp  # Импортируем новый blueprint

# Регистрируем Blueprints (разделяем API по модулям)
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(scenarios_bp, url_prefix='/api')
app.register_blueprint(progress_bp, url_prefix='/api/progress')
app.register_blueprint(profile_bp, url_prefix='/api/profile')
app.register_blueprint(chat_bp, url_prefix='/api/chat')
app.register_blueprint(achievements_admin_bp, url_prefix='/api')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(uploads_bp, url_prefix='/api')
app.register_blueprint(activity_bp)
app.register_blueprint(prompt_templates_bp, url_prefix='/api')
app.register_blueprint(vk_bp, url_prefix='/api')  # Регистрируем VK OAuth

# Хелс-чек эндпоинт для проверки состояния приложения и БД
@app.route('/health')
def health_check():
    """
    Проверка состояния приложения и подключения к базе данных.
    Возвращает статус 'healthy' если все работает корректно.
    """
    try:
        # Проверяем подключение к базе данных
        db.session.execute(text('SELECT 1'))
        return jsonify({'status': 'healthy', 'database': 'connected'})
    except Exception as e:
        app.logger.error(f"Health check failed: {e}")
        return jsonify({'status': 'unhealthy', 'database': 'disconnected'}), 500

# Обработчик для статических файлов (если нужно)
@app.route('/static/<path:filename>')
def static_files(filename):
    """
    Обработчик для статических файлов.
    """
    return send_from_directory('static', filename)

# Обработчик для корневого пути (если нужно)
@app.route('/')
def index():
    """
    Корневой путь приложения.
    """
    return jsonify({'message': 'Buzzila API Server', 'status': 'running'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
