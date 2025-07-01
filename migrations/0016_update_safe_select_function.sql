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
  -- Set the school_id for the current transaction if provided
  IF p_selected_school_id IS NOT NULL THEN
    -- Using set_config is standard practice within plpgsql functions.
    -- The third parameter 'true' makes it a transaction-local setting (equivalent to SET LOCAL).
    PERFORM set_config('app.current_school_id', p_selected_school_id::text, true);
  END IF;

  -- Ensure the query is a SELECT statement for security
  IF lower(query_text) NOT LIKE 'select%' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed.';
  END IF;

  -- Execute the query and aggregate the results into a single JSON object
  EXECUTE 'SELECT json_agg(t) FROM (' || query_text || ') t' INTO result;
  
  RETURN result;
END;
$$;