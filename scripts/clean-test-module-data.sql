-- ============================================
-- LIMPIAR DATOS DE TESTING DEL TEST MODULE
-- ============================================
-- Elimina attempts y progress del módulo de prueba para empezar limpio
-- ============================================

-- Eliminar attempts del test module
DELETE FROM kuneo.student_step_attempts
WHERE module_id = '00000000-0000-0000-0000-000000000001';

-- Eliminar progress del test module
DELETE FROM kuneo.student_module_progress
WHERE module_id = '00000000-0000-0000-0000-000000000001';

-- Verificar que se eliminaron
SELECT 
  'student_step_attempts' as table_name,
  COUNT(*) as remaining_count
FROM kuneo.student_step_attempts
WHERE module_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 
  'student_module_progress',
  COUNT(*)
FROM kuneo.student_module_progress
WHERE module_id = '00000000-0000-0000-0000-000000000001';

-- También verificar el módulo y steps
SELECT 
  m.id,
  m.title,
  COUNT(ms.id) as steps_count,
  COUNT(CASE WHEN ms.enriched_content IS NOT NULL THEN 1 END) as enriched_steps
FROM kuneo.modules m
LEFT JOIN kuneo.module_steps ms ON m.id = ms.module_id
WHERE m.id = '00000000-0000-0000-0000-000000000001'
GROUP BY m.id, m.title;
