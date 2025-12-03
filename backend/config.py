import os
from dotenv import load_dotenv
import redis
from datetime import timedelta

# Загружаем переменные окружения из .env файла
load_dotenv()

# Конфигурация клиента Redis для хранения сессий и кэша
redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    db=0,
    password=os.getenv('REDIS_PASSWORD'),
    decode_responses=True,  # Автоматическое декодирование строк
    encoding='utf-8',
    encoding_errors='strict'
)

class Config:
    """
    Класс конфигурации Flask-приложения.
    Все параметры берутся из переменных окружения или задаются по умолчанию.
    Используется для настройки базы данных, сессий, JWT, CORS и интеграций.
    """
    # Основные настройки
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-please-change-in-production')
    
    # Настройки базы данных PostgreSQL
    DB_USER = os.getenv('DB_USER')
    DB_PASSWORD = os.getenv('DB_PASSWORD')
    DB_HOST = os.getenv('DB_HOST')
    DB_PORT = os.getenv('DB_PORT')
    DB_NAME = os.getenv('DB_NAME')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@db:5432/buzzila')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    CORS_HEADERS = 'Content-Type'
    
    # Настройки сессий (используется Redis)
    SESSION_TYPE = 'redis'
    SESSION_REDIS = redis_client
    SESSION_KEY_PREFIX = 'session:'
    PERMANENT_SESSION_LIFETIME = timedelta(days=1)
    
    # Настройки JWT (токены доступа)
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    
    # Настройки GigaChat API
    GIGACHAT_CLIENT_ID = os.getenv('GIGACHAT_CLIENT_ID')
    GIGACHAT_CLIENT_SECRET = os.getenv('GIGACHAT_CLIENT_SECRET')
    GIGACHAT_SCOPE = os.getenv('GIGACHAT_SCOPE', 'GIGACHAT_API_PERS')
    GIGACHAT_API_URL = os.getenv('GIGACHAT_API_URL', 'https://gigachat.devices.sberbank.ru/api/v1')
    GIGACHAT_MODEL = os.getenv('GIGACHAT_MODEL', 'GigaChat')
    GIGACHAT_AUTH = os.getenv('GIGA')

    # Настройки загрузки файлов
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx'}
    
    # Настройки CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '').split(',')
    
    # Настройки логгирования
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'

    # Базовая директория проекта
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))

    def __init__(self):
        """
        Проверяет наличие обязательных переменных окружения при инициализации конфигурации.
        Если какая-то переменная не установлена — пишет предупреждение в логгер.
        """
        import logging
        logger = logging.getLogger("config")
        required_vars = ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_NAME', 'SECRET_KEY', 'JWT_SECRET_KEY']
        for var in required_vars:
            if not os.getenv(var):
                logger.warning(f"Внимание: Переменная окружения {var} не установлена") 