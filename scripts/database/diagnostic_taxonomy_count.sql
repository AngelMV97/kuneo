-- ============================================
-- DIAGNÓSTICO: Registros en curriculum_taxonomy
-- ============================================

-- 1. CONTEO TOTAL
SELECT COUNT(*) as total_registros
FROM kuneo.curriculum_taxonomy;

-- 2. CONTEO POR MATERIA (completo con TODOS)
SELECT 
    subject,
    COUNT(*) as cantidad
FROM kuneo.curriculum_taxonomy
GROUP BY subject
ORDER BY subject;

-- 3. CONTEO POR RANGO DE GRADO (completo con TODOS)
SELECT 
    grade_range,
    COUNT(*) as cantidad
FROM kuneo.curriculum_taxonomy
GROUP BY grade_range
ORDER BY grade_range;

-- 4. VERIFICAR SI EXISTEN LENGUAJE E INGLÉS
SELECT 
    subject,
    COUNT(*) as cantidad
FROM kuneo.curriculum_taxonomy
WHERE subject IN ('lenguaje', 'ingles')
GROUP BY subject;

-- 5. VER MUESTRA DE REGISTROS DE LENGUAJE
SELECT *
FROM kuneo.curriculum_taxonomy
WHERE subject = 'lenguaje'
LIMIT 5;

-- 6. VER MUESTRA DE REGISTROS DE INGLÉS
SELECT *
FROM kuneo.curriculum_taxonomy
WHERE subject = 'ingles'
LIMIT 5;

-- 7. SUMA DE VERIFICACIÓN (debe dar 1570)
SELECT 
    SUM(cantidad) as suma_total
FROM (
    SELECT subject, COUNT(*) as cantidad
    FROM kuneo.curriculum_taxonomy
    GROUP BY subject
) subquery;

-- 8. VERIFICAR DISTRIBUCIÓN COMPLETA
SELECT 
    subject,
    grade_range,
    COUNT(*) as cantidad
FROM kuneo.curriculum_taxonomy
GROUP BY subject, grade_range
ORDER BY subject, grade_range;
