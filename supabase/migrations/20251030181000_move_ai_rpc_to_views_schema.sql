-- Moves AI-facing RPC helpers into the `views` schema and renames them.
-- Safe to rerun while iterating.

-- Ensure the schema exists (no-op if already created earlier).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_namespace WHERE nspname = 'views'
  ) THEN
    EXECUTE 'CREATE SCHEMA views AUTHORIZATION postgres';
  END IF;
END$$;

-- Drop old functions if they still exist in public.
DROP FUNCTION IF EXISTS public.list_public_tables();
DROP FUNCTION IF EXISTS public.get_public_table_schema(text);
DROP FUNCTION IF EXISTS public.execute_safe_select(text, uuid);

-- Define new helpers inside the views schema.

CREATE OR REPLACE FUNCTION views.list_views()
RETURNS TABLE(name text, comment text)
LANGUAGE plpgsql
SET search_path TO pg_catalog, views
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.relname::text AS name,
    obj_description(c.oid, 'pg_class')::text AS comment
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'views'
    AND c.relkind IN ('v', 'm') -- plain views or materialized views
    AND pg_catalog.pg_table_is_visible(c.oid);
END;
$$;

COMMENT ON FUNCTION views.list_views IS 'Lists AI-safe views (and future materialized views) exposed under the `views` schema.';

CREATE OR REPLACE FUNCTION views.get_view_schema(p_view_name text)
RETURNS TABLE(column_name text, data_type text, comment text)
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cols.column_name::text,
    cols.data_type::text,
    pg_catalog.col_description(
      format('%I.%I', cols.table_schema, cols.table_name)::regclass,
      cols.ordinal_position
    )::text AS comment
  FROM information_schema.columns cols
  WHERE cols.table_schema = 'views'
    AND cols.table_name = p_view_name;
END;
$$;

COMMENT ON FUNCTION views.get_view_schema IS 'Returns column metadata for a view inside the `views` schema.';

CREATE OR REPLACE FUNCTION views.execute_safe_select(p_query text, p_selected_school_id uuid DEFAULT NULL::uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  IF p_selected_school_id IS NOT NULL THEN
    PERFORM set_config('app.current_school_id', p_selected_school_id::text, true);
  END IF;

  IF lower(p_query) NOT LIKE 'select%' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed.';
  END IF;

  -- Basic guard against cross-schema references.
  IF p_query ~* '\\b(public|information_schema|pg_catalog)\\.' THEN
    RAISE EXCEPTION 'Queries may only reference relations in the views schema.';
  END IF;

  -- Lock resolution to the views schema only.
  PERFORM set_config('search_path', 'views', true);

  EXECUTE 'SELECT json_agg(t) FROM (' || p_query || ') t' INTO result;
  RETURN result;
END;
$$;

COMMENT ON FUNCTION views.execute_safe_select IS 'Executes vetted read-only SQL against the AI-safe `views` schema with optional school scoping.';

-- Grant access to expected roles.
GRANT EXECUTE ON FUNCTION views.list_views() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION views.get_view_schema(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION views.execute_safe_select(text, uuid) TO authenticated, service_role;

-- Provide thin wrappers in the public schema for PostgREST compatibility until we can figure out why calling directly in into the views schema isn't working
CREATE OR REPLACE FUNCTION public.list_views()
RETURNS TABLE(name text, comment text)
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM views.list_views();
$$;

COMMENT ON FUNCTION public.list_views IS 'Delegates to views.list_views so RPC callers can continue using the public schema entry point.';

CREATE OR REPLACE FUNCTION public.get_view_schema(p_view_name text)
RETURNS TABLE(column_name text, data_type text, comment text)
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM views.get_view_schema(p_view_name);
$$;

COMMENT ON FUNCTION public.get_view_schema IS 'Delegates to views.get_view_schema while maintaining the legacy public RPC signature.';

CREATE OR REPLACE FUNCTION public.execute_safe_select(p_query text, p_selected_school_id uuid DEFAULT NULL::uuid)
RETURNS json
LANGUAGE sql
AS $$
  SELECT views.execute_safe_select(p_query, p_selected_school_id);
$$;

COMMENT ON FUNCTION public.execute_safe_select IS 'Delegates to views.execute_safe_select; kept for API compatibility.';

GRANT EXECUTE ON FUNCTION public.list_views() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_view_schema(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.execute_safe_select(text, uuid) TO authenticated, service_role;

-- Ensure PostgREST exposes the views schema for all API roles.
ALTER ROLE anon SET pgrst.db_schemas = 'public,views';
ALTER ROLE authenticated SET pgrst.db_schemas = 'public,views';
ALTER ROLE service_role SET pgrst.db_schemas = 'public,views';

ALTER ROLE anon SET search_path = 'views', 'public';
ALTER ROLE authenticated SET search_path = 'views', 'public';
ALTER ROLE service_role SET search_path = 'views', 'public';
