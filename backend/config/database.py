from typing import Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

class DatabaseConfig:
    # PostgreSQL
    POSTGRES_USER = os.getenv('POSTGRES_USER')
    POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD')
    POSTGRES_HOST = os.getenv('POSTGRES_HOST')
    POSTGRES_PORT = os.getenv('POSTGRES_PORT')
    POSTGRES_DB = os.getenv('POSTGRES_DB')
    
    # MongoDB
    MONGO_URI = os.getenv('MONGO_URI')
    MONGO_DB = os.getenv('MONGO_DB')
    
    # Redis
    REDIS_HOST = os.getenv('REDIS_HOST')
    REDIS_PORT = os.getenv('REDIS_PORT')
    REDIS_DB = os.getenv('REDIS_DB')
    REDIS_PASSWORD = os.getenv('REDIS_PASSWORD')

    @classmethod
    def get_postgres_url(cls) -> str:
        """Получить URL для подключения к PostgreSQL"""
        return f"postgresql://{cls.POSTGRES_USER}:{cls.POSTGRES_PASSWORD}@{cls.POSTGRES_HOST}:{cls.POSTGRES_PORT}/{cls.POSTGRES_DB}"

    @classmethod
    def get_mongo_config(cls) -> Dict[str, Any]:
        """Получить конфигурацию для MongoDB"""
        return {
            'host': cls.MONGO_URI,
            'database': cls.MONGO_DB,
            'options': {
                'maxPoolSize': 100,
                'minPoolSize': 10,
                'maxIdleTimeMS': 30000,
                'waitQueueTimeoutMS': 5000,
            }
        }

    @classmethod
    def get_redis_config(cls) -> Dict[str, Any]:
        """Получить конфигурацию для Redis"""
        return {
            'host': cls.REDIS_HOST,
            'port': int(cls.REDIS_PORT),
            'db': int(cls.REDIS_DB),
            'password': cls.REDIS_PASSWORD,
            'decode_responses': True,
            'socket_timeout': 5,
            'socket_connect_timeout': 5,
            'retry_on_timeout': True
        }

# Константы для Redis
class RedisKeys:
    # Кэширование
    USER_CACHE = "user:{user_id}"
    SCENARIO_CACHE = "scenario:{scenario_id}"
    ORGANIZATION_CACHE = "org:{org_id}"
    
    # Ограничение запросов
    RATE_LIMIT = "rate_limit:{user_id}:{endpoint}"
    
    # Очереди
    DIALOG_QUEUE = "dialog_queue"
    FEEDBACK_QUEUE = "feedback_queue"
    
    # Сессии
    USER_SESSION = "session:{session_id}"
    
    # Временные метрики
    ACTIVE_USERS = "metrics:active_users"
    API_LATENCY = "metrics:api_latency:{endpoint}"
    
    # Блокировки
    DIALOG_LOCK = "lock:dialog:{dialog_id}"
    USER_LOCK = "lock:user:{user_id}"

# Константы для MongoDB коллекций
class MongoCollections:
    DIALOG_LOGS = "dialog_logs"
    USER_ACTIVITY = "user_activity_logs"
    SYSTEM_METRICS = "system_metrics"
    ERROR_LOGS = "error_logs"
    LLM_INTERACTIONS = "llm_interaction_logs"
    ANALYTICS = "analytics_aggregates"

# Настройки пулов соединений
class ConnectionPools:
    POSTGRES_POOL_SIZE = 20
    POSTGRES_MAX_OVERFLOW = 10
    POSTGRES_POOL_TIMEOUT = 30
    POSTGRES_POOL_RECYCLE = 1800
    
    MONGO_MAX_POOL_SIZE = 100
    MONGO_MIN_POOL_SIZE = 10
    MONGO_MAX_IDLE_TIME_MS = 30000
    
    REDIS_MAX_CONNECTIONS = 100
    REDIS_TIMEOUT = 5 