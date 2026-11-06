-- =============================================================================
-- VISUAL TEMPLATES ENRICHMENT INFRASTRUCTURE
-- =============================================================================
-- Purpose: Add enrichment tracking and storage to visual_templates table
-- Created: 2026-05-15
--
-- PREREQUISITES: 
-- - Execute scripts/database/update_visual_templates_table.sql first
--   (adds renderer, default_props, interaction_level columns)
--
-- This migration adds columns to store OpenAI-enriched visual pedagogy:
-- - enriched_config: JSONB with pedagogical visual enhancements
-- - enrichment_status: tracking enrichment state
-- - enriched_at: timestamp of enrichment
-- - enrichment_version: version of enrichment pipeline
--
-- IMPORTANT: This does NOT change template_key, renderer, visual_type, or base config
-- =============================================================================

-- =============================================================================
-- PRE-VALIDATION: Check that required columns exist
-- =============================================================================

DO $$ 
DECLARE 
  missing_cols text[];
BEGIN
  SELECT array_agg(col) INTO missing_cols
  FROM unnest(ARRAY['renderer']) AS col
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'kuneo' 
      AND table_name = 'visual_templates' 
      AND column_name = col
  );
  
  IF array_length(missing_cols, 1) > 0 THEN
    RAISE EXCEPTION '❌ Missing required columns in visual_templates: %. Please execute scripts/database/update_visual_templates_table.sql first.', 
      array_to_string(missing_cols, ', ');
  END IF;
  
  RAISE NOTICE '✅ Prerequisites verified: all required columns exist';
END $$;

-- =============================================================================
-- ADD ENRICHMENT COLUMNS
-- =============================================================================

-- Add enrichment columns to visual_templates
ALTER TABLE kuneo.visual_templates
ADD COLUMN IF NOT EXISTS enriched_config jsonb,
ADD COLUMN IF NOT EXISTS enrichment_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS enriched_at timestamptz,
ADD COLUMN IF NOT EXISTS enrichment_version text DEFAULT '0.1';

-- Add constraint to enrichment_status
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'visual_templates_enrichment_status_check'
  ) THEN
    ALTER TABLE kuneo.visual_templates
    ADD CONSTRAINT visual_templates_enrichment_status_check
    CHECK (enrichment_status IN ('pending', 'in_progress', 'completed', 'failed', 'skipped'));
  END IF;
END $$;

-- Create indexes for enrichment queries
CREATE INDEX IF NOT EXISTS idx_visual_templates_enrichment_status 
ON kuneo.visual_templates(enrichment_status);

CREATE INDEX IF NOT EXISTS idx_visual_templates_visual_type_enrichment 
ON kuneo.visual_templates(visual_type, enrichment_status);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function: get_pending_visual_enrichments
-- Purpose: Fetch visual templates ready for enrichment
CREATE OR REPLACE FUNCTION kuneo.get_pending_visual_enrichments(
  p_limit int DEFAULT 10,
  p_visual_type text DEFAULT NULL,
  p_renderer text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  template_key text,
  visual_type text,
  renderer text,
  subject kuneo.subject_enum,
  config jsonb,
  enrichment_status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vt.id,
    vt.template_key,
    vt.visual_type,
    vt.renderer,
    vt.subject,
    vt.config,
    COALESCE(vt.enrichment_status, 'pending') as enrichment_status
  FROM kuneo.visual_templates vt
  WHERE (vt.enrichment_status IS NULL 
         OR vt.enrichment_status = 'pending' 
         OR vt.enrichment_status = 'failed')
    AND (p_visual_type IS NULL OR vt.visual_type = p_visual_type)
    AND (p_renderer IS NULL OR vt.renderer = p_renderer)
  ORDER BY vt.id
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: get_visual_enrichment_stats
-- Purpose: Get enrichment statistics
CREATE OR REPLACE FUNCTION kuneo.get_visual_enrichment_stats()
RETURNS TABLE (
  enrichment_status text,
  count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(vt.enrichment_status, 'pending') as enrichment_status,
    COUNT(*) as count
  FROM kuneo.visual_templates vt
  GROUP BY COALESCE(vt.enrichment_status, 'pending')
  ORDER BY enrichment_status;
END;
$$ LANGUAGE plpgsql;

-- Function: reset_failed_visual_enrichments
-- Purpose: Reset failed enrichments to pending for retry
CREATE OR REPLACE FUNCTION kuneo.reset_failed_visual_enrichments()
RETURNS SETOF kuneo.visual_templates AS $$
BEGIN
  RETURN QUERY
  UPDATE kuneo.visual_templates
  SET 
    enrichment_status = 'pending',
    enriched_config = NULL,
    enriched_at = NULL
  WHERE enrichment_status = 'failed'
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- DASHBOARD VIEW
-- =============================================================================

CREATE OR REPLACE VIEW kuneo.visual_enrichment_dashboard AS
SELECT 
  vt.template_key,
  vt.visual_type,
  vt.renderer,
  vt.subject,
  COALESCE(vt.enrichment_status, 'pending') as enrichment_status,
  vt.enriched_at,
  vt.enrichment_version,
  CASE 
    WHEN vt.enriched_config IS NOT NULL THEN 
      jsonb_array_length(COALESCE(vt.enriched_config->'overlays'->'misconception', '[]'::jsonb))
    ELSE 0
  END as misconception_overlays_count,
  CASE 
    WHEN vt.enriched_config IS NOT NULL THEN 
      jsonb_array_length(COALESCE(vt.enriched_config->'animation_steps', '[]'::jsonb))
    ELSE 0
  END as animation_steps_count
FROM kuneo.visual_templates vt
ORDER BY vt.enrichment_status, vt.template_key;

-- =============================================================================
-- VALIDATION
-- =============================================================================

-- Verify columns were added
DO $$ 
DECLARE 
  missing_cols text[];
BEGIN
  SELECT array_agg(col) INTO missing_cols
  FROM unnest(ARRAY['enriched_config', 'enrichment_status', 'enriched_at', 'enrichment_version']) AS col
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'kuneo' 
      AND table_name = 'visual_templates' 
      AND column_name = col
  );
  
  IF array_length(missing_cols, 1) > 0 THEN
    RAISE EXCEPTION 'Missing columns: %', array_to_string(missing_cols, ', ');
  END IF;
  
  RAISE NOTICE '✅ All enrichment columns added successfully';
END $$;

-- =============================================================================
-- USAGE EXAMPLES
-- =============================================================================

-- Example 1: Get enrichment statistics
-- SELECT * FROM kuneo.get_visual_enrichment_stats();

-- Example 2: Fetch pending templates for enrichment
-- SELECT * FROM kuneo.get_pending_visual_enrichments(5);

-- Example 3: View enrichment dashboard
-- SELECT * FROM kuneo.visual_enrichment_dashboard;

-- Example 4: Reset failed enrichments
-- SELECT * FROM kuneo.reset_failed_visual_enrichments();

-- Example 5: Inspect enriched config for a specific template
-- SELECT 
--   template_key,
--   enriched_config->'pedagogical_visual'->>'caption' as caption,
--   jsonb_array_length(enriched_config->'animation_steps') as animation_count
-- FROM kuneo.visual_templates 
-- WHERE template_key = 'fraction_part_whole';
