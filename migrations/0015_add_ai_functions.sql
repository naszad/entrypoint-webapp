-- Custom SQL migration file, put your code below! --
CREATE OR REPLACE FUNCTION public.execute_safe_select(query_text text)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = '';
AS $$
DECLARE
  result JSON;
BEGIN
  -- Ensure the query is a SELECT statement for security
  IF lower(query_text) NOT LIKE 'select%' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed.';
  END IF;

  -- Execute the query and aggregate the results into a single JSON object
  EXECUTE 'SELECT json_agg(t) FROM (' || query_text || ') t' INTO result;
  
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_table_schema(p_table_name text)
RETURNS TABLE(column_name text, data_type text)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = '';
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::text,
        c.data_type::text
    FROM 
        information_schema.columns c
    WHERE 
        c.table_schema = 'public' AND c.table_name = p_table_name;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_public_tables()
RETURNS TABLE(name text)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = '';
AS $$
BEGIN
    RETURN QUERY 
    SELECT table_name::text as name 
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';
END;
$$; 