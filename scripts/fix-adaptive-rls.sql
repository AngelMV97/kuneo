-- ============================================
-- FIX: Deshabilitar RLS para tablas del Adaptive Engine
-- ============================================
-- IMPORTANTE: Esto es para MVP/desarrollo
-- En producción, usa políticas RLS más específicas
-- ============================================

-- El service_role key debería bypassear RLS automáticamente,
-- pero si no funciona, deshabilitamos RLS temporalmente

ALTER TABLE kuneo.student_step_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE kuneo.student_module_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE kuneo.student_cognitive_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE kuneo.student_taxonomy_mastery DISABLE ROW LEVEL SECURITY;
ALTER TABLE kuneo.student_recommendations DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está deshabilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'kuneo'
  AND tablename IN (
    'student_step_attempts',
    'student_module_progress',
    'student_cognitive_profile',
    'student_taxonomy_mastery',
    'student_recommendations'
  );

-- Output esperado: rowsecurity = false para todas las tablas
