-- =====================================================
-- DIAGNÓSTICO: Búsqueda Semántica No Retorna Resultados
-- =====================================================

-- 1. Verificar registros totales
SELECT 'Total registros' AS test, COUNT(*) AS count 
FROM kuneo.competency_units;

-- 2. Verificar embeddings no nulos
SELECT 'Embeddings no nulos' AS test, COUNT(*) AS count 
FROM kuneo.competency_units 
WHERE embedding IS NOT NULL;

-- 3. Verificar por materia (inglés)
SELECT subject, COUNT(*) 
FROM kuneo.competency_units 
GROUP BY subject 
ORDER BY COUNT(*) DESC;

-- 4. Probar búsqueda SIN filtros (threshold muy bajo)
SELECT 
    'Sin filtros, threshold 0.1' AS test,
    COUNT(*) AS results_count
FROM kuneo.search_competency_units(
    (SELECT embedding FROM kuneo.competency_units LIMIT 1),
    0.1,  -- threshold muy bajo
    10,
    NULL, -- sin filtro de materia
    NULL,
    NULL,
    NULL
);

-- 5. Probar búsqueda CON filtro mathematics (threshold bajo)
SELECT 
    'Con filtro mathematics, threshold 0.1' AS test,
    COUNT(*) AS results_count
FROM kuneo.search_competency_units(
    (SELECT embedding FROM kuneo.competency_units LIMIT 1),
    0.1,
    10,
    'mathematics',
    NULL,
    NULL,
    NULL
);

-- 6. Probar búsqueda directa con cosine distance
-- Debería retornar el mismo registro (distance = 0)
WITH test_embedding AS (
    SELECT id, embedding, subject, grade_range
    FROM kuneo.competency_units 
    LIMIT 1
)
SELECT 
    cu.id,
    cu.subject,
    cu.grade_range,
    cu.embedding <=> te.embedding AS distance,
    1 - (cu.embedding <=> te.embedding) AS similarity
FROM kuneo.competency_units cu, test_embedding te
WHERE cu.embedding IS NOT NULL
ORDER BY cu.embedding <=> te.embedding
LIMIT 5;

-- 7. Verificar función RPC existe y tiene permisos
SELECT 
    routine_name,
    routine_type,
    routine_schema
FROM information_schema.routines
WHERE routine_schema = 'kuneo' 
  AND routine_name LIKE '%competency%';

-- 8. Ver políticas RLS de la tabla
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'kuneo' 
  AND tablename = 'competency_units';

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
/*
Test 1-2: Debería mostrar 1426 registros
Test 3: Debería mostrar las 5 materias en inglés
Test 4: Debería retornar ~10 resultados (threshold muy bajo)
Test 5: Si retorna 0, hay problema con el filtro de materia
Test 6: Debería retornar 5 registros con similarity cercano a 1.0
Test 7: Debería mostrar 2 funciones (search_competency_units, get_competency_units)
Test 8: Debería mostrar 2 políticas (authenticated SELECT, service_role ALL)
*/

-- =====================================================
-- POSIBLES PROBLEMAS
-- =====================================================
/*
1. Si test 4 retorna 0: Problema con el índice HNSW o la función RPC
2. Si test 5 retorna 0 pero test 4 retorna >0: El filtro de materia no funciona
3. Si test 6 retorna resultados pero test 4 no: Problema con la función RPC
4. Si test 7 no muestra funciones: Las funciones no se crearon correctamente
*/

SELECT '✅ Diagnóstico completado' AS status;
