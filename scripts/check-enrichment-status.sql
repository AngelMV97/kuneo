-- ============================================
-- VERIFICAR MÓDULOS SIN ENRICHED_CONTENT
-- ============================================
-- Identifica cuántos módulos y steps necesitan enrichment
-- ============================================

-- 1. Resumen por asignatura
SELECT 
  m.subject,
  COUNT(DISTINCT m.id) as total_modules,
  COUNT(ms.id) as total_steps,
  COUNT(CASE WHEN ms.enriched_content IS NOT NULL THEN 1 END) as enriched_steps,
  COUNT(CASE WHEN ms.enriched_content IS NULL THEN 1 END) as pending_steps,
  ROUND(
    100.0 * COUNT(CASE WHEN ms.enriched_content IS NOT NULL THEN 1 END) / 
    NULLIF(COUNT(ms.id), 0), 
    2
  ) as enrichment_percentage
FROM kuneo.modules m
LEFT JOIN kuneo.module_steps ms ON m.id = ms.module_id
WHERE m.is_active = true
GROUP BY m.subject
ORDER BY pending_steps DESC;

-- 2. Top 20 módulos con más steps sin enriquecer
SELECT 
  m.id,
  m.subject,
  m.title,
  COUNT(ms.id) as total_steps,
  COUNT(CASE WHEN ms.enriched_content IS NOT NULL THEN 1 END) as enriched_steps,
  COUNT(CASE WHEN ms.enriched_content IS NULL THEN 1 END) as pending_steps
FROM kuneo.modules m
LEFT JOIN kuneo.module_steps ms ON m.id = ms.module_id
WHERE m.is_active = true
GROUP BY m.id, m.subject, m.title
HAVING COUNT(CASE WHEN ms.enriched_content IS NULL THEN 1 END) > 0
ORDER BY pending_steps DESC
LIMIT 20;

-- 3. Total general
SELECT 
  COUNT(DISTINCT m.id) as total_modules,
  COUNT(ms.id) as total_steps,
  COUNT(CASE WHEN ms.enriched_content IS NOT NULL THEN 1 END) as enriched_steps,
  COUNT(CASE WHEN ms.enriched_content IS NULL THEN 1 END) as pending_steps,
  ROUND(
    100.0 * COUNT(CASE WHEN ms.enriched_content IS NOT NULL THEN 1 END) / 
    NULLIF(COUNT(ms.id), 0), 
    2
  ) as enrichment_percentage
FROM kuneo.modules m
LEFT JOIN kuneo.module_steps ms ON m.id = ms.module_id
WHERE m.is_active = true;

-- 4. Módulos listos para testing (con todos los steps enriquecidos)
SELECT 
  m.id,
  m.subject,
  m.title,
  COUNT(ms.id) as total_steps,
  COUNT(CASE WHEN ms.enriched_content IS NOT NULL THEN 1 END) as enriched_steps
FROM kuneo.modules m
JOIN kuneo.module_steps ms ON m.id = ms.module_id
WHERE m.is_active = true
GROUP BY m.id, m.subject, m.title
HAVING COUNT(ms.id) = COUNT(CASE WHEN ms.enriched_content IS NOT NULL THEN 1 END)
ORDER BY m.subject, m.title
LIMIT 10;
