-- =====================================================
-- TEST CORRECTO: Usar embedding de mathematics para buscar mathematics
-- =====================================================

-- 1. Buscar usando un embedding de mathematics
WITH math_embedding AS (
    SELECT embedding 
    FROM kuneo.competency_units 
    WHERE subject = 'mathematics' 
    LIMIT 1
)
SELECT 
    id,
    subject,
    grade_range,
    content->>'competency' AS competency,
    similarity
FROM kuneo.search_competency_units(
    (SELECT embedding FROM math_embedding),
    0.7,  -- threshold normal
    5,
    'mathematics',  -- filtro por mathematics
    NULL,
    NULL,
    NULL
)
ORDER BY similarity DESC;

-- 2. Buscar sin filtro de materia (debería retornar de todas las materias)
SELECT 
    id,
    subject,
    grade_range,
    content->>'competency' AS competency,
    similarity
FROM kuneo.search_competency_units(
    (SELECT embedding FROM kuneo.competency_units WHERE subject = 'mathematics' LIMIT 1),
    0.7,
    10,
    NULL,  -- sin filtro
    NULL,
    NULL,
    NULL
)
ORDER BY similarity DESC;

-- 3. Ver qué tan similares son los embeddings entre materias diferentes
SELECT 
    cu1.subject AS subject_1,
    cu2.subject AS subject_2,
    1 - (cu1.embedding <=> cu2.embedding) AS similarity
FROM 
    (SELECT embedding, subject FROM kuneo.competency_units WHERE subject = 'mathematics' LIMIT 1) cu1,
    (SELECT embedding, subject FROM kuneo.competency_units WHERE subject = 'natural_sciences' LIMIT 1) cu2;

SELECT '✅ Tests completados - Ahora debería retornar resultados' AS status;
