-- Encontrar módulos de Language con TODOS los steps enriquecidos
WITH module_stats AS (
  SELECT 
    m.id,
    m.title,
    m.subject,
    m.core_concept,
    m.difficulty_level,
    m.target_grade,
    COUNT(ms.id) as total_steps,
    COUNT(CASE WHEN ms.enriched_content IS NOT NULL THEN 1 END) as enriched_steps,
    jsonb_agg(DISTINCT ms.enriched_content->'expected_answer'->>'type') 
      FILTER (WHERE ms.enriched_content IS NOT NULL) as answer_types,
    jsonb_agg(DISTINCT ms.enriched_content->>'cognitive_dimension') 
      FILTER (WHERE ms.enriched_content IS NOT NULL) as dimensions
  FROM kuneo.modules m
  JOIN kuneo.module_steps ms ON m.id = ms.module_id
  WHERE m.subject = 'language'
  GROUP BY m.id, m.title, m.subject, m.core_concept, m.difficulty_level, m.target_grade
)
SELECT 
  id,
  title,
  core_concept,
  difficulty_level,
  target_grade,
  total_steps,
  enriched_steps,
  answer_types,
  dimensions
FROM module_stats
WHERE enriched_steps = total_steps  -- TODOS enriquecidos
  AND total_steps >= 5  -- Al menos 5 steps
ORDER BY difficulty_level, total_steps DESC
LIMIT 10;
