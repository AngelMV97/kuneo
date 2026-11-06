-- Verificar que el módulo y los steps existen
SELECT 
  m.id as module_id,
  m.title,
  ms.id as step_id,
  ms.step_order,
  ms.step_type,
  ms.enriched_content->>'cognitive_dimension' as dimension,
  ms.enriched_content->'expected_answer'->>'type' as answer_type
FROM kuneo.modules m
JOIN kuneo.module_steps ms ON ms.module_id = m.id
WHERE m.id = '00000000-0000-0000-0000-000000000001'
ORDER BY ms.step_order;
