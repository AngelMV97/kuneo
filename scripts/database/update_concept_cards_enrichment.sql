-- =============================================================================
-- Script: update_concept_cards_enrichment.sql
-- Purpose: Add enrichment tracking fields to concept_cards table
-- Created: 2026-05-15
-- =============================================================================

-- Add enrichment tracking columns to concept_cards
ALTER TABLE kuneo.concept_cards
ADD COLUMN IF NOT EXISTS enriched_content jsonb,
ADD COLUMN IF NOT EXISTS enrichment_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS enriched_at timestamptz,
ADD COLUMN IF NOT EXISTS enrichment_version text DEFAULT '0.1';

-- Add constraint for enrichment_status
ALTER TABLE kuneo.concept_cards
DROP CONSTRAINT IF EXISTS concept_cards_enrichment_status_check;

ALTER TABLE kuneo.concept_cards
ADD CONSTRAINT concept_cards_enrichment_status_check
CHECK (enrichment_status IN ('pending', 'in_progress', 'completed', 'failed', 'skipped'));

-- Add index for faster filtering by enrichment status
CREATE INDEX IF NOT EXISTS idx_concept_cards_enrichment_status
ON kuneo.concept_cards(enrichment_status);

-- Add index for faster filtering by subject + enrichment_status
CREATE INDEX IF NOT EXISTS idx_concept_cards_subject_enrichment
ON kuneo.concept_cards(subject, enrichment_status);

COMMENT ON COLUMN kuneo.concept_cards.enriched_content IS 'JSON containing refined content, variants, error patterns, and adaptive usage rules';
COMMENT ON COLUMN kuneo.concept_cards.enrichment_status IS 'Status of enrichment: pending, in_progress, completed, failed, skipped';
COMMENT ON COLUMN kuneo.concept_cards.enriched_at IS 'Timestamp when enrichment was completed';
COMMENT ON COLUMN kuneo.concept_cards.enrichment_version IS 'Version of pedagogical foundations used for enrichment';

-- =============================================================================
-- Helper Functions
-- =============================================================================

-- Function to get pending concept cards for enrichment
CREATE OR REPLACE FUNCTION kuneo.get_pending_card_enrichments(
    p_limit integer DEFAULT 10,
    p_subject text DEFAULT NULL,
    p_grade_range text DEFAULT NULL
)
RETURNS TABLE (
    id bigint,
    concept_key text,
    subject text,
    grade_range text,
    difficulty text,
    definition text,
    visual_template_key text,
    taxonomy_ids bigint[],
    source_module_ids bigint[]
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.concept_key,
        c.subject,
        c.grade_range,
        c.difficulty,
        c.definition,
        c.visual_template_key,
        c.taxonomy_ids,
        c.source_module_ids
    FROM kuneo.concept_cards c
    WHERE 
        (c.enrichment_status = 'pending' OR c.enrichment_status = 'failed' OR c.enrichment_status IS NULL)
        AND (p_subject IS NULL OR c.subject = p_subject)
        AND (p_grade_range IS NULL OR c.grade_range = p_grade_range)
    ORDER BY c.id
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION kuneo.get_pending_card_enrichments IS 'Fetch concept cards pending enrichment with optional subject and grade_range filters';

-- Function to get enrichment statistics for concept cards
CREATE OR REPLACE FUNCTION kuneo.get_card_enrichment_stats()
RETURNS TABLE (
    enrichment_status text,
    count bigint
)
LANGUAGE sql
AS $$
    SELECT 
        COALESCE(enrichment_status, 'pending') as enrichment_status,
        COUNT(*) as count
    FROM kuneo.concept_cards
    GROUP BY enrichment_status
    ORDER BY enrichment_status;
$$;

COMMENT ON FUNCTION kuneo.get_card_enrichment_stats IS 'Get count of concept cards by enrichment status';

-- Function to reset failed card enrichments
CREATE OR REPLACE FUNCTION kuneo.reset_failed_card_enrichments()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    reset_count integer;
BEGIN
    UPDATE kuneo.concept_cards
    SET 
        enrichment_status = 'pending',
        enriched_content = NULL,
        enriched_at = NULL
    WHERE enrichment_status = 'failed';
    
    GET DIAGNOSTICS reset_count = ROW_COUNT;
    RETURN reset_count;
END;
$$;

COMMENT ON FUNCTION kuneo.reset_failed_card_enrichments IS 'Reset all failed concept card enrichments back to pending status';

-- =============================================================================
-- Enrichment Dashboard View
-- =============================================================================

CREATE OR REPLACE VIEW kuneo.card_enrichment_dashboard AS
SELECT 
    c.subject,
    c.grade_range,
    c.difficulty,
    c.enrichment_status,
    COUNT(*) as card_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY c.subject), 2) as percentage_of_subject
FROM kuneo.concept_cards c
GROUP BY c.subject, c.grade_range, c.difficulty, c.enrichment_status
ORDER BY c.subject, c.grade_range, c.enrichment_status;

COMMENT ON VIEW kuneo.card_enrichment_dashboard IS 'Dashboard view showing enrichment progress by subject, grade_range, and difficulty';

-- =============================================================================
-- Usage Examples
-- =============================================================================

-- Example 1: Get all pending concept cards (limit 10)
-- SELECT * FROM kuneo.get_pending_card_enrichments(10);

-- Example 2: Get pending mathematics cards
-- SELECT * FROM kuneo.get_pending_card_enrichments(10, 'mathematics');

-- Example 3: Get pending cards for specific grade range
-- SELECT * FROM kuneo.get_pending_card_enrichments(10, NULL, '4-5');

-- Example 4: Get enrichment statistics
-- SELECT * FROM kuneo.get_card_enrichment_stats();

-- Example 5: Reset failed enrichments
-- SELECT kuneo.reset_failed_card_enrichments();

-- Example 6: View enrichment dashboard
-- SELECT * FROM kuneo.card_enrichment_dashboard;

-- Example 7: Count cards by subject and status
-- SELECT subject, enrichment_status, COUNT(*) 
-- FROM kuneo.concept_cards 
-- GROUP BY subject, enrichment_status 
-- ORDER BY subject, enrichment_status;
