-- =====================================================
-- ACTUALIZACIÓN DE TABLA MODULES
-- Nueva estructura para módulos generados desde competency_units
-- =====================================================

-- Paso 1: Eliminar índices existentes si existen
DROP INDEX IF EXISTS kuneo.idx_modules_subject CASCADE;
DROP INDEX IF EXISTS kuneo.idx_modules_grade_range CASCADE;
DROP INDEX IF EXISTS kuneo.idx_modules_difficulty CASCADE;
DROP INDEX IF EXISTS kuneo.idx_modules_core_concept CASCADE;
DROP INDEX IF EXISTS kuneo.idx_modules_source CASCADE;
DROP INDEX IF EXISTS kuneo.idx_modules_is_active CASCADE;
DROP INDEX IF EXISTS kuneo.idx_modules_content_gin CASCADE;
DROP INDEX IF EXISTS kuneo.idx_modules_grade_level CASCADE; -- Índice antiguo

-- Paso 2: Eliminar policies existentes si existen
DROP POLICY IF EXISTS "All authenticated users can view active modules" ON kuneo.modules;
DROP POLICY IF EXISTS "Service role full access to modules" ON kuneo.modules;

-- Paso 3: Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS trigger_update_modules_timestamp ON kuneo.modules;
DROP FUNCTION IF EXISTS kuneo.update_modules_timestamp() CASCADE;

-- Paso 4: Hacer backup de la tabla antigua (opcional - comentar si no necesitas backup)
-- Si necesitas los datos antiguos, descomenta estas líneas:
-- DROP TABLE IF EXISTS kuneo.modules_backup CASCADE;
-- CREATE TABLE kuneo.modules_backup AS SELECT * FROM kuneo.modules;

-- Paso 5: Eliminar tabla existente
DROP TABLE IF EXISTS kuneo.modules CASCADE;
DROP TABLE IF EXISTS kuneo.modules_old CASCADE;

-- Paso 6: Crear nueva tabla modules con estructura mejorada
CREATE TABLE kuneo.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificación y origen
    source_unit_id UUID, -- Referencia al competency_unit original
    source TEXT CHECK (source IN ('dba', 'standard')),
    
    -- Clasificación
    subject TEXT NOT NULL,
    grade_range TEXT NOT NULL, -- Ej: "4-5", "1-3", "10-11", o single "7"
    difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    
    -- Metadatos principales
    title TEXT NOT NULL,
    learning_objective TEXT NOT NULL,
    context TEXT,
    core_concept TEXT NOT NULL,
    
    -- Contenido completo del módulo (JSONB)
    content JSONB NOT NULL,
    -- Estructura:
    -- {
    --   "concepts": [],
    --   "cognitive_type": "",
    --   "skills": [],
    --   "diagnostic": {},
    --   "phases": [],
    --   "guided_exercises": [],
    --   "error_map": {},
    --   "hints": [],
    --   "reflection_prompts": [],
    --   "evaluation": {},
    --   "visual_triggers": [],
    --   "metadata": {}
    -- }
    
    -- Campos de control
    is_active BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda eficiente
CREATE INDEX idx_modules_subject ON kuneo.modules(subject);
CREATE INDEX idx_modules_grade_range ON kuneo.modules(grade_range);
CREATE INDEX idx_modules_difficulty ON kuneo.modules(difficulty);
CREATE INDEX idx_modules_core_concept ON kuneo.modules(core_concept);
CREATE INDEX idx_modules_source ON kuneo.modules(source);
CREATE INDEX idx_modules_is_active ON kuneo.modules(is_active);

-- Índice GIN para búsqueda dentro del JSONB
CREATE INDEX idx_modules_content_gin ON kuneo.modules USING GIN(content);

-- RLS Policies (todos los usuarios autenticados pueden ver módulos activos)
ALTER TABLE kuneo.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view active modules"
    ON kuneo.modules FOR SELECT
    USING (auth.uid() IS NOT NULL AND is_active = TRUE);

-- Service role tiene acceso completo
CREATE POLICY "Service role full access to modules"
    ON kuneo.modules FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION kuneo.update_modules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_modules_timestamp
  BEFORE UPDATE ON kuneo.modules
  FOR EACH ROW
  EXECUTE FUNCTION kuneo.update_modules_timestamp();

-- Permisos
GRANT ALL ON kuneo.modules TO service_role;
GRANT ALL ON kuneo.modules TO postgres;
GRANT SELECT ON kuneo.modules TO anon;
GRANT SELECT ON kuneo.modules TO authenticated;

-- Comentario
COMMENT ON TABLE kuneo.modules IS 
    'Módulos de aprendizaje generados desde competency_units (DBAs + Estándares MEN). Contiene estructura pedagógica completa con fases, ejercicios, error maps y evaluación.';

-- =====================================================
-- FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para buscar módulos por concepto
CREATE OR REPLACE FUNCTION kuneo.search_modules_by_concept(
    p_concept TEXT
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    core_concept TEXT,
    subject TEXT,
    grade_range TEXT,
    difficulty INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        m.core_concept,
        m.subject,
        m.grade_range,
        m.difficulty
    FROM kuneo.modules m
    WHERE m.core_concept ILIKE '%' || p_concept || '%'
    AND m.is_active = TRUE
    ORDER BY m.difficulty ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION kuneo.search_modules_by_concept(TEXT) TO authenticated;

-- Función para obtener módulos por materia y grado
CREATE OR REPLACE FUNCTION kuneo.get_modules_by_subject_grade(
    p_subject TEXT,
    p_grade_range TEXT
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    core_concept TEXT,
    learning_objective TEXT,
    difficulty INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        m.core_concept,
        m.learning_objective,
        m.difficulty
    FROM kuneo.modules m
    WHERE m.subject = p_subject
    AND m.grade_range = p_grade_range
    AND m.is_active = TRUE
    ORDER BY m.order_index ASC, m.difficulty ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION kuneo.get_modules_by_subject_grade(TEXT, TEXT) TO authenticated;

-- Función para contar módulos por materia (útil para validación)
CREATE OR REPLACE FUNCTION kuneo.count_modules_by_subject()
RETURNS TABLE (
    subject TEXT,
    count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.subject,
        COUNT(*)::BIGINT
    FROM kuneo.modules m
    WHERE m.is_active = TRUE
    GROUP BY m.subject
    ORDER BY m.subject;
END;
$$;

GRANT EXECUTE ON FUNCTION kuneo.count_modules_by_subject() TO authenticated;

-- =====================================================
-- CONSULTAS DE EJEMPLO
-- =====================================================

-- Ver todos los módulos de matemáticas grado 4-5
-- SELECT * FROM kuneo.get_modules_by_subject_grade('mathematics', '4-5');

-- Buscar módulos sobre fracciones
-- SELECT * FROM kuneo.search_modules_by_concept('fracciones');

-- Contar módulos por materia
-- SELECT * FROM kuneo.count_modules_by_subject();

-- Ver estructura completa de un módulo
-- SELECT content FROM kuneo.modules WHERE id = 'xxx';

-- Ver fases de un módulo
-- SELECT content->'phases' FROM kuneo.modules WHERE id = 'xxx';

-- Buscar módulos con error_map específico
-- SELECT id, title, core_concept 
-- FROM kuneo.modules 
-- WHERE content->'error_map' ? 'misconception_1';
