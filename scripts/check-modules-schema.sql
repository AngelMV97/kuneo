-- Ver la estructura real de la tabla modules
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'kuneo' 
AND table_name = 'modules'
ORDER BY ordinal_position;
