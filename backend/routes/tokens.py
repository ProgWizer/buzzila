from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import Users, db
from datetime import datetime, timedelta

bp = Blueprint('tokens', __name__)

@bp.route('/api/tokens/usage', methods=['GET'])
@jwt_required()
def get_token_usage():
    """
    Получение информации об использовании токенов текущего пользователя
    """
    user_id = get_jwt_identity()
    user = Users.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'Пользователь не найден'}), 404
    
    return jsonify({
        'tokens_used': user.tokens_used,
        'token_limit': user.token_limit,
        'tokens_remaining': max(0, user.token_limit - user.tokens_used),
        'usage_percentage': min(100, (user.tokens_used / user.token_limit * 100) if user.token_limit > 0 else 0)
    })

@bp.route('/api/tokens/add', methods=['POST'])
@jwt_required()
def add_tokens():
    """
    Добавление токенов пользователю (только для администраторов)
    """
    # Проверяем, что пользователь - администратор
    user_id = get_jwt_identity()
    admin = Users.query.get(user_id)
    
    if not admin or admin.role != 'admin':
        return jsonify({'error': 'Недостаточно прав'}), 403
    
    data = request.get_json()
    user_id = data.get('user_id')
    tokens_to_add = int(data.get('tokens', 0))
    
    if not user_id or tokens_to_add <= 0:
        return jsonify({'error': 'Некорректные данные'}), 400
    
    user = Users.query.get(user_id)
    if not user:
        return jsonify({'error': 'Пользователь не найден'}), 404
    
    user.token_limit += tokens_to_add
    db.session.commit()
    
    return jsonify({
        'message': 'Токены успешно добавлены',
        'new_token_limit': user.token_limit,
        'tokens_used': user.tokens_used,
        'tokens_remaining': max(0, user.token_limit - user.tokens_used)
    })

@bp.route('/api/tokens/reset', methods=['POST'])
@jwt_required()
def reset_tokens():
    """
    Сброс счетчика использованных токенов (только для администраторов)
    """
    # Проверяем, что пользователь - администратор
    user_id = get_jwt_identity()
    admin = Users.query.get(user_id)
    
    if not admin or admin.role != 'admin':
        return jsonify({'error': 'Недостаточно прав'}), 403
    
    data = request.get_json()
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Не указан ID пользователя'}), 400
    
    user = Users.query.get(user_id)
    if not user:
        return jsonify({'error': 'Пользователь не найден'}), 404
    
    user.tokens_used = 0
    user.last_token_reset = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': 'Счетчик токенов сброшен',
        'tokens_used': 0,
        'token_limit': user.token_limit,
        'last_reset': user.last_token_reset.isoformat()
    })

@bp.route('/api/tokens/set-limit', methods=['POST'])
@jwt_required()
def set_token_limit():
    """
    Установка лимита токенов для пользователя (только для администраторов)
    """
    # Проверяем, что пользователь - администратор
    user_id = get_jwt_identity()
    admin = Users.query.get(user_id)
    
    if not admin or admin.role != 'admin':
        return jsonify({'error': 'Недостаточно прав'}), 403
    
    data = request.get_json()
    user_id = data.get('user_id')
    new_limit = int(data.get('limit', 0))
    
    if not user_id or new_limit < 0:
        return jsonify({'error': 'Некорректные данные'}), 400
    
    user = Users.query.get(user_id)
    if not user:
        return jsonify({'error': 'Пользователь не найден'}), 404
    
    user.token_limit = new_limit
    db.session.commit()
    
    return jsonify({
        'message': 'Лимит токенов обновлен',
        'user_id': user.id,
        'token_limit': user.token_limit,
        'tokens_used': user.tokens_used,
        'tokens_remaining': max(0, user.token_limit - user.tokens_used)
    })
