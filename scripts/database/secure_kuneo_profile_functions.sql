-- Run once in the Supabase SQL Editor. No user or learning data is deleted.
-- Preserve the installed return types (some deployments return JSON, others TABLE).
-- Does not touch Aula Nativa functions, auth.users, or public.material_embeddings.
BEGIN;

-- The browser reads its own evidence; only the backend may write evaluations.
-- RLS is still required for authenticated SELECT access.
REVOKE ALL ON TABLE kuneo.student_step_attempts, kuneo.student_module_progress,
  kuneo.student_cognitive_profile, kuneo.student_taxonomy_mastery,
  kuneo.student_recommendations FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE kuneo.student_step_attempts, kuneo.student_module_progress,
  kuneo.student_cognitive_profile, kuneo.student_taxonomy_mastery,
  kuneo.student_recommendations FROM authenticated;
GRANT SELECT ON TABLE kuneo.student_step_attempts, kuneo.student_module_progress,
  kuneo.student_cognitive_profile, kuneo.student_taxonomy_mastery,
  kuneo.student_recommendations TO authenticated;

DO $migration$
DECLARE
  target record;
  definition text;
  new_body text;
  guard text := E'\n  -- kuneo_owner_guard_v1\n  IF (SELECT auth.uid()) IS DISTINCT FROM p_user_id THEN\n    RAISE EXCEPTION ''Access denied: profile belongs to another user'' USING ERRCODE = ''42501'';\n  END IF;\n';
  found_count integer := 0;
BEGIN
  FOR target IN
    SELECT p.oid, p.prosrc, p.proargnames, l.lanname
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_language l ON l.oid = p.prolang
    WHERE n.nspname = 'public' AND p.proname IN (
      'kuneo_create_user_profile', 'kuneo_get_user_profile',
      'kuneo_update_character_preference', 'kuneo_update_username'
    )
  LOOP
    found_count := found_count + 1;
    IF target.lanname <> 'plpgsql' OR NOT ('p_user_id' = ANY(target.proargnames)) THEN
      RAISE EXCEPTION 'Unexpected profile function definition: %', target.oid::regprocedure;
    END IF;
    IF position('kuneo_owner_guard_v1' IN target.prosrc) = 0 THEN
      new_body := regexp_replace(target.prosrc, '\mBEGIN\M', 'BEGIN' || guard, 'i');
      IF new_body = target.prosrc THEN
        RAISE EXCEPTION 'Could not insert ownership guard: %', target.oid::regprocedure;
      END IF;
      definition := pg_get_functiondef(target.oid);
      definition := replace(definition, target.prosrc, new_body);
      EXECUTE definition;
    END IF;
    EXECUTE format('ALTER FUNCTION %s SET search_path = pg_catalog, kuneo, pg_temp', target.oid::regprocedure);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', target.oid::regprocedure);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', target.oid::regprocedure);
  END LOOP;
  IF found_count <> 4 THEN
    RAISE EXCEPTION 'Expected four Kuneo profile functions, found %. Review before applying.', found_count;
  END IF;
END;
$migration$;
NOTIFY pgrst, 'reload schema';
COMMIT;

-- Verification: all four functions should include kuneo_owner_guard_v1.
SELECT p.oid::regprocedure AS function_name,
       position('kuneo_owner_guard_v1' IN p.prosrc) > 0 AS owner_guard,
       p.proconfig AS configuration
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname IN (
  'kuneo_create_user_profile', 'kuneo_get_user_profile',
  'kuneo_update_character_preference', 'kuneo_update_username'
);
