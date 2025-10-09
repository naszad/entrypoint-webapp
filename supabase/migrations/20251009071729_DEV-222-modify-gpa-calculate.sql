-- Modify calculate_gpa_dispatch function to accept customer_id and fetch configurations
CREATE OR REPLACE FUNCTION "public"."calculate_gpa_dispatch"(
  "p_student_id" "uuid", 
  "p_method" "text" DEFAULT NULL::"text", 
  "p_grade_codes" "text"[] DEFAULT NULL::"text"[], 
  "p_credit_types" "text"[] DEFAULT NULL::"text"[], 
  "p_year_labels" "text"[] DEFAULT NULL::"text"[], 
  "p_grade_levels" integer[] DEFAULT NULL::integer[]
) RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  resolved_method TEXT;
  school_id_val   UUID;
  customer_id_val UUID;
  gpa             NUMERIC;
  config_value    JSONB;
BEGIN
  -- Log input parameters
  RAISE NOTICE '=== calculate_gpa_dispatch called ===';
  RAISE NOTICE 'p_student_id: %', p_student_id;
  RAISE NOTICE 'p_method: %', p_method;
  RAISE NOTICE 'p_grade_codes: %', p_grade_codes;
  RAISE NOTICE 'p_credit_types: %', p_credit_types;
  RAISE NOTICE 'p_year_labels: %', p_year_labels;
  RAISE NOTICE 'p_grade_levels: %', p_grade_levels;
  -- Always derive customer_id from student's school
  RAISE NOTICE 'Looking up customer_id from student school...';
  -- Find the school_id for the given student
  SELECT ssl.school_id INTO school_id_val
  FROM school_student_link ssl
  WHERE ssl.student_id = p_student_id
  ORDER BY ssl.start_date DESC
  LIMIT 1;

  RAISE NOTICE 'Found school_id: %', school_id_val;

  -- Get customer_id from school if school is found
  IF school_id_val IS NOT NULL THEN
    SELECT s.customer_id INTO customer_id_val
    FROM schools s
    WHERE s.school_id = school_id_val;
    RAISE NOTICE 'Derived customer_id from school: %', customer_id_val;
  ELSE
    RAISE NOTICE 'No school found for student';
  END IF;

  -- If p_method is NULL, look up the default method from configurations
  IF p_method IS NULL THEN
    RAISE NOTICE 'No method provided, looking up from configurations...';
    -- First try to get method from customer-level configuration
    IF customer_id_val IS NOT NULL THEN
      RAISE NOTICE 'Checking customer-level config for customer_id: %', customer_id_val;
      SELECT pc.value INTO config_value
      FROM public_configuration pc
      WHERE pc.config_key = 'gpa_grade_levels'
        AND pc.customer_id = customer_id_val
        AND pc.school_id IS NULL
        AND pc.user_id IS NULL
      LIMIT 1;
      
      IF config_value IS NOT NULL THEN
        RAISE NOTICE 'Found customer-level config: %', config_value;
        -- Parse grade codes from config if available
        IF config_value ? 'grade_codes' THEN
          p_grade_codes := ARRAY(SELECT jsonb_array_elements_text(config_value->'grade_codes'));
          RAISE NOTICE 'Parsed grade_codes from config: %', p_grade_codes;
        END IF;
      ELSE
        RAISE NOTICE 'No customer-level config found';
      END IF;
    END IF;
    
    -- If no customer-level config found, try school-level config
    IF resolved_method IS NULL AND school_id_val IS NOT NULL THEN
      RAISE NOTICE 'Checking school-level config for school_id: %', school_id_val;
      SELECT s.gpa_config->>'default_method' INTO resolved_method
      FROM schools s
      WHERE s.school_id = school_id_val;
      RAISE NOTICE 'Resolved method from school config: %', resolved_method;
    END IF;
  ELSE
    resolved_method := p_method;
    RAISE NOTICE 'Using provided method: %', resolved_method;
  END IF;

  -- Default to 'simple' if no method is resolved
  IF resolved_method IS NULL THEN
    resolved_method := 'simple';
    RAISE NOTICE 'No method resolved, defaulting to: %', resolved_method;
  END IF;

  RAISE NOTICE 'Final resolved method: %', resolved_method;

  -- Dispatch to the correct calculation function based on the method
  CASE resolved_method
    WHEN 'simple' THEN
      RAISE NOTICE 'Calling calculate_simple_gpa...';
      SELECT calculate_simple_gpa(
        p_student_id,
        p_grade_codes,
        p_credit_types,
        p_year_labels,
        p_grade_levels
      ) INTO gpa;
    WHEN 'added_value' THEN
      RAISE NOTICE 'Calling calculate_added_value_gpa...';
      SELECT calculate_added_value_gpa(
        p_student_id,
        p_grade_codes,
        p_credit_types,
        p_year_labels,
        p_grade_levels
      ) INTO gpa;
    WHEN 'credit_hour_weighted' THEN
      RAISE NOTICE 'Calling calculate_credit_hour_weighted_gpa...';
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

  RAISE NOTICE 'Calculated GPA: %', gpa;
  RAISE NOTICE '=== calculate_gpa_dispatch completed ===';

  RETURN gpa;
END;
$$;

-- Update the function ownership
ALTER FUNCTION "public"."calculate_gpa_dispatch"(
  "p_student_id" "uuid", 
  "p_method" "text", 
  "p_grade_codes" "text"[], 
  "p_credit_types" "text"[], 
  "p_year_labels" "text"[], 
  "p_grade_levels" integer[]
) OWNER TO "postgres";

-- Also update calculate_gpa_for_students function
CREATE OR REPLACE FUNCTION "public"."calculate_gpa_for_students"(
  "p_student_ids" "uuid"[], 
  "p_method" "text" DEFAULT NULL::"text", 
  "p_grade_codes" "text"[] DEFAULT NULL::"text"[], 
  "p_credit_types" "text"[] DEFAULT NULL::"text"[], 
  "p_year_labels" "text"[] DEFAULT NULL::"text"[], 
  "p_grade_levels" integer[] DEFAULT NULL::integer[]
) RETURNS TABLE("student_id" "uuid", "gpa" numeric)
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

-- Update the function ownership
ALTER FUNCTION "public"."calculate_gpa_for_students"(
  "p_student_ids" "uuid"[], 
  "p_method" "text", 
  "p_grade_codes" "text"[], 
  "p_credit_types" "text"[], 
  "p_year_labels" "text"[], 
  "p_grade_levels" integer[]
) OWNER TO "postgres";

-- Grant permissions
GRANT ALL ON FUNCTION "public"."calculate_gpa_dispatch"(
  "p_student_id" "uuid", 
  "p_method" "text", 
  "p_grade_codes" "text"[], 
  "p_credit_types" "text"[], 
  "p_year_labels" "text"[], 
  "p_grade_levels" integer[]
) TO "anon";

GRANT ALL ON FUNCTION "public"."calculate_gpa_dispatch"(
  "p_student_id" "uuid", 
  "p_method" "text", 
  "p_grade_codes" "text"[], 
  "p_credit_types" "text"[], 
  "p_year_labels" "text"[], 
  "p_grade_levels" integer[]
) TO "authenticated";

GRANT ALL ON FUNCTION "public"."calculate_gpa_dispatch"(
  "p_student_id" "uuid", 
  "p_method" "text", 
  "p_grade_codes" "text"[], 
  "p_credit_types" "text"[], 
  "p_year_labels" "text"[], 
  "p_grade_levels" integer[]
) TO "service_role";

GRANT ALL ON FUNCTION "public"."calculate_gpa_for_students"(
  "p_student_ids" "uuid"[], 
  "p_method" "text", 
  "p_grade_codes" "text"[], 
  "p_credit_types" "text"[], 
  "p_year_labels" "text"[], 
  "p_grade_levels" integer[]
) TO "anon";

GRANT ALL ON FUNCTION "public"."calculate_gpa_for_students"(
  "p_student_ids" "uuid"[], 
  "p_method" "text", 
  "p_grade_codes" "text"[], 
  "p_credit_types" "text"[], 
  "p_year_labels" "text"[], 
  "p_grade_levels" integer[]
) TO "authenticated";

GRANT ALL ON FUNCTION "public"."calculate_gpa_for_students"(
  "p_student_ids" "uuid"[], 
  "p_method" "text", 
  "p_grade_codes" "text"[], 
  "p_credit_types" "text"[], 
  "p_year_labels" "text"[], 
  "p_grade_levels" integer[]
) TO "service_role";

-- Create updated GPA calculation functions with exclude_from_gpa filter and  suffix
CREATE OR REPLACE FUNCTION "public"."calculate_simple_gpa"("p_student_id" "uuid", "p_grade_codes" "text"[] DEFAULT NULL::"text"[], "p_credit_types" "text"[] DEFAULT NULL::"text"[], "p_year_labels" "text"[] DEFAULT NULL::"text"[], "p_grade_levels" integer[] DEFAULT NULL::integer[]) RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  total_points    NUMERIC := 0;
  total_credits   NUMERIC := 0;
  gpa             NUMERIC := NULL;
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
    COALESCE(COUNT(*), 0)
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
    AND (p_grade_levels IS NULL OR sg.grade_level::integer = ANY(p_grade_levels))
    AND (sg.exclude_from_gpa IS FALSE);

  IF total_credits > 0 THEN
    gpa := ROUND(total_points / total_credits, 4);
  END IF;
  
  RETURN gpa;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."calculate_added_value_gpa"("p_student_id" "uuid", "p_grade_codes" "text"[] DEFAULT NULL::"text"[], "p_credit_types" "text"[] DEFAULT NULL::"text"[], "p_year_labels" "text"[] DEFAULT NULL::"text"[], "p_grade_levels" integer[] DEFAULT NULL::integer[]) RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  total_points    NUMERIC := 0;
  total_credits   NUMERIC := 0;
  gpa             NUMERIC := NULL;
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
    COALESCE(COUNT(*), 0)
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
    AND (p_grade_levels IS NULL OR sg.grade_level::integer = ANY(p_grade_levels))
    AND (sg.exclude_from_gpa IS FALSE);

  IF total_credits > 0 THEN
    gpa := ROUND(total_points / total_credits, 4);
  END IF;
  
  RETURN gpa;
END;
$$;

-- Also update calculate_credit_hour_weighted_gpa function to include the exclude_from_gpa filter
CREATE OR REPLACE FUNCTION "public"."calculate_credit_hour_weighted_gpa"("p_student_id" "uuid", "p_grade_codes" "text"[] DEFAULT NULL::"text"[], "p_credit_types" "text"[] DEFAULT NULL::"text"[], "p_year_labels" "text"[] DEFAULT NULL::"text"[], "p_grade_levels" integer[] DEFAULT NULL::integer[]) RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  total_points    NUMERIC := 0;
  total_credits   NUMERIC := 0;
  gpa             NUMERIC := NULL;
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
    AND (p_grade_levels IS NULL OR sg.grade_level::integer = ANY(p_grade_levels))
    AND (sg.exclude_from_gpa IS FALSE);

  IF total_credits > 0 THEN
    gpa := ROUND(total_points / total_credits, 4);
  END IF;
  
  RETURN gpa;
END;
$$;

<<<<<<< HEAD
CREATE INDEX idx_student_grades_student_final 
=======
CREATE INDEX IF NOT EXISTS idx_student_grades_student_final 
>>>>>>> bfdaae9e35994f7daef348f9130fecb3cad83014
ON student_grades (student_id, grade_status) 
WHERE grade_status = 'Final';