-- =============================================================================
-- PRE-EXECUTION VALIDATION SCRIPT
-- =============================================================================
-- Purpose: Validate visual_templates table before running enrichment migrations
-- Run this BEFORE executing update_visual_templates_table.sql
-- =============================================================================

DO $$ 
DECLARE 
  v_table_exists boolean;
  v_schema_name text := 'kuneo';
  v_table_name text := 'visual_templates';
  v_count bigint;
  rec record;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = v_schema_name 
      AND table_name = v_table_name
  ) INTO v_table_exists;
  
  IF NOT v_table_exists THEN
    RAISE EXCEPTION '❌ Table %.% does not exist. Run create_module_system_tables.sql first.', v_schema_name, v_table_name;
  END IF;
  
  RAISE NOTICE '✅ Table %.% exists', v_schema_name, v_table_name;
  
  -- Check current columns
  RAISE NOTICE '';
  RAISE NOTICE '📋 Current columns in visual_templates:';
  PERFORM column_name 
  FROM information_schema.columns 
  WHERE table_schema = v_schema_name 
    AND table_name = v_table_name
  ORDER BY ordinal_position;
  
  -- List all columns
  FOR rec IN (
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_schema = v_schema_name 
      AND table_name = v_table_name
    ORDER BY ordinal_position
  ) LOOP
    RAISE NOTICE '   - % (%, nullable: %)', rec.column_name, rec.data_type, rec.is_nullable;
  END LOOP;
  
  -- Check for enrichment columns (should NOT exist yet)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = v_schema_name 
      AND table_name = v_table_name 
      AND column_name = 'enriched_config'
  ) THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  WARNING: enriched_config column already exists!';
    RAISE NOTICE '   This means enrichment migration was already executed.';
    RAISE NOTICE '   You can safely re-run the scripts (they are idempotent).';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '✅ Enrichment columns not found (as expected)';
    RAISE NOTICE '   Ready to execute enrichment migrations.';
  END IF;
  
  -- Check for renderer column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = v_schema_name 
      AND table_name = v_table_name 
      AND column_name = 'renderer'
  ) THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  WARNING: renderer column already exists!';
    RAISE NOTICE '   update_visual_templates_table.sql was already executed.';
    RAISE NOTICE '   You can safely re-run it (it is idempotent).';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '✅ renderer column not found';
    RAISE NOTICE '   Execute update_visual_templates_table.sql first.';
  END IF;
  
  -- Count existing records
  EXECUTE format('SELECT COUNT(*) FROM %I.%I', v_schema_name, v_table_name) INTO v_count;
  RAISE NOTICE '';
  RAISE NOTICE '📊 Current record count: %', v_count;
  
  -- Check for existing constraints
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Existing constraints:';
  FOR rec IN (
    SELECT conname, contype 
    FROM pg_constraint 
    WHERE conrelid = format('%I.%I', v_schema_name, v_table_name)::regclass
  ) LOOP
    RAISE NOTICE '   - % (type: %)', rec.conname, rec.contype;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '✅ VALIDATION COMPLETE';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Execute: scripts/database/update_visual_templates_table.sql';
  RAISE NOTICE '2. Execute: scripts/database/update_visual_templates_enrichment.sql';
  RAISE NOTICE '3. Run Python enrichment: python scripts/openai_enrichment/enrich_visual_templates.py --limit 5 --dry-run';
  
END $$;
