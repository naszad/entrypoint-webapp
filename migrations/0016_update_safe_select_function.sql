DROP FUNCTION IF EXISTS public.execute_safe_select;
CREATE OR REPLACE FUNCTION public.execute_safe_select(
    query_text text,
    p_selected_school_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  IF p_selected_school_id IS NOT NULL THEN

    PERFORM set_config('app.current_school_id', p_selected_school_id::text, true);
  END IF;

  IF lower(query_text) NOT LIKE 'select%' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed.';
  END IF;

  EXECUTE 'SELECT json_agg(t) FROM (' || query_text || ') t' INTO result;
  
  RETURN result;
END;
$$;