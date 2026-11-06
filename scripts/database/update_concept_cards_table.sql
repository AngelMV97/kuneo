-- =====================================================
-- UPDATE CONCEPT_CARDS TABLE
-- Agregar campos para sistema completo de tarjetas conceptuales
-- =====================================================

-- 1. Agregar nuevos campos a la tabla existente
ALTER TABLE kuneo.concept_cards
  -- Tipo de tarjeta (determina cuándo y cómo mostrarla)
  ADD COLUMN IF NOT EXISTS card_type TEXT CHECK (card_type IN ('basic', 'corrective', 'hint', 'reflective')) DEFAULT 'basic',
  
  -- Contenido pedagógico estructurado
  ADD COLUMN IF NOT EXISTS one_line_definition TEXT, -- Definición ultra concisa (1 oración)
  ADD COLUMN IF NOT EXISTS core_insight TEXT, -- La idea clave que debe quedarse
  ADD COLUMN IF NOT EXISTS example JSONB, -- Ejemplo práctico estructurado
  ADD COLUMN IF NOT EXISTS common_misconception TEXT, -- Error conceptual más frecuente
  ADD COLUMN IF NOT EXISTS hint_prompt TEXT, -- Hint progresivo (sin revelar respuesta)
  
  -- Renamed visual field for clarity
  ADD COLUMN IF NOT EXISTS visual_template_key TEXT, -- Clave exacta de visual_templates
  
  -- Relaciones con otras tablas
  ADD COLUMN IF NOT EXISTS source_module_ids UUID[], -- Módulos de donde se extrajo
  ADD COLUMN IF NOT EXISTS taxonomy_ids UUID[]; -- Taxonomías curriculares relacionadas

-- 2. Migrar dato existente si es necesario
UPDATE kuneo.concept_cards 
SET visual_template_key = visual_template 
WHERE visual_template IS NOT NULL AND visual_template_key IS NULL;

-- 3. Crear índices para queries comunes
CREATE INDEX IF NOT EXISTS idx_concept_cards_card_type ON kuneo.concept_cards(card_type);
CREATE INDEX IF NOT EXISTS idx_concept_cards_source_modules ON kuneo.concept_cards USING GIN (source_module_ids);
CREATE INDEX IF NOT EXISTS idx_concept_cards_taxonomies ON kuneo.concept_cards USING GIN (taxonomy_ids);

-- 4. Comentarios para documentación
COMMENT ON COLUMN kuneo.concept_cards.card_type IS 
  'Tipo de tarjeta: basic (rescate/bloqueo), corrective (error conceptual), hint (exploración), reflective (profundización)';

COMMENT ON COLUMN kuneo.concept_cards.one_line_definition IS 
  'Definición ultra concisa del concepto (máx 1 oración). Ejemplo: "Fracción es una parte de un todo dividido en partes iguales"';

COMMENT ON COLUMN kuneo.concept_cards.core_insight IS 
  'La idea clave que debe quedarse en la mente del estudiante. Ejemplo: "La clave de las fracciones es que las partes deben ser iguales"';

COMMENT ON COLUMN kuneo.concept_cards.example IS 
  'Ejemplo práctico estructurado en JSONB. Debe incluir: {context, problem, solution, visual_ref}';

COMMENT ON COLUMN kuneo.concept_cards.common_misconception IS 
  'Error conceptual más frecuente. Ejemplo: "Los estudiantes creen que 1/4 es más grande que 1/2 porque 4 > 2"';

COMMENT ON COLUMN kuneo.concept_cards.hint_prompt IS 
  'Hint progresivo que guía sin revelar la respuesta. Ejemplo: "¿Qué pasa si divides el círculo en más partes iguales?"';

COMMENT ON COLUMN kuneo.concept_cards.visual_template_key IS 
  'Clave que referencia visual_templates.template_key. Ejemplo: "fraction_part_whole", "parabola_interactive"';

COMMENT ON COLUMN kuneo.concept_cards.source_module_ids IS 
  'Array de UUIDs de módulos de donde se extrajo este concepto. Permite rastrear origen y contexto.';

COMMENT ON COLUMN kuneo.concept_cards.taxonomy_ids IS 
  'Array de UUIDs de curriculum_taxonomy relacionadas. Conecta tarjetas con currículo oficial.';

-- 5. Función auxiliar: buscar tarjetas por tipo
CREATE OR REPLACE FUNCTION kuneo.get_cards_by_type_and_concept(
  p_card_type TEXT,
  p_concept_key TEXT
)
RETURNS SETOF kuneo.concept_cards
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM kuneo.concept_cards
  WHERE card_type = p_card_type
    AND concept_key = p_concept_key
  LIMIT 1;
$$;

COMMENT ON FUNCTION kuneo.get_cards_by_type_and_concept IS 
  'Obtiene la tarjeta específica para un concepto y tipo (usado por el motor de decisión de Tuko)';

-- 6. Función auxiliar: buscar tarjetas relacionadas
CREATE OR REPLACE FUNCTION kuneo.get_related_cards(
  p_concept_key TEXT,
  p_limit INTEGER DEFAULT 3
)
RETURNS SETOF kuneo.concept_cards
LANGUAGE sql
STABLE
AS $$
  SELECT c2.*
  FROM kuneo.concept_cards c1
  JOIN kuneo.concept_cards c2 
    ON c2.concept_key = ANY(c1.related_concepts)
  WHERE c1.concept_key = p_concept_key
    AND c2.concept_key != p_concept_key
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION kuneo.get_related_cards IS 
  'Obtiene tarjetas de conceptos relacionados (para sugerir exploración adicional)';

-- 7. View: Tarjetas con conteo de módulos y taxonomías
CREATE OR REPLACE VIEW kuneo.concept_cards_with_stats AS
SELECT 
  cc.*,
  COALESCE(array_length(cc.source_module_ids, 1), 0) AS module_count,
  COALESCE(array_length(cc.taxonomy_ids, 1), 0) AS taxonomy_count
FROM kuneo.concept_cards cc;

COMMENT ON VIEW kuneo.concept_cards_with_stats IS 
  'Vista enriquecida con estadísticas de módulos y taxonomías asociadas a cada tarjeta';

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Estructura final de concept_cards:
-- 
-- CAMPOS ORIGINALES:
-- - id, concept_key, concept_name
-- - title, body, explanation
-- - visual_template (legacy)
-- - subject, grade_range, difficulty
-- - related_concepts
-- - created_at, updated_at
--
-- CAMPOS NUEVOS:
-- - card_type (basic | corrective | hint | reflective)
-- - one_line_definition (definición ultra concisa)
-- - core_insight (idea clave)
-- - example (JSONB con ejemplo estructurado)
-- - common_misconception (error frecuente)
-- - hint_prompt (hint progresivo)
-- - visual_template_key (referencia a visual_templates)
-- - source_module_ids (array de UUIDs)
-- - taxonomy_ids (array de UUIDs)
-- =====================================================

SELECT 'concept_cards table updated successfully' AS status;
