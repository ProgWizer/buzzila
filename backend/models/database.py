# Модуль для инициализации подключения к базе данных через SQLAlchemy
from flask_sqlalchemy import SQLAlchemy

# Глобальный объект для работы с БД
# Используйте db для объявления моделей и работы с сессией

db = SQLAlchemy()


def init_db(app):
    """
    Инициализирует подключение к базе данных PostgreSQL для Flask-приложения.
    :param app: экземпляр Flask-приложения
    :return: None
    """
    try:
        # Формируем строку подключения из конфигурации приложения
        app.config['SQLALCHEMY_DATABASE_URI'] = f"postgresql://{app.config['DB_USER']}:{app.config['DB_PASSWORD']}@{app.config['DB_HOST']}:{app.config['DB_PORT']}/{app.config['DB_NAME']}"
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

        db.init_app(app)

        with app.app_context():
            db.engine.connect()
            app.logger.info("✅ Подключение к базе данных успешно!")

    except Exception as e:
        app.logger.error(f"❌ Ошибка при инициализации базы данных: {str(e)}")
        raise
