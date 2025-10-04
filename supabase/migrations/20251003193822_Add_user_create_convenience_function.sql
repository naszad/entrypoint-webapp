set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_user_for_customer(p_email text, p_encrypted_password text, p_first_name text, p_last_name text, p_customer_id uuid, p_membership_role text DEFAULT 'member'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_id uuid := gen_random_uuid();
BEGIN
  -- set a safe search_path for security definer functions
  PERFORM set_config('search_path', '', true);

  -- 1) Insert into auth.users using a single UUID
  INSERT INTO auth.users (
    id, email, encrypted_password, aud, role, email_confirmed_at, created_at
  ) VALUES (
    v_id,
    lower(p_email),
    p_encrypted_password,
    'authenticated',
    'authenticated',
    now(),
    now()
  );

  -- 2) Insert into public.users (use same UUID)
  INSERT INTO public.users (
    user_id, auth_user_id, first_name, last_name, email
  ) VALUES (
    v_id,
    v_id,
    p_first_name,
    p_last_name,
    lower(p_email)
  );

  -- 3) Create memberships for every school for the provided customer_id
  INSERT INTO public.user_school_memberships (user_id, school_id, role, created_at)
  SELECT
    v_id AS user_id,
    s.school_id AS school_id,
    p_membership_role AS role,
    now() AS created_at
  FROM public.schools s
  WHERE s.customer_id = p_customer_id
  ON CONFLICT (user_id, school_id) DO NOTHING;

  RETURN v_id;
END;
$function$
;


-- Security recommendation: restrict who can EXECUTE this function after you verify behaviour
-- Example: revoke from public and grant to a specific role
-- REVOKE ALL ON FUNCTION public.create_user_for_customer(text,text,text,text,uuid,text) FROM public;
-- GRANT EXECUTE ON FUNCTION public.create_user_for_customer(text,text,text,text,uuid,text) TO your_admin_role;

-- Optionally revoke from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.create_user_for_customer(text,text,text,text,uuid,text) FROM authenticated, anon;