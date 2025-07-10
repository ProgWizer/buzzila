# Роуты для загрузки, получения и удаления иконок достижений
from flask import Blueprint, request, jsonify, send_file, abort
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import Users, UserRole
import os
from werkzeug.utils import secure_filename 

uploads_bp = Blueprint('uploads', __name__)

@uploads_bp.route('/upload/achievement_icon', methods=['POST'])
@jwt_required()
def upload_achievement_icon():
    """
    Загрузка иконки достижения (только для администратора).
    :return: JSON с url и статусом
    """
    current_user_id = get_jwt_identity()
    current_admin = Users.query.get(current_user_id)

    if not current_admin or current_admin.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403

    if 'file' not in request.files:
        return jsonify({'error': 'Нет файла в запросе'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'Не выбран файл'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        upload_folder = os.path.join(os.getcwd(), 'uploads', 'achievement_icons')
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)
        file_url = f'/api/achievement_icon/{filename}'
        return jsonify({'message': 'Файл успешно загружен', 'url': file_url}), 200
    else:
        return jsonify({'error': 'Недопустимый тип файла'}), 400

@uploads_bp.route('/upload/achievement_icons', methods=['GET'])
@jwt_required()
def list_achievement_icons():
    """
    Получить список всех загруженных иконок достижений (только для администратора).
    :return: JSON со списком url
    """
    current_user_id = get_jwt_identity()
    current_admin = Users.query.get(current_user_id)
    if not current_admin or current_admin.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403
    upload_folder = os.path.join(os.getcwd(), 'uploads', 'achievement_icons')
    if not os.path.exists(upload_folder):
        return jsonify({'icons': []}), 200
    icons = [f'/api/achievement_icon/' + f for f in os.listdir(upload_folder) if allowed_file(f)]
    return jsonify({'icons': icons}), 200

@uploads_bp.route('/achievement_icon/<filename>', methods=['GET'])
def get_achievement_icon(filename):
    """
    Скачать иконку достижения по имени файла.
    :param filename: строка — имя файла
    :return: файл или 404
    """
    path = os.path.join(os.getcwd(), 'uploads', 'achievement_icons', filename)
    if not os.path.exists(path):
        abort(404)
    return send_file(path)

@uploads_bp.route('/upload/achievement_icon/<filename>', methods=['DELETE'])
@jwt_required()
def delete_achievement_icon(filename):
    """
    Удалить иконку достижения (только для администратора).
    :param filename: строка — имя файла
    :return: JSON с результатом
    """
    current_user_id = get_jwt_identity()
    current_admin = Users.query.get(current_user_id)
    if not current_admin or current_admin.role.value != 'admin':
        return jsonify({'error': 'Доступ запрещен'}), 403
    upload_folder = os.path.join(os.getcwd(), 'uploads', 'achievement_icons')
    file_path = os.path.join(upload_folder, filename)
    if not os.path.exists(file_path):
        return jsonify({'error': 'Файл не найден'}), 404
    try:
        os.remove(file_path)
        return jsonify({'message': 'Иконка удалена'}), 200
    except Exception as e:
        return jsonify({'error': f'Ошибка при удалении: {str(e)}'}), 500

def allowed_file(filename):
    """
    Проверяет, разрешён ли тип файла для загрузки.
    :param filename: строка — имя файла
    :return: bool
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ['png', 'jpg', 'jpeg', 'gif', 'svg']