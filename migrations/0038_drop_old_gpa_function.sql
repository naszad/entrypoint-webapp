-- Custom SQL migration file, put your code below! --
-- Drop the old version of calculate_gpa_for_students that only takes p_student_ids
-- This resolves the function overloading conflict
DROP FUNCTION IF EXISTS calculate_gpa_for_students(p_student_ids UUID[]);