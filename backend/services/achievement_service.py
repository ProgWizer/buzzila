# Сервис для работы с достижениями пользователей (выдача, прогресс, пересчёт баллов)
from datetime import datetime
from models.models import Achievement, UserAchievement, UserStatistics, db, Users
from flask import current_app
import json

class AchievementService:
    """
    Класс-сервис для управления достижениями пользователей:
    - Проверка и выдача достижений
    - Получение прогресса по достижениям
    - Создание новых достижений
    - Пересчёт баллов пользователей
    """
    @staticmethod
    def check_achievements(user_id):
        """
        Проверяет, какие достижения пользователь может получить, и присваивает их.
        Универсальная логика по requirement_type/value.
        :param user_id: int — идентификатор пользователя
        :return: список объектов Achievement, которые были выданы
        """
        try:
            user_stats = UserStatistics.query.filter_by(user_id=user_id).first()
            if not user_stats:
                return []

            all_achievements = Achievement.query.all()
            earned_achievements = []

            # --- Универсальная выдача всех none-достижений ---
            for ach in all_achievements:
                if ach.requirement_type == 'none' and not UserAchievement.query.filter_by(user_id=user_id, achievement_id=ach.id).first():
                    user_achievement = UserAchievement(
                        user_id=user_id,
                        achievement_id=ach.id,
                        earned_at=datetime.utcnow()
                    )
                    db.session.add(user_achievement)
                    # Начисляем баллы пользователю
                    user = Users.query.get(user_id)
                    if user and ach.points:
                        user.points = (user.points or 0) + ach.points
                    earned_achievements.append(ach)
            # --- Конец блока ---

            for achievement in all_achievements:
                # Пропускаем, если уже есть
                if UserAchievement.query.filter_by(
                    user_id=user_id,
                    achievement_id=achievement.id
                ).first():
                    continue

                req = achievement.requirements or {}
                if isinstance(req, str):
                    try:
                        req = json.loads(req)
                    except Exception:
                        req = {}
                req_type = req.get('type')
                req_value = req.get('value')

                if req_type == 'none':
                    continue  # none уже обработаны выше

                stat_value = getattr(user_stats, req_type, None)
                if stat_value is not None and req_value is not None and float(stat_value) >= float(req_value):
                    user_achievement = UserAchievement(
                        user_id=user_id,
                        achievement_id=achievement.id,
                        earned_at=datetime.utcnow()
                    )
                    db.session.add(user_achievement)
                    # Начисляем баллы пользователю
                    user = Users.query.get(user_id)
                    if user and achievement.points:
                        user.points = (user.points or 0) + achievement.points
                    earned_achievements.append(achievement)

            db.session.commit()
            return earned_achievements
        except Exception as e:
            current_app.logger.error(f"Ошибка при проверке достижений: {str(e)}")
            db.session.rollback()
            return []

    @staticmethod
    def get_user_achievements(user_id):
        """
        Возвращает список достижений пользователя с прогрессом по каждому достижению.
        :param user_id: int — идентификатор пользователя
        :return: список словарей с данными о достижениях
        """
        try:
            user_stats = UserStatistics.query.filter_by(user_id=user_id).first()
            all_achievements = Achievement.query.all()
            user_achievements = {
                ua.achievement_id: ua
                for ua in UserAchievement.query.filter_by(user_id=user_id).all()
            }

            # Получаем дату регистрации пользователя (если есть)
            user = Users.query.get(user_id)
            reg_date = user.created_at.isoformat() if user and user.created_at else datetime.utcnow().isoformat()

            result = []
            for ach in all_achievements:
                req = ach.requirements or {}
                if isinstance(req, str):
                    try:
                        req = json.loads(req)
                    except Exception:
                        req = {}
                if not req or not req.get('type') or req.get('type') == 'none':
                    unlocked = True
                    progress = 100
                    achieved_at = user_achievements[ach.id].earned_at.isoformat() if ach.id in user_achievements else reg_date
                else:
                    req_type = req.get('type')
                    req_value = req.get('value')
                    stat_value = getattr(user_stats, req_type, 0) if user_stats and req_type else 0
                    unlocked = ach.id in user_achievements
                    progress = 100 if unlocked else (min(100, int((float(stat_value) / float(req_value)) * 100)) if req_value else 0)
                    achieved_at = user_achievements[ach.id].earned_at.isoformat() if unlocked else None

                result.append({
                    'id': ach.id,
                    'name': ach.name,
                    'description': ach.description,
                    'icon_url': ach.icon,
                    'points': ach.points,  
                    'achieved_at': achieved_at,
                    'unlocked': unlocked,
                    'progress': progress,
                    'requirements': req
                })

            return result
        except Exception as e:
            current_app.logger.error(f"Ошибка при получении достижений пользователя: {str(e)}")
            return []

    @staticmethod
    def create_achievement(name, description, icon, points=0, requirements={}):
        """
        Создаёт новое достижение в базе данных.
        :param name: строка — название достижения
        :param description: строка — описание
        :param icon: строка — url иконки
        :param points: int — количество баллов за достижение
        :param requirements: dict — условия получения
        :return: объект Achievement или None
        """
        try:
            achievement = Achievement(
                name=name,
                description=description,
                icon=icon,
                points=points,
                requirements=requirements
            )
            db.session.add(achievement)
            db.session.commit()

            current_app.logger.info(f"Создано новое достижение: {name}")
            return achievement
        except Exception as e:
            current_app.logger.error(f"Ошибка при создании достижения: {str(e)}")
            db.session.rollback()
            return None

    @staticmethod
    def _get_streak(user_id):
        """
        Возвращает текущий стрик (серия) успешных диалогов подряд для пользователя.
        :param user_id: int — идентификатор пользователя
        :return: int — длина стрика
        """
        from models.models import Dialog
        dialogs = Dialog.query.filter_by(user_id=user_id).order_by(Dialog.completed_at.desc()).all()
        streak = 0
        for d in dialogs:
            if d.is_successful:
                streak += 1
            else:
                break
        return streak

    @staticmethod
    def _unique_scenarios_count(user_id):
        """
        Возвращает количество уникальных успешно завершённых сценариев пользователя.
        :param user_id: int — идентификатор пользователя
        :return: int — количество уникальных сценариев
        """
        from models.models import Dialog
        dialogs = Dialog.query.filter_by(user_id=user_id).filter(Dialog.is_successful==True).all()
        scenario_ids = set(d.scenario_id for d in dialogs)
        return len(scenario_ids)

    @staticmethod
    def recalculate_all_users_points():
        """
        Пересчитывает баллы (points) для всех пользователей на основании их полученных достижений.
        :return: None
        """
        from models.models import Users, UserAchievement, Achievement, db
        users = Users.query.all()
        for user in users:
            total_points = 0
            for ua in user.achievements:
                if ua.achievement and ua.achievement.points:
                    total_points += ua.achievement.points
            user.points = total_points
        db.session.commit()
 