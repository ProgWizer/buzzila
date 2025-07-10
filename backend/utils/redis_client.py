# Модуль для работы с Redis: хранение сессий и кэширование данных
import redis
from datetime import timedelta
import os
import json
import logging  # Для логирования ошибок

# Создаём клиент Redis с параметрами из переменных окружения
redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'redis'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    db=int(os.getenv('REDIS_DB', 0)),
    password=os.getenv('REDIS_PASSWORD', 'qwertyQWERTY'),
    decode_responses=False  # False — для работы с бинарными данными
)


def init_redis(app):
    """
    Инициализация Redis для Flask-приложения.
    Настраивает хранение сессий в Redis и проверяет подключение.
    :param app: экземпляр Flask-приложения
    """
    # Настройка параметров сессии
    app.config['SESSION_TYPE'] = 'redis'
    app.config['SESSION_REDIS'] = redis_client
    app.config['SESSION_KEY_PREFIX'] = 'session:'
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=1)
    
    # Проверяем подключение к Redis
    try:
        redis_client.ping()
        app.logger.info("Redis подключен успешно")
    except redis.ConnectionError as e:
        app.logger.error(f"Ошибка подключения к Redis: {str(e)}")
        raise


def get_session_data(session_id):
    """
    Получить данные сессии по её идентификатору.
    :param session_id: строка — идентификатор сессии
    :return: dict сессии или None
    """
    logger = logging.getLogger("redis_client")
    try:
        data = redis_client.get(f"session:{session_id}")
        return json.loads(data.decode('utf-8')) if data else None
    except Exception as e:
        logger.error(f"Ошибка при получении данных сессии: {str(e)}")
        return None


def set_session_data(session_id, data, timeout=3600):
    """
    Сохранить данные сессии в Redis.
    :param session_id: строка — идентификатор сессии
    :param data: dict — данные для сохранения
    :param timeout: int — время жизни сессии в секундах (по умолчанию 1 час)
    """
    logger = logging.getLogger("redis_client")
    try:
        redis_client.setex(
            f"session:{session_id}",
            timeout,
            json.dumps(data).encode('utf-8')
        )
    except Exception as e:
        logger.error(f"Ошибка при сохранении данных сессии: {str(e)}")


def delete_session(session_id):
    """
    Удалить сессию по идентификатору.
    :param session_id: строка — идентификатор сессии
    """
    logger = logging.getLogger("redis_client")
    try:
        redis_client.delete(f"session:{session_id}")
    except Exception as e:
        logger.error(f"Ошибка при удалении сессии: {str(e)}")


# --- Функции для работы с кэшем ---
def cache_data(key, data, timeout=300):
    """
    Кэшировать данные по ключу.
    :param key: строка — ключ кэша
    :param data: строка или bytes — данные для кэширования
    :param timeout: int — время жизни кэша в секундах (по умолчанию 5 минут)
    """
    logger = logging.getLogger("redis_client")
    try:
        redis_client.setex(key, timeout, data.encode('utf-8') if isinstance(data, str) else data)
    except Exception as e:
        logger.error(f"Ошибка при кэшировании данных: {str(e)}")


def get_cached_data(key):
    """
    Получить данные из кэша по ключу.
    :param key: строка — ключ кэша
    :return: bytes или None
    """
    logger = logging.getLogger("redis_client")
    try:
        return redis_client.get(key)
    except Exception as e:
        logger.error(f"Ошибка при получении данных из кэша: {str(e)}")
        return None


def delete_cached_data(key):
    """
    Удалить данные из кэша по ключу.
    :param key: строка — ключ кэша
    """
    logger = logging.getLogger("redis_client")
    try:
        redis_client.delete(key)
    except Exception as e:
        logger.error(f"Ошибка при удалении данных из кэша: {str(e)}")


def clear_cache():
    """
    Очистить весь кэш Redis (использовать с осторожностью!).
    """
    logger = logging.getLogger("redis_client")
    try:
        redis_client.flushall()
    except Exception as e:
        logger.error(f"Ошибка при очистке кэша: {str(e)}") 