-- Encontrar módulos con TODOS sus steps enriquecidos
-- Para usar en testing del Adaptive Engine

SELECT 
  m.id,
  m.title,
  m.subject,
  m.core_concept,
  m.difficulty,
  m.grade_range,
  COUNT(ms.id) as total_steps,
  COUNT(ms.enriched_content) FILTER (WHERE ms.enriched_content IS NOT NULL) as enriched_steps,
  -- Lista de answer types presentes
  json_agg(DISTINCT ms.enriched_content->'expected_answer'->>'type') 
    FILTER (WHERE ms.enriched_content IS NOT NULL) as answer_types,
  -- Lista de dimensiones presentes
  json_agg(DISTINCT ms.enriched_content->>'cognitive_dimension') 
    FILTER (WHERE ms.enriched_content IS NOT NULL) as dimensions
FROM kuneo.modules m
INNER JOIN kuneo.module_steps ms ON ms.module_id = m.id
GROUP BY m.id, m.title, m.subject, m.core_concept, m.difficulty, m.grade_range
HAVING COUNT(ms.id) = COUNT(ms.enriched_content)  -- Todos los steps enriquecidos
  AND COUNT(ms.id) >= 6  -- Al menos 6 steps para hacer un buen test
ORDER BY m.subject, COUNT(ms.id) DESC
LIMIT 20;
