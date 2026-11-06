-- =====================================================
-- UPDATE MODULE_STEPS TABLE
-- Expandir para soportar 8 dimensiones cognitivas
-- =====================================================

-- 1. Agregar columnas nuevas
ALTER TABLE kuneo.module_steps 
ADD COLUMN IF NOT EXISTS cognitive_type TEXT CHECK (cognitive_type IN (
    'exploracion',
    'representacion',
    'razonamiento',
    'clasificacion',
    'aplicacion_guiada',
    'transferencia',
    'analisis_de_error',
    'metacognicion'
)),
ADD COLUMN IF NOT EXISTS session_type TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS instruction TEXT,
ADD COLUMN IF NOT EXISTS expected_response_type TEXT CHECK (expected_response_type IN (
    'multiple_choice',
    'open_text',
    'numeric',
    'drag_drop',
    'drawing',
    'selection',
    'voice',
    'none'
)),
ADD COLUMN IF NOT EXISTS success_criteria JSONB,
ADD COLUMN IF NOT EXISTS concept_card_id UUID REFERENCES kuneo.concept_cards(id),
ADD COLUMN IF NOT EXISTS visual_template_key TEXT,
ADD COLUMN IF NOT EXISTS hint_policy JSONB,
ADD COLUMN IF NOT EXISTS feedback_policy JSONB,
ADD COLUMN IF NOT EXISTS next_step_logic JSONB,
ADD COLUMN IF NOT EXISTS estimated_time_seconds INTEGER DEFAULT 120,
ADD COLUMN IF NOT EXISTS difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5);

-- 2. Actualizar constraint de step_type para incluir más tipos
ALTER TABLE kuneo.module_steps DROP CONSTRAINT IF EXISTS module_steps_step_type_check;
ALTER TABLE kuneo.module_steps ADD CONSTRAINT module_steps_step_type_check 
CHECK (step_type IN (
    'question',
    'explanation',
    'guided_exercise',
    'visual_exploration',
    'reflection',
    'mini_assessment',
    'classification_task',
    'error_analysis',
    'transfer_task'
));

-- 3. Actualizar constraint de phase para incluir exploration
ALTER TABLE kuneo.module_steps DROP CONSTRAINT IF EXISTS module_steps_phase_check;
ALTER TABLE kuneo.module_steps ADD CONSTRAINT module_steps_phase_check 
CHECK (phase IN (
    'exploration',
    'representation',
    'concept_formation',
    'classification',
    'guided_application',
    'transfer',
    'error_analysis',
    'metacognition'
));

-- 4. Crear índices adicionales
CREATE INDEX IF NOT EXISTS idx_module_steps_cognitive_type 
    ON kuneo.module_steps(cognitive_type);

CREATE INDEX IF NOT EXISTS idx_module_steps_concept_card 
    ON kuneo.module_steps(concept_card_id);

CREATE INDEX IF NOT EXISTS idx_module_steps_visual_template 
    ON kuneo.module_steps(visual_template_key);

CREATE INDEX IF NOT EXISTS idx_module_steps_difficulty 
    ON kuneo.module_steps(difficulty);

-- 5. Crear función auxiliar: obtener steps por tipo cognitivo
CREATE OR REPLACE FUNCTION kuneo.get_steps_by_cognitive_type(
    p_module_id UUID,
    p_cognitive_type TEXT
)
RETURNS TABLE (
    id UUID,
    step_number INTEGER,
    title TEXT,
    instruction TEXT,
    content JSONB,
    concept_card_id UUID,
    visual_template_key TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ms.id,
        ms.step_order,
        ms.title,
        ms.instruction,
        ms.content,
        ms.concept_card_id,
        ms.visual_template_key
    FROM kuneo.module_steps ms
    WHERE ms.module_id = p_module_id
      AND ms.cognitive_type = p_cognitive_type
    ORDER BY ms.step_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Crear función auxiliar: validar vinculación concept_cards
CREATE OR REPLACE FUNCTION kuneo.validate_module_steps_cards()
RETURNS TABLE (
    module_id UUID,
    module_title TEXT,
    steps_count INTEGER,
    steps_with_card INTEGER,
    steps_with_visual INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        COUNT(ms.id)::INTEGER AS steps_count,
        COUNT(ms.concept_card_id)::INTEGER AS steps_with_card,
        COUNT(ms.visual_template_key)::INTEGER AS steps_with_visual
    FROM kuneo.modules m
    LEFT JOIN kuneo.module_steps ms ON m.id = ms.module_id
    GROUP BY m.id, m.title
    ORDER BY m.title;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Crear vista: module_steps con información enriquecida
CREATE OR REPLACE VIEW kuneo.module_steps_with_context AS
SELECT 
    ms.id,
    ms.module_id,
    m.title AS module_title,
    m.subject,
    ms.step_order,
    ms.cognitive_type,
    ms.phase,
    ms.step_type,
    ms.title AS step_title,
    ms.instruction,
    ms.expected_response_type,
    ms.difficulty,
    ms.estimated_time_seconds,
    cc.concept_name AS concept_name,
    cc.concept_key AS concept_key,
    vt.template_name AS visual_template_name,
    vt.visual_type AS visual_type,
    ms.content,
    ms.success_criteria,
    ms.hint_policy,
    ms.feedback_policy,
    ms.next_step_logic,
    ms.created_at,
    ms.updated_at
FROM kuneo.module_steps ms
JOIN kuneo.modules m ON ms.module_id = m.id
LEFT JOIN kuneo.concept_cards cc ON ms.concept_card_id = cc.id
LEFT JOIN kuneo.visual_templates vt ON ms.visual_template_key = vt.template_key
ORDER BY m.title, ms.step_order;

COMMENT ON VIEW kuneo.module_steps_with_context IS 
    'Vista enriquecida de module_steps con información de módulo, concept_card y visual_template';

-- 8. Crear función: obtener secuencia completa de un módulo
CREATE OR REPLACE FUNCTION kuneo.get_module_sequence(p_module_id UUID)
RETURNS TABLE (
    step_number INTEGER,
    cognitive_type TEXT,
    phase TEXT,
    step_type TEXT,
    title TEXT,
    has_card BOOLEAN,
    has_visual BOOLEAN,
    estimated_time INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ms.step_order,
        ms.cognitive_type,
        ms.phase,
        ms.step_type,
        ms.title,
        (ms.concept_card_id IS NOT NULL) AS has_card,
        (ms.visual_template_key IS NOT NULL) AS has_visual,
        ms.estimated_time_seconds
    FROM kuneo.module_steps ms
    WHERE ms.module_id = p_module_id
    ORDER BY ms.step_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Crear función: estadísticas por tipo cognitivo
CREATE OR REPLACE FUNCTION kuneo.get_cognitive_type_stats()
RETURNS TABLE (
    cognitive_type TEXT,
    total_steps BIGINT,
    avg_difficulty NUMERIC,
    avg_time_seconds NUMERIC,
    with_card_pct NUMERIC,
    with_visual_pct NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ms.cognitive_type,
        COUNT(*) AS total_steps,
        ROUND(AVG(ms.difficulty), 2) AS avg_difficulty,
        ROUND(AVG(ms.estimated_time_seconds), 0) AS avg_time_seconds,
        ROUND(100.0 * COUNT(ms.concept_card_id) / COUNT(*), 1) AS with_card_pct,
        ROUND(100.0 * COUNT(ms.visual_template_key) / COUNT(*), 1) AS with_visual_pct
    FROM kuneo.module_steps ms
    WHERE ms.cognitive_type IS NOT NULL
    GROUP BY ms.cognitive_type
    ORDER BY total_steps DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Comentarios actualizados
COMMENT ON TABLE kuneo.module_steps IS 
    'Pasos ejecutables dentro de cada módulo. Secuencia de 8 dimensiones cognitivas: exploración, representación, razonamiento, clasificación, aplicación guiada, transferencia, análisis de error, metacognición.';

COMMENT ON COLUMN kuneo.module_steps.cognitive_type IS 
    'Dimensión cognitiva del paso: exploracion | representacion | razonamiento | clasificacion | aplicacion_guiada | transferencia | analisis_de_error | metacognicion';

COMMENT ON COLUMN kuneo.module_steps.success_criteria IS 
    'JSONB: {correct_required, max_attempts_before_hint, min_confidence, requires_explanation}';

COMMENT ON COLUMN kuneo.module_steps.hint_policy IS 
    'JSONB: {allow_hint, hint_level_sequence, show_card_after_attempts, show_card_if_time_seconds}';

COMMENT ON COLUMN kuneo.module_steps.feedback_policy IS 
    'JSONB: {immediate, delayed, adaptive, show_explanation, show_visual}';

COMMENT ON COLUMN kuneo.module_steps.next_step_logic IS 
    'JSONB: {if_correct, if_incorrect_once, if_incorrect_twice, if_mastered, if_struggling}';

-- Finalizado
SELECT 'module_steps table updated successfully' AS status;
