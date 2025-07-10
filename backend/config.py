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
    SECRET_KEY = os.getenv('SECRET_KEY')
    
    # Настройки базы данных PostgreSQL
    DB_USER = os.getenv('DB_USER')
    DB_PASSWORD = os.getenv('DB_PASSWORD')
    DB_HOST = os.getenv('DB_HOST')
    DB_PORT = os.getenv('DB_PORT')
    DB_NAME = os.getenv('DB_NAME')
    SQLALCHEMY_DATABASE_URI = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    
    CORS_HEADERS = 'Content-Type'
    
    # Настройки сессий (используется Redis)
    SESSION_TYPE = 'redis'
    SESSION_REDIS = redis_client
    SESSION_KEY_PREFIX = 'session:'
    PERMANENT_SESSION_LIFETIME = timedelta(days=1)
    
    # Настройки JWT (токены доступа)
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    
    # Настройки DeepSeek API (интеграция с внешним ИИ)
    DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY')
    DEEPSEEK_API_URL = os.getenv('DEEPSEEK_API_URL')
    
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