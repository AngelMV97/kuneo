-- ============================================
-- MÓDULO DE PRUEBA PARA ADAPTIVE ENGINE
-- ============================================
-- Módulo simple: Fracciones básicas
-- Con enriched_content completo para testing del Adaptive Engine
-- ============================================

-- 1. Crear el módulo
INSERT INTO kuneo.modules (
  id,
  subject,
  grade_range,
  difficulty,
  title,
  learning_objective,
  context,
  core_concept,
  content,
  order_index,
  is_active
)
VALUES (
  '00000000-0000-0000-0000-000000000001', -- ID fijo para testing
  'mathematics',
  '3-5', -- Grados 3 a 5
  2, -- Dificultad baja
  'Introducción a las Fracciones',
  'Comprender qué es una fracción y cómo representar partes de un todo',
  'Las fracciones están en todas partes: al dividir una pizza, medir ingredientes, o compartir juguetes.',
  'Fracción como parte de un todo',
  '{"phases": ["exploracion", "representacion", "practica"], "expected_outcomes": ["Comprender fracciones"], "linked_standards": [], "content_tags": ["fracciones", "basico"]}'::jsonb,
  1,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  learning_objective = EXCLUDED.learning_objective,
  is_active = true;

-- 2. Crear steps con enriched_content completo

-- Step 1: Pregunta de exploración (keywords)
INSERT INTO kuneo.module_steps (
  id,
  module_id,
  step_order,
  step_type,
  content,
  phase,
  enriched_content
)
VALUES (
  '00000000-0000-0000-0001-000000000001',
  '00000000-0000-0000-0000-000000000001',
  1,
  'question',
  '{"question": "¿Qué es una fracción?", "instruction": "Escribe con tus propias palabras qué crees que es una fracción."}'::jsonb,
  'exploration',
  '{
    "cognitive_dimension": "comprension",
    "expected_answer": {
      "type": "text",
      "evaluation_strategy": "keywords",
      "required_keywords": ["parte", "todo"],
      "optional_keywords": ["dividir", "porción", "pedazo"],
      "misconceptions": []
    },
    "step_config": {
      "expected_time": 60,
      "hints": [
        "Piensa en cómo divides una pizza.",
        "Una fracción representa una parte de algo completo.",
        "El todo se divide en partes iguales."
      ],
      "hint_card_key": "fraction_basics",
      "concept_card_key": "fraction_part_whole",
      "visual_template_key": "fraction_part_whole",
      "success_message": "¡Excelente! Entendiste que una fracción es una parte de un todo."
    }
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  enriched_content = EXCLUDED.enriched_content;

-- Step 2: Pregunta de opción múltiple
INSERT INTO kuneo.module_steps (
  id,
  module_id,
  step_order,
  step_type,
  content,
  phase,
  enriched_content
)
VALUES (
  '00000000-0000-0000-0001-000000000002',
  '00000000-0000-0000-0000-000000000001',
  2,
  'question',
  '{"question": "Si divides una pizza en 4 partes iguales y tomas 1, ¿qué fracción tomaste?", "options": ["1/4", "1/2", "4/1", "1/8"]}'::jsonb,
  'concept_formation',
  '{
    "cognitive_dimension": "representacion",
    "expected_answer": {
      "type": "option",
      "correct_option": "1/4",
      "misconceptions": [
        {
          "common_wrong_answer": "4/1",
          "misconception_key": "confunde_numerador_denominador",
          "explanation": "Inviertes el numerador y denominador. El denominador (abajo) indica las partes totales."
        },
        {
          "common_wrong_answer": "1/2",
          "misconception_key": "ignora_partes_totales",
          "explanation": "No consideraste cuántas partes tiene el todo. Son 4 partes, no 2."
        }
      ]
    },
    "step_config": {
      "expected_time": 45,
      "hints": [
        "El número de abajo indica cuántas partes tiene el todo.",
        "El número de arriba indica cuántas partes tomaste.",
        "Si hay 4 partes y tomas 1, es 1 de 4."
      ],
      "hint_card_key": "fraction_notation",
      "concept_card_key": "fraction_part_whole",
      "visual_template_key": "fraction_part_whole",
      "success_message": "¡Correcto! 1/4 significa 1 parte de 4."
    }
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  enriched_content = EXCLUDED.enriched_content;

-- Step 3: Pregunta numérica
INSERT INTO kuneo.module_steps (
  id,
  module_id,
  step_order,
  step_type,
  content,
  phase,
  enriched_content
)
VALUES (
  '00000000-0000-0000-0001-000000000003',
  '00000000-0000-0000-0000-000000000001',
  3,
  'guided_exercise',
  '{"question": "Si una barra de chocolate tiene 8 cuadros y comes 3, ¿cuántos cuadros quedan?", "answer_type": "numeric"}'::jsonb,
  'guided_application',
  '{
    "cognitive_dimension": "razonamiento",
    "expected_answer": {
      "type": "numeric",
      "correct_value": 5,
      "tolerance": 0,
      "unit": "cuadros",
      "misconceptions": [
        {
          "common_wrong_answer": "3",
          "misconception_key": "confunde_parte_con_restante",
          "explanation": "3 es lo que comiste, no lo que queda."
        }
      ]
    },
    "step_config": {
      "expected_time": 40,
      "hints": [
        "Resta lo que comiste del total.",
        "Tenías 8 y comiste 3.",
        "8 - 3 = ?"
      ],
      "success_message": "¡Perfecto! 8 - 3 = 5 cuadros."
    }
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  enriched_content = EXCLUDED.enriched_content;

-- Verificar que se creó correctamente
SELECT 
  m.title,
  ms.step_order,
  ms.step_type,
  ms.enriched_content->>'cognitive_dimension' as dimension,
  ms.enriched_content->'expected_answer'->>'type' as answer_type
FROM kuneo.modules m
JOIN kuneo.module_steps ms ON m.id = ms.module_id
WHERE m.id = '00000000-0000-0000-0000-000000000001'
ORDER BY ms.step_order;
