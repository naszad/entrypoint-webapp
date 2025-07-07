-- Custom SQL migration file, put your code below! --
CREATE OR REPLACE FUNCTION calculate_gpa_dispatch(
  p_student_id   UUID,
  p_method       TEXT    DEFAULT NULL,
  p_grade_codes  TEXT[]  DEFAULT NULL,
  p_grade_levels INT[]   DEFAULT NULL,
  p_credit_types TEXT[]  DEFAULT NULL,
  p_term_ids     UUID[]  DEFAULT NULL,
  p_use_percent  BOOLEAN DEFAULT FALSE
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
    ORDER BY ssl.start_date DESC -- Assuming student can be in multiple schools over time
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
        p_term_ids,
        p_use_percent
      ) INTO gpa;
    -- TODO: Add other cases for 'added_value', 'credit_hour_weighted', etc.
    -- WHEN 'added_value' THEN
    --   gpa := calculate_added_value_gpa(...);
    ELSE
      -- Optionally, raise an exception for an unknown method
      RAISE EXCEPTION 'Unknown GPA calculation method: %', resolved_method;
  END CASE;

  RETURN gpa;
END;
$$ LANGUAGE plpgsql;
