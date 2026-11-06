-- ============================================
-- FIX: Grant permissions para tablas del Adaptive Engine
-- ============================================

-- Grant ALL permissions para el role authenticado y service_role
GRANT ALL ON kuneo.student_step_attempts TO authenticated, service_role;
GRANT ALL ON kuneo.student_module_progress TO authenticated, service_role;
GRANT ALL ON kuneo.student_cognitive_profile TO authenticated, service_role;
GRANT ALL ON kuneo.student_taxonomy_mastery TO authenticated, service_role;
GRANT ALL ON kuneo.student_recommendations TO authenticated, service_role;

-- Grant USAGE en el schema
GRANT USAGE ON SCHEMA kuneo TO authenticated, service_role;

-- Verificar permisos
SELECT 
  table_schema,
  table_name,
  grantee,
  string_agg(privilege_type, ', ') as privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'kuneo'
  AND table_name IN (
    'student_step_attempts',
    'student_module_progress',
    'student_cognitive_profile',
    'student_taxonomy_mastery',
    'student_recommendations'
  )
  AND grantee IN ('authenticated', 'service_role', 'postgres')
GROUP BY table_schema, table_name, grantee
ORDER BY table_name, grantee;
