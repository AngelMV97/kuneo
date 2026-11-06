-- ============================================
-- Tabla: curriculum_taxonomy
-- Propósito: Almacenar la arquitectura curricular estática de Kuneo (CAPA 1)
-- Autor: Sistema Kuneo
-- Fecha: 2026-05-12
-- ============================================

-- Esta tabla almacena la estructura curricular jerárquica:
-- DISCIPLINAS → TEMÁTICAS → SUBTEMÁTICAS → MICROTOPICS
-- 
-- NO contiene embeddings porque no es contenido a buscar semánticamente,
-- sino estructura pedagógica que guía la generación de módulos.

CREATE TABLE IF NOT EXISTS kuneo.curriculum_taxonomy (
  -- Identificador único
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ubicación curricular
  subject TEXT NOT NULL, -- matematicas, ciencias_naturales, ciencias_sociales, ingles, lenguaje
  grade_range TEXT NOT NULL, -- 1-3, 4-5, 6-7, 8-9, 10-11
  
  -- Jerarquía curricular (4 niveles)
  discipline TEXT NOT NULL, -- Ej: aritmetica, geometria, algebra
  thematic TEXT NOT NULL, -- Ej: numeros_fraccionarios, ecuaciones_lineales
  subthematic TEXT NOT NULL, -- Ej: fraccion_parte_todo, resolucion_de_ecuaciones
  microtopics TEXT[] NOT NULL, -- Array de strings: [representacion_visual_fracciones, particion_de_unidades, ...]
  
  -- Metadatos específicos de Inglés (solo para subject='ingles')
  mcer_level TEXT, -- A1, A2.1, A2.2, B1.1, B1.2
  core_model TEXT[], -- Array: narrativa_tematica, comprension_multimodal, etc.
  cognitive_layer TEXT[], -- Array: ingles_para_explorar_el_mundo, aprendizaje_mediante_historias, etc.
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_taxonomy_entry 
    UNIQUE(subject, grade_range, discipline, thematic, subthematic),
  
  CONSTRAINT valid_subject 
    CHECK (subject IN ('matematicas', 'ciencias_naturales', 'ciencias_sociales', 'ingles', 'lenguaje')),
  
  CONSTRAINT valid_grade_range 
    CHECK (grade_range IN ('1-3', '4-5', '6-7', '8-9', '10-11')),
  
  CONSTRAINT microtopics_not_empty 
    CHECK (array_length(microtopics, 1) > 0)
);

-- ============================================
-- Índices para optimizar consultas
-- ============================================

-- Búsqueda por materia y grado
CREATE INDEX IF NOT EXISTS idx_curriculum_subject_grade 
  ON kuneo.curriculum_taxonomy(subject, grade_range);

-- Búsqueda jerárquica completa
CREATE INDEX IF NOT EXISTS idx_curriculum_hierarchy 
  ON kuneo.curriculum_taxonomy(subject, grade_range, discipline, thematic);

-- Búsqueda por disciplina (para módulos temáticos)
CREATE INDEX IF NOT EXISTS idx_curriculum_discipline 
  ON kuneo.curriculum_taxonomy(discipline);

-- Búsqueda específica de Inglés por nivel MCER
CREATE INDEX IF NOT EXISTS idx_curriculum_mcer 
  ON kuneo.curriculum_taxonomy(mcer_level) 
  WHERE subject = 'ingles';

-- Búsqueda por microtopics usando GIN (para array search)
CREATE INDEX IF NOT EXISTS idx_curriculum_microtopics 
  ON kuneo.curriculum_taxonomy USING GIN(microtopics);

-- ============================================
-- Función: Actualizar timestamp automáticamente
-- ============================================

CREATE OR REPLACE FUNCTION kuneo.update_curriculum_taxonomy_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_curriculum_timestamp
  BEFORE UPDATE ON kuneo.curriculum_taxonomy
  FOR EACH ROW
  EXECUTE FUNCTION kuneo.update_curriculum_taxonomy_timestamp();

-- ============================================
-- Comentarios para documentación
-- ============================================

COMMENT ON TABLE kuneo.curriculum_taxonomy IS 
  'Arquitectura curricular estática de Kuneo (CAPA 1). Define la estructura jerárquica de aprendizaje: disciplinas → temáticas → subtemáticas → microtopics. No contiene embeddings.';

COMMENT ON COLUMN kuneo.curriculum_taxonomy.subject IS 
  'Materia: matematicas, ciencias_naturales, ciencias_sociales, ingles, lenguaje';

COMMENT ON COLUMN kuneo.curriculum_taxonomy.grade_range IS 
  'Rango de grados: 1-3, 4-5, 6-7, 8-9, 10-11 (bandas curriculares flexibles)';

COMMENT ON COLUMN kuneo.curriculum_taxonomy.discipline IS 
  'Nivel 1 de jerarquía. Ej: aritmetica, geometria, algebra (matemáticas) | listening, reading, speaking (inglés)';

COMMENT ON COLUMN kuneo.curriculum_taxonomy.thematic IS 
  'Nivel 2 de jerarquía. Ej: numeros_fraccionarios, ecuaciones_lineales';

COMMENT ON COLUMN kuneo.curriculum_taxonomy.subthematic IS 
  'Nivel 3 de jerarquía. Ej: fraccion_parte_todo, resolucion_de_ecuaciones';

COMMENT ON COLUMN kuneo.curriculum_taxonomy.microtopics IS 
  'Nivel 4 de jerarquía (array). Ej: [representacion_visual_fracciones, particion_de_unidades]';

COMMENT ON COLUMN kuneo.curriculum_taxonomy.mcer_level IS 
  'Solo para inglés. Marco Común Europeo de Referencia: A1, A2.1, A2.2, B1.1, B1.2';

COMMENT ON COLUMN kuneo.curriculum_taxonomy.core_model IS 
  'Solo para inglés. Modelo pedagógico central del nivel';

COMMENT ON COLUMN kuneo.curriculum_taxonomy.cognitive_layer IS 
  'Solo para inglés. Capa cognitiva del modelo de aprendizaje';

-- ============================================
-- Consultas de ejemplo
-- ============================================

-- Ver todas las disciplinas de matemáticas para grados 4-5
-- SELECT discipline, COUNT(*) as num_thematics 
-- FROM kuneo.curriculum_taxonomy 
-- WHERE subject = 'matematicas' AND grade_range = '4-5' 
-- GROUP BY discipline;

-- Buscar todas las subtemáticas de fracciones
-- SELECT * FROM kuneo.curriculum_taxonomy 
-- WHERE subject = 'matematicas' AND thematic LIKE '%fraccion%';

-- Ver estructura completa de una disciplina
-- SELECT discipline, thematic, subthematic, microtopics 
-- FROM kuneo.curriculum_taxonomy 
-- WHERE subject = 'matematicas' AND discipline = 'aritmetica' 
-- ORDER BY thematic, subthematic;

-- Buscar por microtopic específico
-- SELECT * FROM kuneo.curriculum_taxonomy 
-- WHERE 'fracciones_equivalentes_visuales' = ANY(microtopics);

-- ============================================
-- Permisos para roles de Supabase
-- ============================================

-- Permitir acceso completo al role service_role (usado por backend)
GRANT ALL ON kuneo.curriculum_taxonomy TO service_role;
GRANT ALL ON kuneo.curriculum_taxonomy TO postgres;

-- Permitir lectura al role anon y authenticated (usado por frontend)
GRANT SELECT ON kuneo.curriculum_taxonomy TO anon;
GRANT SELECT ON kuneo.curriculum_taxonomy TO authenticated;

-- Permitir uso de secuencias (si las hay)
GRANT USAGE ON SCHEMA kuneo TO service_role;
GRANT USAGE ON SCHEMA kuneo TO anon;
GRANT USAGE ON SCHEMA kuneo TO authenticated;
