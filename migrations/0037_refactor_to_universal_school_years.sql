-- Custom SQL migration file, put your code below! --

-- Step 1: Create the new universal school_years table
CREATE TABLE "school_years" (
  "school_year_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text UNIQUE NOT NULL,
  "start_year" integer NOT NULL,
  "end_year" integer NOT NULL,
  "nominal_start_date" date,
  "nominal_end_date" date,
  "is_current" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Step 2: Migrate unique year data from years table to school_years table
-- We'll deduplicate by name since years should be universal
INSERT INTO school_years (name, start_year, end_year, is_current, created_at, updated_at)
SELECT DISTINCT 
  name,
  year_start,
  year_end,
  false, -- We'll set current year manually later
  MIN(created_at) as created_at,
  MAX(updated_at) as updated_at
FROM years
GROUP BY name, year_start, year_end
ORDER BY year_start DESC;

-- Step 3: Set the most recent year as current
UPDATE school_years 
SET is_current = true 
WHERE school_year_id = (
  SELECT school_year_id 
  FROM school_years 
  ORDER BY start_year DESC 
  LIMIT 1
);

-- Step 4: Add temporary school_year_id column to terms table
ALTER TABLE terms ADD COLUMN school_year_id uuid;

-- Step 5: Populate the school_year_id in terms based on the year name mapping
UPDATE terms 
SET school_year_id = sy.school_year_id
FROM school_years sy
JOIN years y ON sy.name = y.name
WHERE terms.year_id = y.year_id;

-- Step 6: Make school_year_id NOT NULL after population
ALTER TABLE terms ALTER COLUMN school_year_id SET NOT NULL;

-- Step 7: Add foreign key constraint for school_year_id
ALTER TABLE terms ADD CONSTRAINT "terms_school_year_id_school_years_school_year_id_fk" 
  FOREIGN KEY ("school_year_id") REFERENCES "school_years"("school_year_id") ON DELETE cascade ON UPDATE cascade;

-- Step 8: Drop the old year_id foreign key constraint and column
ALTER TABLE terms DROP CONSTRAINT "terms_year_id_years_year_id_fk";
ALTER TABLE terms DROP COLUMN year_id;

-- Step 9: Update any GPA functions that reference years table to use school_years
-- Update calculate_simple_gpa
CREATE OR REPLACE FUNCTION calculate_simple_gpa(
  p_student_id   UUID,
  p_grade_codes  TEXT[]  DEFAULT NULL,
  p_credit_types TEXT[]  DEFAULT NULL,
  p_year_labels  TEXT[]  DEFAULT NULL
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
    AND sg.exclude_from_gpa IS NOT TRUE
    AND (p_grade_codes  IS NULL OR sg.grade_code   = ANY(p_grade_codes))
    AND (p_credit_types IS NULL OR sg.credit_type  = ANY(p_credit_types))
    AND (p_year_labels  IS NULL OR sg.term_id      = ANY(term_ids_for_years));

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
  p_credit_types TEXT[]  DEFAULT NULL,
  p_year_labels  TEXT[]  DEFAULT NULL
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
    AND sg.exclude_from_gpa IS NOT TRUE
    AND (p_grade_codes  IS NULL OR sg.grade_code   = ANY(p_grade_codes))
    AND (p_credit_types IS NULL OR sg.credit_type  = ANY(p_credit_types))
    AND (p_year_labels  IS NULL OR sg.term_id      = ANY(term_ids_for_years));

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
  p_credit_types TEXT[]  DEFAULT NULL,
  p_year_labels  TEXT[]  DEFAULT NULL
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
    AND (p_year_labels  IS NULL OR sg.term_id      = ANY(term_ids_for_years));

  IF total_credits > 0 THEN
    gpa := total_points / total_credits;
  END IF;
  
  RETURN gpa;
END;
$$ LANGUAGE plpgsql;

-- Update get_student_year_labels function
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

-- Step 10: Drop the old years table
DROP TABLE years;