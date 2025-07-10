from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import db, Achievement, UserAchievement, UserRole
from models.models import Users
from sqlalchemy.exc import IntegrityError
from services.achievement_service import AchievementService

achievements_admin_bp = Blueprint('achievements_admin', __name__)

@achievements_admin_bp.route('/achievements/user', methods=['GET'], endpoint='get_current_user_achievements_v2')
@jwt_required()
def get_current_user_achievements():
    """
    Получить список достижений текущего пользователя.
    Возвращает массив достижений с деталями.
    """
    user_id = get_jwt_identity()
    achievements_data = AchievementService.get_user_achievements(user_id)
    return jsonify(achievements_data), 200

@achievements_admin_bp.route('/achievements', methods=['GET'], endpoint='get_all_achievements_v2')
@jwt_required()
def get_all_achievements():
    """
    Получить список всех достижений (только для администратора).
    """
    user_id = get_jwt_identity()
    current_user = Users.query.get(user_id)
    if not current_user or current_user.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403

    achievements = Achievement.query.all()
    achievements_data = []
    for achievement in achievements:
        achievements_data.append({
            'id': achievement.id,
            'title': achievement.name,
            'description': achievement.description,
            'icon': achievement.icon,
            'points': achievement.points,
            'is_repeatable': achievement.is_repeatable,
            'requirements': achievement.requirements
        })
    return jsonify(achievements_data), 200

@achievements_admin_bp.route('/achievements', methods=['POST'], endpoint='create_achievement_v2')
@jwt_required()
def create_achievement():
    """
    Создать новое достижение (только для администратора).
    Принимает JSON с полями: title, description, icon, points, is_repeatable, requirements.
    Возвращает созданное достижение.
    """
    user_id = get_jwt_identity()
    current_user = Users.query.get(user_id)
    if not current_user or current_user.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403

    data = request.get_json()
    name = data.get('title')
    description = data.get('description')
    icon = data.get('icon')
    points = data.get('points', 0)
    is_repeatable = data.get('is_repeatable', False)
    requirements = data.get('requirements')
    if not requirements or isinstance(requirements, str):
        requirement_type = 'none'
        requirement_value = None
    else:
        requirement_type = requirements.get('type')
        requirement_value = requirements.get('value')

    if not name or not description:
        return jsonify({'error': 'Название и описание обязательны'}), 400

    try:
        new_achievement = Achievement(
            name=name,
            description=description,
            icon=icon,
            points=points,
            is_repeatable=is_repeatable,
            requirements=requirements,
        )
        # Если в модели есть поля requirement_type и requirement_value — заполняем их
        if hasattr(new_achievement, 'requirement_type'):
            new_achievement.requirement_type = requirement_type
        if hasattr(new_achievement, 'requirement_value'):
            new_achievement.requirement_value = requirement_value
        db.session.add(new_achievement)
        db.session.commit()
        return jsonify({'message': 'Достижение успешно создано', 'achievement': {
            'id': new_achievement.id,
            'title': new_achievement.name,
            'description': new_achievement.description,
            'icon': new_achievement.icon,
            'points': new_achievement.points,
            'is_repeatable': new_achievement.is_repeatable,
            'requirements': new_achievement.requirements
        }}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Достижение с таким названием уже существует'}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ошибка при создании достижения', 'details': str(e)}), 500

@achievements_admin_bp.route('/achievements/<int:achievement_id>', methods=['PUT'], endpoint='update_achievement_v2')
@jwt_required()
def update_achievement(achievement_id):
    """
    Обновить достижение по id (только для администратора).
    Принимает JSON с новыми значениями полей.
    Пересчитывает баллы у всех пользователей.
    """
    user_id = get_jwt_identity()
    current_user = Users.query.get(user_id)
    if not current_user or current_user.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403

    achievement = Achievement.query.get_or_404(achievement_id)
    data = request.json
    achievement.name = data.get('name', achievement.name) if 'name' in data else data.get('title', achievement.name)
    achievement.description = data.get('description', achievement.description)
    achievement.icon = data.get('icon', achievement.icon)
    achievement.points = data.get('points', achievement.points)
    achievement.is_repeatable = data.get('is_repeatable', achievement.is_repeatable)
    achievement.requirements = data.get('requirements', achievement.requirements)
    try:
        db.session.commit()
        # Пересчитываем баллы у всех пользователей
        AchievementService.recalculate_all_users_points()
        return jsonify({'message': 'Достижение успешно обновлено', 'achievement': {
            'id': achievement.id,
            'title': achievement.name,
            'description': achievement.description,
            'icon': achievement.icon,
            'points': achievement.points,
            'is_repeatable': achievement.is_repeatable,
            'requirements': achievement.requirements
        }}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ошибка при обновлении достижения', 'details': str(e)}), 500

@achievements_admin_bp.route('/achievements/<int:achievement_id>', methods=['DELETE'], endpoint='delete_achievement_v2')
@jwt_required()
def delete_achievement(achievement_id):
    """
    Удалить достижение по id (только для администратора).
    """
    user_id = get_jwt_identity()
    current_user = Users.query.get(user_id)
    if not current_user or current_user.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403

    achievement_to_delete = Achievement.query.get(achievement_id)
    if not achievement_to_delete:
        return jsonify({'error': 'Достижение не найдено'}), 404

    try:
        db.session.delete(achievement_to_delete)
        db.session.commit()
        return jsonify({'message': 'Достижение успешно удалено'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ошибка при удалении достижения', 'details': str(e)}), 500

@achievements_admin_bp.route('/achievements/assign_to_user', methods=['POST'], endpoint='assign_achievement_to_user_v2')
@jwt_required()
def assign_achievement_to_user():
    """
    Назначить или отменить назначение достижения пользователю (только для администратора).
    Принимает user_id, achievement_id, action ('assign' или 'unassign').
    """
    current_user_id = get_jwt_identity()
    current_admin = Users.query.get(current_user_id)
    if not current_admin or current_admin.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403

    data = request.json
    user_id = data.get('user_id')
    achievement_id = data.get('achievement_id')
    action = data.get('action') # 'assign' или 'unassign'

    if not user_id or not achievement_id or not action:
        return jsonify({'error': 'Необходимо указать user_id, achievement_id и action'}), 400

    achievement = Achievement.query.get(achievement_id)
    user = Users.query.get(user_id)

    if not achievement:
        return jsonify({'error': 'Достижение не найдено'}), 404
    if not user:
        return jsonify({'error': 'Пользователь не найден'}), 404

    if action == 'assign':
        existing_user_achievement = UserAchievement.query.filter_by(user_id=user_id, achievement_id=achievement_id).first()
        if existing_user_achievement:
            return jsonify({'error': 'Достижение уже назначено этому пользователю'}), 409
        try:
            user_achievement = UserAchievement(user_id=user_id, achievement_id=achievement_id)
            db.session.add(user_achievement)
            db.session.commit()
            return jsonify({'message': 'Достижение успешно назначено пользователю'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Ошибка при назначении достижения', 'details': str(e)}), 500
    elif action == 'unassign':
        user_achievement = UserAchievement.query.filter_by(user_id=user_id, achievement_id=achievement_id).first()
        if not user_achievement:
            return jsonify({'error': 'Назначение достижения не найдено для данного пользователя'}), 404
        try:
            db.session.delete(user_achievement)
            db.session.commit()
            return jsonify({'message': 'Назначение достижения успешно отменено'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Ошибка при отмене назначения достижения', 'details': str(e)}), 500
    else:
        return jsonify({'error': 'Недопустимое действие'}), 400

@achievements_admin_bp.route('/achievements/<int:achievement_id>/unassign/<int:user_id>', methods=['DELETE'], endpoint='unassign_achievement_by_path_params_v3')
@jwt_required()
def unassign_achievement_by_path_params(achievement_id, user_id):
    """
    Отменить назначение достижения пользователю по id (только для администратора).
    """
    current_user_id = get_jwt_identity()
    current_admin = Users.query.get(current_user_id)
    if not current_admin or current_admin.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403

    user_achievement = UserAchievement.query.filter_by(user_id=user_id, achievement_id=achievement_id).first()

    if not user_achievement:
        return jsonify({'error': 'Назначение достижения не найдено для данного пользователя'}), 404

    try:
        db.session.delete(user_achievement)
        db.session.commit()
        return jsonify({'message': 'Назначение достижения успешно отменено'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ошибка при отмене назначения достижения', 'details': str(e)}), 500

@achievements_admin_bp.route('/users/<int:user_id>/achievements', methods=['GET'], endpoint='get_user_achievements_by_id_v2')
@jwt_required()
def get_user_achievements_by_id(user_id):
    """
    Получить список достижений пользователя по его id (для администратора или самого пользователя).
    """
    current_user_id = get_jwt_identity()
    current_user = Users.query.get(current_user_id)
    if not current_user or (current_user.role.value != 'admin' and current_user_id != user_id):
        return jsonify({'error': 'Доступ запрещен'}), 403

    achievements_data = AchievementService.get_user_achievements(user_id)
    return jsonify(achievements_data), 200 