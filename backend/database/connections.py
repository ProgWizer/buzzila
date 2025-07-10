from typing import Optional
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from motor.motor_asyncio import AsyncIOMotorClient
from redis import Redis, ConnectionPool
from contextlib import contextmanager

from backend.config.database import (
    DatabaseConfig,
    ConnectionPools,
    MongoCollections
)

class DatabaseManager:
    _postgres_engine = None
    _mongo_client = None
    _redis_pool = None
    
    @classmethod
    def init_postgres(cls):
        """Инициализация подключения к PostgreSQL"""
        if cls._postgres_engine is None:
            cls._postgres_engine = create_engine(
                DatabaseConfig.get_postgres_url(),
                poolclass=QueuePool,
                pool_size=ConnectionPools.POSTGRES_POOL_SIZE,
                max_overflow=ConnectionPools.POSTGRES_MAX_OVERFLOW,
                pool_timeout=ConnectionPools.POSTGRES_POOL_TIMEOUT,
                pool_recycle=ConnectionPools.POSTGRES_POOL_RECYCLE
            )
        return cls._postgres_engine

    @classmethod
    def init_mongo(cls):
        """Инициализация подключения к MongoDB"""
        if cls._mongo_client is None:
            cls._mongo_client = AsyncIOMotorClient(**DatabaseConfig.get_mongo_config())
        return cls._mongo_client

    @classmethod
    def init_redis(cls):
        """Инициализация подключения к Redis"""
        if cls._redis_pool is None:
            cls._redis_pool = ConnectionPool(
                **DatabaseConfig.get_redis_config(),
                max_connections=ConnectionPools.REDIS_MAX_CONNECTIONS
            )
        return Redis(connection_pool=cls._redis_pool)

    @classmethod
    @contextmanager
    def get_postgres_session(cls) -> Session:
        """Получить сессию PostgreSQL"""
        if cls._postgres_engine is None:
            cls.init_postgres()
        
        SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=cls._postgres_engine
        )
        session = SessionLocal()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    @classmethod
    def get_mongo_db(cls):
        """Получить базу данных MongoDB"""
        if cls._mongo_client is None:
            cls.init_mongo()
        return cls._mongo_client[DatabaseConfig.MONGO_DB]

    @classmethod
    def get_redis_client(cls) -> Redis:
        """Получить клиент Redis"""
        if cls._redis_pool is None:
            cls.init_redis()
        return Redis(connection_pool=cls._redis_pool)

    @classmethod
    async def close_connections(cls):
        """Закрыть все соединения с базами данных"""
        if cls._postgres_engine is not None:
            cls._postgres_engine.dispose()
            cls._postgres_engine = None
        
        if cls._mongo_client is not None:
            cls._mongo_client.close()
            cls._mongo_client = None
        
        if cls._redis_pool is not None:
            cls._redis_pool.disconnect()
            cls._redis_pool = None

# Создаем глобальный экземпляр менеджера баз данных
db_manager = DatabaseManager()

# Функции-помощники для работы с базами данных
def get_db():
    """Dependency для FastAPI для получения сессии PostgreSQL"""
    with db_manager.get_postgres_session() as session:
        yield session

async def get_mongo():
    """Dependency для FastAPI для получения MongoDB"""
    return db_manager.get_mongo_db()

def get_redis():
    """Dependency для FastAPI для получения Redis"""
    return db_manager.get_redis_client() 