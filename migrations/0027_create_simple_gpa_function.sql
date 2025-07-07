-- Custom SQL migration file, put your code below! --
CREATE OR REPLACE FUNCTION calculate_simple_gpa(
  p_student_id   UUID,
  p_grade_codes  TEXT[]  DEFAULT NULL,
  p_grade_levels INT[]   DEFAULT NULL,
  p_credit_types TEXT[]  DEFAULT NULL,
  p_term_ids     UUID[]  DEFAULT NULL,
  p_use_percent  BOOLEAN DEFAULT FALSE
) RETURNS NUMERIC AS
$$
DECLARE
  total_points NUMERIC := 0;
  course_count INTEGER := 0;
  gpa          NUMERIC := NULL;
BEGIN
  SELECT
    COALESCE(SUM(
      CASE
        WHEN p_use_percent AND sg.grade_percent IS NOT NULL THEN
             (sg.grade_percent / 100.0) * 4.0      -- convert % to a 4.0 scale
        ELSE sg.gpa_points
      END), 0),
    COUNT(sg.grade_id)
  INTO total_points, course_count
  FROM student_grades sg
  WHERE sg.student_id = p_student_id
    AND sg.grade_status = 'Final' -- Assuming 'Final' indicates a completed grade
    AND (p_grade_codes  IS NULL OR sg.grade_code   = ANY(p_grade_codes))
    AND (p_grade_levels IS NULL OR sg.student_grade_level_at_time::INT = ANY(p_grade_levels))
    AND (p_credit_types IS NULL OR sg.credit_type  = ANY(p_credit_types))
    AND (p_term_ids     IS NULL OR sg.term_id      = ANY(p_term_ids));

  IF course_count > 0 THEN
    gpa := total_points / course_count;
  END IF;
  
  RETURN gpa;
END;
$$ LANGUAGE plpgsql;