from flask import Blueprint, request, jsonify, current_app, redirect
from models.models import Users, UserPreferences, UserStatistics, UserRole, db
from datetime import datetime
import requests
from urllib.parse import urlencode
from flask_jwt_extended import create_access_token, create_refresh_token

vk_bp = Blueprint('vk_auth', __name__)

# Конфигурация VK (замените на свои значения)
VK_APP_ID = '54348608'
VK_APP_SECRET = 'Vu748TCCJuV6TyVI18U6'
VK_REDIRECT_URI = 'https://profdailog.com/auth/vk/callback'

# VK_APP_ID = '54350017'
# VK_APP_SECRET = 'alXqgGXsm8fAO2JSy71x'
# VK_REDIRECT_URI = 'https://334e6011ee732584872ff7d0ba1a0b3b.serveo.net/auth/vk/callback'
# В твоем vk_bp.py измени:
# VK_REDIRECT_URI = 'https://334e6011ee732584872ff7d0ba1a0b3b.serveo.net/'

def get_vk_access_token(code):
    """Получение access_token от VK"""
    token_url = 'https://oauth.vk.com/access_token'
    params = {
        'client_id': VK_APP_ID,
        'client_secret': VK_APP_SECRET,
        'redirect_uri': VK_REDIRECT_URI,
        'code': code
    }
    response = requests.get(token_url, params=params)
    return response.json()

def get_vk_user_info(access_token, user_id):
    """Получение информации о пользователе VK"""
    url = 'https://api.vk.com/method/users.get'
    params = {
        'user_ids': user_id,
        'fields': 'first_name,last_name,photo_200,email',
        'access_token': access_token,
        'v': '5.131'
    }
    response = requests.get(url, params=params)
    return response.json().get('response', [{}])[0]

@vk_bp.route('/auth/vk', methods=['GET'])
def vk_auth():
    """Перенаправление на страницу авторизации VK"""
    auth_url = 'https://oauth.vk.com/authorize'
    params = {
        'client_id': VK_APP_ID,
        'redirect_uri': VK_REDIRECT_URI,
        'response_type': 'code',
        'scope': 'email',
        'v': '5.131',
        'display': 'page',
        'state': 'vk_auth'
    }
    return redirect(f"{auth_url}?{urlencode(params)}")

@vk_bp.route('/auth/vk/callback', methods=['GET'])
def vk_callback():
    """Обработка ответа от VK OAuth"""
    code = request.args.get('code')
    if not code:
        return jsonify({'error': 'Код авторизации не получен'}), 400

    try:
        # Получаем access_token от VK
        token_data = get_vk_access_token(code)
        if 'error' in token_data:
            return jsonify({'error': token_data.get('error_description', 'Ошибка авторизации VK')}), 400

        access_token = token_data.get('access_token')
        vk_user_id = token_data.get('user_id')
        email = token_data.get('email')

        # Получаем информацию о пользователе
        user_info = get_vk_user_info(access_token, vk_user_id)
        
        # Проверяем, есть ли пользователь в базе
        user = Users.query.filter_by(vk_id=str(vk_user_id)).first()
        
        if not user:
            # Создаем нового пользователя
            user = Users(
                email=email or f"vk_{vk_user_id}@vk.com",
                username=f"{user_info.get('first_name', '')} {user_info.get('last_name', '')}".strip(),
                vk_id=str(vk_user_id),
                avatar_url=user_info.get('photo_200'),
                created_at=datetime.utcnow(),
                role=UserRole.USER,
                is_active=True
            )
            
            db.session.add(user)
            db.session.flush()  # Получаем ID пользователя
            
            # Создаем настройки пользователя
            preferences = UserPreferences(user_id=user.id)
            db.session.add(preferences)
            
            # Создаем статистику пользователя
            statistics = UserStatistics(user_id=user.id)
            db.session.add(statistics)
            
            db.session.commit()
        
        # Создаем JWT токены
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        # Возвращаем токены
        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'avatar': user.avatar_url,
                'role': user.role.value
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"VK auth error: {str(e)}")
        return jsonify({'error': 'Ошибка аутентификации'}), 500

@vk_bp.route('/auth/vk/verify', methods=['POST'])
def vk_verify():
    """Verify VK ID code and authenticate user"""
    data = request.get_json()
    code = data.get('code')
    device_id = data.get('device_id')
    
    if not code or not device_id:
        return jsonify({'error': 'Неверные параметры запроса'}), 400

    try:
        # Exchange code for token
        token_url = 'https://api.vk.com/oauth/token'
        params = {
            'client_id': VK_APP_ID,
            'client_secret': VK_APP_SECRET,
            'code': code,
            'device_id': device_id,
            'grant_type': 'code',
            'redirect_uri': VK_REDIRECT_URI
        }
        
        response = requests.post(token_url, data=params)
        token_data = response.json()
        
        if 'error' in token_data:
            return jsonify({'error': token_data.get('error_description', 'Ошибка авторизации VK')}), 400

        access_token = token_data.get('access_token')
        vk_user_id = token_data.get('user_id')
        email = token_data.get('email')

        # Get user info from VK
        user_info = get_vk_user_info(access_token, vk_user_id)
        
        # Check if user exists
        user = Users.query.filter_by(vk_id=str(vk_user_id)).first()
        
        if not user:
            # Create new user
            user = Users(
                email=email or f"vk_{vk_user_id}@vk.com",
                username=f"{user_info.get('first_name', '')} {user_info.get('last_name', '')}".strip(),
                vk_id=str(vk_user_id),
                avatar_url=user_info.get('photo_200'),
                created_at=datetime.utcnow(),
                role=UserRole.USER,
                is_active=True
            )
            
            db.session.add(user)
            db.session.flush()
            
            # Create user preferences
            preferences = UserPreferences(user_id=user.id)
            db.session.add(preferences)
            
            # Create user statistics
            statistics = UserStatistics(user_id=user.id)
            db.session.add(statistics)
            
            db.session.commit()
        
        # Generate JWT tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'avatar': user.avatar_url,
                'role': user.role.value
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"VK verify error: {str(e)}")
        return jsonify({'error': 'Ошибка верификации VK ID'}), 500
