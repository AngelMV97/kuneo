-- Verificar todos los subjects disponibles

SELECT 
  subject,
  COUNT(DISTINCT id) as total_modules,
  COUNT(*) as total_with_steps
FROM kuneo.modules
GROUP BY subject
ORDER BY total_modules DESC;
