-- Custom SQL migration file, put your code below! --

-- Update calculate_simple_gpa
CREATE OR REPLACE FUNCTION calculate_simple_gpa(
  p_student_id   UUID,
  p_grade_codes  TEXT[]  DEFAULT NULL,
  p_grade_levels INT[]   DEFAULT NULL,
  p_credit_types TEXT[]  DEFAULT NULL,
  p_year_label   TEXT    DEFAULT NULL -- Changed from p_term_ids
) RETURNS NUMERIC AS
$$
DECLARE
  total_points NUMERIC := 0;
  course_count INTEGER := 0;
  gpa          NUMERIC := NULL;
  term_ids_for_year UUID[];
BEGIN
  -- If p_year_label is provided, get the corresponding term_ids
  IF p_year_label IS NOT NULL THEN
    SELECT ARRAY_AGG(t.term_id) INTO term_ids_for_year
    FROM terms t
    JOIN years y ON t.year_id = y.year_id
    WHERE y.label = p_year_label;
  END IF;

  SELECT
    COALESCE(SUM(sg.gpa_points), 0),
    COUNT(sg.grade_id)
  INTO total_points, course_count
  FROM student_grades sg
  WHERE sg.student_id = p_student_id
    AND sg.grade_status = 'Final'
    AND sg.exclude_from_gpa IS NOT TRUE
    AND (p_grade_codes  IS NULL OR sg.grade_code   = ANY(p_grade_codes))
    AND (p_grade_levels IS NULL OR sg.grade_level::INT = ANY(p_grade_levels))
    AND (p_credit_types IS NULL OR sg.credit_type  = ANY(p_credit_types))
    AND (p_year_label   IS NULL OR sg.term_id      = ANY(term_ids_for_year)); -- Use the resolved term_ids

  IF course_count > 0 THEN
    gpa := total_points / course_count;
  END IF;
  
  RETURN gpa;
END;
$$ LANGUAGE plpgsql;


-- Update calculate_added_value_gpa
CREATE OR REPLACE FUNCTION calculate_added_value_gpa(
  p_student_id   UUID,
  p_grade_codes  TEXT[]  DEFAULT NULL,
  p_grade_levels INT[]   DEFAULT NULL,
  p_credit_types TEXT[]  DEFAULT NULL,
  p_year_label   TEXT    DEFAULT NULL
) RETURNS NUMERIC AS
$$
DECLARE
  total_points NUMERIC := 0;
  course_count INTEGER := 0;
  gpa          NUMERIC := NULL;
  term_ids_for_year UUID[];
BEGIN
  -- If p_year_label is provided, get the corresponding term_ids
  IF p_year_label IS NOT NULL THEN
    SELECT ARRAY_AGG(t.term_id) INTO term_ids_for_year
    FROM terms t
    JOIN years y ON t.year_id = y.year_id
    WHERE y.label = p_year_label;
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
    AND (p_grade_levels IS NULL OR sg.grade_level::INT = ANY(p_grade_levels))
    AND (p_credit_types IS NULL OR sg.credit_type  = ANY(p_credit_types))
    AND (p_year_label   IS NULL OR sg.term_id      = ANY(term_ids_for_year));

  IF course_count > 0 THEN
    gpa := total_points / course_count;
  END IF;
  
  RETURN gpa;
END;
$$ LANGUAGE plpgsql;


-- Update calculate_credit_hour_weighted_gpa
CREATE OR REPLACE FUNCTION calculate_credit_hour_weighted_gpa(
  p_student_id   UUID,
  p_grade_codes  TEXT[]  DEFAULT NULL,
  p_grade_levels INT[]   DEFAULT NULL,
  p_credit_types TEXT[]  DEFAULT NULL,
  p_year_label   TEXT    DEFAULT NULL
) RETURNS NUMERIC AS
$$
DECLARE
  total_points NUMERIC := 0;
  total_credits NUMERIC := 0;
  gpa           NUMERIC := NULL;
  term_ids_for_year UUID[];
BEGIN
  -- If p_year_label is provided, get the corresponding term_ids
  IF p_year_label IS NOT NULL THEN
    SELECT ARRAY_AGG(t.term_id) INTO term_ids_for_year
    FROM terms t
    JOIN years y ON t.year_id = y.year_id
    WHERE y.label = p_year_label;
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
    AND (p_grade_levels IS NULL OR sg.grade_level::INT = ANY(p_grade_levels))
    AND (p_credit_types IS NULL OR sg.credit_type  = ANY(p_credit_types))
    AND (p_year_label   IS NULL OR sg.term_id      = ANY(term_ids_for_year));

  IF total_credits > 0 THEN
    gpa := total_points / total_credits;
  END IF;
  
  RETURN gpa;
END;
$$ LANGUAGE plpgsql;


-- Update calculate_gpa_dispatch
CREATE OR REPLACE FUNCTION calculate_gpa_dispatch(
  p_student_id   UUID,
  p_method       TEXT    DEFAULT NULL,
  p_grade_codes  TEXT[]  DEFAULT NULL,
  p_grade_levels INT[]   DEFAULT NULL,
  p_credit_types TEXT[]  DEFAULT NULL,
  p_year_label   TEXT    DEFAULT NULL -- Changed from p_term_ids
) RETURNS NUMERIC AS
$$
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
        p_grade_levels,
        p_credit_types,
        p_year_label
      ) INTO gpa;
    WHEN 'added_value' THEN
      SELECT calculate_added_value_gpa(
        p_student_id,
        p_grade_codes,
        p_grade_levels,
        p_credit_types,
        p_year_label
      ) INTO gpa;
    WHEN 'credit_hour_weighted' THEN
      SELECT calculate_credit_hour_weighted_gpa(
        p_student_id,
        p_grade_codes,
        p_grade_levels,
        p_credit_types,
        p_year_label
      ) INTO gpa;
    ELSE
      RAISE EXCEPTION 'Unknown GPA calculation method: %', resolved_method;
  END CASE;

  RETURN gpa;
END;
$$ LANGUAGE plpgsql;