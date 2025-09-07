-- Drop the existing functions. We have to do this because you can't replace a function with one of a different return type.
DROP FUNCTION IF EXISTS public.list_public_tables;
DROP FUNCTION IF EXISTS public.get_public_table_schema;

-- Create the new functions
CREATE OR REPLACE FUNCTION public.list_public_tables()
RETURNS TABLE(name text, comment text)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.table_name::text AS name,
        pg_catalog.obj_description(
            format('%I.%I', t.table_schema, t.table_name)::regclass,
            'pg_class'
        )::text AS comment
    FROM
        information_schema.tables AS t
    WHERE
        t.table_schema = 'public' AND t.table_type = 'BASE TABLE';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_table_schema(p_table_name text)
RETURNS TABLE(column_name text, data_type text, comment text)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.column_name::text,
        c.data_type::text,
        pg_catalog.col_description(
            format('%I.%I', c.table_schema, c.table_name)::regclass,
            c.ordinal_position
        )::text AS comment
    FROM
        information_schema.columns AS c
    WHERE
        c.table_schema = 'public' AND c.table_name = p_table_name;
END;
$$;

-- Add comments for some tables/columns
COMMENT ON TABLE public.tags IS 'Tag definitions, organized by category and customer. Use the names of tags to decide which tags to use to help answer a user query. If you think a tag might be available to help answer a user''s question, SEARCH THE NAMES OF THESE TAGS for something relevant, rather than just assuming a tag name.';
COMMENT ON TABLE public.student_tags IS 'Contains the value of tags when they are associated to a student. Search this AFTER searching the "tags" table for relevant tag names.';
COMMENT ON TABLE public.section_enrollments IS 'Contains the enrollment of students in course sections.';

COMMENT ON COLUMN tags.name IS 'The name of a tag/attribute that can be used to help answer a user''s question.';
COMMENT ON COLUMN tags.is_multi_value IS 'Indicates whether the tag can have specific values when it is associated to a student, or if it is a boolean tag (the student either has it, or doesn''t)';