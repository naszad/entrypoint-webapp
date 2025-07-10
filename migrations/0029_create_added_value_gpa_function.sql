-- Custom SQL migration file, put your code below!
CREATE OR REPLACE FUNCTION calculate_added_value_gpa(
  p_student_id   UUID,
  p_grade_codes  TEXT[]  DEFAULT NULL,
  p_grade_levels INT[]   DEFAULT NULL,
  p_credit_types TEXT[]  DEFAULT NULL,
  p_term_ids     UUID[]  DEFAULT NULL
) RETURNS NUMERIC AS
$$
DECLARE
  total_points NUMERIC := 0;
  course_count INTEGER := 0;
  gpa          NUMERIC := NULL;
  school_id_val UUID;
  v_gpa_config JSONB;
BEGIN
  -- Get school_id for the student
  SELECT ssl.school_id INTO school_id_val
  FROM school_student_link ssl
  WHERE ssl.student_id = p_student_id
  ORDER BY ssl.start_date DESC
  LIMIT 1;

  -- Get the gpa_config for the school
  IF school_id_val IS NOT NULL THEN
    SELECT s.gpa_config INTO v_gpa_config
    FROM schools s
    WHERE s.school_id = school_id_val;
  END IF;

  SELECT
    COALESCE(SUM(
      sg.grade_points + COALESCE(
        (
          SELECT (rule->>'value')::NUMERIC
          FROM
            jsonb_array_elements(v_gpa_config->'added_value_rules') AS rule,
            LATERAL jsonb_array_elements_text(rule->'applies_to') AS c
          WHERE (rule->>'field' = 'credit_type' AND c = sg.credit_type)
             OR (rule->>'field' = 'course_code' AND c = co.local_course_code)
          LIMIT 1
        ), 0)
    ), 0),
    COUNT(sg.grade_id)
  INTO total_points, course_count
  FROM student_grades sg
  JOIN courses co ON sg.course_id = co.course_id
  WHERE sg.student_id = p_student_id
    AND sg.grade_status = 'Final'
    AND (p_grade_codes  IS NULL OR sg.grade_code   = ANY(p_grade_codes))
    AND (p_grade_levels IS NULL OR sg.grade_level::INT = ANY(p_grade_levels))
    AND (p_credit_types IS NULL OR sg.credit_type  = ANY(p_credit_types))
    AND (p_term_ids     IS NULL OR sg.term_id      = ANY(p_term_ids));

  IF course_count > 0 THEN
    gpa := total_points / course_count;
  END IF;
  
  RETURN gpa;
END;
$$ LANGUAGE plpgsql;