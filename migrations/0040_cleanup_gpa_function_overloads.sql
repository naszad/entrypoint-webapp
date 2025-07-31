-- Custom SQL migration file, put your code below! --

-- Drop old overloaded functions
DROP FUNCTION IF EXISTS calculate_simple_gpa(uuid, text[], integer[], text[], uuid[]);
DROP FUNCTION IF EXISTS calculate_simple_gpa(uuid, text[], integer[], text[], text);
DROP FUNCTION IF EXISTS calculate_added_value_gpa(uuid, text[], integer[], text[], uuid[]);
DROP FUNCTION IF EXISTS calculate_added_value_gpa(uuid, text[], integer[], text[], text);
DROP FUNCTION IF EXISTS calculate_credit_hour_weighted_gpa(uuid, text[], integer[], text[], uuid[]);
DROP FUNCTION IF EXISTS calculate_credit_hour_weighted_gpa(uuid, text[], integer[], text[], text);
DROP FUNCTION IF EXISTS calculate_gpa_dispatch(uuid, text, text[], integer[], text[], uuid[]);
DROP FUNCTION IF EXISTS calculate_gpa_dispatch(uuid, text, text[], integer[], text[], text);
DROP FUNCTION IF EXISTS calculate_simple_gpa(uuid, text[], text[], text[]);
DROP FUNCTION IF EXISTS calculate_added_value_gpa(uuid, text[], text[], text[]);
DROP FUNCTION IF EXISTS calculate_credit_hour_weighted_gpa(uuid, text[], text[], text[]);
DROP FUNCTION IF EXISTS calculate_gpa_dispatch(uuid, text, text[], text[], text[]);
DROP FUNCTION IF EXISTS calculate_gpa_for_students(uuid[], text, text[], text[], text[]);

-- Recreate latest functions with correct bodies

-- calculate_simple_gpa
CREATE OR REPLACE FUNCTION calculate_simple_gpa(
  p_student_id   UUID,
  p_grade_codes  TEXT[]  DEFAULT NULL,
  p_credit_types TEXT[]  DEFAULT NULL,
  p_year_labels  TEXT[]  DEFAULT NULL,
  p_grade_levels INTEGER[]  DEFAULT NULL
) RETURNS NUMERIC AS
$$
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
    JOIN school_years sy ON t.school_year_id = sy.school_year_id
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
$$ LANGUAGE plpgsql;

-- calculate_added_value_gpa (fixed version)
CREATE OR REPLACE FUNCTION calculate_added_value_gpa(
  p_student_id   UUID,
  p_grade_codes  TEXT[]  DEFAULT NULL,
  p_credit_types TEXT[]  DEFAULT NULL,
  p_year_labels  TEXT[]  DEFAULT NULL,
  p_grade_levels INTEGER[]  DEFAULT NULL
) RETURNS NUMERIC AS
$$
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
    JOIN school_years sy ON t.school_year_id = sy.school_year_id
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
$$ LANGUAGE plpgsql;

-- calculate_credit_hour_weighted_gpa
CREATE OR REPLACE FUNCTION calculate_credit_hour_weighted_gpa(
  p_student_id   UUID,
  p_grade_codes  TEXT[]  DEFAULT NULL,
  p_credit_types TEXT[]  DEFAULT NULL,
  p_year_labels  TEXT[]  DEFAULT NULL,
  p_grade_levels INTEGER[]  DEFAULT NULL
) RETURNS NUMERIC AS
$$
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
    JOIN school_years sy ON t.school_year_id = sy.school_year_id
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
$$ LANGUAGE plpgsql;

-- calculate_gpa_dispatch
CREATE OR REPLACE FUNCTION calculate_gpa_dispatch(
  p_student_id   UUID,
  p_method       TEXT    DEFAULT NULL,
  p_grade_codes  TEXT[]  DEFAULT NULL,
  p_credit_types TEXT[]  DEFAULT NULL,
  p_year_labels  TEXT[]  DEFAULT NULL,
  p_grade_levels INTEGER[]  DEFAULT NULL
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
$$ LANGUAGE plpgsql;

-- calculate_gpa_for_students
CREATE OR REPLACE FUNCTION calculate_gpa_for_students(
  p_student_ids  UUID[],
  p_method       TEXT    DEFAULT NULL,
  p_grade_codes  TEXT[]  DEFAULT NULL,
  p_credit_types TEXT[]  DEFAULT NULL,
  p_year_labels  TEXT[]  DEFAULT NULL,
  p_grade_levels INTEGER[]  DEFAULT NULL
)
RETURNS TABLE(student_id UUID, gpa NUMERIC) AS $$
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
$$ LANGUAGE plpgsql;

-- get_student_year_labels
CREATE OR REPLACE FUNCTION get_student_year_labels(p_student_id UUID)
RETURNS TEXT[] AS $$
DECLARE
    year_labels TEXT[];
BEGIN
    SELECT ARRAY_AGG(DISTINCT sy.name ORDER BY sy.name DESC) INTO year_labels
    FROM student_grades sg
    JOIN terms t ON sg.term_id = t.term_id
    JOIN school_years sy ON t.school_year_id = sy.school_year_id
    WHERE sg.student_id = p_student_id;
    
    RETURN year_labels;
END;
$$ LANGUAGE plpgsql;

-- get_current_student_grades
-- Returns the latest in-progress grade for each course the student is currently enrolled in (based on section_enrollments dates)
-- along with the term abbreviation so the UI can easily identify the current grading term.
--
-- Parameters:
--   p_student_id – id of the student to query
--
-- Result columns:
--   course_id          – UUID of the course
--   course_name        – Course name
--   course_number      – Local course code / number
--   grade_letter       – Latest letter grade (can be NULL if no grade yet)
--   grade_percent      – Latest grade percentage (can be NULL)
--   updated_at         – Timestamp the grade was last updated (can be NULL)
--   term_abbreviation  – Abbreviation for the term (e.g. Q3) that the enrollment/grade belongs to
--
-- NOTE:
--   • "Currently enrolled" means (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()).
--   • We consider only grades with grade_status = 'InProgress'.
--   • If multiple grade rows exist for the same course, we pick the most recently updated row.
--   • If a student is enrolled in multiple sections of the same course concurrently, the most recent grade across those sections is returned.

CREATE OR REPLACE FUNCTION get_current_student_grades(p_student_id UUID)
RETURNS TABLE(
    course_id       UUID,
    course_name     TEXT,
    course_number   TEXT,
    grade_letter    TEXT,
    grade_percent   NUMERIC,
    updated_at      TIMESTAMP WITH TIME ZONE,
    term_abbreviation TEXT
) AS $$
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
$$ LANGUAGE plpgsql;