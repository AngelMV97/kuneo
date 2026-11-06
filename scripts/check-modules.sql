-- Verificar qué módulos existen en la BD
SELECT 
  id,
  title,
  subject,
  difficulty,
  is_active,
  created_at
FROM kuneo.modules
ORDER BY created_at DESC
LIMIT 10;

-- Verificar cuántos steps tienen los módulos
SELECT 
  m.id as module_id,
  m.title,
  COUNT(ms.id) as steps_count,
  COUNT(CASE WHEN ms.enriched_content IS NOT NULL THEN 1 END) as enriched_steps_count
FROM kuneo.modules m
LEFT JOIN kuneo.module_steps ms ON m.id = ms.module_id
GROUP BY m.id, m.title
ORDER BY m.created_at DESC
LIMIT 10;

-- Verificar si hay algún step con enriched_content completo
SELECT 
  ms.id as step_id,
  m.title as module_title,
  ms.step_type,
  ms.step_order,
  CASE 
    WHEN ms.enriched_content IS NOT NULL THEN 'Has enriched_content'
    ELSE 'No enriched_content'
  END as status,
  CASE 
    WHEN ms.enriched_content->>'expected_answer' IS NOT NULL THEN 'Has expected_answer'
    ELSE 'No expected_answer'
  END as has_expected_answer
FROM kuneo.module_steps ms
JOIN kuneo.modules m ON m.id = ms.module_id
ORDER BY m.created_at DESC, ms.step_order
LIMIT 20;
