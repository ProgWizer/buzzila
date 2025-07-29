from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from config import Config, redis_client
from models.database import db
from models.models import create_default_organization 
from utils.redis_client import init_redis
from flask_jwt_extended import JWTManager
from flask_session import Session
import os
import logging
from datetime import timedelta
import sys

# Создаем приложение Flask
app = Flask(__name__)

# Загружаем конфигурацию приложения из класса Config
config = Config()
app.config.from_object(config)

# Инициализация базы данных
# (db.init_app регистрирует SQLAlchemy с приложением Flask)
db.init_app(app)

with app.app_context():
    db.create_all()  # Создаем все таблицы в базе данных
    create_default_organization()  # Создаем организацию по умолчанию, если её нет

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
def expired_token_response(callback):
    """Возвращает ошибку, если токен JWT истёк."""
    app.logger.warning(f"JWT Expired Token Error: {callback}")
    return jsonify({'msg': callback}), 401

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

# Хелс-чек эндпоинт для проверки состояния приложения и БД
@app.route('/health')
def health_check():
    """Проверяет подключение к базе данных и возвращает статус приложения."""
    try:
        db.session.execute('SELECT 1')  # Проверяем подключение к базе данных
        return jsonify({'status': 'healthy', 'database': 'connected'}), 200
    except Exception as e:
        app.logger.error(f"Health check failed: {str(e)}")
        return jsonify({'status': 'unhealthy', 'database': 'disconnected'}), 500

# Логируем все зарегистрированные маршруты приложения
app.logger.info("=== Зарегистрированные маршруты ===")
for rule in app.url_map.iter_rules():
    app.logger.info(f"{rule.methods} {rule.rule}")
app.logger.info("====================================")

# Явная отдача статических файлов (если не работает стандартная статика Flask)
@app.route('/static/<path:filename>')
def static_files(filename):
    """Отдаёт статические файлы из папки static."""
    return send_from_directory(os.path.join(app.root_path, 'static'), filename)

# Запуск приложения (только для режима разработки)
if __name__ == '__main__':
    app.run(
        debug=os.getenv('DEBUG', 'True').lower() == 'true',
        host=os.getenv('HOST', '0.0.0.0'),
        port=int(os.getenv('PORT', 5000))
    )
