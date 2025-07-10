from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import (
    Users, UserStatistics, UserPreferences, 
    Dialog, UserProgress, Badge, UserBadge, Scenario
)
from datetime import datetime, timedelta
from models.database import db

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/', methods=['GET'])
@jwt_required()
def get_profile():
    """
    Получение профиля текущего пользователя.
    Возвращает основную информацию, статистику, настройки, диалоги, значки и прогресс за неделю.
    """
    user_id = get_jwt_identity()
    print(f"User ID from JWT: {user_id}")
    current_user = Users.query.get(user_id)
    print(f"Current User object: {current_user}")
    if not current_user:
        return jsonify({'error': 'Пользователь не найден'}), 404

    # Получаем статистику пользователя
    stats = current_user.statistics
    
    # Получаем настройки пользователя
    preferences = current_user.preferences
    
    # Получаем диалоги пользователя (от новых к старым)
    dialogs = Dialog.query.filter_by(user_id=current_user.id).order_by(Dialog.started_at.desc()).all()
    
    # Получаем значки пользователя
    user_badges = UserBadge.query.filter_by(user_id=current_user.id).all()
    badges_data = []
    for ub in user_badges:
        badge = Badge.query.get(ub.badge_id)
        if badge:
            badges_data.append({
                'id': badge.id,
                'name': badge.name,
                'description': badge.description,
                'icon_url': badge.icon_url
            })
    
    # Получаем прогресс за последнюю неделю
    week_ago = datetime.utcnow() - timedelta(days=7)
    weekly_progress = UserProgress.query.filter(
        UserProgress.user_id == current_user.id,
        UserProgress.updated_at >= week_ago
    ).order_by(UserProgress.updated_at).all()
    
    # --- Блок: статистика по времени ---
    durations = [d.duration for d in dialogs if d.duration and d.duration > 0]
    average_time = int(sum(durations) / len(durations)) if durations else 0
    best_time = min(durations) if durations else 0
    last_time = durations[0] if durations else 0
    # По сценариям
    scenario_times = {}
    for d in dialogs:
        if d.scenario_id not in scenario_times:
            scenario_times[d.scenario_id] = []
        if d.duration and d.duration > 0:
            scenario_times[d.scenario_id].append(d.duration)
    scenario_stats = []
    for sid, times in scenario_times.items():
        if times:
            scenario = Scenario.query.get(sid)
            scenario_stats.append({
                'scenario_id': sid,
                'name': scenario.name if scenario else f'ID {sid}',
                'best_time': min(times),
                'average_time': int(sum(times)/len(times)),
                'last_time': times[0]
            })
    # --- Конец блока ---

    # История времени для графика (список словарей с датой и длительностью)
    time_history = [
        {'date': d.completed_at.isoformat(), 'duration': d.duration}
        for d in dialogs if d.completed_at and d.duration and d.duration > 0
    ]

    # Определяем количество диалогов, баллы, статус пользователя
    user_dialogs = stats.total_dialogs if stats else 0 # Количество диалогов пользователя
    user_points = current_user.points or 0 # Баллы пользователя
    user_status = 'Активен' if current_user.is_active else 'Неактивен'
    user_avatar = '' # Placeholder, если аватар не реализован

    # Формируем структуру ответа
    return jsonify({
        'user': {
            'id': current_user.id,
            'email': current_user.email,
            'name': current_user.username,
            'role': current_user.role.value,
            'created_at': current_user.created_at.isoformat(),
            'last_login': current_user.last_login.isoformat() if current_user.last_login else None,
            'avatar': user_avatar,
            'dialogs': user_dialogs,
            'points': user_points,
            'status': user_status
        },
        'statistics': {
            'totalDialogs': stats.total_dialogs if stats else 0,
            'completedScenarios': stats.completed_scenarios if stats else 0,
            'totalTimeSpent': stats.total_time_spent if stats else 0,
            'averageScore': float(stats.average_score) if stats else 0.0
        },
        'preferences': {
            'language': preferences.language if preferences else 'ru',
            'difficulty': preferences.difficulty_preference if preferences else 'normal',
            'theme': preferences.theme if preferences else 'light'
        },
        'dialogs': [{
            'id': d.id,
            'started_at': d.started_at.isoformat(),
            'completed_at': d.ended_at.isoformat() if d.ended_at else None,
            'score': d.score,
            'status': 'completed' 
        } for d in dialogs],
        'badges': badges_data,
        'weeklyProgress': [{
            'date': p.updated_at.isoformat(),
            'status': 'completed', 
            'progress_percentage': p.current_step 
        } for p in weekly_progress],
        'timeStats': {
            'averageTime': average_time,
            'bestTime': best_time,
            'lastTime': last_time,
            'byScenario': scenario_stats
        },
        'timeHistory': time_history
    }), 200

@profile_bp.route('/preferences', methods=['PUT'])
@jwt_required()
def update_preferences():
    """
    Обновление настроек пользователя (язык, сложность, тема, уведомления).
    Принимает JSON с новыми значениями.
    """
    user_id = get_jwt_identity()
    current_user = Users.query.get(user_id)
    if not current_user:
        return jsonify({'error': 'Пользователь не найден'}), 404
    
    data = request.get_json()
    preferences = current_user.preferences

    # Если настроек ещё нет — создаём их
    if not preferences:
        preferences = UserPreferences(user_id=current_user.id)
        db.session.add(preferences)

    # Обновляем поля, если они есть в запросе
    if 'language' in data:
        preferences.language = data['language']
    if 'difficulty' in data:
        preferences.difficulty_preference = data['difficulty']
    if 'theme' in data:
        preferences.theme = data['theme']
    if 'notification_enabled' in data:
        preferences.notification_enabled = data['notification_enabled']

    try:
        db.session.commit()
        return jsonify({
            'message': 'Настройки успешно обновлены',
            'preferences': {
                'language': preferences.language,
                'difficulty': preferences.difficulty_preference,
                'theme': preferences.theme,
                'notification_enabled': preferences.notification_enabled
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ошибка при обновлении настроек'}), 500 