-- ============================================
-- PERFORMANCE OPTIMIZATION - DATABASE INDEXES
-- ============================================
-- Script: optimize-indexes.sql
-- Objetivo: Agregar índices críticos para reducir query time
-- Impacto esperado: -800ms (26% improvement)
-- Fecha: 2026-05-20
-- ============================================

-- Nota: Ejecutar este script con conexión de administrador
-- Supabase: SQL Editor → New Query → Ejecutar

-- ============================================
-- 1. MODULE_STEPS - Query de steps por módulo
-- ============================================
-- Uso: SELECT * FROM module_steps WHERE module_id = ? ORDER BY step_order
-- Frecuencia: Alta (cada carga de módulo)
CREATE INDEX IF NOT EXISTS idx_module_steps_module_id_order 
ON kuneo.module_steps(module_id, step_order);

COMMENT ON INDEX kuneo.idx_module_steps_module_id_order IS 
'Optimizes module step queries with ordering. Expected impact: -100ms per query.';

-- ============================================
-- 2. STUDENT_STEP_ATTEMPTS - Query de intentos por usuario/step
-- ============================================
-- Uso: SELECT * FROM student_step_attempts WHERE user_id = ? AND step_id = ?
-- Frecuencia: Muy alta (cada respuesta para COUNT y SELECT)
CREATE INDEX IF NOT EXISTS idx_step_attempts_user_step 
ON kuneo.student_step_attempts(user_id, step_id);

COMMENT ON INDEX kuneo.idx_step_attempts_user_step IS 
'Optimizes attempt lookups by user and step. Expected impact: -200ms per query.';

-- ============================================
-- 3. STUDENT_STEP_ATTEMPTS - Query con ORDER BY created_at
-- ============================================
-- Uso: SELECT * FROM student_step_attempts WHERE user_id = ? AND step_id = ? ORDER BY created_at DESC LIMIT 5
-- Frecuencia: Alta (resolveNextStep)
CREATE INDEX IF NOT EXISTS idx_step_attempts_user_step_created 
ON kuneo.student_step_attempts(user_id, step_id, created_at DESC);

COMMENT ON INDEX kuneo.idx_step_attempts_user_step_created IS 
'Optimizes recent attempts queries with temporal sorting. Expected impact: -150ms per query.';

-- ============================================
-- 4. STUDENT_MODULE_PROGRESS - Query de progreso por usuario/módulo
-- ============================================
-- Uso: SELECT * FROM student_module_progress WHERE user_id = ? AND module_id = ?
-- Frecuencia: Muy alta (cada respuesta)
CREATE INDEX IF NOT EXISTS idx_module_progress_user_module 
ON kuneo.student_module_progress(user_id, module_id);

COMMENT ON INDEX kuneo.idx_module_progress_user_module IS 
'Optimizes module progress lookups. Expected impact: -150ms per query.';

-- ============================================
-- 5. STUDENT_COGNITIVE_PROFILE - Query de perfil por usuario
-- ============================================
-- Uso: SELECT * FROM student_cognitive_profile WHERE user_id = ?
-- Frecuencia: Muy alta (cada respuesta)
CREATE INDEX IF NOT EXISTS idx_cognitive_profile_user 
ON kuneo.student_cognitive_profile(user_id);

COMMENT ON INDEX kuneo.idx_cognitive_profile_user IS 
'Optimizes cognitive profile lookups. Expected impact: -200ms per query.';

-- ============================================
-- 6. STUDENT_STEP_ATTEMPTS - Índice para attempt_number MAX query
-- ============================================
-- Uso: SELECT MAX(attempt_number) FROM student_step_attempts WHERE user_id = ? AND step_id = ?
-- Frecuencia: Muy alta (cada respuesta)
CREATE INDEX IF NOT EXISTS idx_step_attempts_user_step_attempt_num 
ON kuneo.student_step_attempts(user_id, step_id, attempt_number DESC);

COMMENT ON INDEX kuneo.idx_step_attempts_user_step_attempt_num IS 
'Optimizes attempt number lookups for sequential attempts. Expected impact: -100ms per query.';

-- ============================================
-- VERIFICACIÓN DE ÍNDICES
-- ============================================
-- Ejecutar esto después para confirmar que se crearon:
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'kuneo'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ============================================
-- ANÁLISIS DE IMPACTO
-- ============================================
-- Para ver el query plan ANTES vs DESPUÉS:
-- EXPLAIN ANALYZE SELECT * FROM kuneo.student_step_attempts 
-- WHERE user_id = 'b5d08d8c-2c8a-47aa-85e5-3cd58751f35d' 
-- AND step_id = '698b6f8b-015f-48c6-85cb-d50d9ca84ac4'
-- ORDER BY created_at DESC LIMIT 5;

-- Esperado ANTES: Seq Scan (~200-500ms)
-- Esperado DESPUÉS: Index Scan (~10-50ms)

-- ============================================
-- ROLLBACK (Si es necesario)
-- ============================================
/*
DROP INDEX IF EXISTS kuneo.idx_module_steps_module_id_order;
DROP INDEX IF EXISTS kuneo.idx_step_attempts_user_step;
DROP INDEX IF EXISTS kuneo.idx_step_attempts_user_step_created;
DROP INDEX IF EXISTS kuneo.idx_module_progress_user_module;
DROP INDEX IF EXISTS kuneo.idx_cognitive_profile_user;
DROP INDEX IF EXISTS kuneo.idx_step_attempts_user_step_attempt_num;
*/

-- ============================================
-- ESTADÍSTICAS ESPERADAS
-- ============================================
-- Total de índices agregados: 6
-- Tablas afectadas: 3 (module_steps, student_step_attempts, student_module_progress, student_cognitive_profile)
-- Impacto esperado total: -800ms a -1,000ms por request
-- Reducción de performance: ~26-33%
-- Performance proyectada: 3,000ms → 2,000-2,200ms
