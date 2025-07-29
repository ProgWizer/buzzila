from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import UserProgress, Scenario, Users
from models.database import db
from datetime import datetime, timedelta

progress_bp = Blueprint('progress', __name__, url_prefix='/api/progress')

@progress_bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_progress():
    """
    Получение прогресса пользователя по всем сценариям или по конкретному сценарию.
    Принимает scenario_id как query-параметр (опционально).
    Возвращает список прогресса с информацией о сценариях.
    """
    user_id = get_jwt_identity()
    user = Users.query.get(user_id)
    scenario_id = request.args.get('scenario_id')
    query = UserProgress.query.filter_by(user_id=user.id)
    if scenario_id:
        query = query.filter_by(scenario_id=scenario_id)
    progress_list = query.order_by(UserProgress.updated_at.desc()).all()

    result = []
    for p in progress_list:
        scenario = Scenario.query.get(p.scenario_id)
        result.append({
            'id': p.id,
            'scenario_id': p.scenario_id,
            'scenario_name': scenario.name if scenario else 'Unknown Scenario',
            'status': p.status,
            'progress_percentage': p.progress_percentage,
            'updated_at': p.updated_at.isoformat()
        })
    return jsonify({'progress': result})

@progress_bp.route('/', methods=['POST'])
@jwt_required()
def save_progress():
    """
    Сохраняет или обновляет прогресс пользователя по сценарию.
    Принимает scenario_id, status, progress_percentage (в JSON).
    Если прогресс по сценарию уже есть — обновляет, иначе создаёт новый.
    Возвращает обновлённый прогресс.
    """
    data = request.get_json()
    scenario_id = data.get('scenario_id')
    
    if not scenario_id:
        return jsonify({'error': 'Scenario ID is required'}), 400
        
    # Проверяем существование сценария
    scenario = Scenario.query.get(scenario_id)
    if not scenario:
        return jsonify({'error': 'Scenario not found'}), 404
    
    # Получаем существующий прогресс или создаем новый
    user_id = get_jwt_identity()
    progress = UserProgress.query.filter_by(
        user_id=user_id,
        scenario_id=scenario_id
    ).first()
    
    if not progress:
        progress = UserProgress(
            user_id=user_id,
            scenario_id=scenario_id
        )
        db.session.add(progress)
    
    # Валидация и обновление данных
    status = data.get('status', progress.status)
    progress_percentage = data.get('progress_percentage', progress.progress_percentage)
    
    if progress_percentage is not None and not (0 <= progress_percentage <= 100):
        return jsonify({'error': 'Progress percentage must be between 0 and 100'}), 400
    
    # Обновляем только если есть изменения
    if (progress.status != status or progress.progress_percentage != progress_percentage):
        progress.status = status
        progress.progress_percentage = progress_percentage
        progress.updated_at = datetime.utcnow()
        
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Failed to save progress', 'details': str(e)}), 500
    
    scenario = Scenario.query.get(progress.scenario_id)
    return jsonify({
        'message': 'Progress saved successfully',
        'progress': {
            'id': progress.id,
            'scenario_id': progress.scenario_id,
            'scenario_name': scenario.name if scenario else 'Unknown Scenario',
            'status': progress.status,
            'progress_percentage': progress.progress_percentage,
            'updated_at': progress.updated_at.isoformat()
        }
    })

@progress_bp.route('/reset', methods=['POST'])
@jwt_required()
def reset_progress():
    """
    Сбрасывает прогресс пользователя для конкретного сценария.
    Принимает scenario_id (в JSON).
    Возвращает сообщение об успехе или ошибке.
    """
    data = request.get_json()
    scenario_id = data.get('scenario_id')
    
    if not scenario_id:
        return jsonify({'error': 'Scenario ID is required'}), 400
    
    user_id = get_jwt_identity()
    progress = UserProgress.query.filter_by(
        user_id=user_id,
        scenario_id=scenario_id
    ).first()
    
    if progress:
        progress.status = 'not_started'
        progress.progress_percentage = 0
        progress.updated_at = datetime.utcnow()
        
        try:
            db.session.commit()
            return jsonify({'message': 'Progress reset successfully'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Failed to reset progress', 'details': str(e)}), 500
    
    return jsonify({'message': 'No progress found to reset'}), 404

# Исправленная функция для получения ежедневной активности
@progress_bp.route('/daily', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_daily_progress():
    """
    Получение ежедневной активности пользователя (завершённые диалоги по дням).
    Возвращает агрегированные данные за последние 7 дней.
    """
    user_id = get_jwt_identity()
    from datetime import timedelta
    week_ago = datetime.utcnow() - timedelta(days=7)
    
    # Агрегация завершенных диалогов по дням с исправленным синтаксисом case
    daily_progress = db.session.query(
        db.func.date(UserProgress.updated_at).label('date'),
        db.func.count(UserProgress.id).label('total_dialogs'),
        db.func.sum(db.case((UserProgress.status == 'completed', 1), else_=0)).label('completed_dialogs')
    ).filter(
        UserProgress.user_id == user_id,
        UserProgress.updated_at >= week_ago
    ).group_by(db.func.date(UserProgress.updated_at)).all()
    
    result = [{
        'date': dp.date.isoformat()[:10],  # Только дата в формате YYYY-MM-DD
        'total_dialogs': dp.total_dialogs,
        'completed_dialogs': dp.completed_dialogs
    } for dp in daily_progress]
    
    return jsonify({'dailyActivity': result})