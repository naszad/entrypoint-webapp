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

  -- Term IDs
  q1_2425_term_id uuid;
  q2_2425_term_id uuid;
  q3_2425_term_id uuid;
  q4_2425_term_id uuid;

  -- Course IDs
  english_10_course_id uuid;
  algebra_1_course_id uuid;
  us_history_course_id uuid;
  biology_1_course_id uuid;
  english_11_course_id uuid;
  english_12_course_id uuid;

  -- Section IDs
  english_10_section_id uuid;
  algebra_1_section_id uuid;
  us_history_section_id uuid;
  biology_1_section_id uuid;
  english_11_section_id uuid;
  english_12_section_id uuid;

BEGIN
  -- Get Student IDs
  SELECT student_id INTO emma_johnson_student_id FROM students WHERE email = 'emma.johnson@student.edu' LIMIT 1;
  SELECT student_id INTO michael_chen_student_id FROM students WHERE email = 'michael.chen@student.edu' LIMIT 1;
  SELECT student_id INTO sophia_rodriguez_student_id FROM students WHERE email = 'sophia.rodriguez@student.edu' LIMIT 1;

  -- Get School ID
  SELECT school_id INTO lincoln_high_school_id FROM schools WHERE name = 'Lincoln High School' LIMIT 1;

  -- Get Term IDs
  SELECT term_id INTO q1_2425_term_id FROM terms WHERE abbreviation = 'Q1' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT term_id INTO q2_2425_term_id FROM terms WHERE abbreviation = 'Q2' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT term_id INTO q3_2425_term_id FROM terms WHERE abbreviation = 'Q3' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT term_id INTO q4_2425_term_id FROM terms WHERE abbreviation = 'Q4' AND school_id = lincoln_high_school_id LIMIT 1;

  -- Get Course IDs
  SELECT course_id INTO english_10_course_id FROM courses WHERE name = 'English 10' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO algebra_1_course_id FROM courses WHERE name = 'Algebra I' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO us_history_course_id FROM courses WHERE name = 'US History' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO biology_1_course_id FROM courses WHERE name = 'Biology' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO english_11_course_id FROM courses WHERE name = 'English 11' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO english_12_course_id FROM courses WHERE name = 'English 12' AND school_id = lincoln_high_school_id LIMIT 1;

  -- Get Section IDs
  SELECT section_id INTO english_10_section_id FROM sections WHERE course_number = 'ENG10' AND grade_level = '10' AND course_id = english_10_course_id LIMIT 1;
  SELECT section_id INTO algebra_1_section_id FROM sections WHERE course_number = 'ALG1' AND grade_level = '10' AND course_id = algebra_1_course_id LIMIT 1;
  SELECT section_id INTO us_history_section_id FROM sections WHERE course_number = 'USHIST' AND grade_level = '11' AND course_id = us_history_course_id LIMIT 1;
  SELECT section_id INTO biology_1_section_id FROM sections WHERE course_number = 'BIO1' AND grade_level = '10' AND course_id = biology_1_course_id LIMIT 1;
  SELECT section_id INTO english_11_section_id FROM sections WHERE course_number = 'ENG11' AND grade_level = '11' AND course_id = english_11_course_id LIMIT 1;
  SELECT section_id INTO english_12_section_id FROM sections WHERE course_number = 'ENG12' AND grade_level = '12' AND course_id = english_12_course_id LIMIT 1;

  -- # Seed Section Enrollments

  -- Emma Johnson (Grade 11) - enroll in US History, English 11
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, us_history_section_id, q1_2425_term_id, '2024-08-15', 2, 1, 'ENRL_EMMA_USHIST_Q1', 'E_EMMA_USHIST_Q1', encode(digest('ENRL_EMMA_USHIST_Q1', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_11_section_id, q1_2425_term_id, '2024-08-15', 1, 0, 'ENRL_EMMA_ENG11_Q1', 'E_EMMA_ENG11_Q1', encode(digest('ENRL_EMMA_ENG11_Q1', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, us_history_section_id, q2_2425_term_id, '2024-10-21', 0, 1, 'ENRL_EMMA_USHIST_Q2', 'E_EMMA_USHIST_Q2', encode(digest('ENRL_EMMA_USHIST_Q2', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_11_section_id, q2_2425_term_id, '2024-10-21', 3, 0, 'ENRL_EMMA_ENG11_Q2', 'E_EMMA_ENG11_Q2', encode(digest('ENRL_EMMA_ENG11_Q2', 'sha256'), 'hex'), 'mock_source');

  -- Michael Chen (Grade 10) - enroll in English 10, Algebra I, Biology
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (michael_chen_student_id, english_10_section_id, q1_2425_term_id, '2024-08-15', 0, 0, 'ENRL_MICHAEL_ENG10_Q1', 'E_MICHAEL_ENG10_Q1', encode(digest('ENRL_MICHAEL_ENG10_Q1', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, algebra_1_section_id, q1_2425_term_id, '2024-08-15', 1, 2, 'ENRL_MICHAEL_ALG1_Q1', 'E_MICHAEL_ALG1_Q1', encode(digest('ENRL_MICHAEL_ALG1_Q1', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, biology_1_section_id, q1_2425_term_id, '2024-08-15', 0, 1, 'ENRL_MICHAEL_BIO1_Q1', 'E_MICHAEL_BIO1_Q1', encode(digest('ENRL_MICHAEL_BIO1_Q1', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_10_section_id, q2_2425_term_id, '2024-10-21', 1, 0, 'ENRL_MICHAEL_ENG10_Q2', 'E_MICHAEL_ENG10_Q2', encode(digest('ENRL_MICHAEL_ENG10_Q2', 'sha256'), 'hex'), 'mock_source');


  -- Sophia Rodriguez (Grade 12) - enroll in English 12
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (sophia_rodriguez_student_id, english_12_section_id, q1_2425_term_id, '2024-08-15', 0, 0, 'ENRL_SOPHIA_ENG12_Q1', 'E_SOPHIA_ENG12_Q1', encode(digest('ENRL_SOPHIA_ENG12_Q1', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_12_section_id, q2_2425_term_id, '2024-10-21', 1, 0, 'ENRL_SOPHIA_ENG12_Q2', 'E_SOPHIA_ENG12_Q2', encode(digest('ENRL_SOPHIA_ENG12_Q2', 'sha256'), 'hex'), 'mock_source');


  -- # Seed Student Grades

  -- Emma Johnson's Grades (Grade 11)
  -- US History (Q1 & Q2)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, us_history_section_id, q1_2425_term_id, us_history_course_id, 'A-', 'Q1', 92.00, 3.70, 0.5, 0.5, 0, false, 'History', 'Final', 'Excellent work on Q1 project!', '11', 'StoredGrades', '2024-10-20', 'GRADE_EMMA_USHIST_Q1', 'G_EMMA_USHIST_Q1', encode(digest('GRADE_EMMA_USHIST_Q1', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, us_history_section_id, q2_2425_term_id, us_history_course_id, 'B+', 'Q2', 88.50, 3.30, 0.5, 0.5, 0, false, 'History', 'InProgress', 'Good participation.', '11', 'PGFinalGrades', '2024-12-15', 'GRADE_EMMA_USHIST_Q2', 'G_EMMA_USHIST_Q2', encode(digest('GRADE_EMMA_USHIST_Q2', 'sha256'), 'hex'), 'mock_source');
  -- English 11 (Q1 & Q2)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, english_11_section_id, q1_2425_term_id, english_11_course_id, 'A', 'Q1', 95.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', 'Great analytical essays.', '11', 'StoredGrades', '2024-10-20', 'GRADE_EMMA_ENG11_Q1', 'G_EMMA_ENG11_Q1', encode(digest('GRADE_EMMA_ENG11_Q1', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_11_section_id, q2_2425_term_id, english_11_course_id, 'A-', 'Q2', 91.00, 3.70, 0.5, 0.5, 0, false, 'English', 'InProgress', NULL, '11', 'PGFinalGrades', '2024-12-15', 'GRADE_EMMA_ENG11_Q2', 'G_EMMA_ENG11_Q2', encode(digest('GRADE_EMMA_ENG11_Q2', 'sha256'), 'hex'), 'mock_source');

  -- Michael Chen's Grades (Grade 10)
  -- English 10 (Q1 & Q2)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (michael_chen_student_id, english_10_section_id, q1_2425_term_id, english_10_course_id, 'B', 'Q1', 85.00, 3.00, 0.5, 0.5, 0, false, 'English', 'Final', 'Needs to work on thesis statements.', '10', 'StoredGrades', '2024-10-20', 'GRADE_MICHAEL_ENG10_Q1', 'G_MICHAEL_ENG10_Q1', encode(digest('GRADE_MICHAEL_ENG10_Q1', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_10_section_id, q2_2425_term_id, english_10_course_id, 'B-', 'Q2', 81.50, 2.70, 0.5, 0.5, 0, false, 'English', 'InProgress', NULL, '10', 'PGFinalGrades', '2024-12-15', 'GRADE_MICHAEL_ENG10_Q2', 'G_MICHAEL_ENG10_Q2', encode(digest('GRADE_MICHAEL_ENG10_Q2', 'sha256'), 'hex'), 'mock_source');
  -- Algebra I (Q1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (michael_chen_student_id, algebra_1_section_id, q1_2425_term_id, algebra_1_course_id, 'C+', 'Q1', 78.00, 2.30, 0.5, 0.5, 0, false, 'Math', 'Final', 'Showing improvement.', '10', 'StoredGrades', '2024-10-20', 'GRADE_MICHAEL_ALG1_Q1', 'G_MICHAEL_ALG1_Q1', encode(digest('GRADE_MICHAEL_ALG1_Q1', 'sha256'), 'hex'), 'mock_source');
  -- Biology (Q1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (michael_chen_student_id, biology_1_section_id, q1_2425_term_id, biology_1_course_id, 'B', 'Q1', 86.00, 3.00, 0.5, 0.5, 0, false, 'Science', 'Final', 'Good lab work.', '10', 'StoredGrades', '2024-10-20', 'GRADE_MICHAEL_BIO1_Q1', 'G_MICHAEL_BIO1_Q1', encode(digest('GRADE_MICHAEL_BIO1_Q1', 'sha256'), 'hex'), 'mock_source');

  -- Sophia Rodriguez's Grades (Grade 12)
  -- English 12 (Q1 & Q2)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (sophia_rodriguez_student_id, english_12_section_id, q1_2425_term_id, english_12_course_id, 'A', 'Q1', 96.50, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', 'Outstanding analysis.', '12', 'StoredGrades', '2024-10-20', 'GRADE_SOPHIA_ENG12_Q1', 'G_SOPHIA_ENG12_Q1', encode(digest('GRADE_SOPHIA_ENG12_Q1', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_12_section_id, q2_2425_term_id, english_12_course_id, 'A', 'Q2', 94.00, 4.00, 0.5, 0.5, 0, false, 'English', 'InProgress', NULL, '12', 'PGFinalGrades', '2024-12-15', 'GRADE_SOPHIA_ENG12_Q2', 'G_SOPHIA_ENG12_Q2', encode(digest('GRADE_SOPHIA_ENG12_Q2', 'sha256'), 'hex'), 'mock_source');

END $$;