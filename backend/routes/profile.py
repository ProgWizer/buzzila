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
    ОТЛАДОЧНАЯ версия получения профиля с детальным логированием
    """
    user_id = get_jwt_identity()
    print(f"=== ОТЛАДКА ПРОФИЛЯ ===")
    print(f"User ID from JWT: {user_id}")
    
    current_user = Users.query.get(user_id)
    print(f"Current User object: {current_user}")
    if not current_user:
        return jsonify({'error': 'Пользователь не найден'}), 404

    # Получаем ВСЕ диалоги пользователя с детальной информацией
    all_dialogs = Dialog.query.filter_by(user_id=current_user.id).order_by(Dialog.id.desc()).all()
    print(f"=== АНАЛИЗ ДИАЛОГОВ ===")
    print(f"Всего диалогов найдено: {len(all_dialogs)}")
    
    completed_dialogs = []
    active_dialogs = []
    
    for dialog in all_dialogs:
        print(f"Диалог {dialog.id}: статус='{dialog.status}', сценарий={dialog.scenario_id}, "
              f"начат={dialog.started_at}, завершен={dialog.completed_at}, "
              f"длительность={dialog.duration}, успешен={getattr(dialog, 'is_successful', None)}")
        
        if dialog.status == 'completed':
            completed_dialogs.append(dialog)
        elif dialog.status == 'active':
            active_dialogs.append(dialog)

    print(f"Завершенных диалогов: {len(completed_dialogs)}")
    print(f"Активных диалогов: {len(active_dialogs)}")

    # Анализ статистики пользователя
    stats = current_user.statistics
    print(f"=== СТАТИСТИКА ПОЛЬЗОВАТЕЛЯ ===")
    if stats:
        print(f"total_dialogs: {stats.total_dialogs}")
        print(f"successful_dialogs: {stats.successful_dialogs}")
        print(f"completed_scenarios: {stats.completed_scenarios}")
        print(f"total_time_spent: {stats.total_time_spent}")
        print(f"average_score: {stats.average_score}")
    else:
        print("Статистика пользователя отсутствует!")

    # Получаем уникальные завершенные сценарии
    completed_scenario_ids = set([d.scenario_id for d in completed_dialogs])
    print(f"Уникальных завершенных сценариев: {len(completed_scenario_ids)} - {completed_scenario_ids}")

    # Рассчитываем время
    durations = [d.duration for d in completed_dialogs if d.duration and d.duration > 0]
    print(f"Диалоги с duration: {len(durations)} из {len(completed_dialogs)}")
    
    average_time = int(sum(durations) / len(durations)) if durations else 0
    best_time = min(durations) if durations else 0
    last_time = durations[0] if durations else 0
    
    print(f"Статистика времени - Среднее: {average_time}, Лучшее: {best_time}, Последнее: {last_time}")

    # Получаем preferences
    preferences = current_user.preferences

    # Формируем completed_scenarios для ответа
    completed_scenarios = []
    for scenario_id in completed_scenario_ids:
        scenario = Scenario.query.get(scenario_id)
        if scenario:
            last_dialog = next((d for d in completed_dialogs if d.scenario_id == scenario_id), None)
            progress = UserProgress.query.filter_by(
                user_id=current_user.id,
                scenario_id=scenario_id
            ).first()
            
            completed_scenarios.append({
                'id': scenario.id,
                'name': scenario.name,
                'description': scenario.description,
                'progress_percentage': progress.progress_percentage if progress else 100,
                'completed_at': last_dialog.completed_at.isoformat() if last_dialog and last_dialog.completed_at else None
            })

    # Получаем badges
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

    # Получаем weekly progress
    week_ago = datetime.utcnow() - timedelta(days=7)
    weekly_progress = UserProgress.query.filter(
        UserProgress.user_id == current_user.id,
        UserProgress.updated_at >= week_ago
    ).order_by(UserProgress.updated_at).all()

    # ПЕРЕСЧИТЫВАЕМ статистику на основе реальных данных
    total_time_spent = sum(durations) if durations else 0
    
    statistics_data = {
        'totalDialogs': len(all_dialogs),  # ВСЕ диалоги
        'completedScenarios': len(completed_scenario_ids),  # Уникальные завершенные сценарии
        'totalTimeSpent': total_time_spent,  # Сумма всех duration
        'averageScore': float(stats.average_score) if stats and stats.average_score else 0.0,
        'successfulDialogs': len(all_dialogs)  # Теперь считаем все диалоги, а не только успешные
    }

    print(f"=== ИТОГОВАЯ СТАТИСТИКА ===")
    print(f"statistics_data: {statistics_data}")

    # Формируем время по сценариям
    scenario_stats = []
    scenario_times = {}
    for d in completed_dialogs:
        if d.scenario_id not in scenario_times:
            scenario_times[d.scenario_id] = []
        if d.duration and d.duration > 0:
            scenario_times[d.scenario_id].append(d.duration)
    
    for sid, times in scenario_times.items():
        if times:
            scenario = Scenario.query.get(sid)
            scenario_stats.append({
                'scenario_id': sid,
                'name': scenario.name if scenario else f'Сценарий {sid}',
                'best_time': min(times),
                'average_time': int(sum(times)/len(times)),
                'last_time': times[0]
            })

    return jsonify({
        'user': {
            'id': current_user.id,
            'email': current_user.email,
            'name': current_user.username,
            'role': current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
            'created_at': current_user.created_at.isoformat(),
            'last_login': current_user.last_login.isoformat() if current_user.last_login else None,
            'avatar': '',
            'dialogs': len(all_dialogs),
            'points': current_user.points or 0,
            'status': 'Активен'
        },
        'statistics': statistics_data,
        'preferences': {
            'language': preferences.language if preferences else 'ru',
            'difficulty': preferences.difficulty_preference if preferences else 'normal',
            'theme': preferences.theme if preferences else 'light'
        },
        'dialogs': [{
            'id': d.id,
            'started_at': d.started_at.isoformat(),
            'completed_at': d.completed_at.isoformat() if d.completed_at else None,
            'score': d.score,
            'status': d.status,  # Показываем реальный статус
            'duration': d.duration if d.duration and d.duration > 0 else None,
            'analysis': getattr(d, 'analysis', None),
            'was_successful': getattr(d, 'is_successful', None),
            'scenario_name': d.scenario.name if d.scenario else 'Неизвестный сценарий'
        } for d in all_dialogs],
        'badges': badges_data,
        'weeklyProgress': [{
            'date': p.updated_at.isoformat(),
            'status': 'completed' if p.completed else 'in_progress', 
            'progress_percentage': p.progress_percentage or 0
        } for p in weekly_progress],
        'timeStats': {
            'averageTime': average_time,
            'bestTime': best_time,
            'lastTime': last_time,
            'byScenario': scenario_stats
        },
        'completed_scenarios': completed_scenarios,
        'debug_info': {
            'total_dialogs_in_db': len(all_dialogs),
            'completed_dialogs_count': len(completed_dialogs),
            'active_dialogs_count': len(active_dialogs),
            'completed_scenario_ids': list(completed_scenario_ids),
            'has_user_stats': stats is not None
        }
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
        print(f"Созданы новые настройки для пользователя {current_user.id}")

    # Обновляем поля, если они есть в запросе
    if 'language' in data:
        preferences.language = data['language']
        print(f"Обновлен язык: {data['language']}")
    if 'difficulty' in data:
        preferences.difficulty_preference = data['difficulty']
        print(f"Обновлена сложность: {data['difficulty']}")
    if 'theme' in data:
        preferences.theme = data['theme']
        print(f"Обновлена тема: {data['theme']}")
    if 'notification_enabled' in data:
        preferences.notification_enabled = data['notification_enabled']
        print(f"Обновлены уведомления: {data['notification_enabled']}")

    try:
        db.session.commit()
        print(f"Настройки пользователя {current_user.id} успешно сохранены")
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
        print(f"Ошибка при сохранении настроек: {e}")
        return jsonify({'error': 'Ошибка при обновлении настроек', 'details': str(e)}), 500