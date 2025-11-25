from flask import Blueprint, redirect, request, jsonify
import requests
from models.models import Users, UserPreferences, UserStatistics, UserRole, db
from datetime import datetime
from flask_jwt_extended import create_access_token, create_refresh_token

yandex_bp = Blueprint('yandex_auth', __name__)

# Конфигурация Яндекс OAuth
YANDEX_CLIENT_ID = 'b269904fa9be4b55a7a253a69266e393'
YANDEX_CLIENT_SECRET = 'ebc45072485848f8bf22f96850b8eec9'
YANDEX_REDIRECT_URI = 'https://profdailog.com/auth/yandex/callback'

# ---------------------------------------------------
# Редирект на Яндекс для авторизации
# ---------------------------------------------------
@yandex_bp.route('/auth/yandex', methods=['GET'])
def yandex_auth_redirect():
    auth_url = 'https://oauth.yandex.com/authorize'
    params = {
        'response_type': 'code',
        'client_id': YANDEX_CLIENT_ID,
        'redirect_uri': YANDEX_REDIRECT_URI
    }
    from urllib.parse import urlencode
    return redirect(f"{auth_url}?{urlencode(params)}")

# ---------------------------------------------------
# Callback для Яндекс и верификация
# ---------------------------------------------------
@yandex_bp.route('/auth/yandex/verify', methods=['POST'])
def yandex_verify():
    data = request.get_json()
    code = data.get('code')

    if not code:
        return jsonify({'error': 'Нет кода авторизации'}), 400

    try:
        # Получаем access_token от Яндекс
        token_url = 'https://oauth.yandex.com/token'
        payload = {
            'grant_type': 'authorization_code',
            'code': code,
            'client_id': YANDEX_CLIENT_ID,
            'client_secret': YANDEX_CLIENT_SECRET
        }

        r = requests.post(token_url, data=payload)
        token_data = r.json()

        if 'error' in token_data:
            return jsonify({'error': token_data.get('error_description', 'Ошибка авторизации Яндекс')}), 400

        access_token_yandex = token_data.get('access_token')

        # Получаем информацию о пользователе
        user_info_resp = requests.get(
            'https://login.yandex.ru/info',
            headers={'Authorization': f'OAuth {access_token_yandex}'}
        )
        user_info = user_info_resp.json()

        # Проверяем пользователя в базе
        user = Users.query.filter_by(yandex_id=str(user_info['id'])).first()
        if not user:
            # Создаём нового пользователя
            user = Users(
                email=user_info.get('default_email', f"yandex_{user_info['id']}@yandex.com"),
                username=user_info.get('real_name', 'Yandex User'),
                yandex_id=str(user_info['id']),
                avatar_url=user_info.get('display_avatar_url'),
                created_at=datetime.utcnow(),
                role=UserRole.USER,
                is_active=True
            )
            db.session.add(user)
            db.session.flush()
            db.session.add(UserPreferences(user_id=user.id))
            db.session.add(UserStatistics(user_id=user.id))
            db.session.commit()

        # Генерируем JWT
        access_token_jwt = create_access_token(identity=user.id)
        refresh_token_jwt = create_refresh_token(identity=user.id)

        return jsonify({
            'access_token': access_token_jwt,
            'refresh_token': refresh_token_jwt,
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'avatar': user.avatar_url,
                'role': user.role.value
            }
        })

    except Exception as e:
        return jsonify({'error': f'Ошибка Яндекс ID: {str(e)}'}), 500
