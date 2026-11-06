-- =====================================================
-- FIX PERMISSIONS: kuneo.competency_units (VERSIÓN SIMPLE)
-- Ejecutar este script en Supabase SQL Editor
-- =====================================================

-- PASO 1: Otorgar permisos explícitos
GRANT ALL PRIVILEGES ON TABLE kuneo.competency_units TO service_role;
GRANT SELECT ON TABLE kuneo.competency_units TO authenticated;

-- PASO 2: Re-crear políticas RLS
ALTER TABLE kuneo.competency_units DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view all competency units" ON kuneo.competency_units;
DROP POLICY IF EXISTS "Service role full access" ON kuneo.competency_units;

ALTER TABLE kuneo.competency_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all competency units"
    ON kuneo.competency_units 
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Service role full access"
    ON kuneo.competency_units
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- PASO 3: Otorgar permisos en funciones RPC
GRANT EXECUTE ON FUNCTION kuneo.search_competency_units(vector, FLOAT, INT, TEXT, TEXT, INT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION kuneo.get_competency_units(TEXT, TEXT, INT, TEXT, INT) TO authenticated, service_role;

-- PASO 4: Verificación
SELECT 
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'kuneo'
  AND table_name = 'competency_units'
ORDER BY grantee, privilege_type;

-- Si ves service_role con permisos, ¡listo! Ejecuta el script de Python.
