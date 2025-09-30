alter table "public"."students" alter column "student_number" set data type text using "student_number"::text;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.associate_user_with_customer_schools(p_user_id uuid, p_customer_id uuid, p_membership_role text DEFAULT 'user'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- set a safe search_path for security definer functions
  PERFORM set_config('search_path', '', true);

  -- Insert memberships for every school with the provided customer_id
  INSERT INTO public.user_school_memberships (user_id, school_id, role, created_at)
  SELECT
    p_user_id AS user_id,
    s.school_id AS school_id,
    p_membership_role AS role,
    now() AS created_at
  FROM public.schools s
  WHERE s.customer_id = p_customer_id
  ON CONFLICT (user_id, school_id) DO NOTHING;

  RETURN;
END;
$function$
;


