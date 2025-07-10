import multiprocessing
import os

# Базовые настройки
bind = "0.0.0.0:5000"  # Адрес и порт для привязки
workers = multiprocessing.cpu_count() * 2 + 1  # Количество рабочих процессов
worker_class = "sync"  # Тип рабочего процесса
worker_connections = 1000  # Максимальное количество одновременных подключений

# Тайм-ауты
timeout = 120  # Тайм-аут для воркеров 
keepalive = 2  # Время жизни keep-alive соединений

# Логирование
accesslog = "-"  # Логирование в stdout
errorlog = "-"   # Логирование в stderr
loglevel = "info"  # Уровень логирования

# Создаем директорию для логов, если её нет
if not os.path.exists('logs'):
    os.makedirs('logs')

# Настройки процесса
daemon = False                # Запуск в режиме демона
pidfile = None                # Отключаем создание PID-файла
user = None                  # Пользователь для запуска
group = None                 # Группа для запуска

# Хуки
def on_starting(server):
    """Выполняется при запуске сервера (логирование через стандартный логгер)."""
    import logging
    logging.getLogger("gunicorn.error").info("Gunicorn запускается...")

def on_reload(server):
    """Выполняется при перезагрузке сервера (логирование через стандартный логгер)."""
    import logging
    logging.getLogger("gunicorn.error").info("Gunicorn перезагружается...")

def post_fork(server, worker):
    """Выполняется после создания рабочего процесса (логирование через стандартный логгер)."""
    import logging
    logging.getLogger("gunicorn.error").info(f"Рабочий процесс {worker.pid} создан") 
