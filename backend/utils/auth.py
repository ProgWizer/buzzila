from functools import wraps
from flask import jsonify
from models.models import Users
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

def role_required(role_name):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = Users.query.get(user_id)

            if not user or not user.is_active:
                return jsonify({'error': 'Неавторизованный доступ'}), 401
            
            if user.role.value != role_name:
                return jsonify({'error': 'Недостаточно прав'}), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator

# Декораторы для проверки конкретных ролей
admin_required = role_required("admin")
moderator_required = role_required("manager") 