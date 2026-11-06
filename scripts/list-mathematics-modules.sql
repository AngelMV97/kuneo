-- Listar los módulos de matemáticas y su estado de enrichment
-- Para identificar cuáles re-enriquecer

SELECT 
  m.id,
  m.title,
  m.core_concept,
  m.difficulty,
  COUNT(ms.id) as total_steps,
  COUNT(ms.enriched_content) FILTER (WHERE ms.enriched_content IS NOT NULL) as enriched_steps,
  ROUND(
    100.0 * COUNT(ms.enriched_content) FILTER (WHERE ms.enriched_content IS NOT NULL) / COUNT(ms.id),
    1
  ) as enrichment_percentage
FROM kuneo.modules m
LEFT JOIN kuneo.module_steps ms ON ms.module_id = m.id
WHERE m.subject = 'mathematics'
GROUP BY m.id, m.title, m.core_concept, m.difficulty
ORDER BY enrichment_percentage DESC, total_steps DESC;
