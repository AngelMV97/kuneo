-- =====================================================
-- UPDATE VISUAL_TEMPLATES TABLE
-- Agregar campos para sistema completo de plantillas renderizables
-- =====================================================
--
-- IMPORTANT: Este script es IDEMPOTENTE - puede ejecutarse múltiples veces sin error
-- - Usa ADD COLUMN IF NOT EXISTS
-- - Usa DROP CONSTRAINT IF EXISTS
-- - Verifica existencia de constraints antes de agregarlos
--
-- =====================================================

-- 1. Expandir visual_type para incluir todos los tipos necesarios
ALTER TABLE kuneo.visual_templates 
DROP CONSTRAINT IF EXISTS visual_templates_visual_type_check;

ALTER TABLE kuneo.visual_templates 
ADD CONSTRAINT visual_templates_visual_type_check 
CHECK (visual_type IN (
    'static_svg',
    'graph',
    'concept_map',
    'process_diagram',
    'timeline',
    'comparison_table',
    'math_visual',
    'grammar_visual',
    'map_visual',
    'static_image',
    'interactive_diagram',
    'animation',
    'table'
));

-- 2. Agregar campos nuevos (sin constraints inline)
ALTER TABLE kuneo.visual_templates
  ADD COLUMN IF NOT EXISTS renderer TEXT,
  ADD COLUMN IF NOT EXISTS default_props JSONB,
  ADD COLUMN IF NOT EXISTS interaction_level TEXT DEFAULT 'static',
  ADD COLUMN IF NOT EXISTS supported_card_types TEXT[] DEFAULT ARRAY['basic'];

-- 3. Agregar constraints con nombres explícitos (solo si no existen)
DO $$ BEGIN
  -- Constraint para renderer
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'visual_templates_renderer_check'
  ) THEN
    ALTER TABLE kuneo.visual_templates
    ADD CONSTRAINT visual_templates_renderer_check
    CHECK (renderer IN (
      'svg_custom',
      'recharts',
      'katex',
      'react_flow',
      'mermaid',
      'timeline',
      'grammar_table',
      'concept_map',
      'map_visual',
      'static_image'
    ));
  END IF;

  -- Constraint para interaction_level
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'visual_templates_interaction_level_check'
  ) THEN
    ALTER TABLE kuneo.visual_templates
    ADD CONSTRAINT visual_templates_interaction_level_check
    CHECK (interaction_level IN (
      'static',
      'hoverable',
      'interactive',
      'animated'
    ));
  END IF;
END $$;

-- 4. Hacer renderer obligatorio para nuevas inserciones
-- (no agregamos NOT NULL para evitar problemas con registros existentes)

-- 5. Crear índices para queries comunes
CREATE INDEX IF NOT EXISTS idx_visual_templates_renderer ON kuneo.visual_templates(renderer);
CREATE INDEX IF NOT EXISTS idx_visual_templates_interaction ON kuneo.visual_templates(interaction_level);

-- 6. Comentarios para documentación
COMMENT ON COLUMN kuneo.visual_templates.renderer IS 
  'Componente o librería que renderiza el visual en frontend: svg_custom, recharts, katex, react_flow, mermaid, etc.';

COMMENT ON COLUMN kuneo.visual_templates.default_props IS 
  'Props por defecto para el renderer. Ejemplo: {width: 400, height: 300, theme: "light"}';

COMMENT ON COLUMN kuneo.visual_templates.interaction_level IS 
  'Nivel de interactividad: static (solo ver), hoverable (tooltips), interactive (clicks/drag), animated (animaciones)';

COMMENT ON COLUMN kuneo.visual_templates.supported_card_types IS 
  'Array de tipos de tarjetas que pueden usar esta plantilla: basic, corrective, hint, reflective';

COMMENT ON COLUMN kuneo.visual_templates.config IS 
  'Configuración específica del visual. Estructura depende del visual_type y renderer. Ejemplo para fraction_part_whole: {shape: "circle", parts: 4, highlighted: 1, labels: true}';

-- 6. Función auxiliar: obtener plantillas por renderer
CREATE OR REPLACE FUNCTION kuneo.get_templates_by_renderer(
  p_renderer TEXT
)
RETURNS SETOF kuneo.visual_templates
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM kuneo.visual_templates
  WHERE renderer = p_renderer
  ORDER BY template_name;
$$;

COMMENT ON FUNCTION kuneo.get_templates_by_renderer IS 
  'Obtiene todas las plantillas que usan un renderer específico (útil para frontend)';

-- 7. Función auxiliar: validar vinculación con concept_cards
CREATE OR REPLACE FUNCTION kuneo.validate_card_visual_links()
RETURNS TABLE(
  concept_key TEXT,
  visual_template_key TEXT,
  has_template BOOLEAN
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    cc.concept_key,
    cc.visual_template_key,
    EXISTS(
      SELECT 1 
      FROM kuneo.visual_templates vt 
      WHERE vt.template_key = cc.visual_template_key
    ) AS has_template
  FROM kuneo.concept_cards cc
  WHERE cc.visual_template_key IS NOT NULL
  ORDER BY has_template ASC, cc.concept_key;
$$;

COMMENT ON FUNCTION kuneo.validate_card_visual_links IS 
  'Valida que todas las concept_cards tengan visual_templates válidos. Retorna tarjetas sin template primero.';

-- 8. View: Plantillas con conteo de uso
CREATE OR REPLACE VIEW kuneo.visual_templates_with_usage AS
SELECT 
  vt.*,
  (
    SELECT COUNT(*)
    FROM kuneo.concept_cards cc
    WHERE cc.visual_template_key = vt.template_key
  ) AS usage_count
FROM kuneo.visual_templates vt
ORDER BY usage_count DESC, vt.template_name;

COMMENT ON VIEW kuneo.visual_templates_with_usage IS 
  'Vista de plantillas visuales con conteo de cuántas concept_cards las usan';

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Estructura final de visual_templates:
-- 
-- CAMPOS ORIGINALES:
-- - id, template_key, template_name
-- - description
-- - visual_type (expandido a 13 tipos)
-- - config (JSONB)
-- - asset_url (opcional, solo para ilustrativos)
-- - subject, use_cases
-- - created_at, updated_at
--
-- CAMPOS NUEVOS:
-- - renderer (svg_custom | recharts | katex | react_flow | mermaid | timeline | grammar_table | concept_map | map_visual | static_image)
-- - default_props (JSONB con props del renderer)
-- - interaction_level (static | hoverable | interactive | animated)
-- - supported_card_types (array de tipos de tarjeta)
-- =====================================================

SELECT 'visual_templates table updated successfully' AS status;
