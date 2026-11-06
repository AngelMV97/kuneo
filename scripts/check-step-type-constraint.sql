-- Ver los valores permitidos para step_type
SELECT 
  con.conname as constraint_name,
  pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'kuneo'
  AND rel.relname = 'module_steps'
  AND con.conname LIKE '%step_type%';

-- Ver qué step_types existen actualmente en la BD
SELECT DISTINCT step_type
FROM kuneo.module_steps
ORDER BY step_type;
