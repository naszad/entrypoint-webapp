-- !!!                                                                                           !!!
-- !!!            DO NOT EVER ACCIDENTALLY RUN THIS FILE IN YOUR PRODUCTION DATABASE             !!!
-- !!!    This is meant for running locally to seed your database for contributing purposes      !!!

DO $$
DECLARE
  -- Student IDs
  emma_johnson_student_id uuid;
  michael_chen_student_id uuid;
  sophia_rodriguez_student_id uuid;
  noah_miller_student_id uuid;
  isabella_garcia_student_id uuid;
  lucas_martinez_student_id uuid;
  charlotte_davis_student_id uuid;
  benjamin_wilson_student_id uuid;
  amelia_taylor_student_id uuid;
  ethan_anderson_student_id uuid;

  -- School ID
  lincoln_high_school_id uuid;

  -- Year IDs
  year_2223_id uuid;
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
  q1_2223_term_id uuid;
  q2_2223_term_id uuid;
  q3_2223_term_id uuid;
  q4_2223_term_id uuid;
  s1_2223_term_id uuid;
  s2_2223_term_id uuid;

  -- Course IDs
  english_9a_course_id uuid;
  english_9b_course_id uuid;
  english_10a_course_id uuid;
  english_10b_course_id uuid;
  english_11a_course_id uuid;
  english_11b_course_id uuid;
  english_12a_course_id uuid;
  english_12b_course_id uuid;
  algebra_1a_course_id uuid;
  algebra_1b_course_id uuid;
  us_history_a_course_id uuid;
  us_history_b_course_id uuid;
  biology_a_course_id uuid;
  biology_b_course_id uuid;

  -- Section IDs
  english_9a_section_id uuid;
  english_9b_section_id uuid;
  english_10a_section_id uuid;
  english_10b_section_id uuid;
  english_11a_section_id uuid;
  english_11b_section_id uuid;
  english_12a_section_id uuid;
  english_12b_section_id uuid;
  algebra_1a_section_id uuid;
  algebra_1b_section_id uuid;
  us_history_a_section_id uuid;
  us_history_b_section_id uuid;
  biology_a_section_id uuid;
  biology_b_section_id uuid;

BEGIN
  -- Get Student IDs
  SELECT student_id INTO emma_johnson_student_id FROM students WHERE email = 'emma.johnson@student.edu' LIMIT 1;
  SELECT student_id INTO michael_chen_student_id FROM students WHERE email = 'michael.chen@student.edu' LIMIT 1;
  SELECT student_id INTO sophia_rodriguez_student_id FROM students WHERE email = 'sophia.rodriguez@student.edu' LIMIT 1;
  SELECT student_id INTO noah_miller_student_id FROM students WHERE email = 'noah.miller@student.edu' LIMIT 1;
  SELECT student_id INTO isabella_garcia_student_id FROM students WHERE email = 'isabella.garcia@student.edu' LIMIT 1;
  SELECT student_id INTO lucas_martinez_student_id FROM students WHERE email = 'lucas.martinez@student.edu' LIMIT 1;
  SELECT student_id INTO charlotte_davis_student_id FROM students WHERE email = 'charlotte.davis@student.edu' LIMIT 1;
  SELECT student_id INTO benjamin_wilson_student_id FROM students WHERE email = 'benjamin.wilson@student.edu' LIMIT 1;
  SELECT student_id INTO amelia_taylor_student_id FROM students WHERE email = 'amelia.taylor@student.edu' LIMIT 1;
  SELECT student_id INTO ethan_anderson_student_id FROM students WHERE email = 'ethan.anderson@student.edu' LIMIT 1;

  -- Get School ID
  SELECT school_id INTO lincoln_high_school_id FROM schools WHERE name = 'Lincoln High School' LIMIT 1;

  -- Get School Year IDs
  SELECT school_year_id INTO year_2223_id FROM school_years WHERE name = '2022-2023' LIMIT 1;
  SELECT school_year_id INTO year_2324_id FROM school_years WHERE name = '2023-2024' LIMIT 1;
  SELECT school_year_id INTO year_2425_id FROM school_years WHERE name = '2024-2025' LIMIT 1;

  -- Get Term IDs for 2024-2025
  SELECT term_id INTO q1_2425_term_id FROM terms WHERE abbreviation = 'Q1' AND school_id = lincoln_high_school_id AND school_year_id = year_2425_id LIMIT 1;
  SELECT term_id INTO q2_2425_term_id FROM terms WHERE abbreviation = 'Q2' AND school_id = lincoln_high_school_id AND school_year_id = year_2425_id LIMIT 1;
  SELECT term_id INTO q3_2425_term_id FROM terms WHERE abbreviation = 'Q3' AND school_id = lincoln_high_school_id AND school_year_id = year_2425_id LIMIT 1;
  SELECT term_id INTO q4_2425_term_id FROM terms WHERE abbreviation = 'Q4' AND school_id = lincoln_high_school_id AND school_year_id = year_2425_id LIMIT 1;
  SELECT term_id INTO s1_2425_term_id FROM terms WHERE abbreviation = 'S1' AND school_id = lincoln_high_school_id AND school_year_id = year_2425_id LIMIT 1;
  SELECT term_id INTO s2_2425_term_id FROM terms WHERE abbreviation = 'S2' AND school_id = lincoln_high_school_id AND school_year_id = year_2425_id LIMIT 1;

  -- Get Term IDs for 2023-2024
  SELECT term_id INTO q1_2324_term_id FROM terms WHERE abbreviation = 'Q1' AND school_id = lincoln_high_school_id AND school_year_id = year_2324_id LIMIT 1;
  SELECT term_id INTO q2_2324_term_id FROM terms WHERE abbreviation = 'Q2' AND school_id = lincoln_high_school_id AND school_year_id = year_2324_id LIMIT 1;
  SELECT term_id INTO q3_2324_term_id FROM terms WHERE abbreviation = 'Q3' AND school_id = lincoln_high_school_id AND school_year_id = year_2324_id LIMIT 1;
  SELECT term_id INTO q4_2324_term_id FROM terms WHERE abbreviation = 'Q4' AND school_id = lincoln_high_school_id AND school_year_id = year_2324_id LIMIT 1;
  SELECT term_id INTO s1_2324_term_id FROM terms WHERE abbreviation = 'S1' AND school_id = lincoln_high_school_id AND school_year_id = year_2324_id LIMIT 1;
  SELECT term_id INTO s2_2324_term_id FROM terms WHERE abbreviation = 'S2' AND school_id = lincoln_high_school_id AND school_year_id = year_2324_id LIMIT 1;

  -- Get Term IDs for 2022-2023 (assuming these are seeded in courses_terms.sql)
  SELECT term_id INTO q1_2223_term_id FROM terms WHERE abbreviation = 'Q1' AND school_id = lincoln_high_school_id AND school_year_id = year_2223_id LIMIT 1;
  SELECT term_id INTO q2_2223_term_id FROM terms WHERE abbreviation = 'Q2' AND school_id = lincoln_high_school_id AND school_year_id = year_2223_id LIMIT 1;
  SELECT term_id INTO q3_2223_term_id FROM terms WHERE abbreviation = 'Q3' AND school_id = lincoln_high_school_id AND school_year_id = year_2223_id LIMIT 1;
  SELECT term_id INTO q4_2223_term_id FROM terms WHERE abbreviation = 'Q4' AND school_id = lincoln_high_school_id AND school_year_id = year_2223_id LIMIT 1;
  SELECT term_id INTO s1_2223_term_id FROM terms WHERE abbreviation = 'S1' AND school_id = lincoln_high_school_id AND school_year_id = year_2223_id LIMIT 1;
  SELECT term_id INTO s2_2223_term_id FROM terms WHERE abbreviation = 'S2' AND school_id = lincoln_high_school_id AND school_year_id = year_2223_id LIMIT 1;

  -- Get Course IDs
  SELECT course_id INTO english_9a_course_id FROM courses WHERE name = 'English 9 A' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO english_9b_course_id FROM courses WHERE name = 'English 9 B' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO english_10a_course_id FROM courses WHERE name = 'English 10 A' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO english_10b_course_id FROM courses WHERE name = 'English 10 B' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO english_11a_course_id FROM courses WHERE name = 'English 11 A' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO english_11b_course_id FROM courses WHERE name = 'English 11 B' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO english_12a_course_id FROM courses WHERE name = 'English 12 A' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO english_12b_course_id FROM courses WHERE name = 'English 12 B' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO algebra_1a_course_id FROM courses WHERE name = 'Algebra I A' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO algebra_1b_course_id FROM courses WHERE name = 'Algebra I B' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO us_history_a_course_id FROM courses WHERE name = 'US History A' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO us_history_b_course_id FROM courses WHERE name = 'US History B' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO biology_a_course_id FROM courses WHERE name = 'Biology A' AND school_id = lincoln_high_school_id LIMIT 1;
  SELECT course_id INTO biology_b_course_id FROM courses WHERE name = 'Biology B' AND school_id = lincoln_high_school_id LIMIT 1;

  -- Get Section IDs
  SELECT section_id INTO english_9a_section_id FROM sections WHERE course_number = 'ENG9A' AND course_id = english_9a_course_id LIMIT 1;
  SELECT section_id INTO english_9b_section_id FROM sections WHERE course_number = 'ENG9B' AND course_id = english_9b_course_id LIMIT 1;
  SELECT section_id INTO english_10a_section_id FROM sections WHERE course_number = 'ENG10A' AND course_id = english_10a_course_id LIMIT 1;
  SELECT section_id INTO english_10b_section_id FROM sections WHERE course_number = 'ENG10B' AND course_id = english_10b_course_id LIMIT 1;
  SELECT section_id INTO english_11a_section_id FROM sections WHERE course_number = 'ENG11A' AND course_id = english_11a_course_id LIMIT 1;
  SELECT section_id INTO english_11b_section_id FROM sections WHERE course_number = 'ENG11B' AND course_id = english_11b_course_id LIMIT 1;
  SELECT section_id INTO english_12a_section_id FROM sections WHERE course_number = 'ENG12A' AND course_id = english_12a_course_id LIMIT 1;
  SELECT section_id INTO english_12b_section_id FROM sections WHERE course_number = 'ENG12B' AND course_id = english_12b_course_id LIMIT 1;
  SELECT section_id INTO algebra_1a_section_id FROM sections WHERE course_number = 'ALG1A' AND course_id = algebra_1a_course_id LIMIT 1;
  SELECT section_id INTO algebra_1b_section_id FROM sections WHERE course_number = 'ALG1B' AND course_id = algebra_1b_course_id LIMIT 1;
  SELECT section_id INTO us_history_a_section_id FROM sections WHERE course_number = 'USHISTA' AND course_id = us_history_a_course_id LIMIT 1;
  SELECT section_id INTO us_history_b_section_id FROM sections WHERE course_number = 'USHISTB' AND course_id = us_history_b_course_id LIMIT 1;
  SELECT section_id INTO biology_a_section_id FROM sections WHERE course_number = 'BIO1A' AND course_id = biology_a_course_id LIMIT 1;
  SELECT section_id INTO biology_b_section_id FROM sections WHERE course_number = 'BIO1B' AND course_id = biology_b_course_id LIMIT 1;
  
  -- ##################### Seed Section Enrollments #####################

  -- Emma Johnson's Enrollments
  -- Grade 10 (2023-2024)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, english_10a_section_id, s1_2324_term_id, '2023-08-15', 1, 1, 'ENRL_EMMA_ENG10A_S1_2324', 'E_EMMA_ENG10A_S1_2324', encode(digest('ENRL_EMMA_ENG10A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_10b_section_id, s2_2324_term_id, '2024-01-06', 3, 1, 'ENRL_EMMA_ENG10B_S2_2324', 'E_EMMA_ENG10B_S2_2324', encode(digest('ENRL_EMMA_ENG10B_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, algebra_1a_section_id, s1_2324_term_id, '2023-08-15', 1, 3, 'ENRL_EMMA_ALG1A_S1_2324', 'E_EMMA_ALG1A_S1_2324', encode(digest('ENRL_EMMA_ALG1A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, algebra_1b_section_id, s2_2324_term_id, '2024-01-06', 2, 1, 'ENRL_EMMA_ALG1B_S2_2324', 'E_EMMA_ALG1B_S2_2324', encode(digest('ENRL_EMMA_ALG1B_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, biology_a_section_id, s1_2324_term_id, '2023-08-15', 1, 0, 'ENRL_EMMA_BIO1A_S1_2324', 'E_EMMA_BIO1A_S1_2324', encode(digest('ENRL_EMMA_BIO1A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, biology_b_section_id, s2_2324_term_id, '2024-01-06', 1, 1, 'ENRL_EMMA_BIO1B_S2_2324', 'E_EMMA_BIO1B_S2_2324', encode(digest('ENRL_EMMA_BIO1B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 11 (2024-2025)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, us_history_a_section_id, s1_2425_term_id, '2024-08-15', 2, 2, 'ENRL_EMMA_USHISTA_S1_2425', 'E_EMMA_USHISTA_S1_2425', encode(digest('ENRL_EMMA_USHISTA_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, us_history_b_section_id, s2_2425_term_id, '2025-01-06', 3, 1, 'ENRL_EMMA_USHISTB_S2_2425', 'E_EMMA_USHISTB_S2_2425', encode(digest('ENRL_EMMA_USHISTB_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_11a_section_id, s1_2425_term_id, '2024-08-15', 4, 0, 'ENRL_EMMA_ENG11A_S1_2425', 'E_EMMA_ENG11A_S1_2425', encode(digest('ENRL_EMMA_ENG11A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_11b_section_id, s2_2425_term_id, '2025-01-06', 1, 1, 'ENRL_EMMA_ENG11B_S2_2425', 'E_EMMA_ENG11B_S2_2425', encode(digest('ENRL_EMMA_ENG11B_S2_2425', 'sha256'), 'hex'), 'mock_source');

  -- Michael Chen's Enrollments
  -- Grade 9 (2023-2024)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (michael_chen_student_id, english_9a_section_id, s1_2324_term_id, '2023-08-15', 2, 0, 'ENRL_MICHAEL_ENG9A_S1_2324', 'E_MICHAEL_ENG9A_S1_2324', encode(digest('ENRL_MICHAEL_ENG9A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_9b_section_id, s2_2324_term_id, '2024-01-06', 1, 1, 'ENRL_MICHAEL_ENG9B_S2_2324', 'E_MICHAEL_ENG9B_S2_2324', encode(digest('ENRL_MICHAEL_ENG9B_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, algebra_1a_section_id, s1_2324_term_id, '2023-08-15', 3, 2, 'ENRL_MICHAEL_ALG1A_S1_2324', 'E_MICHAEL_ALG1A_S1_2324', encode(digest('ENRL_MICHAEL_ALG1A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, algebra_1b_section_id, s2_2324_term_id, '2024-01-06', 0, 1, 'ENRL_MICHAEL_ALG1B_S2_2324', 'E_MICHAEL_ALG1B_S2_2324', encode(digest('ENRL_MICHAEL_ALG1B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 10 (2024-2025)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (michael_chen_student_id, english_10a_section_id, s1_2425_term_id, '2024-08-15', 0, 2, 'ENRL_MICHAEL_ENG10A_S1_2425', 'E_MICHAEL_ENG10A_S1_2425', encode(digest('ENRL_MICHAEL_ENG10A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_10b_section_id, s2_2425_term_id, '2025-01-06', 1, 0, 'ENRL_MICHAEL_ENG10B_S2_2425', 'E_MICHAEL_ENG10B_S2_2425', encode(digest('ENRL_MICHAEL_ENG10B_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, biology_a_section_id, s1_2425_term_id, '2024-08-15', 2, 1, 'ENRL_MICHAEL_BIO1A_S1_2425', 'E_MICHAEL_BIO1A_S1_2425', encode(digest('ENRL_MICHAEL_BIO1A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, biology_b_section_id, s2_2425_term_id, '2025-01-06', 1, 2, 'ENRL_MICHAEL_BIO1B_S2_2425', 'E_MICHAEL_BIO1B_S2_2425', encode(digest('ENRL_MICHAEL_BIO1B_S2_2425', 'sha256'), 'hex'), 'mock_source');

  -- Sophia Rodriguez's Enrollments
  -- Grade 10 (2022-2023)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (sophia_rodriguez_student_id, english_10a_section_id, s1_2223_term_id, '2022-08-15', 0, 0, 'ENRL_SOPHIA_ENG10A_S1_2223', 'E_SOPHIA_ENG10A_S1_2223', encode(digest('ENRL_SOPHIA_ENG10A_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_10b_section_id, s2_2223_term_id, '2023-01-06', 0, 1, 'ENRL_SOPHIA_ENG10B_S2_2223', 'E_SOPHIA_ENG10B_S2_2223', encode(digest('ENRL_SOPHIA_ENG10B_S2_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, biology_a_section_id, s1_2223_term_id, '2022-08-15', 0, 0, 'ENRL_SOPHIA_BIO1A_S1_2223', 'E_SOPHIA_BIO1A_S1_2223', encode(digest('ENRL_SOPHIA_BIO1A_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, biology_b_section_id, s2_2223_term_id, '2023-01-06', 1, 0, 'ENRL_SOPHIA_BIO1B_S2_2223', 'E_SOPHIA_BIO1B_S2_2223', encode(digest('ENRL_SOPHIA_BIO1B_S2_2223', 'sha256'), 'hex'), 'mock_source');
  -- Grade 11 (2023-2024)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (sophia_rodriguez_student_id, us_history_a_section_id, s1_2324_term_id, '2023-08-15', 0, 0, 'ENRL_SOPHIA_USHISTA_S1_2324', 'E_SOPHIA_USHISTA_S1_2324', encode(digest('ENRL_SOPHIA_USHISTA_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, us_history_b_section_id, s2_2324_term_id, '2024-01-06', 1, 0, 'ENRL_SOPHIA_USHISTB_S2_2324', 'E_SOPHIA_USHISTB_S2_2324', encode(digest('ENRL_SOPHIA_USHISTB_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_11a_section_id, s1_2324_term_id, '2023-08-15', 0, 1, 'ENRL_SOPHIA_ENG11A_S1_2324', 'E_SOPHIA_ENG11A_S1_2324', encode(digest('ENRL_SOPHIA_ENG11A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_11b_section_id, s2_2324_term_id, '2024-01-06', 0, 0, 'ENRL_SOPHIA_ENG11B_S2_2324', 'E_SOPHIA_ENG11B_S2_2324', encode(digest('ENRL_SOPHIA_ENG11B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 12 (2024-2025)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (sophia_rodriguez_student_id, english_12a_section_id, s1_2425_term_id, '2024-08-15', 1, 0, 'ENRL_SOPHIA_ENG12A_S1_2425', 'E_SOPHIA_ENG12A_S1_2425', encode(digest('ENRL_SOPHIA_ENG12A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_12b_section_id, s2_2425_term_id, '2025-01-06', 0, 0, 'ENRL_SOPHIA_ENG12B_S2_2425', 'E_SOPHIA_ENG12B_S2_2425', encode(digest('ENRL_SOPHIA_ENG12B_S2_2425', 'sha256'), 'hex'), 'mock_source');

  -- Noah Miller (Grade 12)
  -- Grade 10 (22-23)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (noah_miller_student_id, english_10a_section_id, s1_2223_term_id, '2022-08-15', 2, 1, 'ENRL_NOAH_ENG10A_S1_2223', 'E_NOAH_ENG10A_S1_2223', encode(digest('ENRL_NOAH_ENG10A_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, english_10b_section_id, s2_2223_term_id, '2023-01-06', 1, 0, 'ENRL_NOAH_ENG10B_S2_2223', 'E_NOAH_ENG10B_S2_2223', encode(digest('ENRL_NOAH_ENG10B_S2_2223', 'sha256'), 'hex'), 'mock_source');
  -- Grade 11 (23-24)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (noah_miller_student_id, english_11a_section_id, s1_2324_term_id, '2023-08-15', 0, 2, 'ENRL_NOAH_ENG11A_S1_2324', 'E_NOAH_ENG11A_S1_2324', encode(digest('ENRL_NOAH_ENG11A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, english_11b_section_id, s2_2324_term_id, '2024-01-06', 1, 1, 'ENRL_NOAH_ENG11B_S2_2324', 'E_NOAH_ENG11B_S2_2324', encode(digest('ENRL_NOAH_ENG11B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 12 (24-25)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (noah_miller_student_id, english_12a_section_id, s1_2425_term_id, '2024-08-15', 1, 0, 'ENRL_NOAH_ENG12A_S1_2425', 'E_NOAH_ENG12A_S1_2425', encode(digest('ENRL_NOAH_ENG12A_S1_2425', 'sha256'), 'hex'), 'mock_source');

  -- Isabella Garcia (Grade 12)
  -- Grade 11 (23-24)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (isabella_garcia_student_id, us_history_a_section_id, s1_2324_term_id, '2023-08-15', 0, 0, 'ENRL_ISABELLA_USHISTA_S1_2324', 'E_ISABELLA_USHISTA_S1_2324', encode(digest('ENRL_ISABELLA_USHISTA_S1_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 12 (24-25)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (isabella_garcia_student_id, english_12a_section_id, s1_2425_term_id, '2024-08-15', 0, 1, 'ENRL_ISABELLA_ENG12A_S1_2425', 'E_ISABELLA_ENG12A_S1_2425', encode(digest('ENRL_ISABELLA_ENG12A_S1_2425', 'sha256'), 'hex'), 'mock_source');

  -- Lucas Martinez (Grade 11)
  -- Grade 10 (23-24)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (lucas_martinez_student_id, english_10a_section_id, s1_2324_term_id, '2023-08-15', 3, 3, 'ENRL_LUCAS_ENG10A_S1_2324', 'E_LUCAS_ENG10A_S1_2324', encode(digest('ENRL_LUCAS_ENG10A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (lucas_martinez_student_id, english_10b_section_id, s2_2324_term_id, '2024-01-06', 4, 1, 'ENRL_LUCAS_ENG10B_S2_2324', 'E_LUCAS_ENG10B_S2_2324', encode(digest('ENRL_LUCAS_ENG10B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 11 (24-25)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (lucas_martinez_student_id, english_11a_section_id, s1_2425_term_id, '2024-08-15', 1, 2, 'ENRL_LUCAS_ENG11A_S1_2425', 'E_LUCAS_ENG11A_S1_2425', encode(digest('ENRL_LUCAS_ENG11A_S1_2425', 'sha256'), 'hex'), 'mock_source');

  -- Charlotte Davis (Grade 11)
  -- Grade 10 (23-24)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (charlotte_davis_student_id, biology_a_section_id, s1_2324_term_id, '2023-08-15', 0, 0, 'ENRL_CHARLOTTE_BIOA_S1_2324', 'E_CHARLOTTE_BIOA_S1_2324', encode(digest('ENRL_CHARLOTTE_BIOA_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (charlotte_davis_student_id, biology_b_section_id, s2_2324_term_id, '2024-01-06', 1, 0, 'ENRL_CHARLOTTE_BIOB_S2_2324', 'E_CHARLOTTE_BIOB_S2_2324', encode(digest('ENRL_CHARLOTTE_BIOB_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 11 (24-25)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (charlotte_davis_student_id, us_history_a_section_id, s1_2425_term_id, '2024-08-15', 0, 1, 'ENRL_CHARLOTTE_USHISTA_S1_2425', 'E_CHARLOTTE_USHISTA_S1_2425', encode(digest('ENRL_CHARLOTTE_USHISTA_S1_2425', 'sha256'), 'hex'), 'mock_source');

  -- Benjamin Wilson (Grade 10)
  -- Grade 9 (23-24)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (benjamin_wilson_student_id, english_9a_section_id, s1_2324_term_id, '2023-08-15', 1, 1, 'ENRL_BENJAMIN_ENG9A_S1_2324', 'E_BENJAMIN_ENG9A_S1_2324', encode(digest('ENRL_BENJAMIN_ENG9A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (benjamin_wilson_student_id, english_9b_section_id, s2_2324_term_id, '2024-01-06', 0, 1, 'ENRL_BENJAMIN_ENG9B_S2_2324', 'E_BENJAMIN_ENG9B_S2_2324', encode(digest('ENRL_BENJAMIN_ENG9B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 10 (24-25)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (benjamin_wilson_student_id, english_10a_section_id, s1_2425_term_id, '2024-08-15', 2, 0, 'ENRL_BENJAMIN_ENG10A_S1_2425', 'E_BENJAMIN_ENG10A_S1_2425', encode(digest('ENRL_BENJAMIN_ENG10A_S1_2425', 'sha256'), 'hex'), 'mock_source');

  -- Amelia Taylor (Grade 10)
  -- Grade 9 (23-24)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (amelia_taylor_student_id, algebra_1a_section_id, s1_2324_term_id, '2023-08-15', 5, 2, 'ENRL_AMELIA_ALG1A_S1_2324', 'E_AMELIA_ALG1A_S1_2324', encode(digest('ENRL_AMELIA_ALG1A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (amelia_taylor_student_id, algebra_1b_section_id, s2_2324_term_id, '2024-01-06', 2, 3, 'ENRL_AMELIA_ALG1B_S2_2324', 'E_AMELIA_ALG1B_S2_2324', encode(digest('ENRL_AMELIA_ALG1B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 10 (24-25)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (amelia_taylor_student_id, biology_a_section_id, s1_2425_term_id, '2024-08-15', 1, 1, 'ENRL_AMELIA_BIOA_S1_2425', 'E_AMELIA_BIOA_S1_2425', encode(digest('ENRL_AMELIA_BIOA_S1_2425', 'sha256'), 'hex'), 'mock_source');

  -- Ethan Anderson (Grade 9)
  -- Grade 9 (24-25)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (ethan_anderson_student_id, english_9a_section_id, s1_2425_term_id, '2024-08-15', 0, 1, 'ENRL_ETHAN_ENG9A_S1_2425', 'E_ETHAN_ENG9A_S1_2425', encode(digest('ENRL_ETHAN_ENG9A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (ethan_anderson_student_id, algebra_1a_section_id, s1_2425_term_id, '2024-08-15', 1, 0, 'ENRL_ETHAN_ALG1A_S1_2425', 'E_ETHAN_ALG1A_S1_2425', encode(digest('ENRL_ETHAN_ALG1A_S1_2425', 'sha256'), 'hex'), 'mock_source');

  -- ##################### Seed Student Grades #####################
  
  -- Emma Johnson's Grades
  -- Grade 10 (2023-2024)
  -- English 10A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, english_10a_section_id, q1_2324_term_id, english_10a_course_id, 'A', 'Q1', 94.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2023-10-20', 'GRADE_EMMA_ENG10A_Q1_2324', 'G_EMMA_ENG10A_Q1_2324', encode(digest('GRADE_EMMA_ENG10A_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_10a_section_id, q2_2324_term_id, english_10a_course_id, 'A-', 'Q2', 91.50, 3.70, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2023-12-22', 'GRADE_EMMA_ENG10A_Q2_2324', 'G_EMMA_ENG10A_Q2_2324', encode(digest('GRADE_EMMA_ENG10A_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_10a_section_id, s1_2324_term_id, english_10a_course_id, 'A', 'S1', 92.75, 3.85, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2023-12-22', 'GRADE_EMMA_ENG10A_S1_2324', 'G_EMMA_ENG10A_S1_2324', encode(digest('GRADE_EMMA_ENG10A_S1_2324', 'sha256'), 'hex'), 'mock_source');
  -- English 10B (S2)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, english_10b_section_id, q3_2324_term_id, english_10b_course_id, 'A', 'Q3', 95.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2024-03-16', 'GRADE_EMMA_ENG10B_Q3_2324', 'G_EMMA_ENG10B_Q3_2324', encode(digest('GRADE_EMMA_ENG10B_Q3_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_10b_section_id, q4_2324_term_id, english_10b_course_id, 'A', 'Q4', 96.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2024-05-25', 'GRADE_EMMA_ENG10B_Q4_2324', 'G_EMMA_ENG10B_Q4_2324', encode(digest('GRADE_EMMA_ENG10B_Q4_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_10b_section_id, s2_2324_term_id, english_10b_course_id, 'A', 'S2', 95.50, 4.00, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2024-05-25', 'GRADE_EMMA_ENG10B_S2_2324', 'G_EMMA_ENG10B_S2_2324', encode(digest('GRADE_EMMA_ENG10B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Algebra I A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, algebra_1a_section_id, q1_2324_term_id, algebra_1a_course_id, 'C-', 'Q1', 71.00, 1.70, 0.5, 0.5, 0, false, 'Math', 'Final', 'Struggled with concepts.', '10', 'StoredGrades', '2023-10-20', 'GRADE_EMMA_ALG1A_Q1_2324', 'G_EMMA_ALG1A_Q1_2324', encode(digest('GRADE_EMMA_ALG1A_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, algebra_1a_section_id, q2_2324_term_id, algebra_1a_course_id, 'A-', 'Q2', 91.00, 3.70, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2023-12-22', 'GRADE_EMMA_ALG1A_Q2_2324', 'G_EMMA_ALG1A_Q2_2324', encode(digest('GRADE_EMMA_ALG1A_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, algebra_1a_section_id, s1_2324_term_id, algebra_1a_course_id, 'B-', 'S1', 81.00, 2.70, 1.0, 1.0, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2023-12-22', 'GRADE_EMMA_ALG1A_S1_2324', 'G_EMMA_ALG1A_S1_2324', encode(digest('GRADE_EMMA_ALG1A_S1_2324', 'sha256'), 'hex'), 'mock_source');
  -- Algebra I B (S2)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, algebra_1b_section_id, q3_2324_term_id, algebra_1b_course_id, 'B+', 'Q3', 89.50, 3.30, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2024-03-16', 'GRADE_EMMA_ALG1B_Q3_2324', 'G_EMMA_ALG1B_Q3_2324', encode(digest('GRADE_EMMA_ALG1B_Q3_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, algebra_1b_section_id, q4_2324_term_id, algebra_1b_course_id, 'A', 'Q4', 93.00, 4.00, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2024-05-25', 'GRADE_EMMA_ALG1B_Q4_2324', 'G_EMMA_ALG1B_Q4_2324', encode(digest('GRADE_EMMA_ALG1B_Q4_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, algebra_1b_section_id, s2_2324_term_id, algebra_1b_course_id, 'A-', 'S2', 91.25, 3.65, 1.0, 1.0, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2024-05-25', 'GRADE_EMMA_ALG1B_S2_2324', 'G_EMMA_ALG1B_S2_2324', encode(digest('GRADE_EMMA_ALG1B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Biology A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, biology_a_section_id, q1_2324_term_id, biology_a_course_id, 'A', 'Q1', 95.00, 4.00, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2023-10-20', 'GRADE_EMMA_BIO1A_Q1_2324', 'G_EMMA_BIO1A_Q1_2324', encode(digest('GRADE_EMMA_BIO1A_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, biology_a_section_id, q2_2324_term_id, biology_a_course_id, 'A-', 'Q2', 92.00, 3.70, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2023-12-22', 'GRADE_EMMA_BIO1A_Q2_2324', 'G_EMMA_BIO1A_Q2_2324', encode(digest('GRADE_EMMA_BIO1A_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, biology_a_section_id, s1_2324_term_id, biology_a_course_id, 'A', 'S1', 93.50, 3.85, 1.0, 1.0, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2023-12-22', 'GRADE_EMMA_BIO1A_S1_2324', 'G_EMMA_BIO1A_S1_2324', encode(digest('GRADE_EMMA_BIO1A_S1_2324', 'sha256'), 'hex'), 'mock_source');
  -- Biology B (S2)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, biology_b_section_id, q3_2324_term_id, biology_b_course_id, 'D+', 'Q3', 68.00, 1.30, 0.5, 0.5, 0, false, 'Science', 'Final', 'Difficulty with lab reports.', '10', 'StoredGrades', '2024-03-16', 'GRADE_EMMA_BIO1B_Q3_2324', 'G_EMMA_BIO1B_Q3_2324', encode(digest('GRADE_EMMA_BIO1B_Q3_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, biology_b_section_id, q4_2324_term_id, biology_b_course_id, 'A', 'Q4', 97.00, 4.00, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2024-05-25', 'GRADE_EMMA_BIO1B_Q4_2324', 'G_EMMA_BIO1B_Q4_2324', encode(digest('GRADE_EMMA_BIO1B_Q4_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, biology_b_section_id, s2_2324_term_id, biology_b_course_id, 'C', 'S2', 82.50, 2.65, 1.0, 1.0, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2024-05-25', 'GRADE_EMMA_BIO1B_S2_2324', 'G_EMMA_BIO1B_S2_2324', encode(digest('GRADE_EMMA_BIO1B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 11 (2024-2025)
  -- US History A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, us_history_a_section_id, q1_2425_term_id, us_history_a_course_id, 'A-', 'Q1', 92.00, 3.70, 0.5, 0.5, 0, false, 'History', 'Final', 'Excellent work on Q1 project!', '11', 'StoredGrades', '2024-10-20', 'GRADE_EMMA_USHISTA_Q1_2425', 'G_EMMA_USHISTA_Q1_2425', encode(digest('GRADE_EMMA_USHISTA_Q1_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, us_history_a_section_id, q2_2425_term_id, us_history_a_course_id, 'D', 'Q2', 65.00, 1.00, 0.5, 0.5, 0, false, 'History', 'Final', 'Needs improvement.', '11', 'PGFinalGrades', '2024-12-15', 'GRADE_EMMA_USHISTA_Q2_2425', 'G_EMMA_USHISTA_Q2_2425', encode(digest('GRADE_EMMA_USHISTA_Q2_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, us_history_a_section_id, s1_2425_term_id, us_history_a_course_id, 'C', 'S1', 78.50, 2.35, 1.0, 1.0, 0, false, 'History', 'Final', 'Preliminary semester grade.', '11', 'PGFinalGrades', '2024-12-22', 'GRADE_EMMA_USHISTA_S1_2425', 'G_EMMA_USHISTA_S1_2425', encode(digest('GRADE_EMMA_USHISTA_S1_2425', 'sha256'), 'hex'), 'mock_source');
  -- US History B (S2)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, us_history_b_section_id, q3_2425_term_id, us_history_b_course_id, 'B', 'Q3', 85.00, 3.00, 0.5, 0.5, 0, false, 'History', 'Final', 'Solid effort.', '11', 'PGFinalGrades', '2025-03-16', 'GRADE_EMMA_USHISTB_Q3_2425', 'G_EMMA_USHISTB_Q3_2425', encode(digest('GRADE_EMMA_USHISTB_Q3_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, us_history_b_section_id, q4_2425_term_id, us_history_b_course_id, 'B+', 'Q4', 89.00, 3.30, 0.5, 0.5, 0, false, 'History', 'Final', 'Strong finish.', '11', 'PGFinalGrades', '2025-05-22', 'GRADE_EMMA_USHISTB_Q4_2425', 'G_EMMA_USHISTB_Q4_2425', encode(digest('GRADE_EMMA_USHISTB_Q4_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, us_history_b_section_id, s2_2425_term_id, us_history_b_course_id, 'B+', 'S2', 87.00, 3.15, 1.0, 1.0, 0, false, 'History', 'Final', 'Keep up the good work.', '11', 'PGFinalGrades', '2025-05-22', 'GRADE_EMMA_USHISTB_S2_2425', 'G_EMMA_USHISTB_S2_2425', encode(digest('GRADE_EMMA_USHISTB_S2_2425', 'sha256'), 'hex'), 'mock_source');
  -- English 11 A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, english_11a_section_id, q1_2425_term_id, english_11a_course_id, 'A', 'Q1', 95.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', 'Great analytical essays.', '11', 'StoredGrades', '2024-10-20', 'GRADE_EMMA_ENG11A_Q1_2425', 'G_EMMA_ENG11A_Q1_2425', encode(digest('GRADE_EMMA_ENG11A_Q1_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_11a_section_id, q2_2425_term_id, english_11a_course_id, 'A-', 'Q2', 91.00, 3.70, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '11', 'PGFinalGrades', '2024-12-15', 'GRADE_EMMA_ENG11A_Q2_2425', 'G_EMMA_ENG11A_Q2_2425', encode(digest('GRADE_EMMA_ENG11A_Q2_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_11a_section_id, s1_2425_term_id, english_11a_course_id, 'A', 'S1', 93.00, 3.85, 1.0, 1.0, 0, false, 'English', 'Final', 'Preliminary semester grade.', '11', 'PGFinalGrades', '2024-12-22', 'GRADE_EMMA_ENG11A_S1_2425', 'G_EMMA_ENG11A_S1_2425', encode(digest('GRADE_EMMA_ENG11A_S1_2425', 'sha256'), 'hex'), 'mock_source');
  -- English 11 B (S2)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, english_11b_section_id, q3_2425_term_id, english_11b_course_id, 'A-', 'Q3', 92.50, 3.70, 0.5, 0.5, 0, false, 'English', 'Final', 'Excellent contributions.', '11', 'PGFinalGrades', '2025-03-16', 'GRADE_EMMA_ENG11B_Q3_2425', 'G_EMMA_ENG11B_Q3_2425', encode(digest('GRADE_EMMA_ENG11B_Q3_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_11b_section_id, q4_2425_term_id, english_11b_course_id, 'A', 'Q4', 96.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', 'Superb final paper.', '11', 'PGFinalGrades', '2025-05-22', 'GRADE_EMMA_ENG11B_Q4_2425', 'G_EMMA_ENG11B_Q4_2425', encode(digest('GRADE_EMMA_ENG11B_Q4_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_11b_section_id, s2_2425_term_id, english_11b_course_id, 'A-', 'S2', 94.25, 3.85, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '11', 'PGFinalGrades', '2025-05-22', 'GRADE_EMMA_ENG11B_S2_2425', 'G_EMMA_ENG11B_S2_2425', encode(digest('GRADE_EMMA_ENG11B_S2_2425', 'sha256'), 'hex'), 'mock_source');

  -- Michael Chen's Grades
  -- Grade 9 (2023-2024)
  -- English 9A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (michael_chen_student_id, english_9a_section_id, q1_2324_term_id, english_9a_course_id, 'C+', 'Q1', 79.00, 2.30, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '09', 'StoredGrades', '2023-10-20', 'GRADE_MICHAEL_ENG9A_Q1_2324', 'G_MICHAEL_ENG9A_Q1_2324', encode(digest('GRADE_MICHAEL_ENG9A_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_9a_section_id, q2_2324_term_id, english_9a_course_id, 'B-', 'Q2', 82.00, 2.70, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '09', 'StoredGrades', '2023-12-22', 'GRADE_MICHAEL_ENG9A_Q2_2324', 'G_MICHAEL_ENG9A_Q2_2324', encode(digest('GRADE_MICHAEL_ENG9A_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_9a_section_id, s1_2324_term_id, english_9a_course_id, 'B-', 'S1', 80.50, 2.50, 1.0, 1.0, 0, false, 'English', 'Final', 'Improvement shown.', '09', 'StoredGrades', '2023-12-22', 'GRADE_MICHAEL_ENG9A_S1_2324', 'G_MICHAEL_ENG9A_S1_2324', encode(digest('GRADE_MICHAEL_ENG9A_S1_2324', 'sha256'), 'hex'), 'mock_source');
  -- English 9B (S2)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (michael_chen_student_id, english_9b_section_id, q3_2324_term_id, english_9b_course_id, 'B', 'Q3', 84.00, 3.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '09', 'StoredGrades', '2024-03-16', 'GRADE_MICHAEL_ENG9B_Q3_2324', 'G_MICHAEL_ENG9B_Q3_2324', encode(digest('GRADE_MICHAEL_ENG9B_Q3_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_9b_section_id, q4_2324_term_id, english_9b_course_id, 'B', 'Q4', 85.00, 3.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '09', 'StoredGrades', '2024-05-25', 'GRADE_MICHAEL_ENG9B_Q4_2324', 'G_MICHAEL_ENG9B_Q4_2324', encode(digest('GRADE_MICHAEL_ENG9B_Q4_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_9b_section_id, s2_2324_term_id, english_9b_course_id, 'B', 'S2', 84.50, 3.00, 1.0, 1.0, 0, false, 'English', 'Final', 'Solid, consistent work.', '09', 'StoredGrades', '2024-05-25', 'GRADE_MICHAEL_ENG9B_S2_2324', 'G_MICHAEL_ENG9B_S2_2324', encode(digest('GRADE_MICHAEL_ENG9B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Algebra I A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (michael_chen_student_id, algebra_1a_section_id, q1_2324_term_id, algebra_1a_course_id, 'C', 'Q1', 74.00, 2.00, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '09', 'StoredGrades', '2023-10-20', 'GRADE_MICHAEL_ALG1A_Q1_2324', 'G_MICHAEL_ALG1A_Q1_2324', encode(digest('GRADE_MICHAEL_ALG1A_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, algebra_1a_section_id, q2_2324_term_id, algebra_1a_course_id, 'B-', 'Q2', 80.00, 2.70, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '09', 'StoredGrades', '2023-12-22', 'GRADE_MICHAEL_ALG1A_Q2_2324', 'G_MICHAEL_ALG1A_Q2_2324', encode(digest('GRADE_MICHAEL_ALG1A_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, algebra_1a_section_id, s1_2324_term_id, algebra_1a_course_id, 'C+', 'S1', 77.00, 2.35, 1.0, 1.0, 0, false, 'Math', 'Final', 'Getting the hang of it.', '09', 'StoredGrades', '2023-12-22', 'GRADE_MICHAEL_ALG1A_S1_2324', 'G_MICHAEL_ALG1A_S1_2324', encode(digest('GRADE_MICHAEL_ALG1A_S1_2324', 'sha256'), 'hex'), 'mock_source');
  -- Algebra I B (S2)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (michael_chen_student_id, algebra_1b_section_id, q3_2324_term_id, algebra_1b_course_id, 'B', 'Q3', 83.00, 3.00, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '09', 'StoredGrades', '2024-03-16', 'GRADE_MICHAEL_ALG1B_Q3_2324', 'G_MICHAEL_ALG1B_Q3_2324', encode(digest('GRADE_MICHAEL_ALG1B_Q3_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, algebra_1b_section_id, q4_2324_term_id, algebra_1b_course_id, 'A-', 'Q4', 90.00, 3.70, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '09', 'StoredGrades', '2024-05-25', 'GRADE_MICHAEL_ALG1B_Q4_2324', 'G_MICHAEL_ALG1B_Q4_2324', encode(digest('GRADE_MICHAEL_ALG1B_Q4_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, algebra_1b_section_id, s2_2324_term_id, algebra_1b_course_id, 'B+', 'S2', 86.50, 3.35, 1.0, 1.0, 0, false, 'Math', 'Final', 'Finished strong!', '09', 'StoredGrades', '2024-05-25', 'GRADE_MICHAEL_ALG1B_S2_2324', 'G_MICHAEL_ALG1B_S2_2324', encode(digest('GRADE_MICHAEL_ALG1B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 10 (2024-2025)
  -- English 10A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (michael_chen_student_id, english_10a_section_id, q1_2425_term_id, english_10a_course_id, 'B', 'Q1', 85.00, 3.00, 0.5, 0.5, 0, false, 'English', 'Final', 'Good start to the year.', '10', 'StoredGrades', '2024-10-20', 'GRADE_MICHAEL_ENG10A_Q1_2425', 'G_MICHAEL_ENG10A_Q1_2425', encode(digest('GRADE_MICHAEL_ENG10A_Q1_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_10a_section_id, q2_2425_term_id, english_10a_course_id, 'B-', 'Q2', 81.50, 2.70, 0.5, 0.5, 0, false, 'English', 'Final', 'Needs to participate more in class discussions.', '10', 'PGFinalGrades', '2024-12-15', 'GRADE_MICHAEL_ENG10A_Q2_2425', 'G_MICHAEL_ENG10A_Q2_2425', encode(digest('GRADE_MICHAEL_ENG10A_Q2_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_10a_section_id, s1_2425_term_id, english_10a_course_id, 'B-', 'S1', 83.25, 2.85, 1.0, 1.0, 0, false, 'English', 'Final', 'Preliminary semester grade.', '10', 'PGFinalGrades', '2024-12-22', 'GRADE_MICHAEL_ENG10A_S1_2425', 'G_MICHAEL_ENG10A_S1_2425', encode(digest('GRADE_MICHAEL_ENG10A_S1_2425', 'sha256'), 'hex'), 'mock_source');
  -- Biology A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (michael_chen_student_id, biology_a_section_id, q1_2425_term_id, biology_a_course_id, 'B+', 'Q1', 89.00, 3.30, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2024-10-20', 'GRADE_MICHAEL_BIO1A_Q1_2425', 'G_MICHAEL_BIO1A_Q1_2425', encode(digest('GRADE_MICHAEL_BIO1A_Q1_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, biology_a_section_id, q2_2425_term_id, biology_a_course_id, 'B', 'Q2', 86.00, 3.00, 0.5, 0.5, 0, false, 'Science', 'Final', 'Good lab work.', '10', 'PGFinalGrades', '2024-12-15', 'GRADE_MICHAEL_BIO1A_Q2_2425', 'G_MICHAEL_BIO1A_Q2_2425', encode(digest('GRADE_MICHAEL_BIO1A_Q2_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, biology_a_section_id, s1_2425_term_id, biology_a_course_id, 'B+', 'S1', 87.50, 3.15, 1.0, 1.0, 0, false, 'Science', 'Final', 'Preliminary semester grade.', '10', 'PGFinalGrades', '2024-12-22', 'GRADE_MICHAEL_BIO1A_S1_2425', 'G_MICHAEL_BIO1A_S1_2425', encode(digest('GRADE_MICHAEL_BIO1A_S1_2425', 'sha256'), 'hex'), 'mock_source');
  
  -- Sophia Rodriguez's Grades
  -- Grade 10 (2022-2023)
  -- English 10A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (sophia_rodriguez_student_id, english_10a_section_id, q1_2223_term_id, english_10a_course_id, 'A', 'Q1', 98.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2022-10-20', 'GRADE_SOPHIA_ENG10A_Q1_2223', 'G_SOPHIA_ENG10A_Q1_2223', encode(digest('GRADE_SOPHIA_ENG10A_Q1_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_10a_section_id, q2_2223_term_id, english_10a_course_id, 'A+', 'Q2', 100.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2022-12-22', 'GRADE_SOPHIA_ENG10A_Q2_2223', 'G_SOPHIA_ENG10A_Q2_2223', encode(digest('GRADE_SOPHIA_ENG10A_Q2_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_10a_section_id, s1_2223_term_id, english_10a_course_id, 'A+', 'S1', 99.00, 4.00, 1.0, 1.0, 0, false, 'English', 'Final', 'Exceptional student.', '10', 'StoredGrades', '2022-12-22', 'GRADE_SOPHIA_ENG10A_S1_2223', 'G_SOPHIA_ENG10A_S1_2223', encode(digest('GRADE_SOPHIA_ENG10A_S1_2223', 'sha256'), 'hex'), 'mock_source');
  -- English 10B (S2)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (sophia_rodriguez_student_id, english_10b_section_id, q3_2223_term_id, english_10b_course_id, 'A', 'Q3', 97.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2023-03-16', 'GRADE_SOPHIA_ENG10B_Q3_2223', 'G_SOPHIA_ENG10B_Q3_2223', encode(digest('GRADE_SOPHIA_ENG10B_Q3_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_10b_section_id, q4_2223_term_id, english_10b_course_id, 'A', 'Q4', 98.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2023-05-25', 'GRADE_SOPHIA_ENG10B_Q4_2223', 'G_SOPHIA_ENG10B_Q4_2223', encode(digest('GRADE_SOPHIA_ENG10B_Q4_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_10b_section_id, s2_2223_term_id, english_10b_course_id, 'A', 'S2', 97.50, 4.00, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2023-05-25', 'GRADE_SOPHIA_ENG10B_S2_2223', 'G_SOPHIA_ENG10B_S2_2223', encode(digest('GRADE_SOPHIA_ENG10B_S2_2223', 'sha256'), 'hex'), 'mock_source');
  -- Biology A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (sophia_rodriguez_student_id, biology_a_section_id, q1_2223_term_id, biology_a_course_id, 'A', 'Q1', 97.00, 4.00, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2022-10-20', 'GRADE_SOPHIA_BIO1A_Q1_2223', 'G_SOPHIA_BIO1A_Q1_2223', encode(digest('GRADE_SOPHIA_BIO1A_Q1_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, biology_a_section_id, q2_2223_term_id, biology_a_course_id, 'A', 'Q2', 96.00, 4.00, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2022-12-22', 'GRADE_SOPHIA_BIO1A_Q2_2223', 'G_SOPHIA_BIO1A_Q2_2223', encode(digest('GRADE_SOPHIA_BIO1A_Q2_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, biology_a_section_id, s1_2223_term_id, biology_a_course_id, 'A', 'S1', 96.50, 4.00, 1.0, 1.0, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2022-12-22', 'GRADE_SOPHIA_BIO1A_S1_2223', 'G_SOPHIA_BIO1A_S1_2223', encode(digest('GRADE_SOPHIA_BIO1A_S1_2223', 'sha256'), 'hex'), 'mock_source');
  -- Biology B (S2)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (sophia_rodriguez_student_id, biology_b_section_id, q3_2223_term_id, biology_b_course_id, 'A-', 'Q3', 93.00, 3.70, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2023-03-16', 'GRADE_SOPHIA_BIO1B_Q3_2223', 'G_SOPHIA_BIO1B_Q3_2223', encode(digest('GRADE_SOPHIA_BIO1B_Q3_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, biology_b_section_id, q4_2223_term_id, biology_b_course_id, 'A', 'Q4', 95.00, 4.00, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2023-05-25', 'GRADE_SOPHIA_BIO1B_Q4_2223', 'G_SOPHIA_BIO1B_Q4_2223', encode(digest('GRADE_SOPHIA_BIO1B_Q4_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, biology_b_section_id, s2_2223_term_id, biology_b_course_id, 'A-', 'S2', 94.00, 3.85, 1.0, 1.0, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2023-05-25', 'GRADE_SOPHIA_BIO1B_S2_2223', 'G_SOPHIA_BIO1B_S2_2223', encode(digest('GRADE_SOPHIA_BIO1B_S2_2223', 'sha256'), 'hex'), 'mock_source');
  -- Grade 11 (2023-2024)
  -- US History A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (sophia_rodriguez_student_id, us_history_a_section_id, q1_2324_term_id, us_history_a_course_id, 'A', 'Q1', 97.00, 4.00, 0.5, 0.5, 0, false, 'History', 'Final', 'Top of the class.', '11', 'StoredGrades', '2023-10-20', 'GRADE_SOPHIA_USHISTA_Q1_2324', 'G_SOPHIA_USHISTA_Q1_2324', encode(digest('GRADE_SOPHIA_USHISTA_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, us_history_a_section_id, q2_2324_term_id, us_history_a_course_id, 'A', 'Q2', 98.00, 4.00, 0.5, 0.5, 0, false, 'History', 'Final', 'Exceptional work.', '11', 'StoredGrades', '2023-12-22', 'GRADE_SOPHIA_USHISTA_Q2_2324', 'G_SOPHIA_USHISTA_Q2_2324', encode(digest('GRADE_SOPHIA_USHISTA_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, us_history_a_section_id, s1_2324_term_id, us_history_a_course_id, 'A', 'S1', 97.50, 4.00, 1.0, 1.0, 0, false, 'History', 'Final', NULL, '11', 'StoredGrades', '2023-12-22', 'GRADE_SOPHIA_USHISTA_S1_2324', 'G_SOPHIA_USHISTA_S1_2324', encode(digest('GRADE_SOPHIA_USHISTA_S1_2324', 'sha256'), 'hex'), 'mock_source');
  -- English 11 B (S2)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (sophia_rodriguez_student_id, english_11b_section_id, q3_2324_term_id, english_11b_course_id, 'A+', 'Q3', 100.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '11', 'StoredGrades', '2024-03-16', 'GRADE_SOPHIA_ENG11B_Q3_2324', 'G_SOPHIA_ENG11B_Q3_2324', encode(digest('GRADE_SOPHIA_ENG11B_Q3_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_11b_section_id, q4_2324_term_id, english_11b_course_id, 'A', 'Q4', 98.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '11', 'StoredGrades', '2024-05-25', 'GRADE_SOPHIA_ENG11B_Q4_2324', 'G_SOPHIA_ENG11B_Q4_2324', encode(digest('GRADE_SOPHIA_ENG11B_Q4_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_11b_section_id, s2_2324_term_id, english_11b_course_id, 'A', 'S2', 99.00, 4.00, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '11', 'StoredGrades', '2024-05-25', 'GRADE_SOPHIA_ENG11B_S2_2324', 'G_SOPHIA_ENG11B_S2_2324', encode(digest('GRADE_SOPHIA_ENG11B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 12 (2024-2025)
  -- English 12A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (sophia_rodriguez_student_id, english_12a_section_id, q1_2425_term_id, english_12a_course_id, 'A', 'Q1', 96.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '12', 'PGFinalGrades', '2024-10-20', 'GRADE_SOPHIA_ENG12A_Q1_2425', 'G_SOPHIA_ENG12A_Q1_2425', encode(digest('GRADE_SOPHIA_ENG12A_Q1_2425', 'sha256'), 'hex'), 'mock_source');

  -- Noah Miller (Grade 12)
  -- Grade 10 (22-23)
  -- English 10A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (noah_miller_student_id, english_10a_section_id, q1_2223_term_id, english_10a_course_id, 'B', 'Q1', 86.00, 3.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2022-10-20', 'GRADE_NOAH_ENG10A_Q1_2223', 'G_NOAH_ENG10A_Q1_2223', encode(digest('GRADE_NOAH_ENG10A_Q1_2223', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, english_10a_section_id, q2_2223_term_id, english_10a_course_id, 'B-', 'Q2', 82.00, 2.70, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2022-12-22', 'GRADE_NOAH_ENG10A_Q2_2223', 'G_NOAH_ENG10A_Q2_2223', encode(digest('GRADE_NOAH_ENG10A_Q2_2223', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, english_10a_section_id, s1_2223_term_id, english_10a_course_id, 'B-', 'S1', 84.00, 2.85, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2022-12-22', 'GRADE_NOAH_ENG10A_S1_2223', 'G_NOAH_ENG10A_S1_2223', encode(digest('GRADE_NOAH_ENG10A_S1_2223', 'sha256'), 'hex'), 'mock_source');
  -- Grade 11 (23-24)
  -- English 11A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (noah_miller_student_id, english_11a_section_id, q1_2324_term_id, english_11a_course_id, 'C+', 'Q1', 78.00, 2.30, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '11', 'StoredGrades', '2023-10-20', 'GRADE_NOAH_ENG11A_Q1_2324', 'G_NOAH_ENG11A_Q1_2324', encode(digest('GRADE_NOAH_ENG11A_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, english_11a_section_id, q2_2324_term_id, english_11a_course_id, 'B', 'Q2', 84.00, 3.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '11', 'StoredGrades', '2023-12-22', 'GRADE_NOAH_ENG11A_Q2_2324', 'G_NOAH_ENG11A_Q2_2324', encode(digest('GRADE_NOAH_ENG11A_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, english_11a_section_id, s1_2324_term_id, english_11a_course_id, 'B-', 'S1', 81.00, 2.65, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '11', 'StoredGrades', '2023-12-22', 'GRADE_NOAH_ENG11A_S1_2324', 'G_NOAH_ENG11A_S1_2324', encode(digest('GRADE_NOAH_ENG11A_S1_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 12 (24-25)
  -- English 12A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (noah_miller_student_id, english_12a_section_id, q1_2425_term_id, english_12a_course_id, 'B', 'Q1', 85.00, 3.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '12', 'PGFinalGrades', '2024-10-20', 'GRADE_NOAH_ENG12A_Q1_2425', 'G_NOAH_ENG12A_Q1_2425', encode(digest('GRADE_NOAH_ENG12A_Q1_2425', 'sha256'), 'hex'), 'mock_source');
  
  -- Isabella Garcia (Grade 12)
  -- Grade 11 (23-24)
  -- US History A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (isabella_garcia_student_id, us_history_a_section_id, q1_2324_term_id, us_history_a_course_id, 'A', 'Q1', 95.00, 4.00, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '11', 'StoredGrades', '2023-10-20', 'GRADE_ISABELLA_USHISTA_Q1_2324', 'G_ISABELLA_USHISTA_Q1_2324', encode(digest('GRADE_ISABELLA_USHISTA_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (isabella_garcia_student_id, us_history_a_section_id, q2_2324_term_id, us_history_a_course_id, 'A-', 'Q2', 91.00, 3.70, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '11', 'StoredGrades', '2023-12-22', 'GRADE_ISABELLA_USHISTA_Q2_2324', 'G_ISABELLA_USHISTA_Q2_2324', encode(digest('GRADE_ISABELLA_USHISTA_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (isabella_garcia_student_id, us_history_a_section_id, s1_2324_term_id, us_history_a_course_id, 'A', 'S1', 93.00, 3.85, 1.0, 1.0, 0, false, 'History', 'Final', NULL, '11', 'StoredGrades', '2023-12-22', 'GRADE_ISABELLA_USHISTA_S1_2324', 'G_ISABELLA_USHISTA_S1_2324', encode(digest('GRADE_ISABELLA_USHISTA_S1_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 12 (24-25)
  -- English 12A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (isabella_garcia_student_id, english_12a_section_id, q1_2425_term_id, english_12a_course_id, 'A-', 'Q1', 92.00, 3.70, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '12', 'PGFinalGrades', '2024-10-20', 'GRADE_ISABELLA_ENG12A_Q1_2425', 'G_ISABELLA_ENG12A_Q1_2425', encode(digest('GRADE_ISABELLA_ENG12A_Q1_2425', 'sha256'), 'hex'), 'mock_source');

  -- Lucas Martinez (Grade 11)
  -- Grade 10 (23-24)
  -- English 10A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (lucas_martinez_student_id, english_10a_section_id, q1_2324_term_id, english_10a_course_id, 'D', 'Q1', 66.00, 1.00, 0.5, 0.5, 0, false, 'English', 'Final', 'Often misses assignments.', '10', 'StoredGrades', '2023-10-20', 'GRADE_LUCAS_ENG10A_Q1_2324', 'G_LUCAS_ENG10A_Q1_2324', encode(digest('GRADE_LUCAS_ENG10A_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (lucas_martinez_student_id, english_10a_section_id, q2_2324_term_id, english_10a_course_id, 'C-', 'Q2', 72.00, 1.70, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2023-12-22', 'GRADE_LUCAS_ENG10A_Q2_2324', 'G_LUCAS_ENG10A_Q2_2324', encode(digest('GRADE_LUCAS_ENG10A_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (lucas_martinez_student_id, english_10a_section_id, s1_2324_term_id, english_10a_course_id, 'D+', 'S1', 69.00, 1.35, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2023-12-22', 'GRADE_LUCAS_ENG10A_S1_2324', 'G_LUCAS_ENG10A_S1_2324', encode(digest('GRADE_LUCAS_ENG10A_S1_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 11 (24-25)
  -- English 11A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (lucas_martinez_student_id, english_11a_section_id, q1_2425_term_id, english_11a_course_id, 'C', 'Q1', 75.00, 2.00, 0.5, 0.5, 0, false, 'English', 'Final', 'Showing more effort.', '11', 'PGFinalGrades', '2024-10-20', 'GRADE_LUCAS_ENG11A_Q1_2425', 'G_LUCAS_ENG11A_Q1_2425', encode(digest('GRADE_LUCAS_ENG11A_Q1_2425', 'sha256'), 'hex'), 'mock_source');
  
  -- Charlotte Davis (Grade 11)
  -- Grade 10 (23-24)
  -- Biology A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (charlotte_davis_student_id, biology_a_section_id, q1_2324_term_id, biology_a_course_id, 'A', 'Q1', 96.00, 4.00, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2023-10-20', 'GRADE_CHARLOTTE_BIOA_Q1_2324', 'G_CHARLOTTE_BIOA_Q1_2324', encode(digest('GRADE_CHARLOTTE_BIOA_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (charlotte_davis_student_id, biology_a_section_id, q2_2324_term_id, biology_a_course_id, 'A', 'Q2', 95.00, 4.00, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2023-12-22', 'GRADE_CHARLOTTE_BIOA_Q2_2324', 'G_CHARLOTTE_BIOA_Q2_2324', encode(digest('GRADE_CHARLOTTE_BIOA_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (charlotte_davis_student_id, biology_a_section_id, s1_2324_term_id, biology_a_course_id, 'A', 'S1', 95.50, 4.00, 1.0, 1.0, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2023-12-22', 'GRADE_CHARLOTTE_BIOA_S1_2324', 'G_CHARLOTTE_BIOA_S1_2324', encode(digest('GRADE_CHARLOTTE_BIOA_S1_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 11 (24-25)
  -- US History A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (charlotte_davis_student_id, us_history_a_section_id, q1_2425_term_id, us_history_a_course_id, 'B+', 'Q1', 88.00, 3.30, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '11', 'PGFinalGrades', '2024-10-20', 'GRADE_CHARLOTTE_USHISTA_Q1_2425', 'G_CHARLOTTE_USHISTA_Q1_2425', encode(digest('GRADE_CHARLOTTE_USHISTA_Q1_2425', 'sha256'), 'hex'), 'mock_source');

  -- Benjamin Wilson (Grade 10)
  -- Grade 9 (23-24)
  -- English 9A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (benjamin_wilson_student_id, english_9a_section_id, q1_2324_term_id, english_9a_course_id, 'B+', 'Q1', 87.00, 3.30, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '09', 'StoredGrades', '2023-10-20', 'GRADE_BENJAMIN_ENG9A_Q1_2324', 'G_BENJAMIN_ENG9A_Q1_2324', encode(digest('GRADE_BENJAMIN_ENG9A_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (benjamin_wilson_student_id, english_9a_section_id, q2_2324_term_id, english_9a_course_id, 'B', 'Q2', 85.00, 3.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '09', 'StoredGrades', '2023-12-22', 'GRADE_BENJAMIN_ENG9A_Q2_2324', 'G_BENJAMIN_ENG9A_Q2_2324', encode(digest('GRADE_BENJAMIN_ENG9A_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (benjamin_wilson_student_id, english_9a_section_id, s1_2324_term_id, english_9a_course_id, 'B', 'S1', 86.00, 3.15, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '09', 'StoredGrades', '2023-12-22', 'GRADE_BENJAMIN_ENG9A_S1_2324', 'G_BENJAMIN_ENG9A_S1_2324', encode(digest('GRADE_BENJAMIN_ENG9A_S1_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 10 (24-25)
  -- English 10A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (benjamin_wilson_student_id, english_10a_section_id, q1_2425_term_id, english_10a_course_id, 'B+', 'Q1', 89.00, 3.30, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'PGFinalGrades', '2024-10-20', 'GRADE_BENJAMIN_ENG10A_Q1_2425', 'G_BENJAMIN_ENG10A_Q1_2425', encode(digest('GRADE_BENJAMIN_ENG10A_Q1_2425', 'sha256'), 'hex'), 'mock_source');

  -- Amelia Taylor (Grade 10)
  -- Grade 9 (23-24)
  -- Algebra I A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (amelia_taylor_student_id, algebra_1a_section_id, q1_2324_term_id, algebra_1a_course_id, 'F', 'Q1', 55.00, 0.00, 0, 0.5, 0, false, 'Math', 'Final', 'Attendance issues impacting grade.', '09', 'StoredGrades', '2023-10-20', 'GRADE_AMELIA_ALG1A_Q1_2324', 'G_AMELIA_ALG1A_Q1_2324', encode(digest('GRADE_AMELIA_ALG1A_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (amelia_taylor_student_id, algebra_1a_section_id, q2_2324_term_id, algebra_1a_course_id, 'D', 'Q2', 65.00, 1.00, 0.5, 0.5, 0, false, 'Math', 'Final', 'Improvement, but still struggling.', '09', 'StoredGrades', '2023-12-22', 'GRADE_AMELIA_ALG1A_Q2_2324', 'G_AMELIA_ALG1A_Q2_2324', encode(digest('GRADE_AMELIA_ALG1A_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (amelia_taylor_student_id, algebra_1a_section_id, s1_2324_term_id, algebra_1a_course_id, 'F', 'S1', 60.00, 0.50, 0.5, 1.0, 0, false, 'Math', 'Final', 'Credit recovery needed.', '09', 'StoredGrades', '2023-12-22', 'GRADE_AMELIA_ALG1A_S1_2324', 'G_AMELIA_ALG1A_S1_2324', encode(digest('GRADE_AMELIA_ALG1A_S1_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 10 (24-25)
  -- Biology A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (amelia_taylor_student_id, biology_a_section_id, q1_2425_term_id, biology_a_course_id, 'C-', 'Q1', 71.00, 1.70, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'PGFinalGrades', '2024-10-20', 'GRADE_AMELIA_BIOA_Q1_2425', 'G_AMELIA_BIOA_Q1_2425', encode(digest('GRADE_AMELIA_BIOA_Q1_2425', 'sha256'), 'hex'), 'mock_source');
  
  -- Ethan Anderson (Grade 9)
  -- Grade 9 (24-25)
  -- English 9A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (ethan_anderson_student_id, english_9a_section_id, q1_2425_term_id, english_9a_course_id, 'B', 'Q1', 86.00, 3.00, 0.5, 0.5, 0, false, 'English', 'Final', 'Good start to high school.', '09', 'PGFinalGrades', '2024-10-20', 'GRADE_ETHAN_ENG9A_Q1_2425', 'G_ETHAN_ENG9A_Q1_2425', encode(digest('GRADE_ETHAN_ENG9A_Q1_2425', 'sha256'), 'hex'), 'mock_source');
  -- Algebra I A (S1)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (ethan_anderson_student_id, algebra_1a_section_id, q1_2425_term_id, algebra_1a_course_id, 'B-', 'Q1', 82.00, 2.70, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '09', 'PGFinalGrades', '2024-10-20', 'GRADE_ETHAN_ALG1A_Q1_2425', 'G_ETHAN_ALG1A_Q1_2425', encode(digest('GRADE_ETHAN_ALG1A_Q1_2425', 'sha256'), 'hex'), 'mock_source');

END $$;