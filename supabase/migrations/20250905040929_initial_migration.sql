

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "config";


ALTER SCHEMA "config" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "drizzle";


ALTER SCHEMA "drizzle" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."created_by" AS ENUM (
    'agent',
    'user'
);


ALTER TYPE "public"."created_by" OWNER TO "postgres";


CREATE TYPE "public"."source" AS ENUM (
    'manual',
    'ai',
    'import'
);


ALTER TYPE "public"."source" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_added_value_gpa"("p_student_id" "uuid", "p_grade_codes" "text"[] DEFAULT NULL::"text"[], "p_credit_types" "text"[] DEFAULT NULL::"text"[], "p_year_labels" "text"[] DEFAULT NULL::"text"[], "p_grade_levels" integer[] DEFAULT NULL::integer[]) RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  total_points NUMERIC := 0;
  course_count INTEGER := 0;
  gpa          NUMERIC := NULL;
  term_ids_for_years UUID[];
BEGIN
  -- If p_year_labels is provided, get the corresponding term_ids
  IF p_year_labels IS NOT NULL THEN
    SELECT ARRAY_AGG(DISTINCT t.term_id) INTO term_ids_for_years
    FROM terms t
    JOIN years sy ON t.year_id = sy.year_id
    WHERE sy.name = ANY(p_year_labels);
  END IF;

  SELECT
    COALESCE(SUM(sg.gpa_points + COALESCE(c.added_value, 0)), 0),
    COUNT(sg.grade_id)
  INTO total_points, course_count
  FROM student_grades sg
  JOIN sections s ON sg.section_id = s.section_id
  JOIN courses c ON s.course_id = c.course_id
  WHERE sg.student_id = p_student_id
    AND sg.grade_status = 'Final'
    AND sg.exclude_from_gpa IS NOT TRUE
    AND (p_grade_codes  IS NULL OR sg.grade_code   = ANY(p_grade_codes))
    AND (p_credit_types IS NULL OR sg.credit_type  = ANY(p_credit_types))
    AND (p_year_labels  IS NULL OR sg.term_id      = ANY(term_ids_for_years))
    AND (p_grade_levels IS NULL OR sg.grade_level::integer = ANY(p_grade_levels));

  IF course_count > 0 THEN
    gpa := total_points / course_count;
  END IF;
  
  RETURN gpa;
END;
$$;


ALTER FUNCTION "public"."calculate_added_value_gpa"("p_student_id" "uuid", "p_grade_codes" "text"[], "p_credit_types" "text"[], "p_year_labels" "text"[], "p_grade_levels" integer[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_credit_hour_weighted_gpa"("p_student_id" "uuid", "p_grade_codes" "text"[] DEFAULT NULL::"text"[], "p_credit_types" "text"[] DEFAULT NULL::"text"[], "p_year_labels" "text"[] DEFAULT NULL::"text"[], "p_grade_levels" integer[] DEFAULT NULL::integer[]) RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  total_points NUMERIC := 0;
  total_credits NUMERIC := 0;
  gpa          NUMERIC := NULL;
  term_ids_for_years UUID[];
BEGIN
  -- If p_year_labels is provided, get the corresponding term_ids
  IF p_year_labels IS NOT NULL THEN
    SELECT ARRAY_AGG(DISTINCT t.term_id) INTO term_ids_for_years
    FROM terms t
    JOIN years sy ON t.year_id = sy.year_id
    WHERE sy.name = ANY(p_year_labels);
  END IF;

  SELECT
    COALESCE(SUM(sg.gpa_points * c.credit_hours), 0),
    COALESCE(SUM(c.credit_hours), 0)
  INTO total_points, total_credits
  FROM student_grades sg
  JOIN sections s ON sg.section_id = s.section_id
  JOIN courses c ON s.course_id = c.course_id
  WHERE sg.student_id = p_student_id
    AND sg.grade_status = 'Final'
    AND sg.exclude_from_gpa IS NOT TRUE
    AND (p_grade_codes  IS NULL OR sg.grade_code   = ANY(p_grade_codes))
    AND (p_credit_types IS NULL OR sg.credit_type  = ANY(p_credit_types))
    AND (p_year_labels  IS NULL OR sg.term_id      = ANY(term_ids_for_years))
    AND (p_grade_levels IS NULL OR sg.grade_level::integer = ANY(p_grade_levels));

  IF total_credits > 0 THEN
    gpa := total_points / total_credits;
  END IF;
  
  RETURN gpa;
END;
$$;


ALTER FUNCTION "public"."calculate_credit_hour_weighted_gpa"("p_student_id" "uuid", "p_grade_codes" "text"[], "p_credit_types" "text"[], "p_year_labels" "text"[], "p_grade_levels" integer[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_gpa_dispatch"("p_student_id" "uuid", "p_method" "text" DEFAULT NULL::"text", "p_grade_codes" "text"[] DEFAULT NULL::"text"[], "p_credit_types" "text"[] DEFAULT NULL::"text"[], "p_year_labels" "text"[] DEFAULT NULL::"text"[], "p_grade_levels" integer[] DEFAULT NULL::integer[]) RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  resolved_method TEXT;
  school_id_val   UUID;
  gpa             NUMERIC;
BEGIN
  -- If p_method is NULL, look up the default method for the student's school.
  IF p_method IS NULL THEN
    -- Find the school_id for the given student
    SELECT ssl.school_id INTO school_id_val
    FROM school_student_link ssl
    WHERE ssl.student_id = p_student_id
    ORDER BY ssl.start_date DESC
    LIMIT 1;

    -- If a school is found, get the default GPA method from its config
    IF school_id_val IS NOT NULL THEN
      SELECT s.gpa_config->>'default_method' INTO resolved_method
      FROM schools s
      WHERE s.school_id = school_id_val;
    END IF;
  ELSE
    resolved_method := p_method;
  END IF;

  -- Default to 'simple' if no method is resolved
  IF resolved_method IS NULL THEN
    resolved_method := 'simple';
  END IF;

  -- Dispatch to the correct calculation function based on the method
  CASE resolved_method
    WHEN 'simple' THEN
      SELECT calculate_simple_gpa(
        p_student_id,
        p_grade_codes,
        p_credit_types,
        p_year_labels,
        p_grade_levels
      ) INTO gpa;
    WHEN 'added_value' THEN
      SELECT calculate_added_value_gpa(
        p_student_id,
        p_grade_codes,
        p_credit_types,
        p_year_labels,
        p_grade_levels
      ) INTO gpa;
    WHEN 'credit_hour_weighted' THEN
      SELECT calculate_credit_hour_weighted_gpa(
        p_student_id,
        p_grade_codes,
        p_credit_types,
        p_year_labels,
        p_grade_levels
      ) INTO gpa;
    ELSE
      RAISE EXCEPTION 'Unknown GPA calculation method: %', resolved_method;
  END CASE;

  RETURN gpa;
END;
$$;


ALTER FUNCTION "public"."calculate_gpa_dispatch"("p_student_id" "uuid", "p_method" "text", "p_grade_codes" "text"[], "p_credit_types" "text"[], "p_year_labels" "text"[], "p_grade_levels" integer[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_gpa_for_students"("p_student_ids" "uuid"[], "p_method" "text" DEFAULT NULL::"text", "p_grade_codes" "text"[] DEFAULT NULL::"text"[], "p_credit_types" "text"[] DEFAULT NULL::"text"[], "p_year_labels" "text"[] DEFAULT NULL::"text"[], "p_grade_levels" integer[] DEFAULT NULL::integer[]) RETURNS TABLE("student_id" "uuid", "gpa" numeric)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    school_row RECORD;
    resolved_method TEXT;
BEGIN
    -- Get the school for the first student to determine the GPA calculation method
    SELECT s.* INTO school_row
    FROM schools s
    JOIN school_student_link ssl ON s.school_id = ssl.school_id
    WHERE ssl.student_id = p_student_ids[1]
    ORDER BY ssl.start_date DESC
    LIMIT 1;

    IF p_method IS NOT NULL THEN
        resolved_method := p_method;
    ELSIF school_row IS NOT NULL THEN
        -- Determine the method from gpa_config
        resolved_method := COALESCE((school_row.gpa_config->>'default_method')::TEXT, 'simple');
    ELSE
        -- Default to simple if school not found
        resolved_method := 'simple';
    END IF;

    -- Using the determined method, calculate GPA for all students in the list.
    RETURN QUERY
    SELECT
        s.id as student_id,
        calculate_gpa_dispatch(
            s.id, 
            resolved_method, 
            p_grade_codes, 
            p_credit_types, 
            p_year_labels,
            p_grade_levels
        ) as gpa
    FROM
        unnest(p_student_ids) AS s(id);
END;
$$;


ALTER FUNCTION "public"."calculate_gpa_for_students"("p_student_ids" "uuid"[], "p_method" "text", "p_grade_codes" "text"[], "p_credit_types" "text"[], "p_year_labels" "text"[], "p_grade_levels" integer[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_simple_gpa"("p_student_id" "uuid", "p_grade_codes" "text"[] DEFAULT NULL::"text"[], "p_credit_types" "text"[] DEFAULT NULL::"text"[], "p_year_labels" "text"[] DEFAULT NULL::"text"[], "p_grade_levels" integer[] DEFAULT NULL::integer[]) RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  total_points NUMERIC := 0;
  course_count INTEGER := 0;
  gpa          NUMERIC := NULL;
  term_ids_for_years UUID[];
BEGIN
  -- If p_year_labels is provided, get the corresponding term_ids
  IF p_year_labels IS NOT NULL THEN
    SELECT ARRAY_AGG(DISTINCT t.term_id) INTO term_ids_for_years
    FROM terms t
    JOIN years sy ON t.year_id = sy.year_id
    WHERE sy.name = ANY(p_year_labels);
  END IF;

  SELECT
    COALESCE(SUM(sg.gpa_points), 0),
    COUNT(sg.grade_id)
  INTO total_points, course_count
  FROM student_grades sg
  WHERE sg.student_id = p_student_id
    AND sg.grade_status = 'Final'
    AND (p_grade_codes  IS NULL OR sg.grade_code   = ANY(p_grade_codes))
    AND (p_credit_types IS NULL OR sg.credit_type  = ANY(p_credit_types))
    AND (p_year_labels  IS NULL OR sg.term_id      = ANY(term_ids_for_years))
    AND (p_grade_levels IS NULL OR sg.grade_level::integer = ANY(p_grade_levels));

  IF course_count > 0 THEN
    gpa := total_points / course_count;
  END IF;
  
  RETURN gpa;
END;
$$;


ALTER FUNCTION "public"."calculate_simple_gpa"("p_student_id" "uuid", "p_grade_codes" "text"[], "p_credit_types" "text"[], "p_year_labels" "text"[], "p_grade_levels" integer[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."execute_safe_select"("query_text" "text", "p_selected_school_id" "uuid" DEFAULT NULL::"uuid") RETURNS "json"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  result JSON;
BEGIN
  IF p_selected_school_id IS NOT NULL THEN

    -- Set the school context so the query is scoped to the user's selected school.
    -- The third parameter is true, which means that the context will be reset after the current transaction.
    PERFORM set_config('app.current_school_id', p_selected_school_id::text, true);
  END IF;

  IF lower(query_text) NOT LIKE 'select%' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed.';
  END IF;

  EXECUTE 'SELECT json_agg(t) FROM (' || query_text || ') t' INTO result;
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."execute_safe_select"("query_text" "text", "p_selected_school_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "config"."configuration" (
    "config_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "config_key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "is_secret" boolean DEFAULT false,
    "customer_id" "uuid",
    "school_id" "uuid",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_single_scope" CHECK (((((("customer_id" IS NOT NULL))::integer + (("school_id" IS NOT NULL))::integer) + (("user_id" IS NOT NULL))::integer) <= 1))
);


ALTER TABLE "config"."configuration" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."public_configuration" AS
 SELECT "configuration"."config_id",
    "configuration"."config_key",
    "configuration"."value",
    "configuration"."customer_id",
    "configuration"."school_id",
    "configuration"."user_id",
    "configuration"."created_at",
    "configuration"."updated_at"
   FROM "config"."configuration"
  WHERE ("configuration"."is_secret" = false);


ALTER TABLE "public"."public_configuration" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fetch_public_config"("p_config_key" "text", "p_user_id" "uuid" DEFAULT NULL::"uuid", "p_school_id" "uuid" DEFAULT NULL::"uuid", "p_customer_id" "uuid" DEFAULT NULL::"uuid") RETURNS SETOF "public"."public_configuration"
    LANGUAGE "plpgsql" STABLE
    AS $$
declare
  v_school_id uuid;
  v_customer_id uuid;
begin
  if p_user_id is not null then
    select school_id
    into v_school_id
    from user_school_memberships
    where user_id = p_user_id
    limit 1;
  end if;

  if p_school_id is not null or v_school_id is not null then
    select customer_id
    into v_customer_id
    from schools
    where school_id = coalesce(p_school_id, v_school_id)
    limit 1;
  end if;

  if p_customer_id is not null then
    v_customer_id := p_customer_id;
  end if;

  return query
  select config_id, config_key, value, customer_id, school_id, user_id, created_at, updated_at
  from public_configuration pc
  where pc.config_key = p_config_key
    and (
      (p_user_id is not null and pc.user_id = p_user_id)
      or (coalesce(p_school_id, v_school_id) is not null and pc.school_id = coalesce(p_school_id, v_school_id) and pc.user_id is null)
      or (v_customer_id is not null and pc.customer_id = v_customer_id and pc.school_id is null and pc.user_id is null)
      or (pc.user_id is null and pc.school_id is null and pc.customer_id is null)
    )
  order by
    case
      when pc.user_id is not null then 1
      when pc.school_id is not null then 2
      when pc.customer_id is not null then 3
      else 4
    end
  limit 1;
end;
$$;


ALTER FUNCTION "public"."fetch_public_config"("p_config_key" "text", "p_user_id" "uuid", "p_school_id" "uuid", "p_customer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_school_id"() RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN current_setting('app.current_school_id')::uuid;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."get_current_school_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_student_grades"("p_student_id" "uuid") RETURNS TABLE("course_id" "uuid", "course_name" "text", "course_number" "text", "grade_letter" "text", "grade_percent" numeric, "updated_at" timestamp with time zone, "term_abbreviation" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Return the latest grades for the current (or most recent) term in one go
  RETURN QUERY
    WITH term_dates AS (
      SELECT se.section_id, se.term_id, t.abbreviation,
             t.start_date::date AS term_start, t.end_date::date AS term_end
      FROM section_enrollments se
      JOIN terms t ON t.term_id = se.term_id
      WHERE se.student_id = p_student_id
        AND (se.start_date IS NULL OR se.start_date <= NOW())
        AND (se.end_date   IS NULL OR se.end_date   >= NOW())
    ),
    current_term AS (
      SELECT term_id, abbreviation
      FROM term_dates
      WHERE term_start <= NOW()::date AND term_end >= NOW()::date
      LIMIT 1
    ),
    fallback_term AS (
      -- Fallback to most recent term where the student has grades
      SELECT td.term_id, td.abbreviation
      FROM term_dates td
      JOIN student_grades sg ON sg.term_id = td.term_id AND sg.student_id = p_student_id
      GROUP BY td.term_id, td.abbreviation, td.term_end
      ORDER BY td.term_end DESC NULLS LAST
      LIMIT 1
    ),
    chosen_term AS (
      SELECT * FROM current_term
      UNION ALL
      SELECT * FROM fallback_term
      LIMIT 1
    ),
    enrolls AS (
      SELECT se.section_id, se.term_id
      FROM section_enrollments se
      JOIN chosen_term ct ON se.term_id = ct.term_id
      WHERE se.student_id = p_student_id
    ),
    latest_grades AS (
      SELECT DISTINCT ON (c.course_id)
        c.course_id,
        c.name               AS course_name,
        c.local_course_code  AS course_number,
        sg.grade_letter,
        sg.grade_percent,
        sg.source_updated_date::timestamp with time zone AS updated_at,
        ct.abbreviation      AS term_abbreviation
      FROM enrolls e
      JOIN sections s ON s.section_id = e.section_id
      JOIN courses c ON c.course_id = s.course_id
      LEFT JOIN student_grades sg ON sg.section_id = s.section_id
                                 AND sg.student_id = p_student_id
      JOIN chosen_term ct ON e.term_id = ct.term_id
      ORDER BY c.course_id, sg.updated_at DESC NULLS LAST
    )
    SELECT * FROM latest_grades ORDER BY course_name, course_number;
END;
$$;


ALTER FUNCTION "public"."get_current_student_grades"("p_student_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_last_n_years_final_terms_gpa"("p_student_id" "uuid", "p_n" integer, "p_grade_codes" "text"[] DEFAULT NULL::"text"[]) RETURNS TABLE("year_name" "text", "grade_code" "text", "gpa" numeric)
    LANGUAGE "plpgsql"
    AS $$
declare
  v_current_end_year int;
  v_min_end_year int;
  v_grade_codes text[];
begin
  -- 1. Get current end year
  select end_year into v_current_end_year
  from public.years
  where is_current = true
  limit 1;

  if v_current_end_year is null then
    raise exception 'No current year found in years table';
  end if;

  -- 2. Compute range for past N years
  v_min_end_year := v_current_end_year - (p_n - 1);

  -- 3. Return raw rows
  return query
    select 
      y.name as year_name,
      sg.grade_code,
      round(avg(sg.gpa_points)::numeric, 2) as gpa
    from student_grades sg
    join terms t on sg.term_id = t.term_id
    join years y on t.year_id = y.year_id
    where sg.student_id = p_student_id
      and sg.grade_status = 'Final'
      and y.end_year between v_min_end_year and v_current_end_year
      and (
        p_grade_codes is null 
        or sg.grade_code = any(p_grade_codes)
      )
    group by y.name, sg.grade_code
    order by y.name, sg.grade_code;
end;
$$;


ALTER FUNCTION "public"."get_last_n_years_final_terms_gpa"("p_student_id" "uuid", "p_n" integer, "p_grade_codes" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_public_table_schema"("p_table_name" "text") RETURNS TABLE("column_name" "text", "data_type" "text", "comment" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
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


ALTER FUNCTION "public"."get_public_table_schema"("p_table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_student_year_labels"("p_student_id" "uuid") RETURNS "text"[]
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    year_labels TEXT[];
BEGIN
    SELECT ARRAY_AGG(DISTINCT sy.name ORDER BY sy.name DESC) INTO year_labels
    FROM student_grades sg
    JOIN terms t ON sg.term_id = t.term_id
    JOIN years sy ON t.year_id = sy.year_id
    WHERE sg.student_id = p_student_id;
    
    RETURN year_labels;
END;
$$;


ALTER FUNCTION "public"."get_student_year_labels"("p_student_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_public_tables"() RETURNS TABLE("name" "text", "comment" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
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


ALTER FUNCTION "public"."list_public_tables"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
    "id" integer NOT NULL,
    "hash" "text" NOT NULL,
    "created_at" bigint
);


ALTER TABLE "drizzle"."__drizzle_migrations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "drizzle"."__drizzle_migrations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "drizzle"."__drizzle_migrations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "drizzle"."__drizzle_migrations_id_seq" OWNED BY "drizzle"."__drizzle_migrations"."id";



CREATE TABLE IF NOT EXISTS "public"."courses" (
    "course_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "external_key" "text" NOT NULL,
    "external_id" "text" NOT NULL,
    "external_key_hash" "text" NOT NULL,
    "external_source" "text" DEFAULT 'Powerschool'::"text" NOT NULL,
    "external_name" "text",
    "school_id" "uuid" NOT NULL,
    "name" "text",
    "local_course_code" "text",
    "state_course_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "customer_id" "uuid"
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "customer_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_grades" (
    "grade_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "section_id" "uuid" NOT NULL,
    "term_id" "uuid" NOT NULL,
    "course_id" "uuid" NOT NULL,
    "grade_letter" "text",
    "grade_code" "text" NOT NULL,
    "grade_percent" numeric,
    "gpa_points" numeric,
    "credit_hours_earned" numeric,
    "credit_type" "text",
    "grade_status" "text" NOT NULL,
    "comment" "text",
    "grade_level" "text",
    "source_api" "text",
    "source_updated_date" timestamp without time zone NOT NULL,
    "external_key" "text" NOT NULL,
    "external_id" "text" NOT NULL,
    "external_key_hash" "text" NOT NULL,
    "external_source" "text" DEFAULT 'Powerschool'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "external_name" "text",
    "customer_id" "uuid",
    "potential_credit_hours" numeric,
    "gpa_added_value" numeric,
    "exclude_from_gpa" boolean
);


ALTER TABLE "public"."student_grades" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."latest_student_grades" AS
 SELECT DISTINCT ON ("student_grades"."student_id", "student_grades"."course_id") "student_grades"."grade_id",
    "student_grades"."student_id",
    "student_grades"."section_id",
    "student_grades"."term_id",
    "student_grades"."course_id",
    "student_grades"."grade_letter",
    "student_grades"."grade_code",
    "student_grades"."grade_percent",
    "student_grades"."gpa_points",
    "student_grades"."credit_hours_earned",
    "student_grades"."credit_type",
    "student_grades"."grade_status",
    "student_grades"."comment",
    "student_grades"."grade_level",
    "student_grades"."source_api",
    "student_grades"."source_updated_date",
    "student_grades"."external_key",
    "student_grades"."external_id",
    "student_grades"."external_key_hash",
    "student_grades"."external_source",
    "student_grades"."created_at",
    "student_grades"."updated_at",
    "student_grades"."external_name",
    "student_grades"."customer_id",
    "student_grades"."potential_credit_hours",
    "student_grades"."gpa_added_value",
    "student_grades"."exclude_from_gpa"
   FROM "public"."student_grades"
  ORDER BY "student_grades"."student_id", "student_grades"."course_id", "student_grades"."updated_at" DESC;


ALTER TABLE "public"."latest_student_grades" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meeting_notes" (
    "meeting_note_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "update_log" "text",
    "private" boolean DEFAULT false NOT NULL,
    "transcript" "text",
    "notes" "text",
    "summary" "text",
    "created_by" "public"."created_by" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."meeting_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reports" (
    "report_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" character varying(256) NOT NULL,
    "description" "text",
    "page_name" character varying,
    "params" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."school_student_link" (
    "student_id" "uuid" NOT NULL,
    "school_id" "uuid" NOT NULL,
    "start_date" "date",
    "end_date" "date",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."school_student_link" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schools" (
    "school_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "school_number" integer,
    "city" "text",
    "state" "text",
    "country" "text",
    "address" "text",
    "phone" "text",
    "principal_name" "text",
    "principal_email" "text",
    "assistant_principal_name" "text",
    "assistant_principal_email" "text",
    "external_source" "text" DEFAULT 'Powerschool'::"text" NOT NULL,
    "external_key" "text" NOT NULL,
    "external_id" "text" NOT NULL,
    "external_key_hash" "text" NOT NULL,
    "external_name" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "customer_id" "uuid",
    "gpa_config" "jsonb"
);


ALTER TABLE "public"."schools" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."section_enrollments" (
    "section_enrollment_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid",
    "section_id" "uuid",
    "term_id" "uuid",
    "start_date" "date",
    "end_date" "date",
    "absences" integer DEFAULT 0 NOT NULL,
    "tardies" integer DEFAULT 0 NOT NULL,
    "external_key" "text" NOT NULL,
    "external_id" "text" NOT NULL,
    "external_key_hash" "text" NOT NULL,
    "external_source" "text" DEFAULT 'Powerschool'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "transaction_date" "date",
    "external_name" "text",
    "customer_id" "uuid"
);


ALTER TABLE "public"."section_enrollments" OWNER TO "postgres";


COMMENT ON TABLE "public"."section_enrollments" IS 'Contains the enrollment of students in course sections.';



CREATE TABLE IF NOT EXISTS "public"."sections" (
    "section_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "no_of_students" integer NOT NULL,
    "section_number" integer NOT NULL,
    "course_number" "text" NOT NULL,
    "grade_level" "text" NOT NULL,
    "external_key" "text" NOT NULL,
    "external_id" "text" NOT NULL,
    "external_key_hash" "text" NOT NULL,
    "external_source" "text" DEFAULT 'Powerschool'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "course_id" "uuid" NOT NULL,
    "transaction_date" "date",
    "external_name" "text",
    "customer_id" "uuid"
);


ALTER TABLE "public"."sections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_tags" (
    "student_tag_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid",
    "tag_id" "uuid",
    "value" "text" NOT NULL,
    "canonical_value_id" "uuid",
    "source" "public"."source" NOT NULL,
    "created_by_user_id" "uuid" NOT NULL,
    "updated_by_user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."student_tags" OWNER TO "postgres";


COMMENT ON TABLE "public"."student_tags" IS 'Contains the value of tags when they are associated to a student. Search this AFTER searching the "tags" table for relevant tag names.';



CREATE TABLE IF NOT EXISTS "public"."students" (
    "student_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "first_name" "text" NOT NULL,
    "middle_name" "text",
    "last_name" "text" NOT NULL,
    "email" character varying(256),
    "phone" character varying(256),
    "grade_level" integer NOT NULL,
    "gender" character varying(256),
    "date_of_birth" "date",
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "external_source" "text" DEFAULT 'Powerschool'::"text" NOT NULL,
    "external_key" "text" NOT NULL,
    "external_id" "text" NOT NULL,
    "external_key_hash" "text" NOT NULL,
    "external_name" "text",
    "graduation_year" integer,
    "enrollment_status" "text" NOT NULL,
    "homeroom_name" "text",
    "full_name" "text" NOT NULL,
    "customer_id" "uuid"
);


ALTER TABLE "public"."students" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tag_canonical_values" (
    "tag_canonical_value_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tag_id" "uuid",
    "value" "text" NOT NULL,
    "search_key_words" "text",
    "created_by_user_id" "uuid" NOT NULL,
    "updated_by_user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tag_canonical_values" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tag_categories" (
    "tag_category_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."tag_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "tag_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tag_category_id" "uuid",
    "customer_id" "uuid",
    "name" "text" NOT NULL,
    "is_multi_value" boolean DEFAULT false NOT NULL,
    "created_by_user_id" "uuid" NOT NULL,
    "updated_by_user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


COMMENT ON TABLE "public"."tags" IS 'Tag definitions, organized by category and customer. Use the names of tags to decide which tags to use to help answer a user query. If you think a tag might be available to help answer a user''s question, SEARCH THE NAMES OF THESE TAGS for something relevant, rather than just assuming a tag name.';



COMMENT ON COLUMN "public"."tags"."name" IS 'The name of a tag/attribute that can be used to help answer a user''s question.';



COMMENT ON COLUMN "public"."tags"."is_multi_value" IS 'Indicates whether the tag can have specific values when it is associated to a student, or if it is a boolean tag (the student either has it, or doesn''t)';



CREATE TABLE IF NOT EXISTS "public"."terms" (
    "term_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "start_date" "text" NOT NULL,
    "end_date" "text" NOT NULL,
    "abbreviation" "text" NOT NULL,
    "school_id" "uuid" NOT NULL,
    "year_id" "uuid" NOT NULL,
    "external_id" "text" NOT NULL,
    "external_name" "text",
    "external_key" "text" NOT NULL,
    "external_key_hash" "text" NOT NULL,
    "external_source" "text" DEFAULT 'Powerschool'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "customer_id" "uuid"
);


ALTER TABLE "public"."terms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_school_memberships" (
    "user_id" "uuid" NOT NULL,
    "school_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp without time zone,
    "updated_at" timestamp without time zone
);


ALTER TABLE "public"."user_school_memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "user_id" "uuid" NOT NULL,
    "auth_user_id" "uuid" NOT NULL,
    "first_name" "text" NOT NULL,
    "middle_name" "text",
    "last_name" "text" NOT NULL,
    "email" character varying(256) NOT NULL,
    "image_url" "text",
    "eula_agree_timestamp" timestamp with time zone
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."years" (
    "year_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "start_year" integer NOT NULL,
    "end_year" integer NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "nominal_start_date" "date",
    "nominal_end_date" "date",
    "is_current" boolean DEFAULT false NOT NULL,
    "year_external_id" "text" NOT NULL
);


ALTER TABLE "public"."years" OWNER TO "postgres";


ALTER TABLE ONLY "drizzle"."__drizzle_migrations" ALTER COLUMN "id" SET DEFAULT "nextval"('"drizzle"."__drizzle_migrations_id_seq"'::"regclass");



ALTER TABLE ONLY "config"."configuration"
    ADD CONSTRAINT "configuration_pkey" PRIMARY KEY ("config_id");



ALTER TABLE ONLY "drizzle"."__drizzle_migrations"
    ADD CONSTRAINT "__drizzle_migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_external_key_hash_unique" UNIQUE ("external_key_hash");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_external_key_unique" UNIQUE ("external_key");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("course_id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_name_unique" UNIQUE ("name");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("customer_id");



ALTER TABLE ONLY "public"."meeting_notes"
    ADD CONSTRAINT "meeting_notes_pkey" PRIMARY KEY ("meeting_note_id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("report_id");



ALTER TABLE ONLY "public"."school_student_link"
    ADD CONSTRAINT "school_student_link_student_id_school_id_pk" PRIMARY KEY ("student_id", "school_id");



ALTER TABLE ONLY "public"."schools"
    ADD CONSTRAINT "schools_external_key_hash_unique" UNIQUE ("external_key_hash");



ALTER TABLE ONLY "public"."schools"
    ADD CONSTRAINT "schools_external_key_unique" UNIQUE ("external_key");



ALTER TABLE ONLY "public"."schools"
    ADD CONSTRAINT "schools_pkey" PRIMARY KEY ("school_id");



ALTER TABLE ONLY "public"."section_enrollments"
    ADD CONSTRAINT "section_enrollments_external_key_hash_unique" UNIQUE ("external_key_hash");



ALTER TABLE ONLY "public"."section_enrollments"
    ADD CONSTRAINT "section_enrollments_external_key_unique" UNIQUE ("external_key");



ALTER TABLE ONLY "public"."section_enrollments"
    ADD CONSTRAINT "section_enrollments_pkey" PRIMARY KEY ("section_enrollment_id");



ALTER TABLE ONLY "public"."section_enrollments"
    ADD CONSTRAINT "section_enrollments_student_id_section_id_term_id_unique" UNIQUE ("student_id", "section_id", "term_id");



ALTER TABLE ONLY "public"."sections"
    ADD CONSTRAINT "sections_external_key_hash_unique" UNIQUE ("external_key_hash");



ALTER TABLE ONLY "public"."sections"
    ADD CONSTRAINT "sections_external_key_unique" UNIQUE ("external_key");



ALTER TABLE ONLY "public"."sections"
    ADD CONSTRAINT "sections_pkey" PRIMARY KEY ("section_id");



ALTER TABLE ONLY "public"."student_grades"
    ADD CONSTRAINT "student_grades_external_key_hash_unique" UNIQUE ("external_key_hash");



ALTER TABLE ONLY "public"."student_grades"
    ADD CONSTRAINT "student_grades_external_key_unique" UNIQUE ("external_key");



ALTER TABLE ONLY "public"."student_grades"
    ADD CONSTRAINT "student_grades_pkey" PRIMARY KEY ("grade_id");



ALTER TABLE ONLY "public"."student_tags"
    ADD CONSTRAINT "student_tags_pkey" PRIMARY KEY ("student_tag_id");



ALTER TABLE ONLY "public"."student_tags"
    ADD CONSTRAINT "student_tags_student_id_tag_id_value_unique" UNIQUE ("student_id", "tag_id", "value");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_external_key_hash_unique" UNIQUE ("external_key_hash");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_external_key_unique" UNIQUE ("external_key");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_pkey" PRIMARY KEY ("student_id");



ALTER TABLE ONLY "public"."tag_canonical_values"
    ADD CONSTRAINT "tag_canonical_values_pkey" PRIMARY KEY ("tag_canonical_value_id");



ALTER TABLE ONLY "public"."tag_canonical_values"
    ADD CONSTRAINT "tag_canonical_values_tag_id_value_unique" UNIQUE ("tag_id", "value");



ALTER TABLE ONLY "public"."tag_categories"
    ADD CONSTRAINT "tag_categories_name_unique" UNIQUE ("name");



ALTER TABLE ONLY "public"."tag_categories"
    ADD CONSTRAINT "tag_categories_pkey" PRIMARY KEY ("tag_category_id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("tag_id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_tag_category_id_customer_id_name_unique" UNIQUE ("tag_category_id", "customer_id", "name");



ALTER TABLE ONLY "public"."terms"
    ADD CONSTRAINT "terms_external_key_hash_unique" UNIQUE ("external_key_hash");



ALTER TABLE ONLY "public"."terms"
    ADD CONSTRAINT "terms_external_key_unique" UNIQUE ("external_key");



ALTER TABLE ONLY "public"."terms"
    ADD CONSTRAINT "terms_pkey" PRIMARY KEY ("term_id");



ALTER TABLE ONLY "public"."user_school_memberships"
    ADD CONSTRAINT "user_school_memberships_user_id_school_id_pk" PRIMARY KEY ("user_id", "school_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_unique" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."years"
    ADD CONSTRAINT "years_name_unique" UNIQUE ("name");



ALTER TABLE ONLY "public"."years"
    ADD CONSTRAINT "years_pkey" PRIMARY KEY ("year_id");



ALTER TABLE ONLY "public"."years"
    ADD CONSTRAINT "years_year_external_id_unique" UNIQUE ("year_external_id");



CREATE INDEX "idx_lookup" ON "config"."configuration" USING "btree" ("config_key", "school_id", "customer_id");



CREATE UNIQUE INDEX "uniq_customer_config" ON "config"."configuration" USING "btree" ("config_key", "customer_id") WHERE (("customer_id" IS NOT NULL) AND ("school_id" IS NULL) AND ("user_id" IS NULL));



CREATE UNIQUE INDEX "uniq_global_config" ON "config"."configuration" USING "btree" ("config_key") WHERE (("customer_id" IS NULL) AND ("school_id" IS NULL) AND ("user_id" IS NULL));



CREATE UNIQUE INDEX "uniq_school_config" ON "config"."configuration" USING "btree" ("config_key", "school_id") WHERE (("school_id" IS NOT NULL) AND ("user_id" IS NULL));



CREATE UNIQUE INDEX "uniq_user_config" ON "config"."configuration" USING "btree" ("config_key", "user_id") WHERE ("user_id" IS NOT NULL);



ALTER TABLE ONLY "config"."configuration"
    ADD CONSTRAINT "configuration_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON DELETE CASCADE;



ALTER TABLE ONLY "config"."configuration"
    ADD CONSTRAINT "configuration_school_id_schools_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("school_id") ON DELETE CASCADE;



ALTER TABLE ONLY "config"."configuration"
    ADD CONSTRAINT "configuration_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_school_id_schools_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("school_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting_notes"
    ADD CONSTRAINT "meeting_notes_student_id_students_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("student_id");



ALTER TABLE ONLY "public"."meeting_notes"
    ADD CONSTRAINT "meeting_notes_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id");



ALTER TABLE ONLY "public"."school_student_link"
    ADD CONSTRAINT "school_student_link_school_id_schools_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("school_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."school_student_link"
    ADD CONSTRAINT "school_student_link_student_id_students_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("student_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schools"
    ADD CONSTRAINT "schools_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."section_enrollments"
    ADD CONSTRAINT "section_enrollments_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."section_enrollments"
    ADD CONSTRAINT "section_enrollments_section_id_sections_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("section_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."section_enrollments"
    ADD CONSTRAINT "section_enrollments_student_id_students_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("student_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."section_enrollments"
    ADD CONSTRAINT "section_enrollments_term_id_terms_term_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("term_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sections"
    ADD CONSTRAINT "sections_course_id_courses_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("course_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sections"
    ADD CONSTRAINT "sections_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_grades"
    ADD CONSTRAINT "student_grades_course_id_courses_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("course_id");



ALTER TABLE ONLY "public"."student_grades"
    ADD CONSTRAINT "student_grades_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_grades"
    ADD CONSTRAINT "student_grades_section_id_sections_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("section_id");



ALTER TABLE ONLY "public"."student_grades"
    ADD CONSTRAINT "student_grades_student_id_students_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("student_id");



ALTER TABLE ONLY "public"."student_grades"
    ADD CONSTRAINT "student_grades_term_id_terms_term_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("term_id");



ALTER TABLE ONLY "public"."student_tags"
    ADD CONSTRAINT "student_tags_canonical_value_id_tag_canonical_values_tag_canoni" FOREIGN KEY ("canonical_value_id") REFERENCES "public"."tag_canonical_values"("tag_canonical_value_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_tags"
    ADD CONSTRAINT "student_tags_created_by_user_id_users_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_tags"
    ADD CONSTRAINT "student_tags_student_id_students_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("student_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_tags"
    ADD CONSTRAINT "student_tags_tag_id_tags_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("tag_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_tags"
    ADD CONSTRAINT "student_tags_updated_by_user_id_users_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tag_canonical_values"
    ADD CONSTRAINT "tag_canonical_values_created_by_user_id_users_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tag_canonical_values"
    ADD CONSTRAINT "tag_canonical_values_tag_id_tags_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("tag_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tag_canonical_values"
    ADD CONSTRAINT "tag_canonical_values_updated_by_user_id_users_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_created_by_user_id_users_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_tag_category_id_tag_categories_tag_category_id_fk" FOREIGN KEY ("tag_category_id") REFERENCES "public"."tag_categories"("tag_category_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_updated_by_user_id_users_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("user_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."terms"
    ADD CONSTRAINT "terms_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."terms"
    ADD CONSTRAINT "terms_school_id_schools_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("school_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."terms"
    ADD CONSTRAINT "terms_year_id_years_year_id_fk" FOREIGN KEY ("year_id") REFERENCES "public"."years"("year_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_school_memberships"
    ADD CONSTRAINT "user_school_memberships_school_id_schools_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("school_id");



ALTER TABLE ONLY "public"."user_school_memberships"
    ADD CONSTRAINT "user_school_memberships_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id");



CREATE POLICY "Allow Access to Non-Private Notes for Students in User Schools" ON "public"."meeting_notes" FOR SELECT TO "authenticated" USING ((("private" = false) AND (EXISTS ( SELECT 1
   FROM ("public"."user_school_memberships" "usm"
     JOIN "public"."school_student_link" "ssl" ON (("usm"."school_id" = "ssl"."school_id")))
  WHERE (("usm"."user_id" = "auth"."uid"()) AND ("ssl"."student_id" = "meeting_notes"."student_id"))))));



CREATE POLICY "Allow Access to Own Notes" ON "public"."meeting_notes" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Allow Delete Own Notes" ON "public"."meeting_notes" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Allow Insert Own Notes" ON "public"."meeting_notes" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Allow Reading of Courses" ON "public"."courses" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_school_memberships" "usm"
     CROSS JOIN LATERAL ( SELECT "public"."get_current_school_id"() AS "current_school_id") "app_context")
  WHERE (("usm"."user_id" = "auth"."uid"()) AND ("usm"."school_id" = "courses"."school_id") AND (("app_context"."current_school_id" IS NULL) OR ("usm"."school_id" = "app_context"."current_school_id"))))));



CREATE POLICY "Allow Reading of Schools" ON "public"."schools" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_school_memberships" "usm"
  WHERE (("usm"."user_id" = "auth"."uid"()) AND ("usm"."school_id" = "schools"."school_id")))));



CREATE POLICY "Allow Reading of Section Enrollments" ON "public"."section_enrollments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ((("public"."sections" "s"
     JOIN "public"."courses" "c" ON (("s"."course_id" = "c"."course_id")))
     JOIN "public"."user_school_memberships" "usm" ON (("usm"."school_id" = "c"."school_id")))
     CROSS JOIN LATERAL ( SELECT "public"."get_current_school_id"() AS "current_school_id") "app_context")
  WHERE (("s"."section_id" = "section_enrollments"."section_id") AND ("usm"."user_id" = "auth"."uid"()) AND (("app_context"."current_school_id" IS NULL) OR ("c"."school_id" = "app_context"."current_school_id"))))));



CREATE POLICY "Allow Reading of Sections" ON "public"."sections" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("public"."courses" "c"
     JOIN "public"."user_school_memberships" "usm" ON (("usm"."school_id" = "c"."school_id")))
     CROSS JOIN LATERAL ( SELECT "public"."get_current_school_id"() AS "current_school_id") "app_context")
  WHERE (("c"."course_id" = "sections"."course_id") AND ("usm"."user_id" = "auth"."uid"()) AND (("app_context"."current_school_id" IS NULL) OR ("c"."school_id" = "app_context"."current_school_id"))))));



CREATE POLICY "Allow Reading of Student Grades" ON "public"."student_grades" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ((("public"."sections" "s"
     JOIN "public"."courses" "c" ON (("s"."course_id" = "c"."course_id")))
     JOIN "public"."user_school_memberships" "usm" ON (("usm"."school_id" = "c"."school_id")))
     CROSS JOIN LATERAL ( SELECT "public"."get_current_school_id"() AS "current_school_id") "app_context")
  WHERE (("s"."section_id" = "student_grades"."section_id") AND ("usm"."user_id" = "auth"."uid"()) AND (("app_context"."current_school_id" IS NULL) OR ("c"."school_id" = "app_context"."current_school_id"))))));



CREATE POLICY "Allow Reading of Student School Links" ON "public"."school_student_link" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_school_memberships" "usm"
     CROSS JOIN LATERAL ( SELECT "public"."get_current_school_id"() AS "current_school_id") "app_context")
  WHERE (("usm"."user_id" = "auth"."uid"()) AND ("usm"."school_id" = "school_student_link"."school_id") AND (("app_context"."current_school_id" IS NULL) OR ("usm"."school_id" = "app_context"."current_school_id"))))));



CREATE POLICY "Allow Reading of Students" ON "public"."students" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."user_school_memberships" "usm"
     JOIN "public"."school_student_link" "ssl" ON (("usm"."school_id" = "ssl"."school_id")))
     CROSS JOIN LATERAL ( SELECT "public"."get_current_school_id"() AS "current_school_id") "app_context")
  WHERE (("usm"."user_id" = "auth"."uid"()) AND ("ssl"."student_id" = "students"."student_id") AND (("app_context"."current_school_id" IS NULL) OR ("ssl"."school_id" = "app_context"."current_school_id"))))));



CREATE POLICY "Allow Reading of Terms" ON "public"."terms" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_school_memberships" "usm"
     CROSS JOIN LATERAL ( SELECT "public"."get_current_school_id"() AS "current_school_id") "app_context")
  WHERE (("usm"."user_id" = "auth"."uid"()) AND ("usm"."school_id" = "terms"."school_id") AND (("app_context"."current_school_id" IS NULL) OR ("usm"."school_id" = "app_context"."current_school_id"))))));



CREATE POLICY "Allow Update Own Notes" ON "public"."meeting_notes" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meeting_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."school_student_link" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schools" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."section_enrollments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."student_grades" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."terms" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

















































































































































































GRANT ALL ON FUNCTION "public"."calculate_added_value_gpa"("p_student_id" "uuid", "p_grade_codes" "text"[], "p_credit_types" "text"[], "p_year_labels" "text"[], "p_grade_levels" integer[]) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_added_value_gpa"("p_student_id" "uuid", "p_grade_codes" "text"[], "p_credit_types" "text"[], "p_year_labels" "text"[], "p_grade_levels" integer[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_added_value_gpa"("p_student_id" "uuid", "p_grade_codes" "text"[], "p_credit_types" "text"[], "p_year_labels" "text"[], "p_grade_levels" integer[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_credit_hour_weighted_gpa"("p_student_id" "uuid", "p_grade_codes" "text"[], "p_credit_types" "text"[], "p_year_labels" "text"[], "p_grade_levels" integer[]) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_credit_hour_weighted_gpa"("p_student_id" "uuid", "p_grade_codes" "text"[], "p_credit_types" "text"[], "p_year_labels" "text"[], "p_grade_levels" integer[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_credit_hour_weighted_gpa"("p_student_id" "uuid", "p_grade_codes" "text"[], "p_credit_types" "text"[], "p_year_labels" "text"[], "p_grade_levels" integer[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_gpa_dispatch"("p_student_id" "uuid", "p_method" "text", "p_grade_codes" "text"[], "p_credit_types" "text"[], "p_year_labels" "text"[], "p_grade_levels" integer[]) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_gpa_dispatch"("p_student_id" "uuid", "p_method" "text", "p_grade_codes" "text"[], "p_credit_types" "text"[], "p_year_labels" "text"[], "p_grade_levels" integer[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_gpa_dispatch"("p_student_id" "uuid", "p_method" "text", "p_grade_codes" "text"[], "p_credit_types" "text"[], "p_year_labels" "text"[], "p_grade_levels" integer[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_gpa_for_students"("p_student_ids" "uuid"[], "p_method" "text", "p_grade_codes" "text"[], "p_credit_types" "text"[], "p_year_labels" "text"[], "p_grade_levels" integer[]) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_gpa_for_students"("p_student_ids" "uuid"[], "p_method" "text", "p_grade_codes" "text"[], "p_credit_types" "text"[], "p_year_labels" "text"[], "p_grade_levels" integer[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_gpa_for_students"("p_student_ids" "uuid"[], "p_method" "text", "p_grade_codes" "text"[], "p_credit_types" "text"[], "p_year_labels" "text"[], "p_grade_levels" integer[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_simple_gpa"("p_student_id" "uuid", "p_grade_codes" "text"[], "p_credit_types" "text"[], "p_year_labels" "text"[], "p_grade_levels" integer[]) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_simple_gpa"("p_student_id" "uuid", "p_grade_codes" "text"[], "p_credit_types" "text"[], "p_year_labels" "text"[], "p_grade_levels" integer[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_simple_gpa"("p_student_id" "uuid", "p_grade_codes" "text"[], "p_credit_types" "text"[], "p_year_labels" "text"[], "p_grade_levels" integer[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."execute_safe_select"("query_text" "text", "p_selected_school_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."execute_safe_select"("query_text" "text", "p_selected_school_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."execute_safe_select"("query_text" "text", "p_selected_school_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."public_configuration" TO "anon";
GRANT ALL ON TABLE "public"."public_configuration" TO "authenticated";
GRANT ALL ON TABLE "public"."public_configuration" TO "service_role";



GRANT ALL ON FUNCTION "public"."fetch_public_config"("p_config_key" "text", "p_user_id" "uuid", "p_school_id" "uuid", "p_customer_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fetch_public_config"("p_config_key" "text", "p_user_id" "uuid", "p_school_id" "uuid", "p_customer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fetch_public_config"("p_config_key" "text", "p_user_id" "uuid", "p_school_id" "uuid", "p_customer_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_school_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_school_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_school_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_student_grades"("p_student_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_student_grades"("p_student_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_student_grades"("p_student_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_last_n_years_final_terms_gpa"("p_student_id" "uuid", "p_n" integer, "p_grade_codes" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_last_n_years_final_terms_gpa"("p_student_id" "uuid", "p_n" integer, "p_grade_codes" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_last_n_years_final_terms_gpa"("p_student_id" "uuid", "p_n" integer, "p_grade_codes" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_public_table_schema"("p_table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_public_table_schema"("p_table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_public_table_schema"("p_table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_student_year_labels"("p_student_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_student_year_labels"("p_student_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_student_year_labels"("p_student_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."list_public_tables"() TO "anon";
GRANT ALL ON FUNCTION "public"."list_public_tables"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_public_tables"() TO "service_role";


















GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."student_grades" TO "anon";
GRANT ALL ON TABLE "public"."student_grades" TO "authenticated";
GRANT ALL ON TABLE "public"."student_grades" TO "service_role";



GRANT ALL ON TABLE "public"."latest_student_grades" TO "anon";
GRANT ALL ON TABLE "public"."latest_student_grades" TO "authenticated";
GRANT ALL ON TABLE "public"."latest_student_grades" TO "service_role";



GRANT ALL ON TABLE "public"."meeting_notes" TO "anon";
GRANT ALL ON TABLE "public"."meeting_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."meeting_notes" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON TABLE "public"."school_student_link" TO "anon";
GRANT ALL ON TABLE "public"."school_student_link" TO "authenticated";
GRANT ALL ON TABLE "public"."school_student_link" TO "service_role";



GRANT ALL ON TABLE "public"."schools" TO "anon";
GRANT ALL ON TABLE "public"."schools" TO "authenticated";
GRANT ALL ON TABLE "public"."schools" TO "service_role";



GRANT ALL ON TABLE "public"."section_enrollments" TO "anon";
GRANT ALL ON TABLE "public"."section_enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."section_enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."sections" TO "anon";
GRANT ALL ON TABLE "public"."sections" TO "authenticated";
GRANT ALL ON TABLE "public"."sections" TO "service_role";



GRANT ALL ON TABLE "public"."student_tags" TO "anon";
GRANT ALL ON TABLE "public"."student_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."student_tags" TO "service_role";



GRANT ALL ON TABLE "public"."students" TO "anon";
GRANT ALL ON TABLE "public"."students" TO "authenticated";
GRANT ALL ON TABLE "public"."students" TO "service_role";



GRANT ALL ON TABLE "public"."tag_canonical_values" TO "anon";
GRANT ALL ON TABLE "public"."tag_canonical_values" TO "authenticated";
GRANT ALL ON TABLE "public"."tag_canonical_values" TO "service_role";



GRANT ALL ON TABLE "public"."tag_categories" TO "anon";
GRANT ALL ON TABLE "public"."tag_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."tag_categories" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."terms" TO "anon";
GRANT ALL ON TABLE "public"."terms" TO "authenticated";
GRANT ALL ON TABLE "public"."terms" TO "service_role";



GRANT ALL ON TABLE "public"."user_school_memberships" TO "anon";
GRANT ALL ON TABLE "public"."user_school_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."user_school_memberships" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."years" TO "anon";
GRANT ALL ON TABLE "public"."years" TO "authenticated";
GRANT ALL ON TABLE "public"."years" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
