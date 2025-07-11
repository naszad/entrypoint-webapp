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
BEGIN
  SELECT
    COALESCE(SUM(sg.gpa_points + COALESCE(sg.gpa_added_value, 0)), 0),
    COUNT(sg.grade_id)
  INTO total_points, course_count
  FROM student_grades sg
  WHERE sg.student_id = p_student_id
    AND sg.grade_status = 'Final'
    AND sg.exclude_from_gpa IS NOT TRUE
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