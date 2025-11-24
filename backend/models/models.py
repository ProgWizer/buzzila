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
    vk_id = Column(String(50), unique=True, nullable=True)  # Добавляем поле для VK ID
    role = Column(Enum(UserRole), default=UserRole.USER)  # Роль пользователя
    is_active = Column(Boolean, default=True)  # Активен ли пользователь
    created_at = Column(DateTime, default=datetime.utcnow)  # Дата создания
    last_login = Column(DateTime)  # Дата последнего входа
    organization_id = Column(Integer, ForeignKey('organizations.id'), nullable=True)  # Связь с организацией
    total_score = Column(Float, default=0.0)  # Общий счет пользователя
    level = Column(Integer, default=1)  # Уровень пользователя
    experience_points = Column(Integer, default=0)  # Очки опыта
    points = Column(Integer, default=0)  # Очки пользователя (дополнительное поле)

    # Связи
    organization = relationship("Organization", back_populates="users")  # Связь с организацией
    user_achievements = relationship("UserAchievement", back_populates="user")  # Достижения пользователя
    dialogs = relationship("Dialog", back_populates="user")  # Диалоги пользователя
    activities = relationship("Activity", back_populates="user")  # Активность пользователя
    preferences = relationship("UserPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan")  # Настройки пользователя
    statistics = relationship("UserStatistics", back_populates="user", uselist=False, cascade="all, delete-orphan")  # Статистика пользователя
    progress = relationship("UserProgress", back_populates="user")  # Прогресс пользователя
    user_badges = relationship("UserBadge", back_populates="user")  # Значки пользователя
    ratings = relationship("Rating", back_populates="user")  # Рейтинги пользователя

class Organization(db.Model):
    """
    Модель организации.
    Содержит информацию об организации, к которой могут принадлежать пользователи.
    """
    __tablename__ = 'organizations'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)  # Название организации
    description = Column(String(500))  # Описание организации
    created_at = Column(DateTime, default=datetime.utcnow)  # Дата создания
    is_active = Column(Boolean, default=True)  # Активна ли организация

    # Связи
    users = relationship("Users", back_populates="organization")  # Пользователи организации
    scenarios = relationship("Scenario", back_populates="organization")  # Сценарии организации
    prompt_templates = relationship("PromptTemplate", back_populates="organization")  # Шаблоны промптов организации

class Scenario(db.Model):
    """
    Модель сценария для ролевых игр.
    Содержит информацию о сценарии, включая описание, роли и шаблон промпта.
    """
    __tablename__ = 'scenarios'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)  # Название сценария
    description = Column(Text, nullable=False)  # Описание сценария
    category = Column(String(50), nullable=False)  # Категория сценария
    subcategory = Column(String(50), nullable=False)  # Подкатегория сценария
    sphere = Column(String(100), nullable=False)  # Сфера применения
    situation = Column(String(200), nullable=False)  # Ситуация
    mood = Column(String(100), nullable=False)  # Настроение
    language = Column(String(50), default='ru')  # Язык сценария
    user_role = Column(String(200), nullable=False)  # Роль пользователя
    ai_role = Column(String(200), nullable=False)  # Роль ИИ
    ai_behavior = Column(String(200), nullable=False)  # Поведение ИИ
    is_active = Column(Boolean, default=True)  # Активен ли сценарий
    is_template = Column(Boolean, default=False)  # Является ли шаблоном
    created_at = Column(DateTime, default=datetime.utcnow)  # Дата создания
    organization_id = Column(Integer, ForeignKey('organizations.id'), nullable=True)  # Связь с организацией
    prompt_template = Column(Text, nullable=False)  # Шаблон для генерации диалога
    prompt_template_id = Column(Integer, ForeignKey('prompt_templates.id'), nullable=True)  # Связь с шаблоном промпта
    type = Column(Enum(ScenarioType), nullable=False)  # Тип сценария
    difficulty = Column(Integer, default=1)  # Сложность (1-5)
    estimated_time = Column(Integer)  # Оценочное время (в минутах)
    category_id = Column(Integer, ForeignKey('categories.id'))  # Категория (внешний ключ)

    # Связи
    organization = relationship("Organization", back_populates="scenarios")  # Связь с организацией
    category_obj = relationship("Category", back_populates="scenarios")  # Связь с категорией
    dialogs = relationship("Dialog", back_populates="scenario")  # Диалоги по сценарию
    prompt_template_obj = relationship("PromptTemplate", backref="scenarios")  # Связь с шаблоном промпта
    user_progress = relationship("UserProgress", back_populates="scenario")  # Прогресс пользователей

    def get_user_progress(self, user_id):
        """
        Возвращает прогресс пользователя по данному сценарию.
        """
        return next((progress for progress in self.user_progress if progress.user_id == user_id), None)

class Dialog(db.Model):
    """
    Модель диалога между пользователем и ИИ.
    Содержит информацию о диалоге, включая сценарий и участников.
    """
    __tablename__ = 'dialogs'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)  # Связь с пользователем
    scenario_id = Column(Integer, ForeignKey('scenarios.id'), nullable=False)  # Связь со сценарием
    started_at = Column(DateTime, default=datetime.utcnow)  # Время начала диалога
    finished_at = Column(DateTime)  # Время окончания диалога
    ended_at = Column(DateTime)  # Время окончания диалога (дополнительное поле)
    duration = Column(Integer)  # Длительность (в секундах)
    is_finished = Column(Boolean, default=False)  # Завершен ли диалог
    user_score = Column(Float, default=0.0)  # Оценка пользователя
    score = Column(Float)  # Оценка диалога (дополнительное поле)
    ai_feedback = Column(Text)  # Обратная связь от ИИ
    total_messages = Column(Integer, default=0)  # Общее количество сообщений
    user_messages_count = Column(Integer, default=0)  # Количество сообщений пользователя
    ai_messages_count = Column(Integer, default=0)  # Количество сообщений ИИ
    messages = Column(JSON)  # История сообщений
    status = Column(String(20), default='active')  # Статус диалога
    completed_at = Column(DateTime, nullable=True)  # Время завершения
    is_successful = Column(Boolean, nullable=True)  # Успешность диалога
    is_archived = Column(Boolean, default=False)  # Архивирован ли диалог

    # Связи
    user = relationship("Users", back_populates="dialogs")  # Связь с пользователем
    scenario = relationship("Scenario", back_populates="dialogs")  # Связь со сценарием
    message_objects = relationship("Message", back_populates="dialog")  # Объекты сообщений

class Message(db.Model):
    """
    Модель сообщения в диалоге.
    Содержит текст сообщения, отправителя и время отправки.
    """
    __tablename__ = 'messages'
    
    id = Column(Integer, primary_key=True)
    dialog_id = Column(Integer, ForeignKey('dialogs.id'), nullable=False)  # Связь с диалогом
    sender = Column(String(20), nullable=False)  # Отправитель: 'user' или 'ai'
    text = Column(Text, nullable=False)  # Текст сообщения
    timestamp = Column(DateTime, default=datetime.utcnow)  # Время отправки

    # Связи
    dialog = relationship("Dialog", back_populates="message_objects")  # Связь с диалогом

class Achievement(db.Model):
    """
    Модель достижения.
    Содержит информацию о достижении, включая название, описание и требования.
    """
    __tablename__ = 'achievements'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)  # Название достижения
    name = Column(String(100), nullable=False)  # Название достижения (дополнительное поле)
    description = Column(Text, nullable=False)  # Описание достижения
    icon = Column(String(500))  # Иконка достижения
    points = Column(Integer, default=0)  # Очки за достижение
    is_repeatable = Column(Boolean, default=False)  # Повторяемое ли достижение
    requirements = Column(JSON)  # Требования для получения достижения
    created_at = Column(DateTime, default=datetime.utcnow)  # Дата создания

    # Связи
    user_achievements = relationship("UserAchievement", back_populates="achievement")  # Достижения пользователей

class UserAchievement(db.Model):
    """
    Модель связи пользователя и достижения.
    Содержит информацию о том, когда пользователь получил достижение.
    """
    __tablename__ = 'user_achievements'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)  # Связь с пользователем
    achievement_id = Column(Integer, ForeignKey('achievements.id'), nullable=False)  # Связь с достижением
    earned_at = Column(DateTime, default=datetime.utcnow)  # Время получения достижения
    progress = Column(Float, default=0.0)  # Прогресс выполнения (0.0 - 1.0)

    # Связи
    user = relationship("Users", back_populates="user_achievements")  # Связь с пользователем
    achievement = relationship("Achievement", back_populates="user_achievements")  # Связь с достижением

class Activity(db.Model):
    """
    Модель активности пользователя.
    Содержит информацию о действиях пользователя в системе.
    """
    __tablename__ = 'activities'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)  # Связь с пользователем
    activity_type = Column(String(50), nullable=False)  # Тип активности
    description = Column(String(500))  # Описание активности
    activity_metadata = Column(JSON)  # Дополнительные данные
    timestamp = Column(DateTime, default=datetime.utcnow)  # Время активности

    # Связи
    user = relationship("Users", back_populates="activities")  # Связь с пользователем

class PromptTemplate(db.Model):
    """
    Модель шаблона системного промпта.
    Содержит информацию о шаблоне промпта для использования в сценариях.
    """
    __tablename__ = 'prompt_templates'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(150), nullable=False)  # Название шаблона
    description = Column(String(500))  # Описание шаблона
    content_start = Column(Text)  # Контент для начала диалога
    content_continue = Column(Text)  # Контент для продолжения диалога
    forbidden_words = Column(Text)  # Запрещенные слова
    sections_json = Column(Text)  # JSON с секциями шаблона
    analysis_prompt = Column(Text)  # Промпт для анализа диалога
    organization_id = Column(Integer, ForeignKey('organizations.id'), nullable=True)  # Связь с организацией
    created_at = Column(DateTime, default=datetime.utcnow)  # Дата создания
    created_by_user_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # Создатель шаблона
    is_global = Column(Boolean, default=True)  # Глобальный ли шаблон

    # Связи
    organization = relationship("Organization", back_populates="prompt_templates")  # Связь с организацией
    created_by = relationship("Users", backref="created_prompt_templates")  # Создатель шаблона

class UserPreferences(db.Model):
    """
    Модель настроек пользователя.
    Содержит пользовательские предпочтения: язык, сложность, тема.
    """
    __tablename__ = 'user_preferences'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, unique=True)  # Связь с пользователем
    language = Column(String(10), default='ru')  # Язык интерфейса
    difficulty_preference = Column(String(20), default='normal')  # Предпочитаемая сложность
    theme = Column(String(20), default='light')  # Тема интерфейса
    created_at = Column(DateTime, default=datetime.utcnow)  # Дата создания
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  # Дата обновления

    # Связи
    user = relationship("Users", back_populates="preferences")  # Связь с пользователем

class UserStatistics(db.Model):
    """
    Модель статистики пользователя.
    Содержит статистические данные о активности пользователя.
    """
    __tablename__ = 'user_statistics'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, unique=True)  # Связь с пользователем
    total_dialogs = Column(Integer, default=0)  # Общее количество диалогов
    completed_scenarios = Column(Integer, default=0)  # Завершенные сценарии
    total_time_spent = Column(Integer, default=0)  # Общее время в секундах
    average_score = Column(Float, default=0.0)  # Средняя оценка
    successful_dialogs = Column(Integer, default=0)  # Успешные диалоги
    created_at = Column(DateTime, default=datetime.utcnow)  # Дата создания
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  # Дата обновления

    # Связи
    user = relationship("Users", back_populates="statistics")  # Связь с пользователем

class UserProgress(db.Model):
    """
    Модель прогресса пользователя по сценариям.
    Содержит информацию о прохождении сценариев пользователем.
    """
    __tablename__ = 'user_progress'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)  # Связь с пользователем
    scenario_id = Column(Integer, ForeignKey('scenarios.id'), nullable=False)  # Связь со сценарием
    status = Column(String(20), default='in_progress')  # Статус прохождения
    score = Column(Float, default=0.0)  # Оценка
    attempts = Column(Integer, default=0)  # Количество попыток
    best_score = Column(Float, default=0.0)  # Лучшая оценка
    current_step = Column(Integer, default=0)  # Текущий шаг
    completed = Column(Boolean, default=False)  # Завершён ли сценарий
    progress_percentage = Column(Integer, default=0)  # Прогресс в процентах
    created_at = Column(DateTime, default=datetime.utcnow)  # Дата создания
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  # Дата обновления

    # Связи
    user = relationship("Users", back_populates="progress")  # Связь с пользователем
    scenario = relationship("Scenario", back_populates="user_progress")  # Связь со сценарием

class Badge(db.Model):
    """
    Модель значка/бейджа.
    Содержит информацию о значках, которые могут получать пользователи.
    """
    __tablename__ = 'badges'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True)  # Название значка
    description = Column(String(500))  # Описание значка
    icon_url = Column(String(500))  # URL иконки значка
    requirements = Column(JSON)  # Требования для получения значка
    created_at = Column(DateTime, default=datetime.utcnow)  # Дата создания

    # Связи
    user_badges = relationship("UserBadge", back_populates="badge")  # Связь с пользовательскими значками

class UserBadge(db.Model):
    """
    Модель связи пользователя и значка.
    Содержит информацию о том, какие значки получил пользователь.
    """
    __tablename__ = 'user_badges'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)  # Связь с пользователем
    badge_id = Column(Integer, ForeignKey('badges.id'), nullable=False)  # Связь со значком
    earned_at = Column(DateTime, default=datetime.utcnow)  # Время получения значка
    awarded_at = Column(DateTime, default=datetime.utcnow)  # Дата присвоения

    # Связи
    user = relationship("Users", back_populates="user_badges")  # Связь с пользователем
    badge = relationship("Badge", back_populates="user_badges")  # Связь со значком

class Rating(db.Model):
    """
    Модель рейтинга пользователя.
    Содержит информацию о рейтингах пользователя по различным категориям.
    """
    __tablename__ = 'ratings'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)  # Связь с пользователем
    score = Column(Float, nullable=False)  # Баллы
    category = Column(String(50))  # Категория рейтинга
    period = Column(String(20))  # Период (daily, weekly, monthly)
    calculated_at = Column(DateTime, default=datetime.utcnow)  # Дата расчёта

    # Связи
    user = relationship("Users", back_populates="ratings")  # Связь с пользователем

def init_default_data():
    """
    Инициализация данных по умолчанию.
    Создает организацию по умолчанию, если она не существует.
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
