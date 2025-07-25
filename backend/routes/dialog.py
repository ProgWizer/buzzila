from flask import Blueprint, jsonify

# Blueprint для тестового эндпоинта диалога

dialog_bp = Blueprint('dialog', __name__)

@dialog_bp.route('/dialog', methods=['GET'])
def get_dialog():
    """
    Тестовый эндпоинт для проверки работы маршрута dialog.
    """
    return jsonify({"message": "Dialog route working"}) 
