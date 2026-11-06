-- ============================================
-- LIMPIAR ENRICHED_CONTENT ANTIGUO
-- ============================================
-- Elimina enriched_content con estructura incompatible
-- Para re-enriquecer con nueva estructura del Adaptive Engine
-- ============================================

-- 1. Ver cuántos steps tienen enriched_content con estructura antigua
SELECT 
  'Antes del borrado' as status,
  COUNT(*) as total_steps,
  COUNT(CASE WHEN enriched_content IS NOT NULL THEN 1 END) as with_old_enriched,
  COUNT(CASE WHEN enriched_content->'expected_answer' IS NOT NULL THEN 1 END) as with_new_structure
FROM kuneo.module_steps
WHERE module_id IN (
  SELECT id FROM kuneo.modules WHERE subject = 'mathematics'
);

-- 2. Limpiar enriched_content del módulo de fracciones específico
UPDATE kuneo.module_steps
SET 
  enriched_content = NULL,
  enriched_at = NULL
WHERE module_id = '0b0f4668-d41e-42b7-a51c-97c5842566b0';

-- 3. Verificar que se limpió
SELECT 
  step_order,
  step_type,
  CASE WHEN enriched_content IS NOT NULL THEN '✓' ELSE '✗' END as has_enriched
FROM kuneo.module_steps
WHERE module_id = '0b0f4668-d41e-42b7-a51c-97c5842566b0'
ORDER BY step_order;

-- 4. (OPCIONAL) Limpiar TODOS los módulos de matemáticas con estructura antigua
-- DESCOMENTAR SOLO SI QUIERES LIMPIAR TODOS A LA VEZ

UPDATE kuneo.module_steps
SET 
  enriched_content = NULL,
  enriched_at = NULL
WHERE module_id IN (
  SELECT id FROM kuneo.modules 
  WHERE subject = 'mathematics'
    AND id IN (
      SELECT DISTINCT module_id 
      FROM kuneo.module_steps 
      WHERE enriched_content IS NOT NULL 
        AND enriched_content->'expected_answer' IS NULL
    )
);

-- 5. Ver estado final
SELECT 
  'Después del borrado' as status,
  COUNT(*) as total_steps,
  COUNT(CASE WHEN enriched_content IS NOT NULL THEN 1 END) as with_enriched,
  COUNT(CASE WHEN enriched_content->'expected_answer' IS NOT NULL THEN 1 END) as with_new_structure
FROM kuneo.module_steps
WHERE module_id IN (
  SELECT id FROM kuneo.modules WHERE subject = 'mathematics'
);
