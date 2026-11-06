-- =====================================================
-- FIX PERMISSIONS: kuneo.competency_units
-- Ejecutar este script en Supabase SQL Editor
-- =====================================================

-- Asegurar que estamos en el schema correcto
SET search_path TO kuneo, public;

-- =====================================================
-- 1. VERIFICAR QUE LA TABLA EXISTE
-- =====================================================
SELECT 'Verificando tabla...' AS status;

SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema = 'kuneo' 
  AND table_name = 'competency_units';

-- =====================================================
-- 2. OTORGAR PERMISOS EXPLÍCITOS
-- =====================================================

-- Permisos para service_role (acceso completo)
GRANT ALL PRIVILEGES ON TABLE kuneo.competency_units TO service_role;

-- Permisos para authenticated users (solo lectura)
GRANT SELECT ON TABLE kuneo.competency_units TO authenticated;

-- Permisos para anon (ninguno, pero por claridad)
REVOKE ALL ON TABLE kuneo.competency_units FROM anon;

-- =====================================================
-- 3. VERIFICAR RLS POLICIES
-- =====================================================

-- Verificar que RLS está habilitado
SELECT c.relname AS tablename, c.relrowsecurity 
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'kuneo' 
  AND c.relname = 'competency_units';

-- Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'kuneo' 
  AND tablename = 'competency_units';

-- =====================================================
-- 4. RE-CREAR POLÍTICAS RLS (por si acaso)
-- =====================================================

-- Deshabilitar RLS temporalmente
ALTER TABLE kuneo.competency_units DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Authenticated users can view all competency units" ON kuneo.competency_units;
DROP POLICY IF EXISTS "Service role full access" ON kuneo.competency_units;

-- Habilitar RLS nuevamente
ALTER TABLE kuneo.competency_units ENABLE ROW LEVEL SECURITY;

-- Re-crear política para authenticated users (SELECT)
CREATE POLICY "Authenticated users can view all competency units"
    ON kuneo.competency_units 
    FOR SELECT
    TO authenticated
    USING (true);

-- Re-crear política para service_role (ALL)
CREATE POLICY "Service role full access"
    ON kuneo.competency_units
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- 5. OTORGAR PERMISOS EN FUNCIONES RPC
-- =====================================================

-- Re-otorgar permisos en funciones
GRANT EXECUTE ON FUNCTION kuneo.search_competency_units(vector, FLOAT, INT, TEXT, TEXT, INT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION kuneo.search_competency_units(vector, FLOAT, INT, TEXT, TEXT, INT, TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION kuneo.get_competency_units(TEXT, TEXT, INT, TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION kuneo.get_competency_units(TEXT, TEXT, INT, TEXT, INT) TO service_role;

-- =====================================================
-- 6. VERIFICACIÓN FINAL
-- =====================================================

-- Verificar permisos otorgados
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges
WHERE table_schema = 'kuneo'
  AND table_name = 'competency_units'
ORDER BY grantee, privilege_type;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'kuneo' 
  AND tablename = 'competency_units';

-- Contar registros (debería ser 0)
SELECT COUNT(*) as total_registros FROM kuneo.competency_units;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
/*
PERMISOS ESPERADOS:
- postgres: ALL PRIVILEGES
- service_role: ALL PRIVILEGES  ← IMPORTANTE
- authenticated: SELECT
- anon: (ninguno)

POLÍTICAS RLS ESPERADAS:
- "Authenticated users can view all competency units" (SELECT, authenticated)
- "Service role full access" (ALL, service_role)

Si todo está correcto, el script de Python debería funcionar.
*/

SELECT '✅ Permisos actualizados correctamente' AS status;
