"""
=================================================================
KUNEO MODULE STEPS GENERATOR
=================================================================
Genera 8 steps por módulo basados en dimensiones cognitivas:
1. exploration (exploracion)
2. representation (representacion)
3. explanation (razonamiento)
4. classification (clasificacion)
5. guided_application (aplicacion_guiada)
6. transfer (transferencia)
7. error_analysis (analisis_de_error)
8. metacognition (metacognicion)

Resultado esperado: 1,426 módulos × 8 = ~11,408 module_steps
=================================================================
"""

import json
import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
from typing import List, Dict, Optional

# Cargar variables de entorno desde server/.env
load_dotenv(Path(__file__).parent.parent.parent / "server" / ".env")

# Configuración Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Mapeo de sujetos (modules JSON → database enum)
SUBJECT_MAPPER = {
    'mathematics': 'matematicas',
    'natural_sciences': 'ciencias',
    'social_studies': 'sociales',
    'language': 'lenguaje',
    'english': 'ingles'
}

# =====================================================
# STEP TEMPLATES POR DIMENSIÓN COGNITIVA
# =====================================================

COGNITIVE_STEPS = [
    {
        'step_number': 1,
        'cognitive_type': 'exploracion',
        'phase': 'exploration',
        'step_type': 'question',
        'title_template': 'Exploración inicial: {concept}',
        'instruction_template': 'Observa y piensa: ¿qué sabes sobre {concept}?',
        'expected_response_type': 'multiple_choice',
        'estimated_time_seconds': 90,
        'difficulty': 1,
        'success_criteria': {
            'correct_required': False,
            'max_attempts_before_hint': 2,
            'min_confidence': 'low',
            'requires_explanation': False
        },
        'hint_policy': {
            'allow_hint': True,
            'hint_level_sequence': ['short_hint', 'visual'],
            'show_card_after_attempts': 3,
            'show_card_if_time_seconds': 120
        },
        'feedback_policy': {
            'immediate': True,
            'adaptive': True,
            'show_explanation': False,
            'show_visual': False
        },
        'next_step_logic': {
            'if_correct': 'next',
            'if_incorrect_once': 'retry',
            'if_incorrect_twice': 'show_hint',
            'if_mastered': 'next',
            'if_struggling': 'show_visual'
        }
    },
    {
        'step_number': 2,
        'cognitive_type': 'representacion',
        'phase': 'representation',
        'step_type': 'visual_exploration',
        'title_template': 'Visualiza: {concept}',
        'instruction_template': 'Observa cómo se representa {concept} visualmente',
        'expected_response_type': 'selection',
        'estimated_time_seconds': 120,
        'difficulty': 2,
        'success_criteria': {
            'correct_required': False,
            'max_attempts_before_hint': 1,
            'min_confidence': 'low',
            'requires_explanation': False
        },
        'hint_policy': {
            'allow_hint': True,
            'hint_level_sequence': ['visual', 'concept_card'],
            'show_card_after_attempts': 2,
            'show_card_if_time_seconds': 90
        },
        'feedback_policy': {
            'immediate': True,
            'adaptive': True,
            'show_explanation': True,
            'show_visual': True
        },
        'next_step_logic': {
            'if_correct': 'next',
            'if_incorrect_once': 'show_visual',
            'if_incorrect_twice': 'show_concept_card',
            'if_mastered': 'next',
            'if_struggling': 'remedial_representation'
        }
    },
    {
        'step_number': 3,
        'cognitive_type': 'razonamiento',
        'phase': 'concept_formation',
        'step_type': 'explanation',
        'title_template': '¿Por qué funciona {concept}?',
        'instruction_template': 'Razona: ¿por qué {concept} funciona de esta manera?',
        'expected_response_type': 'open_text',
        'estimated_time_seconds': 180,
        'difficulty': 3,
        'success_criteria': {
            'correct_required': False,
            'max_attempts_before_hint': 2,
            'min_confidence': 'medium',
            'requires_explanation': True
        },
        'hint_policy': {
            'allow_hint': True,
            'hint_level_sequence': ['concept_card', 'worked_example'],
            'show_card_after_attempts': 2,
            'show_card_if_time_seconds': 150
        },
        'feedback_policy': {
            'immediate': False,
            'adaptive': True,
            'show_explanation': True,
            'show_visual': False
        },
        'next_step_logic': {
            'if_correct': 'next',
            'if_incorrect_once': 'show_hint',
            'if_incorrect_twice': 'show_concept_card',
            'if_mastered': 'skip_to_transfer',
            'if_struggling': 'insert_remedial_step'
        }
    },
    {
        'step_number': 4,
        'cognitive_type': 'clasificacion',
        'phase': 'classification',
        'step_type': 'classification_task',
        'title_template': 'Clasifica: ejemplos de {concept}',
        'instruction_template': '¿Cuáles de estos son ejemplos de {concept} y cuáles no?',
        'expected_response_type': 'drag_drop',
        'estimated_time_seconds': 150,
        'difficulty': 3,
        'success_criteria': {
            'correct_required': True,
            'max_attempts_before_hint': 2,
            'min_confidence': 'medium',
            'requires_explanation': False
        },
        'hint_policy': {
            'allow_hint': True,
            'hint_level_sequence': ['short_hint', 'concept_card'],
            'show_card_after_attempts': 2,
            'show_card_if_time_seconds': 120
        },
        'feedback_policy': {
            'immediate': True,
            'adaptive': True,
            'show_explanation': True,
            'show_visual': False
        },
        'next_step_logic': {
            'if_correct': 'next',
            'if_incorrect_once': 'retry_with_hint',
            'if_incorrect_twice': 'show_concept_card',
            'if_mastered': 'next',
            'if_struggling': 'remedial_classification'
        }
    },
    {
        'step_number': 5,
        'cognitive_type': 'aplicacion_guiada',
        'phase': 'guided_application',
        'step_type': 'guided_exercise',
        'title_template': 'Práctica guiada: {concept}',
        'instruction_template': 'Aplica {concept} en este ejercicio con apoyo',
        'expected_response_type': 'numeric',
        'estimated_time_seconds': 240,
        'difficulty': 3,
        'success_criteria': {
            'correct_required': True,
            'max_attempts_before_hint': 1,
            'min_confidence': 'medium',
            'requires_explanation': False
        },
        'hint_policy': {
            'allow_hint': True,
            'hint_level_sequence': ['short_hint', 'worked_example', 'concept_card'],
            'show_card_after_attempts': 2,
            'show_card_if_time_seconds': 180
        },
        'feedback_policy': {
            'immediate': True,
            'adaptive': True,
            'show_explanation': True,
            'show_visual': True
        },
        'next_step_logic': {
            'if_correct': 'next',
            'if_incorrect_once': 'retry_with_hint',
            'if_incorrect_twice': 'show_concept_card',
            'if_mastered': 'skip_to_transfer',
            'if_struggling': 'remedial_practice'
        }
    },
    {
        'step_number': 6,
        'cognitive_type': 'transferencia',
        'phase': 'transfer',
        'step_type': 'transfer_task',
        'title_template': 'Transfiere: {concept} en otro contexto',
        'instruction_template': 'Aplica {concept} en esta situación nueva',
        'expected_response_type': 'multiple_choice',
        'estimated_time_seconds': 180,
        'difficulty': 4,
        'success_criteria': {
            'correct_required': True,
            'max_attempts_before_hint': 2,
            'min_confidence': 'high',
            'requires_explanation': False
        },
        'hint_policy': {
            'allow_hint': True,
            'hint_level_sequence': ['short_hint', 'concept_card'],
            'show_card_after_attempts': 2,
            'show_card_if_time_seconds': 150
        },
        'feedback_policy': {
            'immediate': True,
            'adaptive': True,
            'show_explanation': True,
            'show_visual': False
        },
        'next_step_logic': {
            'if_correct': 'next',
            'if_incorrect_once': 'retry_with_hint',
            'if_incorrect_twice': 'remedial_transfer',
            'if_mastered': 'next',
            'if_struggling': 'back_to_guided_application'
        }
    },
    {
        'step_number': 7,
        'cognitive_type': 'analisis_de_error',
        'phase': 'error_analysis',
        'step_type': 'error_analysis',
        'title_template': 'Analiza errores en {concept}',
        'instruction_template': '¿Qué está mal en este razonamiento sobre {concept}?',
        'expected_response_type': 'multiple_choice',
        'estimated_time_seconds': 180,
        'difficulty': 4,
        'success_criteria': {
            'correct_required': True,
            'max_attempts_before_hint': 2,
            'min_confidence': 'high',
            'requires_explanation': True
        },
        'hint_policy': {
            'allow_hint': True,
            'hint_level_sequence': ['short_hint', 'concept_card'],
            'show_card_after_attempts': 2,
            'show_card_if_time_seconds': 150
        },
        'feedback_policy': {
            'immediate': True,
            'adaptive': True,
            'show_explanation': True,
            'show_visual': False
        },
        'next_step_logic': {
            'if_correct': 'next',
            'if_incorrect_once': 'retry_with_hint',
            'if_incorrect_twice': 'show_misconception_card',
            'if_mastered': 'next',
            'if_struggling': 'remedial_error_analysis'
        }
    },
    {
        'step_number': 8,
        'cognitive_type': 'metacognicion',
        'phase': 'metacognition',
        'step_type': 'reflection',
        'title_template': 'Reflexiona sobre {concept}',
        'instruction_template': '¿Qué aprendiste sobre {concept}? ¿Cómo lo usarías?',
        'expected_response_type': 'open_text',
        'estimated_time_seconds': 120,
        'difficulty': 2,
        'success_criteria': {
            'correct_required': False,
            'max_attempts_before_hint': 1,
            'min_confidence': 'medium',
            'requires_explanation': True
        },
        'hint_policy': {
            'allow_hint': False,
            'hint_level_sequence': [],
            'show_card_after_attempts': None,
            'show_card_if_time_seconds': None
        },
        'feedback_policy': {
            'immediate': False,
            'adaptive': False,
            'show_explanation': False,
            'show_visual': False
        },
        'next_step_logic': {
            'if_correct': 'complete_module',
            'if_incorrect_once': 'complete_module',
            'if_incorrect_twice': 'complete_module',
            'if_mastered': 'complete_module',
            'if_struggling': 'complete_module'
        }
    }
]

# =====================================================
# FUNCIONES AUXILIARES
# =====================================================

def load_modules_from_supabase() -> List[Dict]:
    """Carga módulos desde Supabase (con IDs reales)"""
    print("\n📂 Cargando módulos desde Supabase...")
    
    # Cargar en batches con paginación
    all_modules = []
    page_size = 1000
    start = 0
    
    while True:
        response = supabase.schema('kuneo').table('modules')\
            .select('id, title, core_concept, subject, grade_range, difficulty, content')\
            .range(start, start + page_size - 1)\
            .execute()
        
        modules_batch = response.data
        if not modules_batch:
            break
        
        all_modules.extend(modules_batch)
        print(f"  Cargados {len(all_modules)} módulos...")
        
        if len(modules_batch) < page_size:
            break
        
        start += page_size
    
    print(f"✅ {len(all_modules)} módulos cargados desde Supabase")
    return all_modules


def load_concept_cards() -> Dict[str, Dict]:
    """Carga concept_cards desde Supabase"""
    print("\n📂 Cargando concept_cards desde Supabase...")
    
    response = supabase.schema('kuneo').table('concept_cards').select('*').execute()
    
    cards = response.data
    cards_dict = {card['concept_key']: card for card in cards}
    
    print(f"✅ {len(cards_dict)} tarjetas cargadas")
    return cards_dict


def normalize_concept_key(text: str) -> str:
    """Normaliza concepto a snake_case"""
    import re
    text = text.lower()
    text = re.sub(r'[áàäâ]', 'a', text)
    text = re.sub(r'[éèëê]', 'e', text)
    text = re.sub(r'[íìïî]', 'i', text)
    text = re.sub(r'[óòöô]', 'o', text)
    text = re.sub(r'[úùüû]', 'u', text)
    text = re.sub(r'[ñ]', 'n', text)
    text = re.sub(r'[^a-z0-9\s_]', '', text)
    text = re.sub(r'\s+', '_', text)
    return text


def find_matching_concept_card(core_concept: str, concept_cards: Dict) -> Optional[Dict]:
    """Busca concept_card por core_concept"""
    normalized = normalize_concept_key(core_concept)
    
    # Búsqueda exacta
    if normalized in concept_cards:
        return concept_cards[normalized]
    
    # Búsqueda parcial
    for key, card in concept_cards.items():
        if normalized in key or key in normalized:
            return card
    
    return None


def generate_content_for_step(
    module: Dict,
    step_template: Dict,
    concept_card: Optional[Dict]
) -> Dict:
    """Genera content JSONB para un step"""
    core_concept = module.get('core_concept', 'el concepto')
    
    # Contenido base
    content = {
        'prompt': step_template['instruction_template'].format(concept=core_concept),
        'context': module.get('learning_context', ''),
        'input_mode': step_template['expected_response_type']
    }
    
    # Agregar opciones si es multiple_choice
    if step_template['expected_response_type'] == 'multiple_choice':
        # Extraer opciones desde module.content.phases si existe
        phases = module.get('content', {}).get('phases', [])
        options = []
        
        for phase in phases:
            if 'exercises' in phase:
                for ex in phase['exercises']:
                    if 'options' in ex:
                        options = ex['options']
                        break
            if options:
                break
        
        if not options:
            options = ['Opción A', 'Opción B', 'Opción C', 'Opción D']
        
        content['options'] = options
    
    # Agregar explicación si hay concept_card
    if concept_card:
        content['concept_key'] = concept_card['concept_key']
        content['concept_name'] = concept_card['concept_name']
    
    return content


def build_module_steps(
    modules: List[Dict],
    concept_cards: Dict
) -> List[Dict]:
    """Construye todos los module_steps"""
    print("\n🎨 GENERANDO MODULE STEPS...")
    
    all_steps = []
    
    for idx, module in enumerate(modules, 1):
        module_id = module.get('id')
        core_concept = module.get('core_concept', 'concepto')
        subject = SUBJECT_MAPPER.get(module.get('subject'), 'matematicas')
        
        if not module_id:
            print(f"⚠️ Módulo sin ID, saltando: {core_concept}")
            continue
        
        # Buscar concept_card
        concept_card = find_matching_concept_card(core_concept, concept_cards)
        concept_card_id = concept_card['id'] if concept_card else None
        visual_template_key = concept_card['visual_template_key'] if concept_card else None
        
        # Generar 8 steps
        for step_template in COGNITIVE_STEPS:
            title = step_template['title_template'].format(concept=core_concept)
            instruction = step_template['instruction_template'].format(concept=core_concept)
            content = generate_content_for_step(module, step_template, concept_card)
            
            step = {
                'module_id': module_id,
                'step_order': step_template['step_number'],
                'cognitive_type': step_template['cognitive_type'],
                'phase': step_template['phase'],
                'step_type': step_template['step_type'],
                'title': title,
                'instruction': instruction,
                'content': content,
                'expected_response_type': step_template['expected_response_type'],
                'success_criteria': step_template['success_criteria'],
                'concept_card_id': concept_card_id,
                'visual_template_key': visual_template_key,
                'hint_policy': step_template['hint_policy'],
                'feedback_policy': step_template['feedback_policy'],
                'next_step_logic': step_template['next_step_logic'],
                'estimated_time_seconds': step_template['estimated_time_seconds'],
                'difficulty': step_template['difficulty']
            }
            
            all_steps.append(step)
        
        if idx % 100 == 0:
            print(f"  Procesados {idx}/{len(modules)} módulos ({len(all_steps)} steps generados)")
    
    print(f"✅ {len(all_steps)} module_steps generados")
    return all_steps


def upload_steps_to_supabase(steps: List[Dict], batch_size: int = 100):
    """Sube steps a Supabase en batches"""
    print(f"\n📤 SUBIENDO {len(steps)} STEPS A SUPABASE...")
    
    total_batches = (len(steps) + batch_size - 1) // batch_size
    
    for i in range(0, len(steps), batch_size):
        batch = steps[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        
        try:
            response = supabase.schema('kuneo').table('module_steps').insert(batch).execute()
            print(f"✓ Lote {batch_num}/{total_batches}: {len(batch)} steps subidos ({i + len(batch)}/{len(steps)})")
        except Exception as e:
            print(f"✗ Error en lote {batch_num}: {e}")
            # Intentar subir uno por uno
            for step in batch:
                try:
                    supabase.schema('kuneo').table('module_steps').insert(step).execute()
                except Exception as e2:
                    print(f"  ✗ Error en step individual (module_id={step.get('module_id')}): {e2}")


def validate_upload():
    """Valida la población de module_steps"""
    print("\n🔍 VALIDANDO POBLACIÓN...")
    
    # Total de steps
    response = supabase.schema('kuneo').table('module_steps').select('id', count='exact').execute()
    total_steps = response.count
    
    # Por tipo cognitivo
    response = supabase.schema('kuneo').table('module_steps')\
        .select('cognitive_type')\
        .execute()
    
    cognitive_counts = {}
    for step in response.data:
        ct = step['cognitive_type']
        cognitive_counts[ct] = cognitive_counts.get(ct, 0) + 1
    
    # Steps con concept_card (filtrar NULL con not.is.null en PostgREST)
    response = supabase.schema('kuneo').table('module_steps')\
        .select('concept_card_id', count='exact')\
        .not_.is_('concept_card_id', 'null')\
        .execute()
    steps_with_card = response.count
    
    # Steps con visual_template
    response = supabase.schema('kuneo').table('module_steps')\
        .select('visual_template_key', count='exact')\
        .not_.is_('visual_template_key', 'null')\
        .execute()
    steps_with_visual = response.count
    
    # Resultados
    print(f"\n📊 VALIDACIÓN:")
    print(f"✅ Total de steps en Supabase: {total_steps}")
    print(f"\n📊 Por tipo cognitivo:")
    for ct, count in sorted(cognitive_counts.items()):
        print(f"  {ct}: {count} steps")
    
    print(f"\n🔗 Vinculación:")
    print(f"  Steps con concept_card: {steps_with_card} ({100*steps_with_card/total_steps:.1f}%)")
    print(f"  Steps con visual_template: {steps_with_visual} ({100*steps_with_visual/total_steps:.1f}%)")


# =====================================================
# MAIN
# =====================================================

def main():
    print("=" * 60)
    print("🚀 KUNEO MODULE STEPS GENERATOR")
    print("=" * 60)
    
    # 1. Cargar datos
    modules = load_modules_from_supabase()
    concept_cards = load_concept_cards()
    
    # 2. Generar steps
    module_steps = build_module_steps(modules, concept_cards)
    
    # 3. Reportar
    print("\n📊 REPORTE:")
    print(f"Total de módulos: {len(modules)}")
    print(f"Total de steps generados: {len(module_steps)}")
    print(f"Steps por módulo: {len(module_steps) / len(modules):.1f}")
    
    # 4. Subir a Supabase
    upload_steps_to_supabase(module_steps, batch_size=100)
    
    # 5. Validar
    validate_upload()
    
    print("\n✅ PROCESO COMPLETADO")
    print(f"🎯 {len(module_steps)} module_steps poblados con éxito")


if __name__ == '__main__':
    main()
