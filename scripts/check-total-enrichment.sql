-- Verificar estado total del enrichment por asignatura

SELECT 
  m.subject,
  COUNT(DISTINCT m.id) as total_modules,
  COUNT(ms.id) as total_steps,
  COUNT(ms.enriched_content) FILTER (WHERE ms.enriched_content IS NOT NULL) as enriched_steps,
  ROUND(
    100.0 * COUNT(ms.enriched_content) FILTER (WHERE ms.enriched_content IS NOT NULL) / COUNT(ms.id),
    2
  ) as enrichment_percentage
FROM kuneo.modules m
LEFT JOIN kuneo.module_steps ms ON ms.module_id = m.id
GROUP BY m.subject
ORDER BY enrichment_percentage DESC;
