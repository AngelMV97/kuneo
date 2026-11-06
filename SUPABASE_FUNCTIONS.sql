-- =====================================================
-- SUPABASE RPC FUNCTIONS FOR KUNEO APP
-- Execute these in Supabase SQL Editor
-- 
-- IMPORTANT: 
-- - Functions are in PUBLIC schema (required for PostgREST to expose them)
-- - Functions have KUNEO_ prefix to avoid conflicts with Aula Nativa
-- - Functions use SECURITY DEFINER to access kuneo.profiles table
-- - auth.users is shared between both apps (this is correct)
-- =====================================================

-- 1. Function to create Kuneo user profile
CREATE OR REPLACE FUNCTION public.kuneo_create_user_profile(
    p_user_id UUID,
    p_grade_level INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    INSERT INTO kuneo.profiles (user_id, grade_level, created_at)
    VALUES (p_user_id, p_grade_level, NOW())
    RETURNING json_build_object(
        'id', id,
        'user_id', user_id,
        'grade_level', grade_level,
        'character_preference', character_preference,
        'created_at', created_at
    ) INTO v_result;
    
    RETURN v_result;
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Profile already exists for this user';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creating profile: %', SQLERRM;
END;
$$;

-- 2. Function to get Kuneo user profile by user_id
CREATE OR REPLACE FUNCTION public.kuneo_get_user_profile(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'id', id,
        'user_id', user_id,
        'grade_level', grade_level,
        'character_preference', character_preference,
        'onboarding_completed', onboarding_completed,
        'created_at', created_at,
        'updated_at', updated_at
    )
    INTO v_result
    FROM kuneo.profiles
    WHERE user_id = p_user_id;
    
    RETURN v_result;
END;
$$;

-- 3. Function to update Kuneo character preference
CREATE OR REPLACE FUNCTION public.kuneo_update_character_preference(
    p_user_id UUID,
    p_character TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    UPDATE kuneo.profiles
    SET character_preference = p_character,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING json_build_object(
        'id', id,
        'user_id', user_id,
        'character_preference', character_preference,
        'updated_at', updated_at
    ) INTO v_result;
    
    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Profile not found for user_id: %', p_user_id;
    END IF;
    
    RETURN v_result;
END;
$$;

-- 4. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.kuneo_create_user_profile TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.kuneo_get_user_profile TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.kuneo_update_character_preference TO anon, authenticated;

-- =====================================================
-- FORCE SCHEMA RELOAD
-- =====================================================
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- FORCE SCHEMA RELOAD
-- =====================================================
NOTIFY pgrst, 'reload schema';
