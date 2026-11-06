-- Add username field to kuneo.profiles table
ALTER TABLE kuneo.profiles 
ADD COLUMN IF NOT EXISTS username TEXT;

-- Create or replace function to update username
CREATE OR REPLACE FUNCTION public.kuneo_update_username(
  p_user_id UUID,
  p_username TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE kuneo.profiles
  SET username = p_username,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'username', p_username
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.kuneo_update_username(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.kuneo_update_username IS 'Updates username for Kuneo user profile';
