from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models.models import Users, UserPreferences, UserStatistics, UserRole
from models.database import db
from datetime import datetime
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, unset_jwt_cookies
import traceback
from services.achievement_service import AchievementService

# Blueprint для маршрутов аутентификации
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Регистрация нового пользователя.
    Принимает email, пароль и имя.
    Если это первый пользователь — назначает роль ADMIN.
    Создаёт настройки и статистику пользователя, выдаёт достижение за регистрацию.
    """
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('username')

    # Проверка обязательных полей
    if not all([email, password, username]):
        return jsonify({'error': 'Все поля обязательны для заполнения'}), 400

    # Проверка уникальности email
    if db.session.query(Users).filter_by(email=email).first():
        return jsonify({'error': 'Email уже зарегистрирован'}), 400

    hashed_password = generate_password_hash(password)
    
    # Проверяем, является ли это первым пользователем в системе
    is_first_user = db.session.query(Users).count() == 0

    new_user = Users(
        email=email,
        password_hash=hashed_password,
        username=username,
        created_at=datetime.utcnow(),
        role=UserRole.ADMIN if is_first_user else UserRole.USER # Присваиваем роль ADMIN, если это первый пользователь
    )
    
    try:
        db.session.add(new_user)
        db.session.flush()  # Получаем id пользователя

        # Создаём начальные настройки пользователя
        user_preferences = UserPreferences(
            user_id=new_user.id,
            language='ru',
            difficulty_preference='normal',
            theme='light'
        )

        # Создаём начальную статистику
        user_statistics = UserStatistics(
            user_id=new_user.id,
            total_dialogs=0,
            completed_scenarios=0,
            total_time_spent=0,
            average_score=0.0
        )

        db.session.add(user_preferences)
        db.session.add(user_statistics)
        db.session.commit()

        # --- Выдаём достижение за регистрацию ---
        AchievementService.check_achievements(new_user.id)
        # --- Конец блока ---

        return jsonify({'message': 'Пользователь успешно зарегистрирован'}), 201
    except Exception as e:
        db.session.rollback()
        # Логируем полную информацию об ошибке для отладки
        print(f"Ошибка при регистрации: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Ошибка при регистрации', 'details': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Вход пользователя по email и паролю.
    Возвращает access_token и refresh_token, а также основную информацию о пользователе.
    Обновляет время последнего входа.
    """
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Проверка обязательных полей
    if not all([email, password]):
        return jsonify({'error': 'Все поля обязательны для заполнения'}), 400

    user = Users.query.filter_by(email=email).first()

    if user and check_password_hash(user.password_hash, password):
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)

        # Обновляем время последнего входа
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        response = jsonify({
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.username,
                'role': user.role.value
            },
            'access_token': access_token,
            'refresh_token': refresh_token
        })
        print(f"Login Response: {response.json}")
        return response, 200
    
    return jsonify({'error': 'Неверный email или пароль'}), 401

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Выход пользователя. Очищает JWT cookies.
    """
    response = jsonify({'message': 'Успешный выход'})
    unset_jwt_cookies(response)
    return response, 200

@auth_bp.route('/check', methods=['GET'])
@jwt_required(optional=True)
def check_auth():
    """
    Проверка авторизации пользователя по JWT.
    Если токен валиден и пользователь активен — возвращает информацию о пользователе.
    """
    user_id = get_jwt_identity()
    if user_id:
        user = Users.query.get(user_id)
        if user and user.is_active:
            return jsonify({
                'success': True,
                'user': {
                    'id': user.id,
                    'email': user.email,
                        'name': user.username,
                        'role': user.role.value
                }
            }), 200
    return jsonify({'success': False}), 401

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Обновление access_token по refresh_token.
    """
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=user_id)
    return jsonify(access_token=access_token), 200 
    
    