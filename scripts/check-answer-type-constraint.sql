-- Ver los valores permitidos para answer_type en student_step_attempts
SELECT 
  con.conname as constraint_name,
  pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'kuneo'
  AND rel.relname = 'student_step_attempts'
  AND con.conname LIKE '%answer_type%';
