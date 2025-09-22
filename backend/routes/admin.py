from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import Users, UserRole, Dialog, Achievement, Scenario, Organization
from models.database import db
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    user_id = get_jwt_identity()
    current_user = Users.query.get(user_id)

    if not current_user or current_user.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403

    users = Users.query.all()
    users_data = []
    for user in users:
        users_data.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role.value,
            'created_at': user.created_at.isoformat(),
            'last_login': user.last_login.isoformat() if user.last_login else None,
            'is_active': user.is_active
        })
    return jsonify(users_data), 200

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    current_user_id = get_jwt_identity()
    current_admin = Users.query.get(current_user_id)

    if not current_admin or current_admin.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403

    user_to_update = Users.query.get(user_id)
    if not user_to_update:
        return jsonify({'error': 'Пользователь не найден'}), 404

    data = request.get_json()
    print(f"Received data: {data}")
    if 'role' in data:
        print(f"Role received: {data['role']}")
        print(f"Role uppercase: {data['role'].upper()}")
        valid_role_names = [r.name for r in UserRole]
        print(f"Valid role names: {valid_role_names}")
        print(f"Is received role in valid names? {data['role'].upper() in valid_role_names}")
        # Проверка на допустимые роли, чтобы избежать некорректных значений
        if data['role'].upper() in valid_role_names:
            user_to_update.role = UserRole[data['role'].upper()]
        else:
            return jsonify({'error': 'Недопустимая роль'}), 400
    
    if 'is_active' in data:
        user_to_update.is_active = data['is_active']
    
    if 'username' in data:
        user_to_update.username = data['username']

    if 'email' in data:
        user_to_update.email = data['email']

    try:
        db.session.commit()
        return jsonify({'message': 'Пользователь успешно обновлен', 'user': {
            'id': user_to_update.id,
            'username': user_to_update.username,
            'email': user_to_update.email,
            'role': user_to_update.role.value,
            'is_active': user_to_update.is_active
        }}), 200
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({'error': 'Ошибка обновления пользователя: Нарушение уникального ограничения (возможно, имя пользователя или адрес электронной почты уже используются).', 'details': str(e)}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ошибка при обновлении пользователя', 'details': str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user_id = get_jwt_identity()
    current_admin = Users.query.get(current_user_id)

    if not current_admin or current_admin.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403

    user_to_delete = Users.query.get(user_id)
    if not user_to_delete:
        return jsonify({'error': 'Пользователь не найден'}), 404
    
    # Запретить удаление самого себя
    if user_to_delete.id == current_user_id:
        return jsonify({'error': 'Нельзя удалить самого себя'}), 400

    try:
        db.session.delete(user_to_delete)
        db.session.commit()
        return jsonify({'message': 'Пользователь успешно удален'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ошибка при удалении пользователя', 'details': str(e)}), 500

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_admin_stats():
    user_id = get_jwt_identity()
    current_user = Users.query.get(user_id)
    if not current_user or current_user.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403

    total_users = Users.query.count()
    active_users = Users.query.filter_by(is_active=True).count()
    total_dialogs = Dialog.query.count()
    total_achievements = Achievement.query.count()
    total_scenarios = Scenario.query.count()
    managers = Users.query.filter(Users.role == UserRole.MANAGER).count()
    admins = Users.query.filter(Users.role == UserRole.ADMIN).count()

    return jsonify({
        'total_users': total_users,
        'active_users': active_users,
        'total_dialogs': total_dialogs,
        'total_achievements': total_achievements,
        'total_scenarios': total_scenarios,
        'managers': managers,
        'admins': admins
    }), 200

@admin_bp.route('/stats/daily', methods=['GET'])
@jwt_required()
def get_daily_stats():
    user_id = get_jwt_identity()
    current_user = Users.query.get(user_id)
    if not current_user or current_user.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403

    today = datetime.utcnow().date()
    days = 30
    date_list = [(today - timedelta(days=i)) for i in range(days-1, -1, -1)]

    # Новые пользователи по дням
    user_counts = (
        db.session.query(func.date(Users.created_at), func.count())
        .filter(Users.created_at >= today - timedelta(days=days-1))
        .group_by(func.date(Users.created_at))
        .all()
    )
    user_counts_dict = {str(date): count for date, count in user_counts}

    # Завершённые диалоги по дням
    dialog_counts = (
        db.session.query(func.date(Dialog.completed_at), func.count())
        .filter(Dialog.completed_at != None)
        .filter(Dialog.completed_at >= today - timedelta(days=days-1))
        .group_by(func.date(Dialog.completed_at))
        .all()
    )
    dialog_counts_dict = {str(date): count for date, count in dialog_counts}

    users_per_day = [user_counts_dict.get(str(day), 0) for day in date_list]
    dialogs_per_day = [dialog_counts_dict.get(str(day), 0) for day in date_list]

    return jsonify({
        'dates': [str(day) for day in date_list],
        'users_per_day': users_per_day,
        'dialogs_per_day': dialogs_per_day
    })

@admin_bp.route('/stats/roles', methods=['GET'])
@jwt_required()
def get_roles_stats():
    user_id = get_jwt_identity()
    current_user = Users.query.get(user_id)
    if not current_user or current_user.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403
    from models.models import UserRole
    roles = [r.value for r in UserRole]
    counts = {role: Users.query.filter(Users.role == UserRole[role.upper()]).count() for role in roles}
    return jsonify(counts)

@admin_bp.route('/stats/top-scenarios', methods=['GET'])
@jwt_required()
def get_top_scenarios():
    user_id = get_jwt_identity()
    current_user = Users.query.get(user_id)
    if not current_user or current_user.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403
    from models.models import Scenario
    top = (
        db.session.query(Scenario.name, db.func.count())
        .join(Dialog, Dialog.scenario_id == Scenario.id)
        .group_by(Scenario.id)
        .order_by(db.func.count().desc())
        .limit(5)
        .all()
    )
    return jsonify({"labels": [x[0] for x in top], "counts": [x[1] for x in top]})

@admin_bp.route('/stats/achievements-distribution', methods=['GET'])
@jwt_required()
def get_achievements_distribution():
    user_id = get_jwt_identity()
    current_user = Users.query.get(user_id)
    if not current_user or current_user.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403
    from models.models import Achievement, UserAchievement
    achievements = Achievement.query.all()
    data = []
    for ach in achievements:
        count = UserAchievement.query.filter_by(achievement_id=ach.id).count()
        data.append({"name": ach.name, "count": count})
    return jsonify({"labels": [x["name"] for x in data], "counts": [x["count"] for x in data]})

@admin_bp.route('/stats/top-users', methods=['GET'])
@jwt_required()
def get_top_users():
    user_id = get_jwt_identity()
    current_user = Users.query.get(user_id)
    if not current_user or current_user.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403
    top = (
        db.session.query(Users.username, db.func.count(Dialog.id))
        .join(Dialog, Dialog.user_id == Users.id)
        .group_by(Users.id)
        .order_by(db.func.count(Dialog.id).desc())
        .limit(10)
        .all()
    )
    return jsonify({"labels": [x[0] for x in top], "counts": [x[1] for x in top]}) 

# ========== API ЭНДПОИНТЫ ДЛЯ ОРГАНИЗАЦИЙ ==========

@admin_bp.route('/organizations', methods=['GET'])
@jwt_required()
def get_all_organizations():
    """Получить список всех организаций"""
    user_id = get_jwt_identity()
    current_user = Users.query.get(user_id)

    if not current_user or current_user.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403

    organizations = Organization.query.all()
    organizations_data = []
    for org in organizations:
        # Подсчитываем количество пользователей и сценариев
        users_count = Users.query.filter_by(organization_id=org.id).count()
        scenarios_count = Scenario.query.filter_by(organization_id=org.id).count()
        
        organizations_data.append({
            'id': org.id,
            'name': org.name,
            'description': org.description,
            'created_at': org.created_at.isoformat(),
            'users_count': users_count,
            'scenarios_count': scenarios_count
        })
    
    return jsonify(organizations_data), 200

@admin_bp.route('/organizations', methods=['POST'])
@jwt_required()
def create_organization():
    """Создать новую организацию"""
    user_id = get_jwt_identity()
    current_user = Users.query.get(user_id)

    if not current_user or current_user.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403

    data = request.get_json()
    name = data.get('name')
    description = data.get('description', '')

    if not name:
        return jsonify({'error': 'Название организации обязательно'}), 400

    try:
        new_organization = Organization(
            name=name,
            description=description
        )
        db.session.add(new_organization)
        db.session.commit()

        return jsonify({
            'id': new_organization.id,
            'name': new_organization.name,
            'description': new_organization.description,
            'created_at': new_organization.created_at.isoformat()
        }), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Организация с таким названием уже существует'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка при создании организации: {str(e)}'}), 500

@admin_bp.route('/organizations/<int:org_id>', methods=['PUT'])
@jwt_required()
def update_organization(org_id):
    """Обновить организацию"""
    user_id = get_jwt_identity()
    current_user = Users.query.get(user_id)

    if not current_user or current_user.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403

    organization = Organization.query.get(org_id)
    if not organization:
        return jsonify({'error': 'Организация не найдена'}), 404

    data = request.get_json()
    name = data.get('name')
    description = data.get('description')

    if name:
        organization.name = name
    if description is not None:
        organization.description = description

    try:
        db.session.commit()
        return jsonify({
            'id': organization.id,
            'name': organization.name,
            'description': organization.description,
            'created_at': organization.created_at.isoformat()
        }), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Организация с таким названием уже существует'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка при обновлении организации: {str(e)}'}), 500

@admin_bp.route('/organizations/<int:org_id>', methods=['DELETE'])
@jwt_required()
def delete_organization(org_id):
    """Удалить организацию"""
    user_id = get_jwt_identity()
    current_user = Users.query.get(user_id)

    if not current_user or current_user.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403

    organization = Organization.query.get(org_id)
    if not organization:
        return jsonify({'error': 'Организация не найдена'}), 404

    # Проверяем, есть ли пользователи или сценарии в организации
    users_count = Users.query.filter_by(organization_id=org_id).count()
    scenarios_count = Scenario.query.filter_by(organization_id=org_id).count()
    
    if users_count > 0 or scenarios_count > 0:
        return jsonify({
            'error': f'Нельзя удалить организацию. В ней есть {users_count} пользователей и {scenarios_count} сценариев'
        }), 400

    try:
        db.session.delete(organization)
        db.session.commit()
        return jsonify({'message': 'Организация успешно удалена'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка при удалении организации: {str(e)}'}), 500

@admin_bp.route('/organizations/<int:org_id>/users', methods=['GET'])
@jwt_required()
def get_organization_users(org_id):
    """Получить пользователей организации"""
    user_id = get_jwt_identity()
    current_user = Users.query.get(user_id)

    if not current_user or current_user.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403

    organization = Organization.query.get(org_id)
    if not organization:
        return jsonify({'error': 'Организация не найдена'}), 404

    users = Users.query.filter_by(organization_id=org_id).all()
    users_data = []
    for user in users:
        users_data.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role.value,
            'is_active': user.is_active,
            'created_at': user.created_at.isoformat()
        })

    return jsonify(users_data), 200

@admin_bp.route('/organizations/<int:org_id>/users', methods=['POST'])
@jwt_required()
def add_user_to_organization(org_id):
    """Добавить пользователя в организацию"""
    user_id = get_jwt_identity()
    current_user = Users.query.get(user_id)

    if not current_user or current_user.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403

    organization = Organization.query.get(org_id)
    if not organization:
        return jsonify({'error': 'Организация не найдена'}), 404

    data = request.get_json()
    user_id_to_add = data.get('user_id')

    if not user_id_to_add:
        return jsonify({'error': 'ID пользователя обязателен'}), 400

    user_to_add = Users.query.get(user_id_to_add)
    if not user_to_add:
        return jsonify({'error': 'Пользователь не найден'}), 404

    if user_to_add.organization_id == org_id:
        return jsonify({'error': 'Пользователь уже в этой организации'}), 400

    try:
        user_to_add.organization_id = org_id
        db.session.commit()
        return jsonify({'message': 'Пользователь успешно добавлен в организацию'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка при добавлении пользователя: {str(e)}'}), 500

@admin_bp.route('/organizations/<int:org_id>/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def remove_user_from_organization(org_id, user_id):
    """Удалить пользователя из организации"""
    current_admin_id = get_jwt_identity()
    current_admin = Users.query.get(current_admin_id)

    if not current_admin or current_admin.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403

    organization = Organization.query.get(org_id)
    if not organization:
        return jsonify({'error': 'Организация не найдена'}), 404

    user = Users.query.get(user_id)
    if not user:
        return jsonify({'error': 'Пользователь не найден'}), 404

    if user.organization_id != org_id:
        return jsonify({'error': 'Пользователь не состоит в этой организации'}), 400

    try:
        user.organization_id = None  # Убираем из организации
        db.session.commit()
        return jsonify({'message': 'Пользователь успешно удален из организации'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка при удалении пользователя: {str(e)}'}), 500

@admin_bp.route('/organizations/<int:org_id>/scenarios', methods=['GET'])
@jwt_required()
def get_organization_scenarios(org_id):
    """Получить сценарии организации"""
    user_id = get_jwt_identity()
    current_user = Users.query.get(user_id)

    if not current_user or current_user.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403

    organization = Organization.query.get(org_id)
    if not organization:
        return jsonify({'error': 'Организация не найдена'}), 404

    scenarios = Scenario.query.filter_by(organization_id=org_id).all()
    scenarios_data = []
    for scenario in scenarios:
        scenarios_data.append({
            'id': scenario.id,
            'name': scenario.name,
            'description': scenario.description,
            'category': scenario.category,
            'subcategory': scenario.subcategory,
            'is_active': scenario.is_active,
            'created_at': scenario.created_at.isoformat()
        })

    return jsonify(scenarios_data), 200

# Новый эндпоинт: отвязать сценарий от организации
@admin_bp.route('/organizations/<int:org_id>/scenarios/<int:scenario_id>', methods=['DELETE'])
@jwt_required()
def detach_scenario_from_organization(org_id, scenario_id):
    """Отвязать сценарий от организации (не удаляя сам сценарий)."""
    current_admin_id = get_jwt_identity()
    current_admin = Users.query.get(current_admin_id)

    if not current_admin or current_admin.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403

    organization = Organization.query.get(org_id)
    if not organization:
        return jsonify({'error': 'Организация не найдена'}), 404

    scenario = Scenario.query.get(scenario_id)
    if not scenario:
        return jsonify({'error': 'Сценарий не найден'}), 404

    if scenario.organization_id != org_id:
        return jsonify({'error': 'Сценарий не принадлежит этой организации'}), 400

    try:
        scenario.organization_id = None
        db.session.commit()
        return jsonify({'message': 'Сценарий отвязан от организации'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Не удалось отвязать сценарий: {str(e)}'}), 500 