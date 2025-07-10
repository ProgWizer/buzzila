# Модуль для стандартизации ответов API
from flask import jsonify

# Константы для статуса ответа
SUCCESS = 'success'   # Успешный ответ
ERROR = 'error'       # Ошибка


def make_custom_response(data=None, message='', status=SUCCESS, code=200):
    """
    Формирует стандартный JSON-ответ для API.
    :param data: dict — полезные данные (по умолчанию пустой словарь)
    :param message: строка — сообщение для пользователя
    :param status: строка — статус ('success' или 'error')
    :param code: int — HTTP-код ответа (по умолчанию 200)
    :return: кортеж (json-ответ, http-код)
    """
    return jsonify({
        'status': status,
        'message': message,
        'data': data or {}
    }), code
