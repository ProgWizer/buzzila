from flask import Blueprint, request, jsonify, current_app
from models.models import Users, UserPreferences, UserStatistics, UserRole, db
from datetime import datetime
import requests
from flask_jwt_extended import create_access_token, create_refresh_token

vk_bp = Blueprint('vk_auth', __name__)

VK_APP_ID = '54348608'
VK_APP_SECRET = 'Vu748TCCJuV6TyVI18U6'
VK_REDIRECT_URI = 'https://profdailog.com/auth/vk/callback'

def get_vk_user_info(access_token, user_id):
    url = 'https://api.vk.com/method/users.get'
    params = {
        'user_ids': user_id,
        'fields': 'first_name,last_name,photo_200,email',
        'access_token': access_token,
        'v': '5.131'
    }
    resp = requests.get(url, params=params)
    return resp.json().get('response', [{}])[0]

@vk_bp.route('/auth/vk/verify', methods=['POST'])
def vk_verify():
    data = request.get_json()
    code = data.get('code')
    device_id = data.get('device_id')

    if not code or not device_id:
        return jsonify({'error': 'Неверные параметры'}), 400

    try:
        # Новый endpoint VK ID v2
        VERIFY_URL = 'https://api.vk.com/oidc/token'
        payload = {
            'client_id': VK_APP_ID,
            'client_secret': VK_APP_SECRET,
            'code': code,            # code_v2
            'device_id': device_id,
            'grant_type': 'vk_device_code'
        }

        r = requests.post(VERIFY_URL, data=payload)
        token_data = r.json()

        if 'error' in token_data:
            return jsonify({'error': token_data.get('error_description', 'Ошибка VK')}), 400

        access_token_vk = token_data.get('access_token')
        vk_user_id = token_data.get('user_id')
        email = token_data.get('email')

        user_info = get_vk_user_info(access_token_vk, vk_user_id)

        user = Users.query.filter_by(vk_id=str(vk_user_id)).first()
        if not user:
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
            db.session.add(UserPreferences(user_id=user.id))
            db.session.add(UserStatistics(user_id=user.id))
            db.session.commit()

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
        current_app.logger.error(f"VK verify error: {e}")
        return jsonify({'error': 'Ошибка верификации VK ID'}), 500
