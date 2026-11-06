-- Fix Mathematics step with legacy correct_option format
-- Step: 00000000-0000-0000-0001-000000000002
-- Module: 00000000-0000-0000-0000-000000000001 (Fracciones)
-- Issue: Uses correct_option (singular) instead of correct_options (plural)
-- Fix: Migrate to correct_options: [0] (answer "1/4" is at index 0)

BEGIN;

-- Step 1: Get current enriched_content to verify structure
SELECT 
    id,
    enriched_content->'expected_answer'->>'correct_option' as current_correct_option,
    enriched_content->'expected_answer'->'correct_options' as current_correct_options,
    content->'options' as available_options
FROM kuneo.module_steps
WHERE id = '00000000-0000-0000-0001-000000000002';

-- Step 2: Add correct_options array [0]
UPDATE kuneo.module_steps
SET enriched_content = jsonb_set(
    enriched_content,
    '{expected_answer,correct_options}',
    '[0]'::jsonb
)
WHERE id = '00000000-0000-0000-0001-000000000002';

-- Step 3: Remove legacy correct_option field
UPDATE kuneo.module_steps
SET enriched_content = jsonb_set(
    enriched_content,
    '{expected_answer}',
    (enriched_content->'expected_answer') - 'correct_option'
)
WHERE id = '00000000-0000-0000-0001-000000000002';

-- Step 4: Verify the fix
SELECT 
    id,
    enriched_content->'expected_answer'->>'type' as answer_type,
    enriched_content->'expected_answer'->'correct_options' as correct_options,
    enriched_content->'expected_answer'->'correct_option' as old_field_should_be_null,
    content->'options' as available_options
FROM kuneo.module_steps
WHERE id = '00000000-0000-0000-0001-000000000002';

COMMIT;

-- Expected result:
-- answer_type: "option"
-- correct_options: [0]
-- old_field_should_be_null: null
-- available_options: ["1/4", "1/2", "4/1", "1/8"]
