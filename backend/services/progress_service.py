# Сервис для работы с прогрессом пользователя по сценариям
from datetime import datetime
from models.models import UserProgress, db
from utils.logger import progress_logger, error_logger

class ProgressService:
    """
    Класс-сервис для управления прогрессом пользователя:
    - Сохранение и обновление прогресса по сценарию
    - Получение прогресса
    - Сброс прогресса
    """
    @staticmethod
    def save_progress(user_id, scenario_id, status, score=None):
        """
        Сохраняет или обновляет прогресс пользователя по сценарию.
        :param user_id: int — идентификатор пользователя
        :param scenario_id: int — идентификатор сценария
        :param status: строка — статус ('not_started', 'in_progress', 'completed')
        :param score: int или None — баллы за попытку (опционально)
        :return: объект UserProgress или None
        """
        try:
            now = datetime.utcnow()

            progress = UserProgress.query.filter_by(
                user_id=user_id,
                scenario_id=scenario_id
            ).first()

            if not progress:
                progress = UserProgress(
                    user_id=user_id,
                    scenario_id=scenario_id,
                    status=status,
                    progress_percentage=0.0,
                    last_attempt_date=now
                )
                db.session.add(progress)

            progress.status = status
            progress.last_attempt_date = now

            if score is not None:
                progress.attempts_count = (progress.attempts_count or 0) + 1
                if progress.best_score is None or score > progress.best_score:
                    progress.best_score = score
                    progress_logger.info(
                        f"User {user_id} достиг нового лучшего результата {score} в сценарии {scenario_id}"
                    )

            # Обновление процента прогресса
            progress.progress_percentage = ProgressService._calculate_progress_percentage(status)

            db.session.commit()
            progress_logger.info(
                f"Прогресс сохранён для пользователя {user_id} по сценарию {scenario_id}: {status}"
            )
            return progress

        except Exception as e:
            error_logger.error(f"Ошибка при сохранении прогресса: {str(e)}")
            db.session.rollback()
            return None

    @staticmethod
    def _calculate_progress_percentage(status):
        """
        Возвращает процент выполнения сценария по статусу.
        :param status: строка — статус ('not_started', 'in_progress', 'completed')
        :return: float — процент выполнения
        """
        mapping = {
            'not_started': 0.0,
            'in_progress': 50.0,
            'completed': 100.0,
        }
        return mapping.get(status, 0.0)

    @staticmethod
    def get_progress(user_id, scenario_id=None):
        """
        Получает прогресс пользователя по одному сценарию или по всем сразу.
        :param user_id: int — идентификатор пользователя
        :param scenario_id: int или None — идентификатор сценария (если None, возвращает все)
        :return: dict или список dict
        """
        try:
            if scenario_id:
                progress = UserProgress.query.filter_by(
                    user_id=user_id,
                    scenario_id=scenario_id
                ).first()
                return progress.to_dict() if progress else None
            else:
                progress_list = UserProgress.query.filter_by(user_id=user_id).all()
                return [p.to_dict() for p in progress_list]
        except Exception as e:
            error_logger.error(f"Ошибка при получении прогресса: {str(e)}")
            return None

    @staticmethod
    def reset_progress(user_id, scenario_id):
        """
        Сбрасывает прогресс пользователя для конкретного сценария.
        :param user_id: int — идентификатор пользователя
        :param scenario_id: int — идентификатор сценария
        :return: bool — True если сброс успешен, иначе False
        """
        try:
            progress = UserProgress.query.filter_by(
                user_id=user_id,
                scenario_id=scenario_id
            ).first()

            if progress:
                now = datetime.utcnow()
                progress.status = 'not_started'
                progress.progress_percentage = 0.0
                progress.best_score = None
                progress.attempts_count = 0
                progress.last_attempt_date = now

                db.session.commit()
                progress_logger.info(
                    f"Прогресс сброшен для пользователя {user_id} по сценарию {scenario_id}"
                )
                return True

            return False
        except Exception as e:
            error_logger.error(f"Ошибка при сбросе прогресса: {str(e)}")
            db.session.rollback()
            return False
