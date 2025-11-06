-- Ensure high-traffic public functions remain usable when callers run with a restricted search_path
-- (e.g. the AI-safe `views` schema). We pin their search_path to `public` so they can resolve
-- the base tables they depend on.

ALTER FUNCTION public.fetch_public_config(text, uuid, uuid, uuid)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.calculate_gpa_for_students(uuid[], text, text[], text[], text[], integer[])
  SET search_path = public, pg_temp;

ALTER FUNCTION public.calculate_gpa_dispatch(uuid, text, text[], text[], text[], integer[])
  SET search_path = public, pg_temp;

ALTER FUNCTION public.calculate_simple_gpa(uuid, text[], text[], text[], integer[])
  SET search_path = public, pg_temp;

ALTER FUNCTION public.calculate_added_value_gpa(uuid, text[], text[], text[], integer[])
  SET search_path = public, pg_temp;

ALTER FUNCTION public.calculate_credit_hour_weighted_gpa(uuid, text[], text[], text[], integer[])
  SET search_path = public, pg_temp;
