-- Obtener todos los steps del módulo de fracciones con sus IDs
-- Para usar en el script de testing

SELECT 
  step_order,
  id,
  step_type,
  enriched_content->>'cognitive_dimension' as dimension,
  enriched_content->'expected_answer'->>'type' as answer_type
FROM kuneo.module_steps
WHERE module_id = '0b0f4668-d41e-42b7-a51c-97c5842566b0'
ORDER BY step_order;
