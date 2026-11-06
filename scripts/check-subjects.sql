-- Verificar qué subjects existen en la base de datos
SELECT 
  subject,
  COUNT(DISTINCT id) as module_count,
  COUNT(ms.id) as step_count,
  COUNT(CASE WHEN ms.enriched_content IS NOT NULL THEN 1 END) as enriched_count
FROM kuneo.modules m
LEFT JOIN kuneo.module_steps ms ON m.id = ms.module_id
GROUP BY subject
ORDER BY module_count DESC;
