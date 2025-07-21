-- !!!                                                                                           !!!
-- !!!            DO NOT EVER ACCIDENTALLY RUN THIS FILE IN YOUR PRODUCTION DATABASE             !!!
-- !!!    This is meant for running locally to seed your database for contributing purposes      !!!

DO $$
DECLARE
  -- Student IDs
  emma_johnson_student_id uuid;
  michael_chen_student_id uuid;
  sophia_rodriguez_student_id uuid;

  -- School ID
  lincoln_high_school_id uuid;

  -- Year IDs
  year_2324_id uuid;
  year_2425_id uuid;

  -- Term IDs
  q1_2425_term_id uuid;
  q2_2425_term_id uuid;
  q3_2425_term_id uuid;
  q4_2425_term_id uuid;
  s1_2425_term_id uuid;
  s2_2425_term_id uuid;
  q1_2324_term_id uuid;
  q2_2324_term_id uuid;
  q3_2324_term_id uuid;
  q4_2324_term_id uuid;
  s1_2324_term_id uuid;
  s2_2324_term_id uuid;

  -- Course IDs
  english_10a_course_id uuid;
  english_10b_course_id uuid;
  algebra_1a_course_id uuid;
  algebra_1b_course_id uuid;
  us_history_a_course_id uuid;
  us_history_b_course_id uuid;
  biology_1a_course_id uuid;
  biology_1b_course_id uuid;
  english_11a_course_id uuid;
  english_11b_course_id uuid;

  -- Section IDs
  english_10a_section_id uuid;
  english_10b_section_id uuid;
  algebra_1a_section_id uuid;
  algebra_1b_section_id uuid;
  us_history_a_section_id uuid;
  us_history_b_section_id uuid;
  biology_1a_section_id uuid;
  biology_1b_section_id uuid;
  english_11a_section_id uuid;
  english_11b_section_id uuid;

BEGIN
  -- Get Student IDs
  SELECT student_id INTO emma_johnson_student_id FROM students WHERE email = 'emma.johnson@student.edu' LIMIT 1;
  SELECT student_id INTO michael_chen_student_id FROM students WHERE email = 'michael.chen@student.edu' LIMIT 1;
  SELECT student_id INTO sophia_rodriguez_student_id FROM students WHERE email = 'sophia.rodriguez@student.edu' LIMIT 1;

  -- Get School ID
  SELECT school_id INTO lincoln_high_school_id FROM schools WHERE name = 'Lincoln High School' LIMIT 1;

  -- Get Year IDs
  SELECT year_id INTO year_2324_id FROM years WHERE year_external_id = '33' LIMIT 1;
  SELECT year_id INTO year_2425_id FROM years WHERE year_external_id = '34' LIMIT 1;

  -- Get Term IDs for 2024-2025
  SELECT term_id INTO q1_2425_term_id FROM terms WHERE abbreviation = 'Q1' AND school_id = lincoln_high_school_id AND year_id = year_2425_id LIMIT 1;
  SELECT term_id INTO q2_2425_term_id FROM terms WHERE abbreviation = 'Q2' AND school_id = lincoln_high_school_id AND year_id = year_2425_id LIMIT 1;
  SELECT term_id INTO q3_2425_term_id FROM terms WHERE abbreviation = 'Q3' AND school_id = lincoln_high_school_id AND year_id = year_2425_id LIMIT 1;
  SELECT term_id INTO q4_2425_term_id FROM terms WHERE abbreviation = 'Q4' AND school_id = lincoln_high_school_id AND year_id = year_2425_id LIMIT 1;
  SELECT term_id INTO s1_2425_term_id FROM terms WHERE abbreviation = 'S1' AND school_id = lincoln_high_school_id AND year_id = year_2425_id LIMIT 1;
  SELECT term_id INTO s2_2425_term_id FROM terms WHERE abbreviation = 'S2' AND school_id = lincoln_high_school_id AND year_id = year_2425_id LIMIT 1;

  -- Get Term IDs for 2023-2024
  SELECT term_id INTO q1_2324_term_id FROM terms WHERE abbreviation = 'Q1' AND school_id = lincoln_high_school_id AND year_id = year_2324_id LIMIT 1;
  SELECT term_id INTO q2_2324_term_id FROM terms WHERE abbreviation = 'Q2' AND school_id = lincoln_high_school_id AND year_id = year_2324_id LIMIT 1;
  SELECT term_id INTO q3_2324_term_id FROM terms WHERE abbreviation = 'Q3' AND school_id = lincoln_high_school_id AND year_id = year_2324_id LIMIT 1;
  SELECT term_id INTO q4_2324_term_id FROM terms WHERE abbreviation = 'Q4' AND school_id = lincoln_high_school_id AND year_id = year_2324_id LIMIT 1;
  SELECT term_id INTO s1_2324_term_id FROM terms WHERE abbreviation = 'S1' AND school_id = lincoln_high_school_id AND year_id = year_2324_id LIMIT 1;
  SELECT term_id INTO s2_2324_term_id FROM terms WHERE abbreviation = 'S2' AND school_id = lincoln_high_school_id AND year_id = year_2324_id LIMIT 1;

  -- Get Course IDs
  SELECT course_id INTO english_10a_course_id FROM courses WHERE name = 'English 10 A' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO english_10b_course_id FROM courses WHERE name = 'English 10 B' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO algebra_1a_course_id FROM courses WHERE name = 'Algebra I A' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO algebra_1b_course_id FROM courses WHERE name = 'Algebra I B' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO us_history_a_course_id FROM courses WHERE name = 'US History A' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO us_history_b_course_id FROM courses WHERE name = 'US History B' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO biology_1a_course_id FROM courses WHERE name = 'Biology A' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO biology_1b_course_id FROM courses WHERE name = 'Biology B' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO english_11a_course_id FROM courses WHERE name = 'English 11 A' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO english_11b_course_id FROM courses WHERE name = 'English 11 B' AND school_id = lincoln_high_school_id LIMIT 1;

  -- Get Section IDs
  SELECT section_id INTO english_10a_section_id FROM sections WHERE course_number = 'ENG10A' AND course_id = english_10a_course_id LIMIT 1;
  IF english_10a_section_id IS NULL THEN RAISE EXCEPTION 'Section not found for course ENG10A'; END IF;
  SELECT section_id INTO english_10b_section_id FROM sections WHERE course_number = 'ENG10B' AND course_id = english_10b_course_id LIMIT 1;
  IF english_10b_section_id IS NULL THEN RAISE EXCEPTION 'Section not found for course ENG10B'; END IF;
  SELECT section_id INTO algebra_1a_section_id FROM sections WHERE course_number = 'ALG1A' AND course_id = algebra_1a_course_id LIMIT 1;
  IF algebra_1a_section_id IS NULL THEN RAISE EXCEPTION 'Section not found for course ALG1A'; END IF;
  SELECT section_id INTO algebra_1b_section_id FROM sections WHERE course_number = 'ALG1B' AND course_id = algebra_1b_course_id LIMIT 1;
  IF algebra_1b_section_id IS NULL THEN RAISE EXCEPTION 'Section not found for course ALG1B'; END IF;
  SELECT section_id INTO us_history_a_section_id FROM sections WHERE course_number = 'USHISTA' AND course_id = us_history_a_course_id LIMIT 1;
  IF us_history_a_section_id IS NULL THEN RAISE EXCEPTION 'Section not found for course USHISTA'; END IF;
  SELECT section_id INTO us_history_b_section_id FROM sections WHERE course_number = 'USHISTB' AND course_id = us_history_b_course_id LIMIT 1;
  IF us_history_b_section_id IS NULL THEN RAISE EXCEPTION 'Section not found for course USHISTB'; END IF;
  SELECT section_id INTO biology_1a_section_id FROM sections WHERE course_number = 'BIO1A' AND course_id = biology_1a_course_id LIMIT 1;
  IF biology_1a_section_id IS NULL THEN RAISE EXCEPTION 'Section not found for course BIO1A'; END IF;
  SELECT section_id INTO biology_1b_section_id FROM sections WHERE course_number = 'BIO1B' AND course_id = biology_1b_course_id LIMIT 1;
  IF biology_1b_section_id IS NULL THEN RAISE EXCEPTION 'Section not found for course BIO1B'; END IF;
  SELECT section_id INTO english_11a_section_id FROM sections WHERE course_number = 'ENG11A' AND course_id = english_11a_course_id LIMIT 1;
  IF english_11a_section_id IS NULL THEN RAISE EXCEPTION 'Section not found for course ENG11A'; END IF;
  SELECT section_id INTO english_11b_section_id FROM sections WHERE course_number = 'ENG11B' AND course_id = english_11b_course_id LIMIT 1;
  IF english_11b_section_id IS NULL THEN RAISE EXCEPTION 'Section not found for course ENG11B'; END IF;

  -- # Seed Section Enrollments

  -- Emma Johnson's Enrollments
  -- Grade 10 (2023-2024)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, english_10a_section_id, s1_2324_term_id, '2023-08-15', 1, 1, 'ENRL_EMMA_ENG10A_S1_2324', 'E_EMMA_ENG10A_S1_2324', encode(digest('ENRL_EMMA_ENG10A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_10b_section_id, s2_2324_term_id, '2024-01-06', 3, 1, 'ENRL_EMMA_ENG10B_S2_2324', 'E_EMMA_ENG10B_S2_2324', encode(digest('ENRL_EMMA_ENG10B_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, algebra_1a_section_id, s1_2324_term_id, '2023-08-15', 1, 3, 'ENRL_EMMA_ALG1A_S1_2324', 'E_EMMA_ALG1A_S1_2324', encode(digest('ENRL_EMMA_ALG1A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, algebra_1b_section_id, s2_2324_term_id, '2024-01-06', 2, 1, 'ENRL_EMMA_ALG1B_S2_2324', 'E_EMMA_ALG1B_S2_2324', encode(digest('ENRL_EMMA_ALG1B_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, biology_1a_section_id, s1_2324_term_id, '2023-08-15', 1, 0, 'ENRL_EMMA_BIO1A_S1_2324', 'E_EMMA_BIO1A_S1_2324', encode(digest('ENRL_EMMA_BIO1A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, biology_1b_section_id, s2_2324_term_id, '2024-01-06', 1, 1, 'ENRL_EMMA_BIO1B_S2_2324', 'E_EMMA_BIO1B_S2_2324', encode(digest('ENRL_EMMA_BIO1B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 11 (2024-2025)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, us_history_a_section_id, s1_2425_term_id, '2024-08-15', 2, 2, 'ENRL_EMMA_USHISTA_S1_2425', 'E_EMMA_USHISTA_S1_2425', encode(digest('ENRL_EMMA_USHISTA_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, us_history_b_section_id, s2_2425_term_id, '2025-01-06', 3, 1, 'ENRL_EMMA_USHISTB_S2_2425', 'E_EMMA_USHISTB_S2_2425', encode(digest('ENRL_EMMA_USHISTB_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_11a_section_id, s1_2425_term_id, '2024-08-15', 4, 0, 'ENRL_EMMA_ENG11A_S1_2425', 'E_EMMA_ENG11A_S1_2425', encode(digest('ENRL_EMMA_ENG11A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_11b_section_id, s2_2425_term_id, '2025-01-06', 1, 1, 'ENRL_EMMA_ENG11B_S2_2425', 'E_EMMA_ENG11B_S2_2425', encode(digest('ENRL_EMMA_ENG11B_S2_2425', 'sha256'), 'hex'), 'mock_source');

  -- # Seed Student Grades
  
  -- Emma Johnson's Grades
  -- Grade 10 (2023-2024)
  -- English 10A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, english_10a_section_id, q1_2324_term_id, english_10a_course_id, 'A', 'Q1', 94.00, 3.76, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2023-10-20', 'GRADE_EMMA_ENG10A_Q1_2324', 'G_EMMA_ENG10A_Q1_2324', encode(digest('GRADE_EMMA_ENG10A_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_10a_section_id, q2_2324_term_id, english_10a_course_id, 'A-', 'Q2', 91.50, 3.66, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2023-12-22', 'GRADE_EMMA_ENG10A_Q2_2324', 'G_EMMA_ENG10A_Q2_2324', encode(digest('GRADE_EMMA_ENG10A_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_10a_section_id, s1_2324_term_id, english_10a_course_id, 'A', 'S1', 92.75, 3.71, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2023-12-22', 'GRADE_EMMA_ENG10A_S1_2324', 'G_EMMA_ENG10A_S1_2324', encode(digest('GRADE_EMMA_ENG10A_S1_2324', 'sha256'), 'hex'), 'mock_source');
  -- English 10B (S2)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, english_10b_section_id, q3_2324_term_id, english_10b_course_id, 'A', 'Q3', 95.00, 3.80, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2024-03-16', 'GRADE_EMMA_ENG10B_Q3_2324', 'G_EMMA_ENG10B_Q3_2324', encode(digest('GRADE_EMMA_ENG10B_Q3_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_10b_section_id, q4_2324_term_id, english_10b_course_id, 'A', 'Q4', 96.00, 3.84, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2024-05-25', 'GRADE_EMMA_ENG10B_Q4_2324', 'G_EMMA_ENG10B_Q4_2324', encode(digest('GRADE_EMMA_ENG10B_Q4_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_10b_section_id, s2_2324_term_id, english_10b_course_id, 'A', 'S2', 95.50, 3.82, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2024-05-25', 'GRADE_EMMA_ENG10B_S2_2324', 'G_EMMA_ENG10B_S2_2324', encode(digest('GRADE_EMMA_ENG10B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Algebra I A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, algebra_1a_section_id, q1_2324_term_id, algebra_1a_course_id, 'C-', 'Q1', 71.00, 2.84, 0.5, 0.5, 0, false, 'Math', 'Final', 'Struggled with concepts.', '10', 'StoredGrades', '2023-10-20', 'GRADE_EMMA_ALG1A_Q1_2324', 'G_EMMA_ALG1A_Q1_2324', encode(digest('GRADE_EMMA_ALG1A_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, algebra_1a_section_id, q2_2324_term_id, algebra_1a_course_id, 'A-', 'Q2', 91.00, 3.64, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2023-12-22', 'GRADE_EMMA_ALG1A_Q2_2324', 'G_EMMA_ALG1A_Q2_2324', encode(digest('GRADE_EMMA_ALG1A_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, algebra_1a_section_id, s1_2324_term_id, algebra_1a_course_id, 'B-', 'S1', 81.00, 3.24, 1.0, 1.0, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2023-12-22', 'GRADE_EMMA_ALG1A_S1_2324', 'G_EMMA_ALG1A_S1_2324', encode(digest('GRADE_EMMA_ALG1A_S1_2324', 'sha256'), 'hex'), 'mock_source');
  -- Algebra I B (S2)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, algebra_1b_section_id, q3_2324_term_id, algebra_1b_course_id, 'B+', 'Q3', 89.50, 3.58, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2024-03-16', 'GRADE_EMMA_ALG1B_Q3_2324', 'G_EMMA_ALG1B_Q3_2324', encode(digest('GRADE_EMMA_ALG1B_Q3_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, algebra_1b_section_id, q4_2324_term_id, algebra_1b_course_id, 'A', 'Q4', 93.00, 3.72, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2024-05-25', 'GRADE_EMMA_ALG1B_Q4_2324', 'G_EMMA_ALG1B_Q4_2324', encode(digest('GRADE_EMMA_ALG1B_Q4_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, algebra_1b_section_id, s2_2324_term_id, algebra_1b_course_id, 'A-', 'S2', 91.25, 3.65, 1.0, 1.0, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2024-05-25', 'GRADE_EMMA_ALG1B_S2_2324', 'G_EMMA_ALG1B_S2_2324', encode(digest('GRADE_EMMA_ALG1B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Biology A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, biology_1a_section_id, q1_2324_term_id, biology_1a_course_id, 'A', 'Q1', 95.00, 3.80, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2023-10-20', 'GRADE_EMMA_BIO1A_Q1_2324', 'G_EMMA_BIO1A_Q1_2324', encode(digest('GRADE_EMMA_BIO1A_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, biology_1a_section_id, q2_2324_term_id, biology_1a_course_id, 'A-', 'Q2', 92.00, 3.68, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2023-12-22', 'GRADE_EMMA_BIO1A_Q2_2324', 'G_EMMA_BIO1A_Q2_2324', encode(digest('GRADE_EMMA_BIO1A_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, biology_1a_section_id, s1_2324_term_id, biology_1a_course_id, 'A', 'S1', 93.50, 3.74, 1.0, 1.0, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2023-12-22', 'GRADE_EMMA_BIO1A_S1_2324', 'G_EMMA_BIO1A_S1_2324', encode(digest('GRADE_EMMA_BIO1A_S1_2324', 'sha256'), 'hex'), 'mock_source');
  -- Biology B (S2)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, biology_1b_section_id, q3_2324_term_id, biology_1b_course_id, 'D+', 'Q3', 68.00, 2.72, 0.5, 0.5, 0, false, 'Science', 'Final', 'Difficulty with lab reports.', '10', 'StoredGrades', '2024-03-16', 'GRADE_EMMA_BIO1B_Q3_2324', 'G_EMMA_BIO1B_Q3_2324', encode(digest('GRADE_EMMA_BIO1B_Q3_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, biology_1b_section_id, q4_2324_term_id, biology_1b_course_id, 'A', 'Q4', 97.00, 3.88, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2024-05-25', 'GRADE_EMMA_BIO1B_Q4_2324', 'G_EMMA_BIO1B_Q4_2324', encode(digest('GRADE_EMMA_BIO1B_Q4_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, biology_1b_section_id, s2_2324_term_id, biology_1b_course_id, 'C+', 'S2', 82.50, 3.30, 1.0, 1.0, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2024-05-25', 'GRADE_EMMA_BIO1B_S2_2324', 'G_EMMA_BIO1B_S2_2324', encode(digest('GRADE_EMMA_BIO1B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  
  -- Grade 11 (2024-2025)
  -- US History A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, us_history_a_section_id, q1_2425_term_id, us_history_a_course_id, 'A-', 'Q1', 92.00, 3.68, 0.5, 0.5, 0, false, 'History', 'Final', 'Excellent work on Q1 project!', '11', 'StoredGrades', '2024-10-20', 'GRADE_EMMA_USHISTA_Q1_2425', 'G_EMMA_USHISTA_Q1_2425', encode(digest('GRADE_EMMA_USHISTA_Q1_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, us_history_a_section_id, q2_2425_term_id, us_history_a_course_id, 'D', 'Q2', 65.00, 2.60, 0.5, 0.5, 0, false, 'History', 'InProgress', 'Needs improvement.', '11', 'PGFinalGrades', '2024-12-15', 'GRADE_EMMA_USHISTA_Q2_2425', 'G_EMMA_USHISTA_Q2_2425', encode(digest('GRADE_EMMA_USHISTA_Q2_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, us_history_a_section_id, s1_2425_term_id, us_history_a_course_id, 'C', 'S1', 78.50, 3.14, 1.0, 1.0, 0, false, 'History', 'InProgress', 'Preliminary semester grade.', '11', 'PGFinalGrades', '2024-12-22', 'GRADE_EMMA_USHISTA_S1_2425', 'G_EMMA_USHISTA_S1_2425', encode(digest('GRADE_EMMA_USHISTA_S1_2425', 'sha256'), 'hex'), 'mock_source');
  -- US History B (S2)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, us_history_b_section_id, q3_2425_term_id, us_history_b_course_id, 'B', 'Q3', 85.00, 3.40, 0.5, 0.5, 0, false, 'History', 'InProgress', 'Solid effort.', '11', 'PGFinalGrades', '2025-03-16', 'GRADE_EMMA_USHISTB_Q3_2425', 'G_EMMA_USHISTB_Q3_2425', encode(digest('GRADE_EMMA_USHISTB_Q3_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, us_history_b_section_id, q4_2425_term_id, us_history_b_course_id, 'B+', 'Q4', 89.00, 3.56, 0.5, 0.5, 0, false, 'History', 'InProgress', 'Strong finish.', '11', 'PGFinalGrades', '2025-05-22', 'GRADE_EMMA_USHISTB_Q4_2425', 'G_EMMA_USHISTB_Q4_2425', encode(digest('GRADE_EMMA_USHISTB_Q4_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, us_history_b_section_id, s2_2425_term_id, us_history_b_course_id, 'B+', 'S2', 87.00, 3.48, 1.0, 1.0, 0, false, 'History', 'InProgress', 'Keep up the good work.', '11', 'PGFinalGrades', '2025-05-22', 'GRADE_EMMA_USHISTB_S2_2425', 'G_EMMA_USHISTB_S2_2425', encode(digest('GRADE_EMMA_USHISTB_S2_2425', 'sha256'), 'hex'), 'mock_source');
  -- English 11 A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, english_11a_section_id, q1_2425_term_id, english_11a_course_id, 'A', 'Q1', 95.00, 3.80, 0.5, 0.5, 0, false, 'English', 'Final', 'Great analytical essays.', '11', 'StoredGrades', '2024-10-20', 'GRADE_EMMA_ENG11A_Q1_2425', 'G_EMMA_ENG11A_Q1_2425', encode(digest('GRADE_EMMA_ENG11A_Q1_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_11a_section_id, q2_2425_term_id, english_11a_course_id, 'A-', 'Q2', 91.00, 3.64, 0.5, 0.5, 0, false, 'English', 'InProgress', NULL, '11', 'PGFinalGrades', '2024-12-15', 'GRADE_EMMA_ENG11A_Q2_2425', 'G_EMMA_ENG11A_Q2_2425', encode(digest('GRADE_EMMA_ENG11A_Q2_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_11a_section_id, s1_2425_term_id, english_11a_course_id, 'A', 'S1', 93.00, 3.72, 1.0, 1.0, 0, false, 'English', 'InProgress', 'Preliminary semester grade.', '11', 'PGFinalGrades', '2024-12-22', 'GRADE_EMMA_ENG11A_S1_2425', 'G_EMMA_ENG11A_S1_2425', encode(digest('GRADE_EMMA_ENG11A_S1_2425', 'sha256'), 'hex'), 'mock_source');
  -- English 11 B (S2)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, english_11b_section_id, q3_2425_term_id, english_11b_course_id, 'A-', 'Q3', 92.50, 3.70, 0.5, 0.5, 0, false, 'English', 'InProgress', 'Excellent contributions.', '11', 'PGFinalGrades', '2025-03-16', 'GRADE_EMMA_ENG11B_Q3_2425', 'G_EMMA_ENG11B_Q3_2425', encode(digest('GRADE_EMMA_ENG11B_Q3_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_11b_section_id, q4_2425_term_id, english_11b_course_id, 'A', 'Q4', 96.00, 3.84, 0.5, 0.5, 0, false, 'English', 'InProgress', 'Superb final paper.', '11', 'PGFinalGrades', '2025-05-22', 'GRADE_EMMA_ENG11B_Q4_2425', 'G_EMMA_ENG11B_Q4_2425', encode(digest('GRADE_EMMA_ENG11B_Q4_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_11b_section_id, s2_2425_term_id, english_11b_course_id, 'A-', 'S2', 94.25, 3.77, 1.0, 1.0, 0, false, 'English', 'InProgress', NULL, '11', 'PGFinalGrades', '2025-05-22', 'GRADE_EMMA_ENG11B_S2_2425', 'G_EMMA_ENG11B_S2_2425', encode(digest('GRADE_EMMA_ENG11B_S2_2425', 'sha256'), 'hex'), 'mock_source');


  -- Michael Chen's Enrollments
  -- Grade 10 (2024-2025)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (michael_chen_student_id, english_10a_section_id, s1_2425_term_id, '2024-08-15', 0, 2, 'ENRL_MICHAEL_ENG10A_S1_2425', 'E_MICHAEL_ENG10A_S1_2425', encode(digest('ENRL_MICHAEL_ENG10A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_10b_section_id, s2_2425_term_id, '2025-01-06', 1, 0, 'ENRL_MICHAEL_ENG10B_S2_2425', 'E_MICHAEL_ENG10B_S2_2425', encode(digest('ENRL_MICHAEL_ENG10B_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, algebra_1a_section_id, s1_2425_term_id, '2024-08-15', 1, 0, 'ENRL_MICHAEL_ALG1A_S1_2425', 'E_MICHAEL_ALG1A_S1_2425', encode(digest('ENRL_MICHAEL_ALG1A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, algebra_1b_section_id, s2_2425_term_id, '2025-01-06', 0, 0, 'ENRL_MICHAEL_ALG1B_S2_2425', 'E_MICHAEL_ALG1B_S2_2425', encode(digest('ENRL_MICHAEL_ALG1B_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, biology_1a_section_id, s1_2425_term_id, '2024-08-15', 2, 1, 'ENRL_MICHAEL_BIO1A_S1_2425', 'E_MICHAEL_BIO1A_S1_2425', encode(digest('ENRL_MICHAEL_BIO1A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, biology_1b_section_id, s2_2425_term_id, '2025-01-06', 1, 2, 'ENRL_MICHAEL_BIO1B_S2_2425', 'E_MICHAEL_BIO1B_S2_2425', encode(digest('ENRL_MICHAEL_BIO1B_S2_2425', 'sha256'), 'hex'), 'mock_source');

  -- Michael Chen's Grades
  -- Grade 10 (2024-2025)
  -- English 10A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (michael_chen_student_id, english_10a_section_id, q1_2425_term_id, english_10a_course_id, 'B', 'Q1', 85.00, 3.40, 0.5, 0.5, 0, false, 'English', 'Final', 'Good start to the year.', '10', 'StoredGrades', '2024-10-20', 'GRADE_MICHAEL_ENG10A_Q1_2425', 'G_MICHAEL_ENG10A_Q1_2425', encode(digest('GRADE_MICHAEL_ENG10A_Q1_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_10a_section_id, q2_2425_term_id, english_10a_course_id, 'B-', 'Q2', 81.50, 3.26, 0.5, 0.5, 0, false, 'English', 'InProgress', 'Needs to participate more in class discussions.', '10', 'PGFinalGrades', '2024-12-15', 'GRADE_MICHAEL_ENG10A_Q2_2425', 'G_MICHAEL_ENG10A_Q2_2425', encode(digest('GRADE_MICHAEL_ENG10A_Q2_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_10a_section_id, s1_2425_term_id, english_10a_course_id, 'B-', 'S1', 83.25, 3.33, 1.0, 1.0, 0, false, 'English', 'InProgress', 'Preliminary semester grade.', '10', 'PGFinalGrades', '2024-12-22', 'GRADE_MICHAEL_ENG10A_S1_2425', 'G_MICHAEL_ENG10A_S1_2425', encode(digest('GRADE_MICHAEL_ENG10A_S1_2425', 'sha256'), 'hex'), 'mock_source');
  -- English 10B (S2)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (michael_chen_student_id, english_10b_section_id, q3_2425_term_id, english_10b_course_id, 'B', 'Q3', 86.00, 3.44, 0.5, 0.5, 0, false, 'English', 'InProgress', NULL, '10', 'PGFinalGrades', '2025-03-16', 'GRADE_MICHAEL_ENG10B_Q3_2425', 'G_MICHAEL_ENG10B_Q3_2425', encode(digest('GRADE_MICHAEL_ENG10B_Q3_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_10b_section_id, q4_2425_term_id, english_10b_course_id, 'B+', 'Q4', 88.00, 3.52, 0.5, 0.5, 0, false, 'English', 'InProgress', NULL, '10', 'PGFinalGrades', '2025-05-22', 'GRADE_MICHAEL_ENG10B_Q4_2425', 'G_MICHAEL_ENG10B_Q4_2425', encode(digest('GRADE_MICHAEL_ENG10B_Q4_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_10b_section_id, s2_2425_term_id, english_10b_course_id, 'B+', 'S2', 87.00, 3.48, 1.0, 1.0, 0, false, 'English', 'InProgress', NULL, '10', 'PGFinalGrades', '2025-05-22', 'GRADE_MICHAEL_ENG10B_S2_2425', 'G_MICHAEL_ENG10B_S2_2425', encode(digest('GRADE_MICHAEL_ENG10B_S2_2425', 'sha256'), 'hex'), 'mock_source');
  -- Algebra I A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (michael_chen_student_id, algebra_1a_section_id, q1_2425_term_id, algebra_1a_course_id, 'C', 'Q1', 75.00, 3.00, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2024-10-20', 'GRADE_MICHAEL_ALG1A_Q1_2425', 'G_MICHAEL_ALG1A_Q1_2425', encode(digest('GRADE_MICHAEL_ALG1A_Q1_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, algebra_1a_section_id, q2_2425_term_id, algebra_1a_course_id, 'C+', 'Q2', 78.00, 3.12, 0.5, 0.5, 0, false, 'Math', 'InProgress', 'Showing improvement.', '10', 'PGFinalGrades', '2024-12-15', 'GRADE_MICHAEL_ALG1A_Q2_2425', 'G_MICHAEL_ALG1A_Q2_2425', encode(digest('GRADE_MICHAEL_ALG1A_Q2_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, algebra_1a_section_id, s1_2425_term_id, algebra_1a_course_id, 'C+', 'S1', 76.50, 3.06, 1.0, 1.0, 0, false, 'Math', 'InProgress', 'Preliminary semester grade.', '10', 'PGFinalGrades', '2024-12-22', 'GRADE_MICHAEL_ALG1A_S1_2425', 'G_MICHAEL_ALG1A_S1_2425', encode(digest('GRADE_MICHAEL_ALG1A_S1_2425', 'sha256'), 'hex'), 'mock_source');
  -- Algebra I B (S2)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (michael_chen_student_id, algebra_1b_section_id, q3_2425_term_id, algebra_1b_course_id, 'B-', 'Q3', 82.00, 3.28, 0.5, 0.5, 0, false, 'Math', 'InProgress', NULL, '10', 'PGFinalGrades', '2025-03-16', 'GRADE_MICHAEL_ALG1B_Q3_2425', 'G_MICHAEL_ALG1B_Q3_2425', encode(digest('GRADE_MICHAEL_ALG1B_Q3_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, algebra_1b_section_id, q4_2425_term_id, algebra_1b_course_id, 'B', 'Q4', 84.00, 3.36, 0.5, 0.5, 0, false, 'Math', 'InProgress', NULL, '10', 'PGFinalGrades', '2025-05-22', 'GRADE_MICHAEL_ALG1B_Q4_2425', 'G_MICHAEL_ALG1B_Q4_2425', encode(digest('GRADE_MICHAEL_ALG1B_Q4_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, algebra_1b_section_id, s2_2425_term_id, algebra_1b_course_id, 'B', 'S2', 83.00, 3.32, 1.0, 1.0, 0, false, 'Math', 'InProgress', NULL, '10', 'PGFinalGrades', '2025-05-22', 'GRADE_MICHAEL_ALG1B_S2_2425', 'G_MICHAEL_ALG1B_S2_2425', encode(digest('GRADE_MICHAEL_ALG1B_S2_2425', 'sha256'), 'hex'), 'mock_source');
  -- Biology A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (michael_chen_student_id, biology_1a_section_id, q1_2425_term_id, biology_1a_course_id, 'B+', 'Q1', 89.00, 3.56, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2024-10-20', 'GRADE_MICHAEL_BIO1A_Q1_2425', 'G_MICHAEL_BIO1A_Q1_2425', encode(digest('GRADE_MICHAEL_BIO1A_Q1_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, biology_1a_section_id, q2_2425_term_id, biology_1a_course_id, 'B', 'Q2', 86.00, 3.44, 0.5, 0.5, 0, false, 'Science', 'InProgress', 'Good lab work.', '10', 'PGFinalGrades', '2024-12-15', 'GRADE_MICHAEL_BIO1A_Q2_2425', 'G_MICHAEL_BIO1A_Q2_2425', encode(digest('GRADE_MICHAEL_BIO1A_Q2_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, biology_1a_section_id, s1_2425_term_id, biology_1a_course_id, 'B+', 'S1', 87.50, 3.50, 1.0, 1.0, 0, false, 'Science', 'InProgress', 'Preliminary semester grade.', '10', 'PGFinalGrades', '2024-12-22', 'GRADE_MICHAEL_BIO1A_S1_2425', 'G_MICHAEL_BIO1A_S1_2425', encode(digest('GRADE_MICHAEL_BIO1A_S1_2425', 'sha256'), 'hex'), 'mock_source');
  -- Biology B (S2)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (michael_chen_student_id, biology_1b_section_id, q3_2425_term_id, biology_1b_course_id, 'B', 'Q3', 84.00, 3.36, 0.5, 0.5, 0, false, 'Science', 'InProgress', NULL, '10', 'PGFinalGrades', '2025-03-16', 'GRADE_MICHAEL_BIO1B_Q3_2425', 'G_MICHAEL_BIO1B_Q3_2425', encode(digest('GRADE_MICHAEL_BIO1B_Q3_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, biology_1b_section_id, q4_2425_term_id, biology_1b_course_id, 'A-', 'Q4', 90.00, 3.60, 0.5, 0.5, 0, false, 'Science', 'InProgress', NULL, '10', 'PGFinalGrades', '2025-05-22', 'GRADE_MICHAEL_BIO1B_Q4_2425', 'G_MICHAEL_BIO1B_Q4_2425', encode(digest('GRADE_MICHAEL_BIO1B_Q4_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, biology_1b_section_id, s2_2425_term_id, biology_1b_course_id, 'B+', 'S2', 87.00, 3.48, 1.0, 1.0, 0, false, 'Science', 'InProgress', NULL, '10', 'PGFinalGrades', '2025-05-22', 'GRADE_MICHAEL_BIO1B_S2_2425', 'G_MICHAEL_BIO1B_S2_2425', encode(digest('GRADE_MICHAEL_BIO1B_S2_2425', 'sha256'), 'hex'), 'mock_source');


  -- Sophia Rodriguez's Enrollments
  -- Grade 11 (2023-2024)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (sophia_rodriguez_student_id, us_history_a_section_id, s1_2324_term_id, '2023-08-15', 0, 0, 'ENRL_SOPHIA_USHISTA_S1_2324', 'E_SOPHIA_USHISTA_S1_2324', encode(digest('ENRL_SOPHIA_USHISTA_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, us_history_b_section_id, s2_2324_term_id, '2024-01-06', 1, 0, 'ENRL_SOPHIA_USHISTB_S2_2324', 'E_SOPHIA_USHISTB_S2_2324', encode(digest('ENRL_SOPHIA_USHISTB_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_11a_section_id, s1_2324_term_id, '2023-08-15', 0, 1, 'ENRL_SOPHIA_ENG11A_S1_2324', 'E_SOPHIA_ENG11A_S1_2324', encode(digest('ENRL_SOPHIA_ENG11A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_11b_section_id, s2_2324_term_id, '2024-01-06', 0, 0, 'ENRL_SOPHIA_ENG11B_S2_2324', 'E_SOPHIA_ENG11B_S2_2324', encode(digest('ENRL_SOPHIA_ENG11B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 12 (2024-2025) - Not enrolled in any sample courses for this year yet

  -- Sophia Rodriguez's Grades
  -- Grade 11 (2023-2024)
  -- US History A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (sophia_rodriguez_student_id, us_history_a_section_id, q1_2324_term_id, us_history_a_course_id, 'A', 'Q1', 97.00, 3.88, 0.5, 0.5, 0, false, 'History', 'Final', 'Top of the class.', '11', 'StoredGrades', '2023-10-20', 'GRADE_SOPHIA_USHISTA_Q1_2324', 'G_SOPHIA_USHISTA_Q1_2324', encode(digest('GRADE_SOPHIA_USHISTA_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, us_history_a_section_id, q2_2324_term_id, us_history_a_course_id, 'A', 'Q2', 98.00, 3.92, 0.5, 0.5, 0, false, 'History', 'Final', 'Exceptional work.', '11', 'StoredGrades', '2023-12-22', 'GRADE_SOPHIA_USHISTA_Q2_2324', 'G_SOPHIA_USHISTA_Q2_2324', encode(digest('GRADE_SOPHIA_USHISTA_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, us_history_a_section_id, s1_2324_term_id, us_history_a_course_id, 'A', 'S1', 97.50, 3.90, 1.0, 1.0, 0, false, 'History', 'Final', NULL, '11', 'StoredGrades', '2023-12-22', 'GRADE_SOPHIA_USHISTA_S1_2324', 'G_SOPHIA_USHISTA_S1_2324', encode(digest('GRADE_SOPHIA_USHISTA_S1_2324', 'sha256'), 'hex'), 'mock_source');
  -- US History B (S2)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (sophia_rodriguez_student_id, us_history_b_section_id, q3_2324_term_id, us_history_b_course_id, 'A-', 'Q3', 92.00, 3.68, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '11', 'StoredGrades', '2024-03-16', 'GRADE_SOPHIA_USHISTB_Q3_2324', 'G_SOPHIA_USHISTB_Q3_2324', encode(digest('GRADE_SOPHIA_USHISTB_Q3_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, us_history_b_section_id, q4_2324_term_id, us_history_b_course_id, 'A', 'Q4', 96.00, 3.84, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '11', 'StoredGrades', '2024-05-25', 'GRADE_SOPHIA_USHISTB_Q4_2324', 'G_SOPHIA_USHISTB_Q4_2324', encode(digest('GRADE_SOPHIA_USHISTB_Q4_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, us_history_b_section_id, s2_2324_term_id, us_history_b_course_id, 'A', 'S2', 94.00, 3.76, 1.0, 1.0, 0, false, 'History', 'Final', NULL, '11', 'StoredGrades', '2024-05-25', 'GRADE_SOPHIA_USHISTB_S2_2324', 'G_SOPHIA_USHISTB_S2_2324', encode(digest('GRADE_SOPHIA_USHISTB_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- English 11 A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (sophia_rodriguez_student_id, english_11a_section_id, q1_2324_term_id, english_11a_course_id, 'A', 'Q1', 99.00, 3.96, 0.5, 0.5, 0, false, 'English', 'Final', 'Leader in class discussions.', '11', 'StoredGrades', '2023-10-20', 'GRADE_SOPHIA_ENG11A_Q1_2324', 'G_SOPHIA_ENG11A_Q1_2324', encode(digest('GRADE_SOPHIA_ENG11A_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_11a_section_id, q2_2324_term_id, english_11a_course_id, 'A', 'Q2', 97.00, 3.88, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '11', 'StoredGrades', '2023-12-22', 'GRADE_SOPHIA_ENG11A_Q2_2324', 'G_SOPHIA_ENG11A_Q2_2324', encode(digest('GRADE_SOPHIA_ENG11A_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_11a_section_id, s1_2324_term_id, english_11a_course_id, 'A', 'S1', 98.00, 3.92, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '11', 'StoredGrades', '2023-12-22', 'GRADE_SOPHIA_ENG11A_S1_2324', 'G_SOPHIA_ENG11A_S1_2324', encode(digest('GRADE_SOPHIA_ENG11A_S1_2324', 'sha256'), 'hex'), 'mock_source');
  -- English 11 B (S2)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (sophia_rodriguez_student_id, english_11b_section_id, q3_2324_term_id, english_11b_course_id, 'A+', 'Q3', 100.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '11', 'StoredGrades', '2024-03-16', 'GRADE_SOPHIA_ENG11B_Q3_2324', 'G_SOPHIA_ENG11B_Q3_2324', encode(digest('GRADE_SOPHIA_ENG11B_Q3_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_11b_section_id, q4_2324_term_id, english_11b_course_id, 'A', 'Q4', 98.00, 3.92, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '11', 'StoredGrades', '2024-05-25', 'GRADE_SOPHIA_ENG11B_Q4_2324', 'G_SOPHIA_ENG11B_Q4_2324', encode(digest('GRADE_SOPHIA_ENG11B_Q4_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_11b_section_id, s2_2324_term_id, english_11b_course_id, 'A', 'S2', 99.00, 3.96, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '11', 'StoredGrades', '2024-05-25', 'GRADE_SOPHIA_ENG11B_S2_2324', 'G_SOPHIA_ENG11B_S2_2324', encode(digest('GRADE_SOPHIA_ENG11B_S2_2324', 'sha256'), 'hex'), 'mock_source');

END $$;