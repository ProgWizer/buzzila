from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Enum, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.exc import IntegrityError
from .database import db
import enum

class UserRole(enum.Enum):
    """
    Перечисление ролей пользователей.
    Возможные значения: user (обычный пользователь), admin (администратор), manager (менеджер).
    """
    USER = "user"
    ADMIN = "admin"
    MANAGER = "manager"

class ScenarioType(enum.Enum):
    """
    Перечисление типов сценариев.
    Возможные значения: hotel, cafe, airport.
    """
    HOTEL = "hotel"
    CAFE = "cafe"
    AIRPORT = "airport"

class Category(db.Model):
    """
    Категория сценариев (например, сфера обслуживания).
    """
    __tablename__ = 'categories'

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)  # Название категории
    description = Column(String(500))  # Описание категории
    created_at = Column(DateTime, default=datetime.utcnow)

    scenarios = relationship("Scenario", back_populates="category_obj")  # Связанные сценарии

class Users(db.Model):
    """
    Модель пользователя системы.
    Содержит данные для аутентификации, роли, связи с организацией и прогрессом.
    """
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)  # Уникальное имя пользователя
    email = Column(String(120), unique=True, nullable=False)  # Email пользователя
    password_hash = Column(String(256), nullable=False)  # Хэш пароля
    role = Column(Enum(UserRole), default=UserRole.USER)  # Роль пользователя
    organization_id = Column(Integer, ForeignKey('organizations.id'))  # Организация
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)  # Последний вход
    is_active = Column(Boolean, default=True)  # Активен ли пользователь
    points = Column(Integer, default=0)  # Очки пользователя
    
    # Связи
    organization = relationship("Organization", back_populates="users")
    dialogs = relationship("Dialog", back_populates="user")
    achievements = relationship("UserAchievement", back_populates="user")
    ratings = relationship("Rating", back_populates="user")
    preferences = relationship("UserPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan")
    statistics = relationship("UserStatistics", back_populates="user", uselist=False, cascade="all, delete-orphan")
    progress = relationship("UserProgress", back_populates="user")
    user_badges = relationship("UserBadge", back_populates="user")

class Organization(db.Model):
    """
    Организация, к которой может принадлежать пользователь или сценарий.
    """
    __tablename__ = 'organizations'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)  # Название организации
    description = Column(String(500))  # Описание
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Связи
    users = relationship("Users", back_populates="organization")
    scenarios = relationship("Scenario", back_populates="organization")

class Scenario(db.Model):
    """
    Сценарий для тренировки пользователя (например, "злой клиент в кафе").
    """
    __tablename__ = 'scenarios'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)  # Название сценария
    description = Column(String(500), nullable=False)  # Описание сценария
    type = Column(Enum(ScenarioType), nullable=False)  # Тип сценария
    difficulty = Column(Integer, default=1)  # Сложность (1-5)
    organization_id = Column(Integer, ForeignKey('organizations.id'))  # Организация
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)  # Активен ли сценарий
    prompt_template = Column(Text, nullable=False)  # Шаблон для генерации диалога
    
    # Дополнительные поля
    category = Column(String(50), nullable=False)  # Категория
    subcategory = Column(String(100), nullable=False)  # Подкатегория
    user_role = Column(String(100), nullable=False)  # Роль пользователя в сценарии
    ai_role = Column(String(100), nullable=False)  # Роль ИИ в сценарии
    ai_behavior = Column(String(500), nullable=False)  # Поведение ИИ
    estimated_time = Column(Integer) # Оценочное время (в минутах)
    category_id = Column(Integer, ForeignKey('categories.id'))  # Категория (внешний ключ)
    mood = Column(String(50), nullable=False)  # Настроение
    language = Column(String(10), nullable=False)  # Язык
    is_template = Column(Boolean, default=False) # Является ли шаблоном

    # Связи
    organization = relationship("Organization", back_populates="scenarios")
    dialogs = relationship("Dialog", back_populates="scenario")
    category_obj = relationship("Category", back_populates="scenarios")
    user_progress = relationship("UserProgress", back_populates="scenario")
    
    def get_user_progress(self, user_id):
        """
        Возвращает прогресс пользователя по данному сценарию.
        """
        return next((progress for progress in self.user_progress if progress.user_id == user_id), None)

class Dialog(db.Model): 
    """
    Диалог между пользователем и ИИ в рамках сценария.
    """
    __tablename__ = 'dialogs'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))  # Пользователь
    scenario_id = Column(Integer, ForeignKey('scenarios.id'))  # Сценарий
    started_at = Column(DateTime, default=datetime.utcnow)  # Время начала
    ended_at = Column(DateTime)  # Время окончания
    duration = Column(Integer)  # Длительность (в секундах)
    score = Column(Float)  # Оценка диалога
    messages = Column(JSON)  # История сообщений
    status = Column(String(20), default='active')  # Статус диалога
    completed_at = Column(DateTime, nullable=True)  # Время завершения
    is_successful = Column(Boolean, nullable=True)  # Успешность диалога
    
    # Связи
    user = relationship("Users", back_populates="dialogs")
    scenario = relationship("Scenario", back_populates="dialogs")
    message_objects = relationship("Message", back_populates="dialog")

class Achievement(db.Model):
    """
    Достижение, которое может получить пользователь.
    """
    __tablename__ = 'achievements'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)  # Название достижения
    description = Column(String(500))  # Описание
    icon = Column(String(100))  # Иконка
    points = Column(Integer, default=0)  # Очки за достижение
    is_repeatable = Column(Boolean, default=False)  # Можно ли получить несколько раз
    requirements = Column(JSON)  # Условия получения
    
    # Связи
    user_achievements = relationship("UserAchievement", back_populates="achievement")

class UserAchievement(db.Model):
    """
    Связь пользователя и достижения (когда и какое достижение получено).
    """
    __tablename__ = 'user_achievements'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))  # Пользователь
    achievement_id = Column(Integer, ForeignKey('achievements.id'))  # Достижение
    earned_at = Column(DateTime, default=datetime.utcnow)  # Время получения
    progress = Column(Integer, default=0)  # Прогресс (для накопительных достижений)
    
    # Связи
    user = relationship("Users", back_populates="achievements")
    achievement = relationship("Achievement", back_populates="user_achievements")

class Rating(db.Model):
    """
    Рейтинг пользователя (например, общий, по организации, за период).
    """
    __tablename__ = 'ratings'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))  # Пользователь
    score = Column(Float, nullable=False)  # Баллы
    category = Column(String(50))  # Категория рейтинга
    period = Column(String(20))  # Период (daily, weekly, monthly)
    calculated_at = Column(DateTime, default=datetime.utcnow)  # Дата расчёта
    
    # Связи
    user = relationship("Users", back_populates="ratings")

class UserPreferences(db.Model):
    """
    Настройки пользователя (язык, тема, предпочтения сложности).
    """
    __tablename__ = 'user_preferences'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, nullable=False)  # Пользователь
    language = Column(String(10), default='en')  # Язык
    difficulty_preference = Column(String(20), default='normal')  # Предпочтительная сложность
    theme = Column(String(20), default='light')  # Тема интерфейса
    
    user = relationship("Users", back_populates="preferences")

class UserStatistics(db.Model):
    """
    Статистика пользователя (количество диалогов, средний балл и т.д.).
    """
    __tablename__ = 'user_statistics'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, nullable=False)  # Пользователь
    total_dialogs = Column(Integer, default=0)  # Всего диалогов
    completed_scenarios = Column(Integer, default=0)  # Пройдено сценариев
    total_time_spent = Column(Integer, default=0) # Время в секундах
    average_score = Column(Float, default=0.0)  # Средний балл
    successful_dialogs = Column(Integer, default=0)  # Успешные диалоги
    
    user = relationship("Users", back_populates="statistics")

class UserProgress(db.Model):
    """
    Прогресс пользователя по конкретному сценарию.
    """
    __tablename__ = 'user_progress'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)  # Пользователь
    scenario_id = Column(Integer, ForeignKey('scenarios.id'), nullable=False)  # Сценарий
    current_step = Column(Integer, default=0)  # Текущий шаг
    completed = Column(Boolean, default=False)  # Завершён ли сценарий
    status = Column(String(20), default='not_started')  # Статус
    progress_percentage = Column(Integer, default=0)  # Прогресс в процентах
    updated_at = Column(DateTime, default=datetime.utcnow)  # Дата обновления

    user = relationship("Users", back_populates="progress")
    scenario = relationship("Scenario", back_populates="user_progress")

class Message(db.Model):
    """
    Сообщение в рамках диалога (от пользователя, ИИ или системы).
    """
    __tablename__ = 'messages'

    id = Column(Integer, primary_key=True)
    dialog_id = Column(Integer, ForeignKey('dialogs.id'), nullable=False)  # Диалог
    sender = Column(String(50), nullable=False)  # Отправитель ('user', 'ai', 'system')
    text = Column(Text, nullable=False)  # Текст сообщения
    timestamp = Column(DateTime, default=datetime.utcnow)  # Время отправки

    dialog = relationship("Dialog", back_populates="message_objects")

class Badge(db.Model):
    """
    Значок (badge), который может быть присвоен пользователю.
    """
    __tablename__ = 'badges'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True)  # Название значка
    description = Column(String(500))  # Описание
    icon_url = Column(String(255))  # URL иконки
    created_at = Column(DateTime, default=datetime.utcnow)

    user_badges = relationship("UserBadge", back_populates="badge")

class UserBadge(db.Model):
    """
    Связь пользователя и значка (badge).
    """
    __tablename__ = 'user_badges'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)  # Пользователь
    badge_id = Column(Integer, ForeignKey('badges.id'), nullable=False)  # Значок
    awarded_at = Column(DateTime, default=datetime.utcnow)  # Дата присвоения

    user = relationship("Users", back_populates="user_badges")
    badge = relationship("Badge", back_populates="user_badges")

def create_default_organization():
    """
    Создаёт организацию по умолчанию (id=1), если она ещё не существует.
    Используется при инициализации базы данных.
    Все сообщения выводятся через логгер приложения.
    """
    from flask import current_app
    with db.session.begin():
        default_org = Organization.query.filter_by(id=1).first()
        if not default_org:
            current_app.logger.info("Создаётся организация по умолчанию...")
            new_org = Organization(id=1, name="Default Organization", description="This is a default organization.")
            db.session.add(new_org)
            current_app.logger.info("Организация по умолчанию создана.")
        else:
            current_app.logger.info("Организация по умолчанию уже существует.")
