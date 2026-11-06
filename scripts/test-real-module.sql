-- ============================================
-- INSPECCIONAR MÓDULO REAL DE FRACCIONES
-- ============================================
-- Ver el contenido enriched_content del módulo 0b0f4668-d41e-42b7-a51c-97c5842566b0
-- ============================================

-- 1. Datos básicos del módulo
SELECT 
  id,
  title,
  learning_objective,
  subject,
  difficulty,
  grade_range,
  core_concept,
  source
FROM kuneo.modules
WHERE id = '0b0f4668-d41e-42b7-a51c-97c5842566b0';

-- 2. Lista de steps con su enriched_content
SELECT 
  id,
  step_order,
  step_type,
  phase,
  content->>'question' as question,
  content->>'instruction' as instruction,
  enriched_content->>'cognitive_dimension' as cognitive_dimension,
  enriched_content->'expected_answer'->>'type' as answer_type,
  enriched_content->'expected_answer'->>'evaluation_strategy' as evaluation_strategy,
  CASE 
    WHEN enriched_content->'expected_answer'->'misconceptions' IS NOT NULL 
    THEN jsonb_array_length(enriched_content->'expected_answer'->'misconceptions')
    ELSE 0
  END as misconceptions_count,
  enriched_content->'step_config'->>'expected_time' as expected_time,
  LENGTH(enriched_content::text) as enriched_size
FROM kuneo.module_steps
WHERE module_id = '0b0f4668-d41e-42b7-a51c-97c5842566b0'
ORDER BY step_order;

-- 3. Ver primer step completo (para verificar estructura)
SELECT 
  id,
  step_order,
  step_type,
  jsonb_pretty(content) as content_formatted,
  jsonb_pretty(enriched_content) as enriched_content_formatted
FROM kuneo.module_steps
WHERE module_id = '0b0f4668-d41e-42b7-a51c-97c5842566b0'
  AND step_order = 1;

-- 4. Ver todos los expected_answer de cada step
SELECT 
  step_order,
  step_type,
  LEFT(COALESCE(content->>'question', content->>'instruction', 'N/A'), 60) as content_preview,
  jsonb_pretty(enriched_content->'expected_answer') as expected_answer
FROM kuneo.module_steps
WHERE module_id = '0b0f4668-d41e-42b7-a51c-97c5842566b0'
ORDER BY step_order;

-- 5. Verificar que todos los steps tienen enriched_content válido
SELECT 
  step_order,
  step_type,
  CASE WHEN enriched_content IS NOT NULL THEN '✓' ELSE '✗' END as has_enriched,
  CASE WHEN enriched_content->'expected_answer' IS NOT NULL THEN '✓' ELSE '✗' END as has_expected_answer,
  CASE WHEN enriched_content->'step_config' IS NOT NULL THEN '✓' ELSE '✗' END as has_step_config,
  enriched_content->>'cognitive_dimension' as dimension
FROM kuneo.module_steps
WHERE module_id = '0b0f4668-d41e-42b7-a51c-97c5842566b0'
ORDER BY step_order;
