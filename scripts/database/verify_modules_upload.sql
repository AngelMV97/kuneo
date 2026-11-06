-- =====================================================
-- VERIFICACIÓN DE MÓDULOS CARGADOS
-- =====================================================

-- Total de módulos
SELECT COUNT(*) as total_modules FROM kuneo.modules;

-- Por materia
SELECT subject, COUNT(*) as count
FROM kuneo.modules
GROUP BY subject
ORDER BY subject;

-- Por grado
SELECT grade_range, COUNT(*) as count
FROM kuneo.modules
GROUP BY grade_range
ORDER BY grade_range;

-- Por dificultad
SELECT difficulty, COUNT(*) as count
FROM kuneo.modules
GROUP BY difficulty
ORDER BY difficulty;

-- Primeros 5 módulos
SELECT id, title, subject, grade_range, core_concept
FROM kuneo.modules
LIMIT 5;
