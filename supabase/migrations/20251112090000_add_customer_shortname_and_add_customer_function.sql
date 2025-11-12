set check_function_bodies = off;

-- 1. Add shortname column with lowercase constraint and uniqueness
ALTER TABLE public.customers
  ADD COLUMN shortname text;

ALTER TABLE public.customers
  ADD CONSTRAINT customers_shortname_lowercase
  CHECK (shortname IS NULL OR shortname = lower(shortname));

CREATE UNIQUE INDEX customers_shortname_unique_idx
  ON public.customers (shortname);

-- 2. Add config.add_customer helper
CREATE OR REPLACE FUNCTION config.add_customer(
    p_name text,
    p_shortname text DEFAULT NULL,
    p_url text DEFAULT NULL,
    p_api_client_id text DEFAULT NULL,
    p_api_client_secret text DEFAULT NULL,
    p_email_domain_whitelist text[] DEFAULT NULL,
    p_final_grade_codes text[] DEFAULT NULL,
    p_grade_code_sort text[] DEFAULT NULL,
    p_gpa_grade_levels integer[] DEFAULT NULL,
    p_is_active boolean DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_customer_id uuid;
  v_shortname text;
  v_config jsonb := '{}'::jsonb;
BEGIN
  PERFORM set_config('search_path', '', true);

  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Customer name is required';
  END IF;

  IF p_shortname IS NOT NULL THEN
    v_shortname := lower(p_shortname);
  END IF;

  INSERT INTO public.customers (name, shortname)
  VALUES (p_name, v_shortname)
  RETURNING customer_id INTO v_customer_id;

  v_config := v_config || jsonb_build_object('is_active', coalesce(p_is_active, false));

  IF p_url IS NOT NULL THEN
    v_config := v_config || jsonb_build_object('url', to_jsonb(p_url));
  END IF;

  IF p_api_client_id IS NOT NULL THEN
    v_config := v_config || jsonb_build_object('api_client_id', to_jsonb(p_api_client_id));
  END IF;

  IF p_api_client_secret IS NOT NULL THEN
    v_config := v_config || jsonb_build_object(
      'api_client_secret',
      jsonb_build_object('value', p_api_client_secret, 'is_secret', true)
    );
  END IF;

  IF p_email_domain_whitelist IS NOT NULL THEN
    v_config := v_config || jsonb_build_object('email_domain_whitelist', to_jsonb(p_email_domain_whitelist));
  END IF;

  IF p_final_grade_codes IS NOT NULL THEN
    v_config := v_config || jsonb_build_object('final_grade_codes', to_jsonb(p_final_grade_codes));
  END IF;

  IF p_grade_code_sort IS NOT NULL THEN
    v_config := v_config || jsonb_build_object('grade_code_sort', to_jsonb(p_grade_code_sort));
  END IF;

  IF p_gpa_grade_levels IS NOT NULL THEN
    v_config := v_config || jsonb_build_object('gpa_grade_levels', to_jsonb(p_gpa_grade_levels));
  END IF;

  IF v_config <> '{}'::jsonb THEN
    PERFORM config.set_customer_config_values(v_customer_id, v_config);
  END IF;

  RETURN v_customer_id;
END;
$function$;

REVOKE ALL ON FUNCTION config.add_customer(text, text, text, text, text, text[], text[], text[], integer[], boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION config.add_customer(text, text, text, text, text, text[], text[], text[], integer[], boolean) TO service_role;
