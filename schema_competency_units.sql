-- =====================================================
-- KUNEO - TABLA COMPETENCY_UNITS
-- Ejecutar este script en Supabase SQL Editor
-- =====================================================

-- Asegurar que el schema kuneo existe
CREATE SCHEMA IF NOT EXISTS kuneo;

-- Asegurar que pgvector está habilitado
CREATE EXTENSION IF NOT EXISTS vector;

-- Set search path
SET search_path TO kuneo, public;

-- =====================================================
-- CREAR TABLA
-- =====================================================
CREATE TABLE IF NOT EXISTS kuneo.competency_units (
    id UUID PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'competency_unit',
    source TEXT NOT NULL CHECK (source IN ('dba', 'standard')),
    subject TEXT NOT NULL,
    grade_range TEXT NOT NULL,
    difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    content JSONB NOT NULL DEFAULT '{}',
    embedding vector(1536), -- OpenAI text-embedding-3-small dimension
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COMENTARIOS (documentación)
-- =====================================================
COMMENT ON TABLE kuneo.competency_units IS 'Competency units normalizados (DBAs + Estándares) con embeddings vectoriales';
COMMENT ON COLUMN kuneo.competency_units.id IS 'UUID único generado durante normalización';
COMMENT ON COLUMN kuneo.competency_units.type IS 'Tipo de unidad (siempre "competency_unit")';
COMMENT ON COLUMN kuneo.competency_units.source IS 'Fuente: "dba" o "standard"';
COMMENT ON COLUMN kuneo.competency_units.subject IS 'Materia: matematicas, lenguaje, ciencias, sociales, ingles';
COMMENT ON COLUMN kuneo.competency_units.grade_range IS 'Rango de grados (ej: "6-7", "10-11")';
COMMENT ON COLUMN kuneo.competency_units.difficulty IS 'Dificultad estimada (1-5)';
COMMENT ON COLUMN kuneo.competency_units.content IS 'Contenido JSONB: competency, evidence, example, concepts, misconceptions, metadata';
COMMENT ON COLUMN kuneo.competency_units.embedding IS 'Vector de 1536 dimensiones (OpenAI text-embedding-3-small)';

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Filtros básicos
CREATE INDEX IF NOT EXISTS idx_competency_units_source ON kuneo.competency_units(source);
CREATE INDEX IF NOT EXISTS idx_competency_units_subject ON kuneo.competency_units(subject);
CREATE INDEX IF NOT EXISTS idx_competency_units_grade_range ON kuneo.competency_units(grade_range);
CREATE INDEX IF NOT EXISTS idx_competency_units_difficulty ON kuneo.competency_units(difficulty);

-- JSONB indexes para content queries
CREATE INDEX IF NOT EXISTS idx_competency_units_content_gin ON kuneo.competency_units USING gin(content);
CREATE INDEX IF NOT EXISTS idx_competency_units_concepts ON kuneo.competency_units USING gin((content->'concepts'));
CREATE INDEX IF NOT EXISTS idx_competency_units_metadata ON kuneo.competency_units USING gin((content->'metadata'));

-- Vector similarity search index (HNSW es más rápido que IVFFlat)
CREATE INDEX IF NOT EXISTS idx_competency_units_embedding_hnsw ON kuneo.competency_units 
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE kuneo.competency_units ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view all competency units" ON kuneo.competency_units;
DROP POLICY IF EXISTS "Service role full access" ON kuneo.competency_units;

-- Usuarios autenticados pueden leer todos los units
CREATE POLICY "Authenticated users can view all competency units"
    ON kuneo.competency_units FOR SELECT
    TO authenticated
    USING (true);

-- Service role tiene acceso completo (para bulk operations)
CREATE POLICY "Service role full access"
    ON kuneo.competency_units
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- FUNCIONES RPC
-- =====================================================

-- Función 1: Búsqueda semántica
CREATE OR REPLACE FUNCTION kuneo.search_competency_units(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.5,
    match_count INT DEFAULT 10,
    filter_subject TEXT DEFAULT NULL,
    filter_grade_range TEXT DEFAULT NULL,
    filter_difficulty INT DEFAULT NULL,
    filter_source TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    source TEXT,
    subject TEXT,
    grade_range TEXT,
    difficulty INT,
    content JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cu.id,
        cu.type,
        cu.source,
        cu.subject,
        cu.grade_range,
        cu.difficulty,
        cu.content,
        1 - (cu.embedding <=> query_embedding) AS similarity
    FROM kuneo.competency_units cu
    WHERE
        (cu.embedding IS NOT NULL)
        AND (1 - (cu.embedding <=> query_embedding) > match_threshold)
        AND (filter_subject IS NULL OR cu.subject = filter_subject)
        AND (filter_grade_range IS NULL OR cu.grade_range = filter_grade_range)
        AND (filter_difficulty IS NULL OR cu.difficulty = filter_difficulty)
        AND (filter_source IS NULL OR cu.source = filter_source)
    ORDER BY cu.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION kuneo.search_competency_units(vector, FLOAT, INT, TEXT, TEXT, INT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION kuneo.search_competency_units(vector, FLOAT, INT, TEXT, TEXT, INT, TEXT) TO service_role;

-- Comentario
COMMENT ON FUNCTION kuneo.search_competency_units IS 'Búsqueda semántica de competency units usando vectores de OpenAI';

-- Función 2: Filtrado sin embeddings
CREATE OR REPLACE FUNCTION kuneo.get_competency_units(
    filter_subject TEXT DEFAULT NULL,
    filter_grade_range TEXT DEFAULT NULL,
    filter_difficulty INT DEFAULT NULL,
    filter_source TEXT DEFAULT NULL,
    limit_count INT DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    source TEXT,
    subject TEXT,
    grade_range TEXT,
    difficulty INT,
    content JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cu.id,
        cu.type,
        cu.source,
        cu.subject,
        cu.grade_range,
        cu.difficulty,
        cu.content
    FROM kuneo.competency_units cu
    WHERE
        (filter_subject IS NULL OR cu.subject = filter_subject)
        AND (filter_grade_range IS NULL OR cu.grade_range = filter_grade_range)
        AND (filter_difficulty IS NULL OR cu.difficulty = filter_difficulty)
        AND (filter_source IS NULL OR cu.source = filter_source)
    ORDER BY cu.created_at DESC
    LIMIT limit_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION kuneo.get_competency_units(TEXT, TEXT, INT, TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION kuneo.get_competency_units(TEXT, TEXT, INT, TEXT, INT) TO service_role;

-- Comentario
COMMENT ON FUNCTION kuneo.get_competency_units IS 'Obtiene competency units usando filtros sin búsqueda vectorial';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que la tabla existe
SELECT 'Tabla creada exitosamente' AS status, 
       COUNT(*) AS registros_actuales 
FROM kuneo.competency_units;

-- =====================================================
-- FIN
-- =====================================================
