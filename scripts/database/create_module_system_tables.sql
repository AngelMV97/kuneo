-- ============================================
-- TABLAS ADICIONALES PARA MODULE SYSTEM
-- ============================================

-- =====================================================
-- 1. MODULE_STEPS TABLE
-- Pasos específicos dentro de cada módulo
-- =====================================================
CREATE TABLE IF NOT EXISTS kuneo.module_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES kuneo.modules(id) ON DELETE CASCADE NOT NULL,
    
    -- Identificación del paso
    step_order INTEGER NOT NULL,
    step_type TEXT NOT NULL CHECK (step_type IN (
        'diagnostic',
        'concept_card',
        'guided_exercise',
        'visual',
        'reflection',
        'evaluation'
    )),
    
    -- Contenido del paso
    content JSONB NOT NULL, -- Estructura varía según step_type
    
    -- Metadata
    phase TEXT CHECK (phase IN (
        'exploration',
        'concept_formation',
        'guided_application',
        'transfer',
        'metacognition'
    )),
    
    -- Índices
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint
    UNIQUE(module_id, step_order)
);

-- RLS Policies
ALTER TABLE kuneo.module_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view module steps"
    ON kuneo.module_steps FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Índices
CREATE INDEX idx_module_steps_module_id ON kuneo.module_steps(module_id);
CREATE INDEX idx_module_steps_phase ON kuneo.module_steps(phase);
CREATE INDEX idx_module_steps_type ON kuneo.module_steps(step_type);

COMMENT ON TABLE kuneo.module_steps IS 
    'Pasos específicos dentro de cada módulo. Cada paso puede ser un diagnóstico, tarjeta conceptual, ejercicio, etc.';

-- =====================================================
-- 2. CONCEPT_CARDS TABLE
-- Tarjetas conceptuales reutilizables
-- =====================================================
CREATE TABLE IF NOT EXISTS kuneo.concept_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Concepto
    concept_key TEXT NOT NULL UNIQUE, -- ej: "fraction_part_whole", "area_perimeter"
    concept_name TEXT NOT NULL, -- ej: "Fracción como parte de un todo"
    
    -- Contenido de la tarjeta
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    explanation TEXT, -- Explicación extendida (opcional)
    
    -- Visual asociado
    visual_template TEXT, -- Referencia a visual_templates
    
    -- Metadata
    subject kuneo.subject_enum NOT NULL,
    grade_range TEXT, -- Ej: "4-5", puede ser NULL si es transversal
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
    
    -- Relaciones
    related_concepts TEXT[], -- Array de concept_keys relacionados
    
    -- Índices
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE kuneo.concept_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view concept cards"
    ON kuneo.concept_cards FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Índices
CREATE INDEX idx_concept_cards_key ON kuneo.concept_cards(concept_key);
CREATE INDEX idx_concept_cards_subject ON kuneo.concept_cards(subject);
CREATE INDEX idx_concept_cards_grade ON kuneo.concept_cards(grade_range);

COMMENT ON TABLE kuneo.concept_cards IS 
    'Tarjetas conceptuales reutilizables que explican conceptos centrales. Pueden ser referenciadas por múltiples módulos.';

-- =====================================================
-- 3. VISUAL_TEMPLATES TABLE
-- Plantillas de visualizaciones reutilizables
-- =====================================================
CREATE TABLE IF NOT EXISTS kuneo.visual_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificación
    template_key TEXT NOT NULL UNIQUE, -- ej: "fraction_part_whole", "circuit_diagram"
    template_name TEXT NOT NULL,
    
    -- Descripción
    description TEXT,
    
    -- Configuración del visual
    visual_type TEXT NOT NULL CHECK (visual_type IN (
        'static_image',
        'interactive_diagram',
        'animation',
        'graph',
        'table',
        'concept_map',
        'comparison'
    )),
    
    -- Datos de configuración
    config JSONB NOT NULL, -- Configuración específica del tipo de visual
    
    -- Assets asociados
    asset_url TEXT, -- URL de imagen base o componente
    
    -- Metadata
    subject kuneo.subject_enum,
    use_cases TEXT[], -- Array de casos de uso: ["misconception", "explanation", "example"]
    
    -- Índices
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE kuneo.visual_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view visual templates"
    ON kuneo.visual_templates FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Índices
CREATE INDEX idx_visual_templates_key ON kuneo.visual_templates(template_key);
CREATE INDEX idx_visual_templates_type ON kuneo.visual_templates(visual_type);
CREATE INDEX idx_visual_templates_subject ON kuneo.visual_templates(subject);

COMMENT ON TABLE kuneo.visual_templates IS 
    'Plantillas de visualizaciones reutilizables. Define cómo se debe renderizar un tipo de visual en el frontend.';

-- =====================================================
-- 4. MODULE_TAXONOMY_LINK TABLE
-- Vincula módulos con entradas de curriculum_taxonomy
-- =====================================================
CREATE TABLE IF NOT EXISTS kuneo.module_taxonomy_link (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    module_id UUID REFERENCES kuneo.modules(id) ON DELETE CASCADE NOT NULL,
    taxonomy_id UUID REFERENCES kuneo.curriculum_taxonomy(id) ON DELETE CASCADE NOT NULL,
    
    -- Tipo de relación
    link_type TEXT DEFAULT 'primary' CHECK (link_type IN ('primary', 'secondary', 'related')),
    
    -- Índices
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint
    UNIQUE(module_id, taxonomy_id)
);

-- RLS Policies
ALTER TABLE kuneo.module_taxonomy_link ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view module taxonomy links"
    ON kuneo.module_taxonomy_link FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Índices
CREATE INDEX idx_module_taxonomy_module ON kuneo.module_taxonomy_link(module_id);
CREATE INDEX idx_module_taxonomy_taxonomy ON kuneo.module_taxonomy_link(taxonomy_id);

COMMENT ON TABLE kuneo.module_taxonomy_link IS 
    'Tabla de relación entre modules y curriculum_taxonomy. Permite vincular múltiples taxonomías a un módulo.';

-- =====================================================
-- 5. TRIGGERS PARA UPDATED_AT
-- =====================================================

-- module_steps
CREATE OR REPLACE FUNCTION kuneo.update_module_steps_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_module_steps_timestamp
  BEFORE UPDATE ON kuneo.module_steps
  FOR EACH ROW
  EXECUTE FUNCTION kuneo.update_module_steps_timestamp();

-- concept_cards
CREATE OR REPLACE FUNCTION kuneo.update_concept_cards_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_concept_cards_timestamp
  BEFORE UPDATE ON kuneo.concept_cards
  FOR EACH ROW
  EXECUTE FUNCTION kuneo.update_concept_cards_timestamp();

-- visual_templates
CREATE OR REPLACE FUNCTION kuneo.update_visual_templates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_visual_templates_timestamp
  BEFORE UPDATE ON kuneo.visual_templates
  FOR EACH ROW
  EXECUTE FUNCTION kuneo.update_visual_templates_timestamp();

-- =====================================================
-- 6. PERMISOS ADICIONALES
-- =====================================================

GRANT ALL ON kuneo.module_steps TO service_role;
GRANT ALL ON kuneo.module_steps TO postgres;
GRANT SELECT ON kuneo.module_steps TO anon;
GRANT SELECT ON kuneo.module_steps TO authenticated;

GRANT ALL ON kuneo.concept_cards TO service_role;
GRANT ALL ON kuneo.concept_cards TO postgres;
GRANT SELECT ON kuneo.concept_cards TO anon;
GRANT SELECT ON kuneo.concept_cards TO authenticated;

GRANT ALL ON kuneo.visual_templates TO service_role;
GRANT ALL ON kuneo.visual_templates TO postgres;
GRANT SELECT ON kuneo.visual_templates TO anon;
GRANT SELECT ON kuneo.visual_templates TO authenticated;

GRANT ALL ON kuneo.module_taxonomy_link TO service_role;
GRANT ALL ON kuneo.module_taxonomy_link TO postgres;
GRANT SELECT ON kuneo.module_taxonomy_link TO anon;
GRANT SELECT ON kuneo.module_taxonomy_link TO authenticated;

-- =====================================================
-- CONSULTAS DE EJEMPLO
-- =====================================================

-- Ver todos los pasos de un módulo
-- SELECT * FROM kuneo.module_steps 
-- WHERE module_id = 'xxx' 
-- ORDER BY step_order;

-- Buscar tarjetas conceptuales por concepto
-- SELECT * FROM kuneo.concept_cards 
-- WHERE concept_key LIKE '%fraction%';

-- Ver qué módulos usan un visual específico
-- SELECT m.title, m.subject, vt.template_name
-- FROM kuneo.modules m
-- JOIN kuneo.module_steps ms ON ms.module_id = m.id
-- JOIN kuneo.visual_templates vt ON vt.template_key = (ms.content->>'visual_template')
-- WHERE vt.template_key = 'fraction_part_whole';

-- Ver taxonomías vinculadas a un módulo
-- SELECT m.title, ct.discipline, ct.thematic, ct.subthematic
-- FROM kuneo.modules m
-- JOIN kuneo.module_taxonomy_link mtl ON mtl.module_id = m.id
-- JOIN kuneo.curriculum_taxonomy ct ON ct.id = mtl.taxonomy_id
-- WHERE m.id = 'xxx';
