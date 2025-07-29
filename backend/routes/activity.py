from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import Scenario, UserProgress, Achievement, Users, UserAchievement
from models.database import db
from datetime import datetime, timedelta
import logging

activity_bp = Blueprint('activity', __name__, url_prefix='/api/activity')

# Настройка логирования для отладки
logger = logging.getLogger(__name__)

@activity_bp.route('/', methods=['GET'])
@jwt_required()
def get_activity():
    """
    Получение активности пользователя: агрегированные данные по дням (завершённые тренировки, достижения).
    Возвращает список событий, агрегированных по дням за последние 7 дней.
    Опционально: параметр 'detailed' для получения детализированных событий.
    """
    user_id = get_jwt_identity()
    user = Users.query.get(user_id)
    if not user:
        logger.warning(f"User not found for user_id: {user_id}")
        return jsonify({'dailyActivity': []})

    # Определяем период (7 дней назад)
    week_ago = datetime.utcnow() - timedelta(days=7)

    # Агрегация данных по дням с исправленным синтаксисом case
    daily_activity = db.session.query(
        db.func.date(UserProgress.updated_at).label('date'),
        db.func.count(UserProgress.id).label('total_dialogs'),
        db.func.count(db.case((UserProgress.status == 'completed', 1), else_=0)).label('completed_dialogs'),
        db.func.count(db.case((UserAchievement.earned_at.isnot(None), 1), else_=0)).label('achievements_earned')
    ).outerjoin(
        UserAchievement, UserAchievement.user_id == user_id
    ).filter(
        UserProgress.user_id == user_id,
        UserProgress.updated_at >= week_ago
    ).group_by(db.func.date(UserProgress.updated_at)).all()

    # Форматирование результата
    result = [{
        'date': dp.date.isoformat()[:10],  # YYYY-MM-DD
        'completed_dialogs': dp.completed_dialogs or 0,
        'total_dialogs': dp.total_dialogs or 0,
        'achievements_earned': dp.achievements_earned or 0
    } for dp in daily_activity]

    # Добавление события регистрации, если оно в пределах 7 дней
    if user.created_at and user.created_at >= week_ago:
        result.append({
            'date': user.created_at.strftime('%Y-%m-%d'),
            'completed_dialogs': 0,
            'total_dialogs': 0,
            'achievements_earned': 0,
            'registration': 'Регистрация в системе'
        })

    # Сортировка по дате (от новых к старым)
    result.sort(key=lambda x: x['date'], reverse=True)
    logger.info(f"Daily activity for user {user_id}: {result}")
    return jsonify({'dailyActivity': result})

# Опциональный эндпоинт для детализированных событий (если нужен)
@activity_bp.route('/detailed', methods=['GET'])
@jwt_required()
def get_detailed_activity():
    """
    Получение детализированных событий активности пользователя (завершённые тренировки, достижения, регистрация).
    Возвращает список событий, отсортированных по дате (от новых к старым).
    """
    user_id = get_jwt_identity()
    user = Users.query.get(user_id)
    if not user:
        logger.warning(f"User not found for user_id: {user_id}")
        return jsonify([])

    events = []

    # Завершённые тренировки
    for p in UserProgress.query.filter_by(user_id=user.id, status='completed').all():
        scenario = Scenario.query.get(p.scenario_id)
        if p.updated_at:
            events.append({
                'date': p.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
                'type': 'training',
                'action': f'Завершена тренировка "{scenario.name if scenario else "Unknown Scenario"}" (ID: {p.scenario_id})'
            })
        else:
            logger.warning(f"UserProgress {p.id} has no updated_at")

    # Полученные достижения
    for ua in UserAchievement.query.filter_by(user_id=user.id).all():
        achievement = Achievement.query.get(ua.achievement_id)
        if ua.earned_at and achievement:
            events.append({
                'date': ua.earned_at.strftime('%Y-%m-%d %H:%M:%S'),
                'type': 'achievement',
                'action': f'Получено достижение "{achievement.name}"'
            })
        else:
            logger.warning(f"UserAchievement {ua.id} has no earned_at or achievement")

    # Событие регистрации
    if hasattr(user, 'created_at') and user.created_at:
        events.append({
            'date': user.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'type': 'registration',
            'action': 'Регистрация в системе'
        })

    # Сортировка по дате (от новых к старым)
    events.sort(key=lambda x: x['date'], reverse=True)
    logger.info(f"Detailed activity for user {user_id}: {events}")
    return jsonify(events)