-- =====================================================
-- UPDATE MODULE_STEPS TABLE FOR OPENAI ENRICHMENT
-- =====================================================
-- Purpose: Add fields to store enriched content separate from original content
-- This allows A/B testing and rollback without losing original structure

-- Add enrichment tracking columns
ALTER TABLE kuneo.module_steps
ADD COLUMN IF NOT EXISTS enriched_content jsonb,
ADD COLUMN IF NOT EXISTS enrichment_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS enriched_at timestamptz,
ADD COLUMN IF NOT EXISTS enrichment_version text DEFAULT '0.1';

-- Add index for filtering pending enrichments
CREATE INDEX IF NOT EXISTS idx_module_steps_enrichment_status 
ON kuneo.module_steps(enrichment_status);

-- Add check constraint for enrichment_status
ALTER TABLE kuneo.module_steps 
DROP CONSTRAINT IF EXISTS check_enrichment_status;

ALTER TABLE kuneo.module_steps
ADD CONSTRAINT check_enrichment_status 
CHECK (enrichment_status IN ('pending', 'in_progress', 'completed', 'failed', 'skipped'));

-- Add comment
COMMENT ON COLUMN kuneo.module_steps.enriched_content IS 
'OpenAI-enriched content: exercise, hints, feedback, card_variants, visual_enrichment, metacognition';

COMMENT ON COLUMN kuneo.module_steps.enrichment_status IS 
'Status: pending (not yet enriched), in_progress (currently processing), completed (successfully enriched), failed (error during enrichment), skipped (intentionally not enriched)';

COMMENT ON COLUMN kuneo.module_steps.enriched_at IS 
'Timestamp when enrichment was completed';

COMMENT ON COLUMN kuneo.module_steps.enrichment_version IS 
'Version of pedagogical_foundations used for enrichment (e.g., 0.1)';

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get pending enrichments
CREATE OR REPLACE FUNCTION kuneo.get_pending_enrichments(
    p_limit INTEGER DEFAULT 10,
    p_subject TEXT DEFAULT NULL,
    p_grade_range TEXT DEFAULT NULL
)
RETURNS TABLE (
    step_id UUID,
    module_id UUID,
    step_number INTEGER,
    cognitive_type TEXT,
    subject TEXT,
    grade_range TEXT,
    core_concept TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ms.id AS step_id,
        ms.module_id,
        ms.step_number,
        ms.cognitive_type,
        m.subject,
        m.grade_range,
        m.core_concept
    FROM kuneo.module_steps ms
    JOIN kuneo.modules m ON ms.module_id = m.id
    WHERE ms.enrichment_status = 'pending'
        AND (p_subject IS NULL OR m.subject = p_subject)
        AND (p_grade_range IS NULL OR m.grade_range = p_grade_range)
    ORDER BY m.subject, m.grade_range, ms.module_id, ms.step_number
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get enrichment statistics
CREATE OR REPLACE FUNCTION kuneo.get_enrichment_stats()
RETURNS TABLE (
    enrichment_status TEXT,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ms.enrichment_status,
        COUNT(*) AS count
    FROM kuneo.module_steps ms
    GROUP BY ms.enrichment_status
    ORDER BY ms.enrichment_status;
END;
$$ LANGUAGE plpgsql;

-- Function to reset failed enrichments
CREATE OR REPLACE FUNCTION kuneo.reset_failed_enrichments()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE kuneo.module_steps
    SET 
        enrichment_status = 'pending',
        enriched_content = NULL,
        enriched_at = NULL
    WHERE enrichment_status = 'failed';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEW FOR ENRICHMENT MONITORING
-- =====================================================

CREATE OR REPLACE VIEW kuneo.enrichment_dashboard AS
SELECT 
    m.subject,
    m.grade_range,
    ms.cognitive_type,
    ms.enrichment_status,
    COUNT(*) AS step_count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY m.subject, m.grade_range, ms.cognitive_type), 2) AS percentage
FROM kuneo.module_steps ms
JOIN kuneo.modules m ON ms.module_id = m.id
GROUP BY m.subject, m.grade_range, ms.cognitive_type, ms.enrichment_status
ORDER BY m.subject, m.grade_range, ms.cognitive_type, ms.enrichment_status;

COMMENT ON VIEW kuneo.enrichment_dashboard IS 
'Dashboard view showing enrichment progress by subject, grade, cognitive type, and status';

-- =====================================================
-- VALIDATION
-- =====================================================

-- Check that columns were added
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kuneo' 
        AND table_name = 'module_steps' 
        AND column_name = 'enriched_content'
    ) THEN
        RAISE EXCEPTION 'enriched_content column was not created';
    END IF;
    
    RAISE NOTICE '✅ Enrichment columns added successfully';
END $$;

-- Display initial statistics
SELECT * FROM kuneo.get_enrichment_stats();
