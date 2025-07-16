-- Custom SQL migration file, put your code below! --
CREATE OR REPLACE FUNCTION calculate_gpa_for_students(p_student_ids UUID[])
RETURNS TABLE(student_id UUID, gpa NUMERIC) AS $$
DECLARE
    gpa_config_row RECORD;
    school_row RECORD;
    method TEXT;
BEGIN
    -- This function is designed to be called for a set of students from a single school.
    -- It fetches the GPA calculation method from the school associated with the first student in the list.
    -- This assumes all students in the batch belong to the same school.

    -- Get the school for the first student to determine the GPA calculation method
    SELECT s.* INTO school_row
    FROM schools s
    JOIN school_student_link ssl ON s.school_id = ssl.school_id
    WHERE ssl.student_id = p_student_ids[1];

    IF school_row IS NULL THEN
        -- Default to simple if school not found
        method := 'simple';
    ELSE
        -- Determine the method from gpa_config
        method := COALESCE((school_row.gpa_config->>'default_method')::TEXT, 'simple');
    END IF;

    -- Using the determined method, calculate GPA for all students in the list.
    -- The calculate_gpa_dispatch function is called for each student.
    RETURN QUERY
    SELECT
        s.id as student_id,
        calculate_gpa_dispatch(s.id, method) as gpa
    FROM
        unnest(p_student_ids) AS s(id);

END;
$$ LANGUAGE plpgsql;