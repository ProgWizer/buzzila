from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import PromptTemplate, Organization, Users, db
from sqlalchemy.exc import IntegrityError
from utils.redis_client import redis_client

# Дефолтный промпт анализа, если не передан при создании шаблона
DEFAULT_ANALYSIS_PROMPT = """Ты опытный эксперт по обучению персонала в сфере обслуживания клиентов. Проанализируй следующий диалог:

**Контекст сценария:**
- Сценарий: {scenario_description}
- Роль сотрудника: {user_role}
- Роль клиента (ИИ): {ai_role}

**Диалог:**
{dialog_text}

**Задание:**
Проведи детальный анализ диалога (не более 400 слов), структурированный по следующим пунктам:

1. **Общая оценка диалога** (3-4 предложения)
   - Как прошел разговор в целом
   - Была ли достигнута цель коммуникации
   - Общее впечатление от взаимодействия

2. **Сильные стороны сотрудника** (3-4 конкретных примера)
   - Какие навыки общения были продемонстрированы успешно
   - Удачные фразы и подходы
   - Проявление эмпатии, профессионализма

3. **Области для улучшения** (3-4 конкретных момента)
   - Что можно было сделать лучше
   - Упущенные возможности
   - Ошибки в коммуникации

4. **Практические рекомендации** (3-5 конкретных советов)
   - Что делать в следующий раз
   - Какие фразы использовать
   - Как улучшить подход

Отвечай только на {language} языке. Будь конструктивен, конкретен и поддерживающ. Приводи примеры из диалога."""

prompt_templates_bp = Blueprint('prompt_templates', __name__)

@prompt_templates_bp.route('/prompt-templates', methods=['GET'])
@jwt_required()
def get_prompt_templates():
    """
    Получение списка шаблонов промптов
    """
    try:
        user_id = get_jwt_identity()
        current_user = Users.query.get(user_id)
        
        if not current_user:
            return jsonify({'error': 'Пользователь не найден'}), 404
        
        # Получаем шаблоны в зависимости от роли пользователя
        if current_user.role.value == 'admin':
            # Админ видит все шаблоны
            templates = PromptTemplate.query.all()
        else:
            # Обычные пользователи видят только глобальные шаблоны и шаблоны своей организации
            templates = PromptTemplate.query.filter(
                (PromptTemplate.is_global == True) | 
                (PromptTemplate.organization_id == current_user.organization_id)
            ).all()
        
        templates_data = []
        for template in templates:
            templates_data.append({
                'id': template.id,
                'name': template.name,
                'description': template.description,
                'content_start': template.content_start,
                'content_continue': template.content_continue,
                'forbidden_words': template.forbidden_words,
                'sections_json': template.sections_json,
                'analysis_prompt': template.analysis_prompt,
                'organization_id': template.organization_id,
                'created_at': template.created_at.isoformat() if template.created_at else None,
                'created_by_user_id': template.created_by_user_id,
                'is_global': template.is_global
            })
        
        return jsonify(templates_data)
    
    except Exception as e:
        return jsonify({'error': 'Ошибка при получении шаблонов промптов', 'details': str(e)}), 500

@prompt_templates_bp.route('/prompt-templates', methods=['POST'])
@jwt_required()
def create_prompt_template():
    """
    Создание нового шаблона промпта
    """
    try:
        user_id = get_jwt_identity()
        current_user = Users.query.get(user_id)
        
        if not current_user:
            return jsonify({'error': 'Пользователь не найден'}), 404
        
        # Только админы могут создавать шаблоны
        if current_user.role.value != 'admin':
            return jsonify({'error': 'Недостаточно прав для создания шаблонов'}), 403
        
        data = request.get_json()
        
        # Проверяем обязательные поля
        required_fields = ['name', 'description']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Необходимо заполнить все обязательные поля'}), 400
        
        # Создаем новый шаблон
        new_template = PromptTemplate(
            name=data['name'],
            description=data['description'],
            content_start=data.get('content_start', ''),
            content_continue=data.get('content_continue', ''),
            forbidden_words=data.get('forbidden_words', ''),
            sections_json=data.get('sections_json', ''),
            analysis_prompt=(data.get('analysis_prompt') or DEFAULT_ANALYSIS_PROMPT),
            organization_id=data.get('organization_id'),
            created_by_user_id=user_id,
            is_global=data.get('is_global', True)
        )
        
        db.session.add(new_template)
        db.session.commit()
        return jsonify({
            'id': new_template.id,
            'name': new_template.name,
            'description': new_template.description,
            'content_start': new_template.content_start,
            'content_continue': new_template.content_continue,
            'forbidden_words': new_template.forbidden_words,
            'sections_json': new_template.sections_json,
            'analysis_prompt': new_template.analysis_prompt,
            'organization_id': new_template.organization_id,
            'created_at': new_template.created_at.isoformat() if new_template.created_at else None,
            'created_by_user_id': new_template.created_by_user_id,
            'is_global': new_template.is_global
        }), 201


    except IntegrityError as e:
        db.session.rollback()
        return jsonify({'error': 'Шаблон с таким именем уже существует'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ошибка при создании шаблона промпта', 'details': str(e)}), 500

@prompt_templates_bp.route('/prompt-templates/<int:template_id>', methods=['PUT'])
@jwt_required()
def update_prompt_template(template_id):
    """
    Обновление шаблона промпта
    """
    try:
        user_id = get_jwt_identity()
        current_user = Users.query.get(user_id)
        
        if not current_user:
            return jsonify({'error': 'Пользователь не найден'}), 404
        
        # Только админы могут обновлять шаблоны
        if current_user.role.value != 'admin':
            return jsonify({'error': 'Недостаточно прав для обновления шаблонов'}), 403
        
        template = PromptTemplate.query.get(template_id)
        if not template:
            return jsonify({'error': 'Шаблон не найден'}), 404
        
        data = request.get_json()
        
        # Обновляем поля
        if 'name' in data:
            template.name = data['name']
        if 'description' in data:
            template.description = data['description']
        if 'content_start' in data:
            template.content_start = data['content_start']
        if 'content_continue' in data:
            template.content_continue = data['content_continue']
        if 'forbidden_words' in data:
            template.forbidden_words = data['forbidden_words']
        if 'analysis_prompt' in data:
            template.analysis_prompt = data['analysis_prompt']
        if 'sections_json' in data:
            template.sections_json = data['sections_json']
        if 'organization_id' in data:
            template.organization_id = data['organization_id']
        if 'is_global' in data:
            template.is_global = data['is_global']
        
        db.session.commit()
        
        return jsonify({
            'id': template.id,
            'name': template.name,
            'description': template.description,
            'content_start': template.content_start,
            'content_continue': template.content_continue,
            'forbidden_words': template.forbidden_words,
            'analysis_prompt': template.analysis_prompt,
            'sections_json': template.sections_json,
            'organization_id': template.organization_id,
            'created_at': template.created_at.isoformat() if template.created_at else None,
            'created_by_user_id': template.created_by_user_id,
            'is_global': template.is_global
        })
    
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({'error': 'Шаблон с таким именем уже существует'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ошибка при обновлении шаблона промпта', 'details': str(e)}), 500

@prompt_templates_bp.route('/prompt-templates/<int:template_id>', methods=['DELETE'])
@jwt_required()
def delete_prompt_template(template_id):
    """
    Удаление шаблона промпта
    """
    try:
        user_id = get_jwt_identity()
        current_user = Users.query.get(user_id)
        
        if not current_user:
            return jsonify({'error': 'Пользователь не найден'}), 404
        
        # Только админы могут удалять шаблоны
        if current_user.role.value != 'admin':
            return jsonify({'error': 'Недостаточно прав для удаления шаблонов'}), 403
        
        template = PromptTemplate.query.get(template_id)
        if not template:
            return jsonify({'error': 'Шаблон не найден'}), 404
        
        db.session.delete(template)
        db.session.commit()
        
        return jsonify({'message': 'Шаблон успешно удален'})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ошибка при удалении шаблона промпта', 'details': str(e)}), 500

# --- Активный шаблон ---

@prompt_templates_bp.route('/prompt-templates/active', methods=['GET'])
@jwt_required()
def get_active_prompt_template():
    """Возвращает активный шаблон (глобально)."""
    try:
        raw = redis_client.get('active_prompt_template_id')
        if not raw:
            return jsonify({'template_id': None, 'template': None})
        template_id = int(raw.decode('utf-8'))
        tpl = PromptTemplate.query.get(template_id)
        if not tpl:
            return jsonify({'template_id': None, 'template': None})
        return jsonify({
            'template_id': tpl.id,
            'template': {
                'id': tpl.id,
                'name': tpl.name,
                'description': tpl.description,
                'content_start': tpl.content_start,
                'content_continue': tpl.content_continue
            }
        })
    except Exception as e:
        return jsonify({'error': 'Не удалось получить активный шаблон', 'details': str(e)}), 500

@prompt_templates_bp.route('/prompt-templates/<int:template_id>/activate', methods=['POST'])
@jwt_required()
def activate_prompt_template(template_id):
    """Делает шаблон активным (глобально)."""
    try:
        user_id = get_jwt_identity()
        current_user = Users.query.get(user_id)
        if not current_user or current_user.role.value != 'admin':
            return jsonify({'error': 'Недостаточно прав'}), 403
        tpl = PromptTemplate.query.get(template_id)
        if not tpl:
            return jsonify({'error': 'Шаблон не найден'}), 404
        redis_client.set('active_prompt_template_id', str(template_id).encode('utf-8'))
        return jsonify({'message': 'Активный шаблон установлен', 'template_id': template_id})
    except Exception as e:
        return jsonify({'error': 'Не удалось установить активный шаблон', 'details': str(e)}), 500

@prompt_templates_bp.route('/prompt-templates/active', methods=['DELETE'])
@jwt_required()
def clear_active_prompt_template():
    """Сбрасывает активный шаблон (глобально)."""
    try:
        user_id = get_jwt_identity()
        current_user = Users.query.get(user_id)
        if not current_user or current_user.role.value != 'admin':
            return jsonify({'error': 'Недостаточно прав'}), 403
        redis_client.delete('active_prompt_template_id')
        return jsonify({'message': 'Активный шаблон сброшен'})
    except Exception as e:
        return jsonify({'error': 'Не удалось сбросить активный шаблон', 'details': str(e)}), 500 