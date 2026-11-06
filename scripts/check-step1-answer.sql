-- Ver el expected_answer completo del step 1 para saber la respuesta correcta

SELECT 
  step_order,
  step_type,
  content->>'prompt' as question,
  content->'options' as options_list,
  jsonb_pretty(enriched_content->'expected_answer') as expected_answer_structure
FROM kuneo.module_steps
WHERE id = '698b6f8b-015f-48c6-85cb-d50d9ca84ac4';
