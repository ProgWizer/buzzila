"""
Сервис для работы с GigaChat API.
Обеспечивает единый интерфейс для взаимодействия с GigaChat.
"""
from flask import current_app
from .gigachat_service import gigachat_service
import logging
import os

class AIService:
    """
    Сервис для работы с GigaChat API.
    Обеспечивает удобный интерфейс для отправки сообщений и управления чатом.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def send_message(self, messages, **kwargs):
        """
        Отправка сообщения в GigaChat.
        
        :param messages: Список сообщений в формате [{"role": "user", "content": "текст"}, ...]
        :param kwargs: Дополнительные параметры:
            - model: str - модель GigaChat (по умолчанию из конфига)
            - temperature: float - температура генерации (0.0-1.0)
            - max_tokens: int - максимальное количество токенов в ответе
            - top_p: float - параметр top-p выборки
            - frequency_penalty: float - штраф за частоту
            - presence_penalty: float - штраф за повторения
        :return: Ответ от GigaChat API
        """
        try:
            # Подготавливаем параметры запроса
            params = {
                'messages': messages,
                'model': kwargs.get('model', current_app.config.get('GIGACHAT_MODEL', 'GigaChat')),
                'temperature': float(kwargs.get('temperature', 0.7)),
                'max_tokens': int(kwargs.get('max_tokens', 1024)),
                'top_p': float(kwargs.get('top_p', 0.9)),
                'frequency_penalty': float(kwargs.get('frequency_penalty', 0.1)),
                'presence_penalty': float(kwargs.get('presence_penalty', 0.1))
            }
            
            self.logger.debug(f"Sending message to GigaChat: {params}")
            response = gigachat_service.send(params)
            self.logger.debug(f"Received response from GigaChat: {response}")
            
            return response
            
        except Exception as e:
            self.logger.error(f"Error sending message to GigaChat: {str(e)}", exc_info=True)
            raise Exception(f"Ошибка при обращении к GigaChat: {str(e)}")
    
    def health_check(self):
        """
        Проверка доступности GigaChat API.
        
        :return: Словарь со статусом и дополнительной информацией
        """
        try:
            # Пробуем получить токен
            token = gigachat_service._get_auth_token()
            if not token:
                return {
                    'status': 'error',
                    'message': 'Не удалось получить токен доступа',
                    'provider': 'gigachat'
                }
            
            return {
                'status': 'ok',
                'provider': 'gigachat',
                'model': current_app.config.get('GIGACHAT_MODEL', 'GigaChat')
            }
            
        except Exception as e:
            self.logger.error(f"GigaChat health check failed: {str(e)}")
            return {
                'status': 'error',
                'message': str(e),
                'provider': 'gigachat'
            }

# Создаем глобальный экземпляр сервиса
ai_service = AIService()
