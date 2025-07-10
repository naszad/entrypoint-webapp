-- Custom SQL migration file, put your code below!
CREATE OR REPLACE FUNCTION calculate_credit_hour_weighted_gpa(
  p_student_id   UUID,
  p_grade_codes  TEXT[]  DEFAULT NULL,
  p_grade_levels INT[]   DEFAULT NULL,
  p_credit_types TEXT[]  DEFAULT NULL,
  p_term_ids     UUID[]  DEFAULT NULL,
  p_use_percent  BOOLEAN DEFAULT FALSE
) RETURNS NUMERIC AS
$$
DECLARE
  total_weighted_points NUMERIC := 0;
  total_credit_hours    NUMERIC := 0;
  gpa                   NUMERIC := NULL;
BEGIN
  SELECT
    COALESCE(SUM(
      (CASE
        WHEN p_use_percent AND sg.grade_percent IS NOT NULL THEN
             (sg.grade_percent / 100.0) * 4.0
        ELSE sg.grade_points
      END) * COALESCE(s.credit_hours, 0)
    ), 0),
    COALESCE(SUM(s.credit_hours), 0)
  INTO total_weighted_points, total_credit_hours
  FROM student_grades sg
  JOIN sections s ON sg.section_id = s.section_id
  WHERE sg.student_id = p_student_id
    AND sg.grade_status = 'Final'
    AND (p_grade_codes  IS NULL OR sg.grade_code   = ANY(p_grade_codes))
    AND (p_grade_levels IS NULL OR sg.grade_level::INT = ANY(p_grade_levels))
    AND (p_credit_types IS NULL OR sg.credit_type  = ANY(p_credit_types))
    AND (p_term_ids     IS NULL OR sg.term_id      = ANY(p_term_ids));

  IF total_credit_hours > 0 THEN
    gpa := total_weighted_points / total_credit_hours;
  END IF;
  
  RETURN gpa;
END;
$$ LANGUAGE plpgsql;