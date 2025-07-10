from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import UserProgress, Achievement, Users, UserAchievement

# Blueprint для активности пользователя
activity_bp = Blueprint('activity', __name__, url_prefix='/api/activity')

@activity_bp.route('/', methods=['GET'])
@jwt_required()
def get_activity():
    """
    Получение событий активности пользователя: завершённые тренировки, достижения, регистрация.
    Возвращает список событий, отсортированных по дате (от новых к старым).
    """
    user_id = get_jwt_identity()
    user = Users.query.get(user_id)
    if not user:
        return jsonify([])
    events = []

    # Завершённые тренировки
    for p in UserProgress.query.filter_by(user_id=user.id, status='completed').all():
        if p.updated_at:
            events.append({
                'date': p.updated_at.strftime('%Y-%m-%d'),
                'type': 'training',
                'action': f'Завершена тренировка по сценарию {p.scenario_id}'
            })

    # Полученные достижения
    for ua in UserAchievement.query.filter_by(user_id=user.id).all():
        achievement = Achievement.query.get(ua.achievement_id)
        if ua.earned_at and achievement:
            events.append({
                'date': ua.earned_at.strftime('%Y-%m-%d'),
                'type': 'achievement',
                'action': f'Получено достижение "{achievement.name}"'
            })

    # Событие регистрации
    if hasattr(user, 'created_at') and user.created_at:
        events.append({
            'date': user.created_at.strftime('%Y-%m-%d'),
            'type': 'registration',
            'action': 'Регистрация в системе'
        })

    # Сортировка по дате (от новых к старым)
    events.sort(key=lambda x: x['date'], reverse=True)
    return jsonify(events) 