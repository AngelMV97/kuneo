-- Ver la estructura real de la tabla module_steps
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'kuneo' 
AND table_name = 'module_steps'
ORDER BY ordinal_position;
