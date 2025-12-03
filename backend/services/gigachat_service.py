import os
import requests
import logging
import time
import base64
import uuid  # ← ДОБАВИТЬ
from datetime import datetime, timedelta
from flask import current_app

class GigaChatService:
    """
    Сервис для работы с GigaChat API.
    Обрабатывает аутентификацию и отправку запросов к API.
    """
    
    def __init__(self):
        self.token = None
        self.token_expires = None
        self.logger = logging.getLogger(__name__)
    
    def _get_auth_token(self):
        """
        Получение и обновление токена доступа GigaChat API.
        Использует авторизацию по сертификату.
        
        :return: Токен доступа
        """
        # Если токен еще действителен, возвращаем его
        if self.token and self.token_expires and datetime.utcnow() < self.token_expires - timedelta(seconds=60):
            return self.token
            
        try:
            # ⚠️ ПРАВИЛЬНЫЙ URL АВТОРИЗАЦИИ
            auth_url = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
            
            # Получаем учетные данные из переменных окружения
            client_id = os.getenv('GIGACHAT_CLIENT_ID')
            client_secret = os.getenv('GIGACHAT_CLIENT_SECRET')
            scope = os.getenv('GIGACHAT_SCOPE', 'GIGACHAT_API_PERS')
            
            if not client_id or not client_secret:
                raise ValueError("Не указаны GIGACHAT_CLIENT_ID или GIGACHAT_CLIENT_SECRET в переменных окружения")
            
            # Кодируем учетные данные в Base64
            credentials = f"{client_id}:{client_secret}"
            encoded_credentials = base64.b64encode(credentials.encode('utf-8')).decode('utf-8')
            
            # ⚠️ ПРАВИЛЬНЫЙ RqUID (UUID v4)
            rquid = str(uuid.uuid4())
            
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'Authorization': f'Basic {encoded_credentials}',
                'RqUID': rquid,  # ⚠️ UUID, не timestamp
            }
            
            data = {
                'scope': scope  # GIGACHAT_API_PERS, GIGACHAT_API_CORP или GIGACHAT_API_B2B
            }
            
            self.logger.info(f"Запрос токена GigaChat, RqUID: {rquid}")
            
            # Отправляем запрос на получение токена
            response = requests.post(
                auth_url,
                headers=headers,
                data=data,
                verify=False,
                timeout=10
            )
            
            # Логируем ответ для отладки
            self.logger.info(f"Статус ответа: {response.status_code}")
            
            if response.status_code != 200:
                self.logger.error(f"Ошибка авторизации: {response.status_code}")
                self.logger.error(f"Тело ответа: {response.text[:200]}")
                raise Exception(f"Auth failed: {response.status_code}")
            
            response.raise_for_status()
            token_data = response.json()
            
            if 'access_token' not in token_data:
                self.logger.error(f"Нет access_token в ответе: {token_data}")
                raise ValueError("Не удалось получить токен доступа из ответа API")
            
            # Сохраняем токен и время его истечения
            self.token = token_data['access_token']
            expires_in = token_data.get('expires_in', 1800)
            self.token_expires = datetime.utcnow() + timedelta(seconds=expires_in - 300)
            
            self.logger.info(f"Токен получен, действует {expires_in} секунд")
            return self.token
            
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Ошибка сети при получении токена: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                self.logger.error(f"Статус: {e.response.status_code}, Ответ: {e.response.text[:500]}")
            raise Exception(f"Ошибка аутентификации: {str(e)}")
        except Exception as e:
            self.logger.error(f"Ошибка при получении токена: {str(e)}", exc_info=True)
            raise Exception(f"Ошибка при получении токена: {str(e)}")

    def send(self, params, retries=3):
        """
        Отправка сообщения в GigaChat API.
        
        :param params: Параметры запроса
        :param retries: количество попыток при ошибках
        :return: Ответ от API
        """
        try:
            # Получаем токен доступа
            token = self._get_auth_token()
            
            # ⚠️ ПРАВИЛЬНЫЙ URL API
            api_url = "https://gigachat.devices.sberbank.ru/api/v1"
            url = f"{api_url}/chat/completions"
            
            # Параметры запроса
            model = params.get('model', 'GigaChat')
            messages = params.get('messages', [])
            
            if not messages:
                raise ValueError("Не указаны сообщения для отправки")
            
            # ⚠️ RqUID для запроса чата
            rquid = str(uuid.uuid4())
            
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {token}',
                'RqUID': rquid,  # ⚠️ Обязательно для запросов чата
            }
            
            data = {
                'model': model,
                'messages': messages,
                'temperature': float(params.get('temperature', 0.7)),
                'max_tokens': int(params.get('max_tokens', 1024)),
                'top_p': float(params.get('top_p', 0.9)),
                'frequency_penalty': float(params.get('frequency_penalty', 0.1)),
                'presence_penalty': float(params.get('presence_penalty', 0.1))
            }
            
            self.logger.info(f"Отправка запроса в GigaChat, модель: {model}, RqUID: {rquid}")
            
            response = requests.post(
                url, 
                headers=headers, 
                json=data, 
                verify=False,
                timeout=30
            )
            
            self.logger.info(f"Статус ответа чата: {response.status_code}")
            
            if response.status_code == 401:  # Не авторизован
                self.logger.warning("Токен недействителен, сбрасываю...")
                self.token = None
                if retries > 0:
                    time.sleep(1)
                    return self.send(params, retries=retries-1)
            
            if response.status_code != 200:
                self.logger.error(f"Ошибка API: {response.status_code}")
                self.logger.error(f"Тело ответа: {response.text[:200]}")
                response.raise_for_status()
            
            response.raise_for_status()
            result = response.json()
            
            if 'choices' not in result:
                self.logger.error(f"Некорректный ответ: {result}")
                raise ValueError("Некорректный формат ответа")
            
            self.logger.info(f"Успешный ответ, выборок: {len(result.get('choices', []))}")
            return result
            
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Ошибка запроса к GigaChat: {str(e)}")
            
            if retries > 0:
                self.logger.info(f"Повторная попытка... ({retries-1} осталось)")
                time.sleep(2)
                return self.send(params, retries=retries-1)
            
            if hasattr(e, 'response') and e.response is not None:
                self.logger.error(f"Статус: {e.response.status_code}")
                try:
                    self.logger.error(f"Тело: {e.response.text[:500]}")
                except:
                    pass
            
            raise Exception(f"Ошибка GigaChat API: {str(e)}")
            
        except Exception as e:
            self.logger.error(f"Неожиданная ошибка: {str(e)}", exc_info=True)
            raise Exception(f"Ошибка обработки: {str(e)}")

# Создаем глобальный экземпляр сервиса
gigachat_service = GigaChatService()