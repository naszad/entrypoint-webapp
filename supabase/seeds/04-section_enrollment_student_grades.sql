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
  year_2122_id uuid;
  year_2223_id uuid;
  year_2324_id uuid;
  year_2425_id uuid;

  -- Term IDs
  q1_2425_term_id uuid; q2_2425_term_id uuid; q3_2425_term_id uuid; q4_2425_term_id uuid; s1_2425_term_id uuid; s2_2425_term_id uuid;
  q1_2324_term_id uuid; q2_2324_term_id uuid; q3_2324_term_id uuid; q4_2324_term_id uuid; s1_2324_term_id uuid; s2_2324_term_id uuid;
  q1_2223_term_id uuid; q2_2223_term_id uuid; q3_2223_term_id uuid; q4_2223_term_id uuid; s1_2223_term_id uuid; s2_2223_term_id uuid;
  q1_2122_term_id uuid; q2_2122_term_id uuid; q3_2122_term_id uuid; q4_2122_term_id uuid; s1_2122_term_id uuid; s2_2122_term_id uuid;

  -- Course IDs
  english_9a_course_id uuid; english_9b_course_id uuid;
  world_hist_9a_course_id uuid; world_hist_9b_course_id uuid;
  phys_sci_9a_course_id uuid; phys_sci_9b_course_id uuid;
  english_10a_course_id uuid; english_10b_course_id uuid;
  algebra_1a_course_id uuid; algebra_1b_course_id uuid;
  biology_a_course_id uuid; biology_b_course_id uuid;
  english_11a_course_id uuid; english_11b_course_id uuid;
  us_history_a_course_id uuid; us_history_b_course_id uuid;
  algebra_2a_course_id uuid; algebra_2b_course_id uuid;
  english_12a_course_id uuid; english_12b_course_id uuid;
  govt_12a_course_id uuid; govt_12b_course_id uuid;
  econ_12a_course_id uuid; econ_12b_course_id uuid;

  -- Section IDs
  english_9a_section_id uuid; english_9b_section_id uuid;
  whist9a_section_id uuid; whist9b_section_id uuid;
  physci9a_section_id uuid; physci9b_section_id uuid;
  english_10a_section_id uuid; english_10b_section_id uuid;
  algebra_1a_section_id uuid; algebra_1b_section_id uuid;
  biology_a_section_id uuid; biology_b_section_id uuid;
  english_11a_section_id uuid; english_11b_section_id uuid;
  us_history_a_section_id uuid; us_history_b_section_id uuid;
  alg2a_section_id uuid; alg2b_section_id uuid;
  english_12a_section_id uuid; english_12b_section_id uuid;
  govt12a_section_id uuid; govt12b_section_id uuid;
  econ12a_section_id uuid; econ12b_section_id uuid;

BEGIN
  -- ##################### Fetch IDs #####################

  -- Get School ID
  SELECT school_id INTO lincoln_high_school_id FROM schools WHERE name = 'Lincoln High School' LIMIT 1;

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

  -- Get School Year IDs
  SELECT year_id INTO year_2122_id FROM years WHERE name = '2021-2022' LIMIT 1;
  SELECT year_id INTO year_2223_id FROM years WHERE name = '2022-2023' LIMIT 1;
  SELECT year_id INTO year_2324_id FROM years WHERE name = '2023-2024' LIMIT 1;
  SELECT year_id INTO year_2425_id FROM years WHERE name = '2024-2025' LIMIT 1;

  -- Get Term IDs
  SELECT term_id INTO q1_2425_term_id FROM terms WHERE abbreviation = 'Q1' AND year_id = year_2425_id LIMIT 1;
  SELECT term_id INTO q2_2425_term_id FROM terms WHERE abbreviation = 'Q2' AND year_id = year_2425_id LIMIT 1;
  SELECT term_id INTO q3_2425_term_id FROM terms WHERE abbreviation = 'Q3' AND year_id = year_2425_id LIMIT 1;
  SELECT term_id INTO q4_2425_term_id FROM terms WHERE abbreviation = 'Q4' AND year_id = year_2425_id LIMIT 1;
  SELECT term_id INTO s1_2425_term_id FROM terms WHERE abbreviation = 'S1' AND year_id = year_2425_id LIMIT 1;
  SELECT term_id INTO s2_2425_term_id FROM terms WHERE abbreviation = 'S2' AND year_id = year_2425_id LIMIT 1;

  SELECT term_id INTO q1_2324_term_id FROM terms WHERE abbreviation = 'Q1' AND year_id = year_2324_id LIMIT 1;
  SELECT term_id INTO q2_2324_term_id FROM terms WHERE abbreviation = 'Q2' AND year_id = year_2324_id LIMIT 1;
  SELECT term_id INTO q3_2324_term_id FROM terms WHERE abbreviation = 'Q3' AND year_id = year_2324_id LIMIT 1;
  SELECT term_id INTO q4_2324_term_id FROM terms WHERE abbreviation = 'Q4' AND year_id = year_2324_id LIMIT 1;
  SELECT term_id INTO s1_2324_term_id FROM terms WHERE abbreviation = 'S1' AND year_id = year_2324_id LIMIT 1;
  SELECT term_id INTO s2_2324_term_id FROM terms WHERE abbreviation = 'S2' AND year_id = year_2324_id LIMIT 1;
  
  SELECT term_id INTO q1_2223_term_id FROM terms WHERE abbreviation = 'Q1' AND year_id = year_2223_id LIMIT 1;
  SELECT term_id INTO q2_2223_term_id FROM terms WHERE abbreviation = 'Q2' AND year_id = year_2223_id LIMIT 1;
  SELECT term_id INTO q3_2223_term_id FROM terms WHERE abbreviation = 'Q3' AND year_id = year_2223_id LIMIT 1;
  SELECT term_id INTO q4_2223_term_id FROM terms WHERE abbreviation = 'Q4' AND year_id = year_2223_id LIMIT 1;
  SELECT term_id INTO s1_2223_term_id FROM terms WHERE abbreviation = 'S1' AND year_id = year_2223_id LIMIT 1;
  SELECT term_id INTO s2_2223_term_id FROM terms WHERE abbreviation = 'S2' AND year_id = year_2223_id LIMIT 1;
  
  SELECT term_id INTO q1_2122_term_id FROM terms WHERE abbreviation = 'Q1' AND year_id = year_2122_id LIMIT 1;
  SELECT term_id INTO q2_2122_term_id FROM terms WHERE abbreviation = 'Q2' AND year_id = year_2122_id LIMIT 1;
  SELECT term_id INTO q3_2122_term_id FROM terms WHERE abbreviation = 'Q3' AND year_id = year_2122_id LIMIT 1;
  SELECT term_id INTO q4_2122_term_id FROM terms WHERE abbreviation = 'Q4' AND year_id = year_2122_id LIMIT 1;
  SELECT term_id INTO s1_2122_term_id FROM terms WHERE abbreviation = 'S1' AND year_id = year_2122_id LIMIT 1;
  SELECT term_id INTO s2_2122_term_id FROM terms WHERE abbreviation = 'S2' AND year_id = year_2122_id LIMIT 1;

  -- Get Course IDs
  SELECT course_id INTO english_9a_course_id FROM courses WHERE name = 'English 9 A' LIMIT 1;
  SELECT course_id INTO english_9b_course_id FROM courses WHERE name = 'English 9 B' LIMIT 1;
  SELECT course_id INTO world_hist_9a_course_id FROM courses WHERE name = 'World History 9 A' LIMIT 1;
  SELECT course_id INTO world_hist_9b_course_id FROM courses WHERE name = 'World History 9 B' LIMIT 1;
  SELECT course_id INTO phys_sci_9a_course_id FROM courses WHERE name = 'Physical Science 9 A' LIMIT 1;
  SELECT course_id INTO phys_sci_9b_course_id FROM courses WHERE name = 'Physical Science 9 B' LIMIT 1;
  SELECT course_id INTO english_10a_course_id FROM courses WHERE name = 'English 10 A' LIMIT 1;
  SELECT course_id INTO english_10b_course_id FROM courses WHERE name = 'English 10 B' LIMIT 1;
  SELECT course_id INTO algebra_1a_course_id FROM courses WHERE name = 'Algebra I A' LIMIT 1;
  SELECT course_id INTO algebra_1b_course_id FROM courses WHERE name = 'Algebra I B' LIMIT 1;
  SELECT course_id INTO biology_a_course_id FROM courses WHERE name = 'Biology A' LIMIT 1;
  SELECT course_id INTO biology_b_course_id FROM courses WHERE name = 'Biology B' LIMIT 1;
  SELECT course_id INTO english_11a_course_id FROM courses WHERE name = 'English 11 A' LIMIT 1;
  SELECT course_id INTO english_11b_course_id FROM courses WHERE name = 'English 11 B' LIMIT 1;
  SELECT course_id INTO us_history_a_course_id FROM courses WHERE name = 'US History A' LIMIT 1;
  SELECT course_id INTO us_history_b_course_id FROM courses WHERE name = 'US History B' LIMIT 1;
  SELECT course_id INTO algebra_2a_course_id FROM courses WHERE name = 'Algebra II A' LIMIT 1;
  SELECT course_id INTO algebra_2b_course_id FROM courses WHERE name = 'Algebra II B' LIMIT 1;
  SELECT course_id INTO english_12a_course_id FROM courses WHERE name = 'English 12 A' LIMIT 1;
  SELECT course_id INTO english_12b_course_id FROM courses WHERE name = 'English 12 B' LIMIT 1;
  SELECT course_id INTO govt_12a_course_id FROM courses WHERE name = 'Government 12 A' LIMIT 1;
  SELECT course_id INTO govt_12b_course_id FROM courses WHERE name = 'Government 12 B' LIMIT 1;
  SELECT course_id INTO econ_12a_course_id FROM courses WHERE name = 'Economics 12 A' LIMIT 1;
  SELECT course_id INTO econ_12b_course_id FROM courses WHERE name = 'Economics 12 B' LIMIT 1;

  -- Get Section IDs
  SELECT section_id INTO english_9a_section_id FROM sections WHERE course_id = english_9a_course_id LIMIT 1;
  SELECT section_id INTO english_9b_section_id FROM sections WHERE course_id = english_9b_course_id LIMIT 1;
  SELECT section_id INTO whist9a_section_id FROM sections WHERE course_id = world_hist_9a_course_id LIMIT 1;
  SELECT section_id INTO whist9b_section_id FROM sections WHERE course_id = world_hist_9b_course_id LIMIT 1;
  SELECT section_id INTO physci9a_section_id FROM sections WHERE course_id = phys_sci_9a_course_id LIMIT 1;
  SELECT section_id INTO physci9b_section_id FROM sections WHERE course_id = phys_sci_9b_course_id LIMIT 1;
  SELECT section_id INTO english_10a_section_id FROM sections WHERE course_id = english_10a_course_id LIMIT 1;
  SELECT section_id INTO english_10b_section_id FROM sections WHERE course_id = english_10b_course_id LIMIT 1;
  SELECT section_id INTO algebra_1a_section_id FROM sections WHERE course_id = algebra_1a_course_id LIMIT 1;
  SELECT section_id INTO algebra_1b_section_id FROM sections WHERE course_id = algebra_1b_course_id LIMIT 1;
  SELECT section_id INTO biology_a_section_id FROM sections WHERE course_id = biology_a_course_id LIMIT 1;
  SELECT section_id INTO biology_b_section_id FROM sections WHERE course_id = biology_b_course_id LIMIT 1;
  SELECT section_id INTO english_11a_section_id FROM sections WHERE course_id = english_11a_course_id LIMIT 1;
  SELECT section_id INTO english_11b_section_id FROM sections WHERE course_id = english_11b_course_id LIMIT 1;
  SELECT section_id INTO us_history_a_section_id FROM sections WHERE course_id = us_history_a_course_id LIMIT 1;
  SELECT section_id INTO us_history_b_section_id FROM sections WHERE course_id = us_history_b_course_id LIMIT 1;
  SELECT section_id INTO alg2a_section_id FROM sections WHERE course_id = algebra_2a_course_id LIMIT 1;
  SELECT section_id INTO alg2b_section_id FROM sections WHERE course_id = algebra_2b_course_id LIMIT 1;
  SELECT section_id INTO english_12a_section_id FROM sections WHERE course_id = english_12a_course_id LIMIT 1;
  SELECT section_id INTO english_12b_section_id FROM sections WHERE course_id = english_12b_course_id LIMIT 1;
  SELECT section_id INTO govt12a_section_id FROM sections WHERE course_id = govt_12a_course_id LIMIT 1;
  SELECT section_id INTO govt12b_section_id FROM sections WHERE course_id = govt_12b_course_id LIMIT 1;
  SELECT section_id INTO econ12a_section_id FROM sections WHERE course_id = econ_12a_course_id LIMIT 1;
  SELECT section_id INTO econ12b_section_id FROM sections WHERE course_id = econ_12b_course_id LIMIT 1;
  
  -- ##################### Seed Section Enrollments #####################

  -- Emma Johnson's Enrollments (Current Grade 11)
  -- Grade 9 (2022-2023)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, english_9a_section_id, s1_2223_term_id, '2022-08-15', 0, 0, 'ENRL_EMMA_ENG9A_S1_2223', 'E_EMMA_ENG9A_S1_2223', encode(digest('ENRL_EMMA_ENG9A_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_9b_section_id, s2_2223_term_id, '2023-01-06', 0, 0, 'ENRL_EMMA_ENG9B_S2_2223', 'E_EMMA_ENG9B_S2_2223', encode(digest('ENRL_EMMA_ENG9B_S2_2223', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, whist9a_section_id, s1_2223_term_id, '2022-08-15', 0, 0, 'ENRL_EMMA_WHIST9A_S1_2223', 'E_EMMA_WHIST9A_S1_2223', encode(digest('ENRL_EMMA_WHIST9A_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, whist9b_section_id, s2_2223_term_id, '2023-01-06', 0, 0, 'ENRL_EMMA_WHIST9B_S2_2223', 'E_EMMA_WHIST9B_S2_2223', encode(digest('ENRL_EMMA_WHIST9B_S2_2223', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, physci9a_section_id, s1_2223_term_id, '2022-08-15', 0, 0, 'ENRL_EMMA_PHY9A_S1_2223', 'E_EMMA_PHY9A_S1_2223', encode(digest('ENRL_EMMA_PHY9A_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, physci9b_section_id, s2_2223_term_id, '2023-01-06', 0, 0, 'ENRL_EMMA_PHY9B_S2_2223', 'E_EMMA_PHY9B_S2_2223', encode(digest('ENRL_EMMA_PHY9B_S2_2223', 'sha256'), 'hex'), 'mock_source');
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
  (emma_johnson_student_id, english_11a_section_id, s1_2425_term_id, '2024-08-15', 4, 0, 'ENRL_EMMA_ENG11A_S1_2425', 'E_EMMA_ENG11A_S1_2425', encode(digest('ENRL_EMMA_ENG11A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_11b_section_id, s2_2425_term_id, '2025-01-06', 1, 1, 'ENRL_EMMA_ENG11B_S2_2425', 'E_EMMA_ENG11B_S2_2425', encode(digest('ENRL_EMMA_ENG11B_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, us_history_a_section_id, s1_2425_term_id, '2024-08-15', 2, 2, 'ENRL_EMMA_USHISTA_S1_2425', 'E_EMMA_USHISTA_S1_2425', encode(digest('ENRL_EMMA_USHISTA_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, us_history_b_section_id, s2_2425_term_id, '2025-01-06', 3, 1, 'ENRL_EMMA_USHISTB_S2_2425', 'E_EMMA_USHISTB_S2_2425', encode(digest('ENRL_EMMA_USHISTB_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, alg2a_section_id, s1_2425_term_id, '2024-08-15', 1, 0, 'ENRL_EMMA_ALG2A_S1_2425', 'E_EMMA_ALG2A_S1_2425', encode(digest('ENRL_EMMA_ALG2A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, alg2b_section_id, s2_2425_term_id, '2025-01-06', 1, 1, 'ENRL_EMMA_ALG2B_S2_2425', 'E_EMMA_ALG2B_S2_2425', encode(digest('ENRL_EMMA_ALG2B_S2_2425', 'sha256'), 'hex'), 'mock_source');

  -- Michael Chen's Enrollments (Current Grade 10)
  -- Grade 9 (2023-2024)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (michael_chen_student_id, english_9a_section_id, s1_2324_term_id, '2023-08-15', 2, 0, 'ENRL_MICHAEL_ENG9A_S1_2324', 'E_MICHAEL_ENG9A_S1_2324', encode(digest('ENRL_MICHAEL_ENG9A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_9b_section_id, s2_2324_term_id, '2024-01-06', 1, 1, 'ENRL_MICHAEL_ENG9B_S2_2324', 'E_MICHAEL_ENG9B_S2_2324', encode(digest('ENRL_MICHAEL_ENG9B_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, whist9a_section_id, s1_2324_term_id, '2023-08-15', 1, 0, 'ENRL_MICHAEL_WHIST9A_S1_2324', 'E_MICHAEL_WHIST9A_S1_2324', encode(digest('ENRL_MICHAEL_WHIST9A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, whist9b_section_id, s2_2324_term_id, '2024-01-06', 0, 1, 'ENRL_MICHAEL_WHIST9B_S2_2324', 'E_MICHAEL_WHIST9B_S2_2324', encode(digest('ENRL_MICHAEL_WHIST9B_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, physci9a_section_id, s1_2324_term_id, '2023-08-15', 2, 0, 'ENRL_MICHAEL_PHY9A_S1_2324', 'E_MICHAEL_PHY9A_S1_2324', encode(digest('ENRL_MICHAEL_PHY9A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, physci9b_section_id, s2_2324_term_id, '2024-01-06', 1, 1, 'ENRL_MICHAEL_PHY9B_S2_2324', 'E_MICHAEL_PHY9B_S2_2324', encode(digest('ENRL_MICHAEL_PHY9B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 10 (2024-2025)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (michael_chen_student_id, english_10a_section_id, s1_2425_term_id, '2024-08-15', 0, 2, 'ENRL_MICHAEL_ENG10A_S1_2425', 'E_MICHAEL_ENG10A_S1_2425', encode(digest('ENRL_MICHAEL_ENG10A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_10b_section_id, s2_2425_term_id, '2025-01-06', 1, 0, 'ENRL_MICHAEL_ENG10B_S2_2425', 'E_MICHAEL_ENG10B_S2_2425', encode(digest('ENRL_MICHAEL_ENG10B_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, algebra_1a_section_id, s1_2425_term_id, '2024-08-15', 3, 2, 'ENRL_MICHAEL_ALG1A_S1_2425', 'E_MICHAEL_ALG1A_S1_2425', encode(digest('ENRL_MICHAEL_ALG1A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, algebra_1b_section_id, s2_2425_term_id, '2025-01-06', 0, 1, 'ENRL_MICHAEL_ALG1B_S2_2425', 'E_MICHAEL_ALG1B_S2_2425', encode(digest('ENRL_MICHAEL_ALG1B_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, biology_a_section_id, s1_2425_term_id, '2024-08-15', 2, 1, 'ENRL_MICHAEL_BIO1A_S1_2425', 'E_MICHAEL_BIO1A_S1_2425', encode(digest('ENRL_MICHAEL_BIO1A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, biology_b_section_id, s2_2425_term_id, '2025-01-06', 1, 2, 'ENRL_MICHAEL_BIO1B_S2_2425', 'E_MICHAEL_BIO1B_S2_2425', encode(digest('ENRL_MICHAEL_BIO1B_S2_2425', 'sha256'), 'hex'), 'mock_source');

  -- Sophia Rodriguez's Enrollments (Current Grade 12)
  -- Grade 9 (2021-2022)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (sophia_rodriguez_student_id, english_9a_section_id, s1_2122_term_id, '2021-08-15', 0, 0, 'ENRL_SOPHIA_ENG9A_S1_2122', 'E_SOPHIA_ENG9A_S1_2122', encode(digest('ENRL_SOPHIA_ENG9A_S1_2122', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_9b_section_id, s2_2122_term_id, '2022-01-06', 0, 0, 'ENRL_SOPHIA_ENG9B_S2_2122', 'E_SOPHIA_ENG9B_S2_2122', encode(digest('ENRL_SOPHIA_ENG9B_S2_2122', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, whist9a_section_id, s1_2122_term_id, '2021-08-15', 0, 0, 'ENRL_SOPHIA_WHIST9A_S1_2122', 'E_SOPHIA_WHIST9A_S1_2122', encode(digest('ENRL_SOPHIA_WHIST9A_S1_2122', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, whist9b_section_id, s2_2122_term_id, '2022-01-06', 0, 0, 'ENRL_SOPHIA_WHIST9B_S2_2122', 'E_SOPHIA_WHIST9B_S2_2122', encode(digest('ENRL_SOPHIA_WHIST9B_S2_2122', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, physci9a_section_id, s1_2122_term_id, '2021-08-15', 0, 0, 'ENRL_SOPHIA_PHY9A_S1_2122', 'E_SOPHIA_PHY9A_S1_2122', encode(digest('ENRL_SOPHIA_PHY9A_S1_2122', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, physci9b_section_id, s2_2122_term_id, '2022-01-06', 0, 0, 'ENRL_SOPHIA_PHY9B_S2_2122', 'E_SOPHIA_PHY9B_S2_2122', encode(digest('ENRL_SOPHIA_PHY9B_S2_2122', 'sha256'), 'hex'), 'mock_source');
  -- Grade 10 (2022-2023)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (sophia_rodriguez_student_id, english_10a_section_id, s1_2223_term_id, '2022-08-15', 0, 0, 'ENRL_SOPHIA_ENG10A_S1_2223', 'E_SOPHIA_ENG10A_S1_2223', encode(digest('ENRL_SOPHIA_ENG10A_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_10b_section_id, s2_2223_term_id, '2023-01-06', 0, 1, 'ENRL_SOPHIA_ENG10B_S2_2223', 'E_SOPHIA_ENG10B_S2_2223', encode(digest('ENRL_SOPHIA_ENG10B_S2_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, algebra_1a_section_id, s1_2223_term_id, '2022-08-15', 0, 0, 'ENRL_SOPHIA_ALG1A_S1_2223', 'E_SOPHIA_ALG1A_S1_2223', encode(digest('ENRL_SOPHIA_ALG1A_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, algebra_1b_section_id, s2_2223_term_id, '2023-01-06', 0, 0, 'ENRL_SOPHIA_ALG1B_S2_2223', 'E_SOPHIA_ALG1B_S2_2223', encode(digest('ENRL_SOPHIA_ALG1B_S2_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, biology_a_section_id, s1_2223_term_id, '2022-08-15', 0, 0, 'ENRL_SOPHIA_BIO1A_S1_2223', 'E_SOPHIA_BIO1A_S1_2223', encode(digest('ENRL_SOPHIA_BIO1A_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, biology_b_section_id, s2_2223_term_id, '2023-01-06', 1, 0, 'ENRL_SOPHIA_BIO1B_S2_2223', 'E_SOPHIA_BIO1B_S2_2223', encode(digest('ENRL_SOPHIA_BIO1B_S2_2223', 'sha256'), 'hex'), 'mock_source');
  -- Grade 11 (2023-2024)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (sophia_rodriguez_student_id, english_11a_section_id, s1_2324_term_id, '2023-08-15', 0, 1, 'ENRL_SOPHIA_ENG11A_S1_2324', 'E_SOPHIA_ENG11A_S1_2324', encode(digest('ENRL_SOPHIA_ENG11A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_11b_section_id, s2_2324_term_id, '2024-01-06', 0, 0, 'ENRL_SOPHIA_ENG11B_S2_2324', 'E_SOPHIA_ENG11B_S2_2324', encode(digest('ENRL_SOPHIA_ENG11B_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, us_history_a_section_id, s1_2324_term_id, '2023-08-15', 0, 0, 'ENRL_SOPHIA_USHISTA_S1_2324', 'E_SOPHIA_USHISTA_S1_2324', encode(digest('ENRL_SOPHIA_USHISTA_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, us_history_b_section_id, s2_2324_term_id, '2024-01-06', 1, 0, 'ENRL_SOPHIA_USHISTB_S2_2324', 'E_SOPHIA_USHISTB_S2_2324', encode(digest('ENRL_SOPHIA_USHISTB_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, alg2a_section_id, s1_2324_term_id, '2023-08-15', 0, 0, 'ENRL_SOPHIA_ALG2A_S1_2324', 'E_SOPHIA_ALG2A_S1_2324', encode(digest('ENRL_SOPHIA_ALG2A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, alg2b_section_id, s2_2324_term_id, '2024-01-06', 0, 0, 'ENRL_SOPHIA_ALG2B_S2_2324', 'E_SOPHIA_ALG2B_S2_2324', encode(digest('ENRL_SOPHIA_ALG2B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 12 (2024-2025)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (sophia_rodriguez_student_id, english_12a_section_id, s1_2425_term_id, '2024-08-15', 1, 0, 'ENRL_SOPHIA_ENG12A_S1_2425', 'E_SOPHIA_ENG12A_S1_2425', encode(digest('ENRL_SOPHIA_ENG12A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_12b_section_id, s2_2425_term_id, '2025-01-06', 0, 0, 'ENRL_SOPHIA_ENG12B_S2_2425', 'E_SOPHIA_ENG12B_S2_2425', encode(digest('ENRL_SOPHIA_ENG12B_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, govt12a_section_id, s1_2425_term_id, '2024-08-15', 0, 0, 'ENRL_SOPHIA_GOVT12A_S1_2425', 'E_SOPHIA_GOVT12A_S1_2425', encode(digest('ENRL_SOPHIA_GOVT12A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, govt12b_section_id, s2_2425_term_id, '2025-01-06', 0, 0, 'ENRL_SOPHIA_GOVT12B_S2_2425', 'E_SOPHIA_GOVT12B_S2_2425', encode(digest('ENRL_SOPHIA_GOVT12B_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, econ12a_section_id, s1_2425_term_id, '2024-08-15', 0, 0, 'ENRL_SOPHIA_ECON12A_S1_2425', 'E_SOPHIA_ECON12A_S1_2425', encode(digest('ENRL_SOPHIA_ECON12A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, econ12b_section_id, s2_2425_term_id, '2025-01-06', 0, 1, 'ENRL_SOPHIA_ECON12B_S2_2425', 'E_SOPHIA_ECON12B_S2_2425', encode(digest('ENRL_SOPHIA_ECON12B_S2_2425', 'sha256'), 'hex'), 'mock_source');
  
  -- Noah Miller's Enrollments (Current Grade 12)
  -- Grade 9 (2021-2022)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (noah_miller_student_id, english_9a_section_id, s1_2122_term_id, '2021-08-15', 1, 0, 'ENRL_NOAH_ENG9A_S1_2122', 'E_NOAH_ENG9A_S1_2122', encode(digest('ENRL_NOAH_ENG9A_S1_2122', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, english_9b_section_id, s2_2122_term_id, '2022-01-06', 0, 1, 'ENRL_NOAH_ENG9B_S2_2122', 'E_NOAH_ENG9B_S2_2122', encode(digest('ENRL_NOAH_ENG9B_S2_2122', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, whist9a_section_id, s1_2122_term_id, '2021-08-15', 2, 0, 'ENRL_NOAH_WHIST9A_S1_2122', 'E_NOAH_WHIST9A_S1_2122', encode(digest('ENRL_NOAH_WHIST9A_S1_2122', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, whist9b_section_id, s2_2122_term_id, '2022-01-06', 1, 1, 'ENRL_NOAH_WHIST9B_S2_2122', 'E_NOAH_WHIST9B_S2_2122', encode(digest('ENRL_NOAH_WHIST9B_S2_2122', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, physci9a_section_id, s1_2122_term_id, '2021-08-15', 0, 0, 'ENRL_NOAH_PHY9A_S1_2122', 'E_NOAH_PHY9A_S1_2122', encode(digest('ENRL_NOAH_PHY9A_S1_2122', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, physci9b_section_id, s2_2122_term_id, '2022-01-06', 1, 0, 'ENRL_NOAH_PHY9B_S2_2122', 'E_NOAH_PHY9B_S2_2122', encode(digest('ENRL_NOAH_PHY9B_S2_2122', 'sha256'), 'hex'), 'mock_source');
  -- Grade 10 (2022-2023)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (noah_miller_student_id, english_10a_section_id, s1_2223_term_id, '2022-08-15', 2, 1, 'ENRL_NOAH_ENG10A_S1_2223', 'E_NOAH_ENG10A_S1_2223', encode(digest('ENRL_NOAH_ENG10A_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, english_10b_section_id, s2_2223_term_id, '2023-01-06', 1, 0, 'ENRL_NOAH_ENG10B_S2_2223', 'E_NOAH_ENG10B_S2_2223', encode(digest('ENRL_NOAH_ENG10B_S2_2223', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, algebra_1a_section_id, s1_2223_term_id, '2022-08-15', 1, 1, 'ENRL_NOAH_ALG1A_S1_2223', 'E_NOAH_ALG1A_S1_2223', encode(digest('ENRL_NOAH_ALG1A_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, algebra_1b_section_id, s2_2223_term_id, '2023-01-06', 0, 1, 'ENRL_NOAH_ALG1B_S2_2223', 'E_NOAH_ALG1B_S2_2223', encode(digest('ENRL_NOAH_ALG1B_S2_2223', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, biology_a_section_id, s1_2223_term_id, '2022-08-15', 0, 0, 'ENRL_NOAH_BIOA_S1_2223', 'E_NOAH_BIOA_S1_2223', encode(digest('ENRL_NOAH_BIOA_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, biology_b_section_id, s2_2223_term_id, '2023-01-06', 1, 2, 'ENRL_NOAH_BIOB_S2_2223', 'E_NOAH_BIOB_S2_2223', encode(digest('ENRL_NOAH_BIOB_S2_2223', 'sha256'), 'hex'), 'mock_source');
  -- Grade 11 (23-24)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (noah_miller_student_id, english_11a_section_id, s1_2324_term_id, '2023-08-15', 0, 2, 'ENRL_NOAH_ENG11A_S1_2324', 'E_NOAH_ENG11A_S1_2324', encode(digest('ENRL_NOAH_ENG11A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, english_11b_section_id, s2_2324_term_id, '2024-01-06', 1, 1, 'ENRL_NOAH_ENG11B_S2_2324', 'E_NOAH_ENG11B_S2_2324', encode(digest('ENRL_NOAH_ENG11B_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, us_history_a_section_id, s1_2324_term_id, '2023-08-15', 2, 0, 'ENRL_NOAH_USHISTA_S1_2324', 'E_NOAH_USHISTA_S1_2324', encode(digest('ENRL_NOAH_USHISTA_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, us_history_b_section_id, s2_2324_term_id, '2024-01-06', 1, 0, 'ENRL_NOAH_USHISTB_S2_2324', 'E_NOAH_USHISTB_S2_2324', encode(digest('ENRL_NOAH_USHISTB_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, alg2a_section_id, s1_2324_term_id, '2023-08-15', 0, 1, 'ENRL_NOAH_ALG2A_S1_2324', 'E_NOAH_ALG2A_S1_2324', encode(digest('ENRL_NOAH_ALG2A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, alg2b_section_id, s2_2324_term_id, '2024-01-06', 1, 1, 'ENRL_NOAH_ALG2B_S2_2324', 'E_NOAH_ALG2B_S2_2324', encode(digest('ENRL_NOAH_ALG2B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 12 (24-25)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (noah_miller_student_id, english_12a_section_id, s1_2425_term_id, '2024-08-15', 1, 0, 'ENRL_NOAH_ENG12A_S1_2425', 'E_NOAH_ENG12A_S1_2425', encode(digest('ENRL_NOAH_ENG12A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, english_12b_section_id, s2_2425_term_id, '2025-01-06', 0, 0, 'ENRL_NOAH_ENG12B_S2_2425', 'E_NOAH_ENG12B_S2_2425', encode(digest('ENRL_NOAH_ENG12B_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, govt12a_section_id, s1_2425_term_id, '2024-08-15', 1, 0, 'ENRL_NOAH_GOVT12A_S1_2425', 'E_NOAH_GOVT12A_S1_2425', encode(digest('ENRL_NOAH_GOVT12A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, govt12b_section_id, s2_2425_term_id, '2025-01-06', 1, 0, 'ENRL_NOAH_GOVT12B_S2_2425', 'E_NOAH_GOVT12B_S2_2425', encode(digest('ENRL_NOAH_GOVT12B_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, econ12a_section_id, s1_2425_term_id, '2024-08-15', 0, 0, 'ENRL_NOAH_ECON12A_S1_2425', 'E_NOAH_ECON12A_S1_2425', encode(digest('ENRL_NOAH_ECON12A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (noah_miller_student_id, econ12b_section_id, s2_2425_term_id, '2025-01-06', 0, 0, 'ENRL_NOAH_ECON12B_S2_2425', 'E_NOAH_ECON12B_S2_2425', encode(digest('ENRL_NOAH_ECON12B_S2_2425', 'sha256'), 'hex'), 'mock_source');

  -- Isabella Garcia's Enrollments (Current Grade 12)
  -- Grade 9 (2021-2022)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (isabella_garcia_student_id, english_9a_section_id, s1_2122_term_id, '2021-08-15', 0, 0, 'ENRL_ISABELLA_ENG9A_S1_2122', 'E_ISABELLA_ENG9A_S1_2122', encode(digest('ENRL_ISABELLA_ENG9A_S1_2122', 'sha256'), 'hex'), 'mock_source'),
  (isabella_garcia_student_id, english_9b_section_id, s2_2122_term_id, '2022-01-06', 0, 0, 'ENRL_ISABELLA_ENG9B_S2_2122', 'E_ISABELLA_ENG9B_S2_2122', encode(digest('ENRL_ISABELLA_ENG9B_S2_2122', 'sha256'), 'hex'), 'mock_source'),
  (isabella_garcia_student_id, whist9a_section_id, s1_2122_term_id, '2021-08-15', 0, 0, 'ENRL_ISABELLA_WHIST9A_S1_2122', 'E_ISABELLA_WHIST9A_S1_2122', encode(digest('ENRL_ISABELLA_WHIST9A_S1_2122', 'sha256'), 'hex'), 'mock_source'),
  (isabella_garcia_student_id, whist9b_section_id, s2_2122_term_id, '2022-01-06', 0, 0, 'ENRL_ISABELLA_WHIST9B_S2_2122', 'E_ISABELLA_WHIST9B_S2_2122', encode(digest('ENRL_ISABELLA_WHIST9B_S2_2122', 'sha256'), 'hex'), 'mock_source'),
  (isabella_garcia_student_id, physci9a_section_id, s1_2122_term_id, '2021-08-15', 0, 0, 'ENRL_ISABELLA_PHY9A_S1_2122', 'E_ISABELLA_PHY9A_S1_2122', encode(digest('ENRL_ISABELLA_PHY9A_S1_2122', 'sha256'), 'hex'), 'mock_source'),
  (isabella_garcia_student_id, physci9b_section_id, s2_2122_term_id, '2022-01-06', 0, 0, 'ENRL_ISABELLA_PHY9B_S2_2122', 'E_ISABELLA_PHY9B_S2_2122', encode(digest('ENRL_ISABELLA_PHY9B_S2_2122', 'sha256'), 'hex'), 'mock_source');
  -- Grade 10 (2022-2023)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (isabella_garcia_student_id, english_10a_section_id, s1_2223_term_id, '2022-08-15', 0, 0, 'ENRL_ISABELLA_ENG10A_S1_2223', 'E_ISABELLA_ENG10A_S1_2223', encode(digest('ENRL_ISABELLA_ENG10A_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (isabella_garcia_student_id, english_10b_section_id, s2_2223_term_id, '2023-01-06', 0, 0, 'ENRL_ISABELLA_ENG10B_S2_2223', 'E_ISABELLA_ENG10B_S2_2223', encode(digest('ENRL_ISABELLA_ENG10B_S2_2223', 'sha256'), 'hex'), 'mock_source'),
  (isabella_garcia_student_id, algebra_1a_section_id, s1_2223_term_id, '2022-08-15', 0, 0, 'ENRL_ISABELLA_ALG1A_S1_2223', 'E_ISABELLA_ALG1A_S1_2223', encode(digest('ENRL_ISABELLA_ALG1A_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (isabella_garcia_student_id, algebra_1b_section_id, s2_2223_term_id, '2023-01-06', 0, 0, 'ENRL_ISABELLA_ALG1B_S2_2223', 'E_ISABELLA_ALG1B_S2_2223', encode(digest('ENRL_ISABELLA_ALG1B_S2_2223', 'sha256'), 'hex'), 'mock_source'),
  (isabella_garcia_student_id, biology_a_section_id, s1_2223_term_id, '2022-08-15', 0, 0, 'ENRL_ISABELLA_BIOA_S1_2223', 'E_ISABELLA_BIOA_S1_2223', encode(digest('ENRL_ISABELLA_BIOA_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (isabella_garcia_student_id, biology_b_section_id, s2_2223_term_id, '2023-01-06', 0, 0, 'ENRL_ISABELLA_BIOB_S2_2223', 'E_ISABELLA_BIOB_S2_2223', encode(digest('ENRL_ISABELLA_BIOB_S2_2223', 'sha256'), 'hex'), 'mock_source');
  -- Grade 11 (2023-2024)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (isabella_garcia_student_id, english_11a_section_id, s1_2324_term_id, '2023-08-15', 0, 0, 'ENRL_ISABELLA_ENG11A_S1_2324', 'E_ISABELLA_ENG11A_S1_2324', encode(digest('ENRL_ISABELLA_ENG11A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (isabella_garcia_student_id, english_11b_section_id, s2_2324_term_id, '2024-01-06', 0, 0, 'ENRL_ISABELLA_ENG11B_S2_2324', 'E_ISABELLA_ENG11B_S2_2324', encode(digest('ENRL_ISABELLA_ENG11B_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  (isabella_garcia_student_id, us_history_a_section_id, s1_2324_term_id, '2023-08-15', 0, 0, 'ENRL_ISABELLA_USHISTA_S1_2324', 'E_ISABELLA_USHISTA_S1_2324', encode(digest('ENRL_ISABELLA_USHISTA_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (isabella_garcia_student_id, us_history_b_section_id, s2_2324_term_id, '2024-01-06', 0, 0, 'ENRL_ISABELLA_USHISTB_S2_2324', 'E_ISABELLA_USHISTB_S2_2324', encode(digest('ENRL_ISABELLA_USHISTB_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  (isabella_garcia_student_id, alg2a_section_id, s1_2324_term_id, '2023-08-15', 0, 0, 'ENRL_ISABELLA_ALG2A_S1_2324', 'E_ISABELLA_ALG2A_S1_2324', encode(digest('ENRL_ISABELLA_ALG2A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (isabella_garcia_student_id, alg2b_section_id, s2_2324_term_id, '2024-01-06', 0, 0, 'ENRL_ISABELLA_ALG2B_S2_2324', 'E_ISABELLA_ALG2B_S2_2324', encode(digest('ENRL_ISABELLA_ALG2B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 12 (2024-2025)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (isabella_garcia_student_id, english_12a_section_id, s1_2425_term_id, '2024-08-15', 0, 1, 'ENRL_ISABELLA_ENG12A_S1_2425', 'E_ISABELLA_ENG12A_S1_2425', encode(digest('ENRL_ISABELLA_ENG12A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (isabella_garcia_student_id, english_12b_section_id, s2_2425_term_id, '2025-01-06', 0, 0, 'ENRL_ISABELLA_ENG12B_S2_2425', 'E_ISABELLA_ENG12B_S2_2425', encode(digest('ENRL_ISABELLA_ENG12B_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (isabella_garcia_student_id, govt12a_section_id, s1_2425_term_id, '2024-08-15', 0, 0, 'ENRL_ISABELLA_GOVT12A_S1_2425', 'E_ISABELLA_GOVT12A_S1_2425', encode(digest('ENRL_ISABELLA_GOVT12A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (isabella_garcia_student_id, govt12b_section_id, s2_2425_term_id, '2025-01-06', 0, 0, 'ENRL_ISABELLA_GOVT12B_S2_2425', 'E_ISABELLA_GOVT12B_S2_2425', encode(digest('ENRL_ISABELLA_GOVT12B_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (isabella_garcia_student_id, econ12a_section_id, s1_2425_term_id, '2024-08-15', 0, 0, 'ENRL_ISABELLA_ECON12A_S1_2425', 'E_ISABELLA_ECON12A_S1_2425', encode(digest('ENRL_ISABELLA_ECON12A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (isabella_garcia_student_id, econ12b_section_id, s2_2425_term_id, '2025-01-06', 0, 0, 'ENRL_ISABELLA_ECON12B_S2_2425', 'E_ISABELLA_ECON12B_S2_2425', encode(digest('ENRL_ISABELLA_ECON12B_S2_2425', 'sha256'), 'hex'), 'mock_source');
  
  -- Lucas Martinez's Enrollments (Current Grade 11)
  -- Grade 9 (2022-2023)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (lucas_martinez_student_id, english_9a_section_id, s1_2223_term_id, '2022-08-15', 0, 0, 'ENRL_LUCAS_ENG9A_S1_2223', 'E_LUCAS_ENG9A_S1_2223', encode(digest('ENRL_LUCAS_ENG9A_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (lucas_martinez_student_id, english_9b_section_id, s2_2223_term_id, '2023-01-06', 0, 0, 'ENRL_LUCAS_ENG9B_S2_2223', 'E_LUCAS_ENG9B_S2_2223', encode(digest('ENRL_LUCAS_ENG9B_S2_2223', 'sha256'), 'hex'), 'mock_source'),
  (lucas_martinez_student_id, whist9a_section_id, s1_2223_term_id, '2022-08-15', 0, 0, 'ENRL_LUCAS_WHIST9A_S1_2223', 'E_LUCAS_WHIST9A_S1_2223', encode(digest('ENRL_LUCAS_WHIST9A_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (lucas_martinez_student_id, whist9b_section_id, s2_2223_term_id, '2023-01-06', 0, 0, 'ENRL_LUCAS_WHIST9B_S2_2223', 'E_LUCAS_WHIST9B_S2_2223', encode(digest('ENRL_LUCAS_WHIST9B_S2_2223', 'sha256'), 'hex'), 'mock_source'),
  (lucas_martinez_student_id, physci9a_section_id, s1_2223_term_id, '2022-08-15', 0, 0, 'ENRL_LUCAS_PHY9A_S1_2223', 'E_LUCAS_PHY9A_S1_2223', encode(digest('ENRL_LUCAS_PHY9A_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (lucas_martinez_student_id, physci9b_section_id, s2_2223_term_id, '2023-01-06', 0, 0, 'ENRL_LUCAS_PHY9B_S2_2223', 'E_LUCAS_PHY9B_S2_2223', encode(digest('ENRL_LUCAS_PHY9B_S2_2223', 'sha256'), 'hex'), 'mock_source');
  -- Grade 10 (2023-2024)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (lucas_martinez_student_id, english_10a_section_id, s1_2324_term_id, '2023-08-15', 1, 1, 'ENRL_LUCAS_ENG10A_S1_2324', 'E_LUCAS_ENG10A_S1_2324', encode(digest('ENRL_LUCAS_ENG10A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (lucas_martinez_student_id, english_10b_section_id, s2_2324_term_id, '2024-01-06', 3, 1, 'ENRL_LUCAS_ENG10B_S2_2324', 'E_LUCAS_ENG10B_S2_2324', encode(digest('ENRL_LUCAS_ENG10B_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  (lucas_martinez_student_id, algebra_1a_section_id, s1_2324_term_id, '2023-08-15', 1, 3, 'ENRL_LUCAS_ALG1A_S1_2324', 'E_LUCAS_ALG1A_S1_2324', encode(digest('ENRL_LUCAS_ALG1A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (lucas_martinez_student_id, algebra_1b_section_id, s2_2324_term_id, '2024-01-06', 2, 1, 'ENRL_LUCAS_ALG1B_S2_2324', 'E_LUCAS_ALG1B_S2_2324', encode(digest('ENRL_LUCAS_ALG1B_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  (lucas_martinez_student_id, biology_a_section_id, s1_2324_term_id, '2023-08-15', 1, 0, 'ENRL_LUCAS_BIO1A_S1_2324', 'E_LUCAS_BIO1A_S1_2324', encode(digest('ENRL_LUCAS_BIO1A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (lucas_martinez_student_id, biology_b_section_id, s2_2324_term_id, '2024-01-06', 1, 1, 'ENRL_LUCAS_BIO1B_S2_2324', 'E_LUCAS_BIO1B_S2_2324', encode(digest('ENRL_LUCAS_BIO1B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 11 (2024-2025)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (lucas_martinez_student_id, english_11a_section_id, s1_2425_term_id, '2024-08-15', 4, 0, 'ENRL_LUCAS_ENG11A_S1_2425', 'E_LUCAS_ENG11A_S1_2425', encode(digest('ENRL_LUCAS_ENG11A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (lucas_martinez_student_id, english_11b_section_id, s2_2425_term_id, '2025-01-06', 1, 1, 'ENRL_LUCAS_ENG11B_S2_2425', 'E_LUCAS_ENG11B_S2_2425', encode(digest('ENRL_LUCAS_ENG11B_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (lucas_martinez_student_id, us_history_a_section_id, s1_2425_term_id, '2024-08-15', 2, 2, 'ENRL_LUCAS_USHISTA_S1_2425', 'E_LUCAS_USHISTA_S1_2425', encode(digest('ENRL_LUCAS_USHISTA_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (lucas_martinez_student_id, us_history_b_section_id, s2_2425_term_id, '2025-01-06', 3, 1, 'ENRL_LUCAS_USHISTB_S2_2425', 'E_LUCAS_USHISTB_S2_2425', encode(digest('ENRL_LUCAS_USHISTB_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (lucas_martinez_student_id, alg2a_section_id, s1_2425_term_id, '2024-08-15', 1, 0, 'ENRL_LUCAS_ALG2A_S1_2425', 'E_LUCAS_ALG2A_S1_2425', encode(digest('ENRL_LUCAS_ALG2A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (lucas_martinez_student_id, alg2b_section_id, s2_2425_term_id, '2025-01-06', 1, 1, 'ENRL_LUCAS_ALG2B_S2_2425', 'E_LUCAS_ALG2B_S2_2425', encode(digest('ENRL_LUCAS_ALG2B_S2_2425', 'sha256'), 'hex'), 'mock_source');

  -- Charlotte Davis's Enrollments (Current Grade 11)
  -- Grade 9 (2022-2023)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (charlotte_davis_student_id, english_9a_section_id, s1_2223_term_id, '2022-08-15', 0, 0, 'ENRL_CHARLOTTE_ENG9A_S1_2223', 'E_CHARLOTTE_ENG9A_S1_2223', encode(digest('ENRL_CHARLOTTE_ENG9A_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (charlotte_davis_student_id, english_9b_section_id, s2_2223_term_id, '2023-01-06', 0, 0, 'ENRL_CHARLOTTE_ENG9B_S2_2223', 'E_CHARLOTTE_ENG9B_S2_2223', encode(digest('ENRL_CHARLOTTE_ENG9B_S2_2223', 'sha256'), 'hex'), 'mock_source'),
  (charlotte_davis_student_id, whist9a_section_id, s1_2223_term_id, '2022-08-15', 0, 0, 'ENRL_CHARLOTTE_WHIST9A_S1_2223', 'E_CHARLOTTE_WHIST9A_S1_2223', encode(digest('ENRL_CHARLOTTE_WHIST9A_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (charlotte_davis_student_id, whist9b_section_id, s2_2223_term_id, '2023-01-06', 0, 0, 'ENRL_CHARLOTTE_WHIST9B_S2_2223', 'E_CHARLOTTE_WHIST9B_S2_2223', encode(digest('ENRL_CHARLOTTE_WHIST9B_S2_2223', 'sha256'), 'hex'), 'mock_source'),
  (charlotte_davis_student_id, physci9a_section_id, s1_2223_term_id, '2022-08-15', 0, 0, 'ENRL_CHARLOTTE_PHY9A_S1_2223', 'E_CHARLOTTE_PHY9A_S1_2223', encode(digest('ENRL_CHARLOTTE_PHY9A_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (charlotte_davis_student_id, physci9b_section_id, s2_2223_term_id, '2023-01-06', 0, 0, 'ENRL_CHARLOTTE_PHY9B_S2_2223', 'E_CHARLOTTE_PHY9B_S2_2223', encode(digest('ENRL_CHARLOTTE_PHY9B_S2_2223', 'sha256'), 'hex'), 'mock_source');
  -- Grade 10 (2023-2024)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (charlotte_davis_student_id, english_10a_section_id, s1_2324_term_id, '2023-08-15', 1, 1, 'ENRL_CHARLOTTE_ENG10A_S1_2324', 'E_CHARLOTTE_ENG10A_S1_2324', encode(digest('ENRL_CHARLOTTE_ENG10A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (charlotte_davis_student_id, english_10b_section_id, s2_2324_term_id, '2024-01-06', 3, 1, 'ENRL_CHARLOTTE_ENG10B_S2_2324', 'E_CHARLOTTE_ENG10B_S2_2324', encode(digest('ENRL_CHARLOTTE_ENG10B_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  (charlotte_davis_student_id, algebra_1a_section_id, s1_2324_term_id, '2023-08-15', 1, 3, 'ENRL_CHARLOTTE_ALG1A_S1_2324', 'E_CHARLOTTE_ALG1A_S1_2324', encode(digest('ENRL_CHARLOTTE_ALG1A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (charlotte_davis_student_id, algebra_1b_section_id, s2_2324_term_id, '2024-01-06', 2, 1, 'ENRL_CHARLOTTE_ALG1B_S2_2324', 'E_CHARLOTTE_ALG1B_S2_2324', encode(digest('ENRL_CHARLOTTE_ALG1B_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  (charlotte_davis_student_id, biology_a_section_id, s1_2324_term_id, '2023-08-15', 1, 0, 'ENRL_CHARLOTTE_BIO1A_S1_2324', 'E_CHARLOTTE_BIO1A_S1_2324', encode(digest('ENRL_CHARLOTTE_BIO1A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (charlotte_davis_student_id, biology_b_section_id, s2_2324_term_id, '2024-01-06', 1, 1, 'ENRL_CHARLOTTE_BIO1B_S2_2324', 'E_CHARLOTTE_BIO1B_S2_2324', encode(digest('ENRL_CHARLOTTE_BIO1B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 11 (2024-2025)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (charlotte_davis_student_id, english_11a_section_id, s1_2425_term_id, '2024-08-15', 4, 0, 'ENRL_CHARLOTTE_ENG11A_S1_2425', 'E_CHARLOTTE_ENG11A_S1_2425', encode(digest('ENRL_CHARLOTTE_ENG11A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (charlotte_davis_student_id, english_11b_section_id, s2_2425_term_id, '2025-01-06', 1, 1, 'ENRL_CHARLOTTE_ENG11B_S2_2425', 'E_CHARLOTTE_ENG11B_S2_2425', encode(digest('ENRL_CHARLOTTE_ENG11B_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (charlotte_davis_student_id, us_history_a_section_id, s1_2425_term_id, '2024-08-15', 2, 2, 'ENRL_CHARLOTTE_USHISTA_S1_2425', 'E_CHARLOTTE_USHISTA_S1_2425', encode(digest('ENRL_CHARLOTTE_USHISTA_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (charlotte_davis_student_id, us_history_b_section_id, s2_2425_term_id, '2025-01-06', 3, 1, 'ENRL_CHARLOTTE_USHISTB_S2_2425', 'E_CHARLOTTE_USHISTB_S2_2425', encode(digest('ENRL_CHARLOTTE_USHISTB_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (charlotte_davis_student_id, alg2a_section_id, s1_2425_term_id, '2024-08-15', 1, 0, 'ENRL_CHARLOTTE_ALG2A_S1_2425', 'E_CHARLOTTE_ALG2A_S1_2425', encode(digest('ENRL_CHARLOTTE_ALG2A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (charlotte_davis_student_id, alg2b_section_id, s2_2425_term_id, '2025-01-06', 1, 1, 'ENRL_CHARLOTTE_ALG2B_S2_2425', 'E_CHARLOTTE_ALG2B_S2_2425', encode(digest('ENRL_CHARLOTTE_ALG2B_S2_2425', 'sha256'), 'hex'), 'mock_source');

  -- Benjamin Wilson's Enrollments (Current Grade 10)
  -- Grade 9 (2023-2024)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (benjamin_wilson_student_id, english_9a_section_id, s1_2324_term_id, '2023-08-15', 2, 0, 'ENRL_BENJAMIN_ENG9A_S1_2324', 'E_BENJAMIN_ENG9A_S1_2324', encode(digest('ENRL_BENJAMIN_ENG9A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (benjamin_wilson_student_id, english_9b_section_id, s2_2324_term_id, '2024-01-06', 1, 1, 'ENRL_BENJAMIN_ENG9B_S2_2324', 'E_BENJAMIN_ENG9B_S2_2324', encode(digest('ENRL_BENJAMIN_ENG9B_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  (benjamin_wilson_student_id, whist9a_section_id, s1_2324_term_id, '2023-08-15', 1, 0, 'ENRL_BENJAMIN_WHIST9A_S1_2324', 'E_BENJAMIN_WHIST9A_S1_2324', encode(digest('ENRL_BENJAMIN_WHIST9A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (benjamin_wilson_student_id, whist9b_section_id, s2_2324_term_id, '2024-01-06', 0, 1, 'ENRL_BENJAMIN_WHIST9B_S2_2324', 'E_BENJAMIN_WHIST9B_S2_2324', encode(digest('ENRL_BENJAMIN_WHIST9B_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  (benjamin_wilson_student_id, physci9a_section_id, s1_2324_term_id, '2023-08-15', 2, 0, 'ENRL_BENJAMIN_PHY9A_S1_2324', 'E_BENJAMIN_PHY9A_S1_2324', encode(digest('ENRL_BENJAMIN_PHY9A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (benjamin_wilson_student_id, physci9b_section_id, s2_2324_term_id, '2024-01-06', 1, 1, 'ENRL_BENJAMIN_PHY9B_S2_2324', 'E_BENJAMIN_PHY9B_S2_2324', encode(digest('ENRL_BENJAMIN_PHY9B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 10 (2024-2025)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (benjamin_wilson_student_id, english_10a_section_id, s1_2425_term_id, '2024-08-15', 0, 2, 'ENRL_BENJAMIN_ENG10A_S1_2425', 'E_BENJAMIN_ENG10A_S1_2425', encode(digest('ENRL_BENJAMIN_ENG10A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (benjamin_wilson_student_id, english_10b_section_id, s2_2425_term_id, '2025-01-06', 1, 0, 'ENRL_BENJAMIN_ENG10B_S2_2425', 'E_BENJAMIN_ENG10B_S2_2425', encode(digest('ENRL_BENJAMIN_ENG10B_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (benjamin_wilson_student_id, algebra_1a_section_id, s1_2425_term_id, '2024-08-15', 3, 2, 'ENRL_BENJAMIN_ALG1A_S1_2425', 'E_BENJAMIN_ALG1A_S1_2425', encode(digest('ENRL_BENJAMIN_ALG1A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (benjamin_wilson_student_id, algebra_1b_section_id, s2_2425_term_id, '2025-01-06', 0, 1, 'ENRL_BENJAMIN_ALG1B_S2_2425', 'E_BENJAMIN_ALG1B_S2_2425', encode(digest('ENRL_BENJAMIN_ALG1B_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (benjamin_wilson_student_id, biology_a_section_id, s1_2425_term_id, '2024-08-15', 2, 1, 'ENRL_BENJAMIN_BIO1A_S1_2425', 'E_BENJAMIN_BIO1A_S1_2425', encode(digest('ENRL_BENJAMIN_BIO1A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (benjamin_wilson_student_id, biology_b_section_id, s2_2425_term_id, '2025-01-06', 1, 2, 'ENRL_BENJAMIN_BIO1B_S2_2425', 'E_BENJAMIN_BIO1B_S2_2425', encode(digest('ENRL_BENJAMIN_BIO1B_S2_2425', 'sha256'), 'hex'), 'mock_source');

  -- Amelia Taylor's Enrollments (Current Grade 10)
  -- Grade 9 (2023-2024)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (amelia_taylor_student_id, english_9a_section_id, s1_2324_term_id, '2023-08-15', 2, 0, 'ENRL_AMELIA_ENG9A_S1_2324', 'E_AMELIA_ENG9A_S1_2324', encode(digest('ENRL_AMELIA_ENG9A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (amelia_taylor_student_id, english_9b_section_id, s2_2324_term_id, '2024-01-06', 1, 1, 'ENRL_AMELIA_ENG9B_S2_2324', 'E_AMELIA_ENG9B_S2_2324', encode(digest('ENRL_AMELIA_ENG9B_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  (amelia_taylor_student_id, whist9a_section_id, s1_2324_term_id, '2023-08-15', 1, 0, 'ENRL_AMELIA_WHIST9A_S1_2324', 'E_AMELIA_WHIST9A_S1_2324', encode(digest('ENRL_AMELIA_WHIST9A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (amelia_taylor_student_id, whist9b_section_id, s2_2324_term_id, '2024-01-06', 0, 1, 'ENRL_AMELIA_WHIST9B_S2_2324', 'E_AMELIA_WHIST9B_S2_2324', encode(digest('ENRL_AMELIA_WHIST9B_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  (amelia_taylor_student_id, physci9a_section_id, s1_2324_term_id, '2023-08-15', 2, 0, 'ENRL_AMELIA_PHY9A_S1_2324', 'E_AMELIA_PHY9A_S1_2324', encode(digest('ENRL_AMELIA_PHY9A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (amelia_taylor_student_id, physci9b_section_id, s2_2324_term_id, '2024-01-06', 1, 1, 'ENRL_AMELIA_PHY9B_S2_2324', 'E_AMELIA_PHY9B_S2_2324', encode(digest('ENRL_AMELIA_PHY9B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 10 (2024-2025)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (amelia_taylor_student_id, english_10a_section_id, s1_2425_term_id, '2024-08-15', 0, 2, 'ENRL_AMELIA_ENG10A_S1_2425', 'E_AMELIA_ENG10A_S1_2425', encode(digest('ENRL_AMELIA_ENG10A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (amelia_taylor_student_id, english_10b_section_id, s2_2425_term_id, '2025-01-06', 1, 0, 'ENRL_AMELIA_ENG10B_S2_2425', 'E_AMELIA_ENG10B_S2_2425', encode(digest('ENRL_AMELIA_ENG10B_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (amelia_taylor_student_id, algebra_1a_section_id, s1_2425_term_id, '2024-08-15', 3, 2, 'ENRL_AMELIA_ALG1A_S1_2425', 'E_AMELIA_ALG1A_S1_2425', encode(digest('ENRL_AMELIA_ALG1A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (amelia_taylor_student_id, algebra_1b_section_id, s2_2425_term_id, '2025-01-06', 0, 1, 'ENRL_AMELIA_ALG1B_S2_2425', 'E_AMELIA_ALG1B_S2_2425', encode(digest('ENRL_AMELIA_ALG1B_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (amelia_taylor_student_id, biology_a_section_id, s1_2425_term_id, '2024-08-15', 2, 1, 'ENRL_AMELIA_BIO1A_S1_2425', 'E_AMELIA_BIO1A_S1_2425', encode(digest('ENRL_AMELIA_BIO1A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (amelia_taylor_student_id, biology_b_section_id, s2_2425_term_id, '2025-01-06', 1, 2, 'ENRL_AMELIA_BIO1B_S2_2425', 'E_AMELIA_BIO1B_S2_2425', encode(digest('ENRL_AMELIA_BIO1B_S2_2425', 'sha256'), 'hex'), 'mock_source');

  -- Ethan Anderson's Enrollments (Current Grade 9)
  -- Grade 9 (2024-2025)
  INSERT INTO section_enrollments (student_id, section_id, term_id, start_date, absences, tardies, external_key, external_id, external_key_hash, external_source) VALUES
  (ethan_anderson_student_id, english_9a_section_id, s1_2425_term_id, '2024-08-15', 0, 1, 'ENRL_ETHAN_ENG9A_S1_2425', 'E_ETHAN_ENG9A_S1_2425', encode(digest('ENRL_ETHAN_ENG9A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (ethan_anderson_student_id, english_9b_section_id, s2_2425_term_id, '2025-01-06', 0, 0, 'ENRL_ETHAN_ENG9B_S2_2425', 'E_ETHAN_ENG9B_S2_2425', encode(digest('ENRL_ETHAN_ENG9B_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (ethan_anderson_student_id, whist9a_section_id, s1_2425_term_id, '2024-08-15', 0, 0, 'ENRL_ETHAN_WHIST9A_S1_2425', 'E_ETHAN_WHIST9A_S1_2425', encode(digest('ENRL_ETHAN_WHIST9A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (ethan_anderson_student_id, whist9b_section_id, s2_2425_term_id, '2025-01-06', 0, 0, 'ENRL_ETHAN_WHIST9B_S2_2425', 'E_ETHAN_WHIST9B_S2_2425', encode(digest('ENRL_ETHAN_WHIST9B_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (ethan_anderson_student_id, physci9a_section_id, s1_2425_term_id, '2024-08-15', 0, 1, 'ENRL_ETHAN_PHY9A_S1_2425', 'E_ETHAN_PHY9A_S1_2425', encode(digest('ENRL_ETHAN_PHY9A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (ethan_anderson_student_id, physci9b_section_id, s2_2425_term_id, '2025-01-06', 1, 0, 'ENRL_ETHAN_PHY9B_S2_2425', 'E_ETHAN_PHY9B_S2_2425', encode(digest('ENRL_ETHAN_PHY9B_S2_2425', 'sha256'), 'hex'), 'mock_source');

  -- ##################### Seed Student Grades #####################
  
  -- Emma Johnson's Grades (Current Grade 11)
  -- Grade 9 (2022-2023)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, english_9a_section_id, q1_2223_term_id, english_9a_course_id, 'A-', 'Q1', 91.50, 3.70, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '09', 'StoredGrades', '2022-10-20', 'GRADE_EMMA_ENG9A_Q1_2223', 'G_EMMA_ENG9A_Q1_2223', encode(digest('GRADE_EMMA_ENG9A_Q1_2223', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_9a_section_id, q2_2223_term_id, english_9a_course_id, 'A', 'Q2', 94.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '09', 'StoredGrades', '2022-12-22', 'GRADE_EMMA_ENG9A_Q2_2223', 'G_EMMA_ENG9A_Q2_2223', encode(digest('GRADE_EMMA_ENG9A_Q2_2223', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_9a_section_id, s1_2223_term_id, english_9a_course_id, 'A-', 'S1', 92.75, 3.70, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '09', 'StoredGrades', '2022-12-22', 'GRADE_EMMA_ENG9A_S1_2223', 'G_EMMA_ENG9A_S1_2223', encode(digest('GRADE_EMMA_ENG9A_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_9b_section_id, q3_2223_term_id, english_9b_course_id, 'A', 'Q3', 95.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '09', 'StoredGrades', '2023-03-16', 'GRADE_EMMA_ENG9B_Q3_2223', 'G_EMMA_ENG9B_Q3_2223', encode(digest('GRADE_EMMA_ENG9B_Q3_2223', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_9b_section_id, q4_2223_term_id, english_9b_course_id, 'A', 'Q4', 96.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '09', 'StoredGrades', '2023-05-25', 'GRADE_EMMA_ENG9B_Q4_2223', 'G_EMMA_ENG9B_Q4_2223', encode(digest('GRADE_EMMA_ENG9B_Q4_2223', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_9b_section_id, s2_2223_term_id, english_9b_course_id, 'A', 'S2', 95.50, 4.00, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '09', 'StoredGrades', '2023-05-25', 'GRADE_EMMA_ENG9B_S2_2223', 'G_EMMA_ENG9B_S2_2223', encode(digest('GRADE_EMMA_ENG9B_S2_2223', 'sha256'), 'hex'), 'mock_source'),
  
  (emma_johnson_student_id, whist9a_section_id, q1_2223_term_id, world_hist_9a_course_id, 'C+', 'Q1', 79.00, 2.30, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '09', 'StoredGrades', '2022-10-20', 'GRADE_EMMA_WHIST9A_Q1_2223', 'G_EMMA_WHIST9A_Q1_2223', encode(digest('GRADE_EMMA_WHIST9A_Q1_2223', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, whist9a_section_id, q2_2223_term_id, world_hist_9a_course_id, 'B', 'Q2', 83.00, 3.00, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '09', 'StoredGrades', '2022-12-22', 'GRADE_EMMA_WHIST9A_Q2_2223', 'G_EMMA_WHIST9A_Q2_2223', encode(digest('GRADE_EMMA_WHIST9A_Q2_2223', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, whist9a_section_id, s1_2223_term_id, world_hist_9a_course_id, 'B-', 'S1', 81.00, 2.70, 1.0, 1.0, 0, false, 'History', 'Final', NULL, '09', 'StoredGrades', '2022-12-22', 'GRADE_EMMA_WHIST9A_S1_2223', 'G_EMMA_WHIST9A_S1_2223', encode(digest('GRADE_EMMA_WHIST9A_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, whist9b_section_id, q3_2223_term_id, world_hist_9b_course_id, 'B+', 'Q3', 88.00, 3.30, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '09', 'StoredGrades', '2023-03-16', 'GRADE_EMMA_WHIST9B_Q3_2223', 'G_EMMA_WHIST9B_Q3_2223', encode(digest('GRADE_EMMA_WHIST9B_Q3_2223', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, whist9b_section_id, q4_2223_term_id, world_hist_9b_course_id, 'A', 'Q4', 94.50, 4.00, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '09', 'StoredGrades', '2023-05-25', 'GRADE_EMMA_WHIST9B_Q4_2223', 'G_EMMA_WHIST9B_Q4_2223', encode(digest('GRADE_EMMA_WHIST9B_Q4_2223', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, whist9b_section_id, s2_2223_term_id, world_hist_9b_course_id, 'A-', 'S2', 91.25, 3.70, 1.0, 1.0, 0, false, 'History', 'Final', NULL, '09', 'StoredGrades', '2023-05-25', 'GRADE_EMMA_WHIST9B_S2_2223', 'G_EMMA_WHIST9B_S2_2223', encode(digest('GRADE_EMMA_WHIST9B_S2_2223', 'sha256'), 'hex'), 'mock_source'),
  
  (emma_johnson_student_id, physci9a_section_id, q1_2223_term_id, phys_sci_9a_course_id, 'A', 'Q1', 95.00, 4.00, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '09', 'StoredGrades', '2022-10-20', 'GRADE_EMMA_PHY9A_Q1_2223', 'G_EMMA_PHY9A_Q1_2223', encode(digest('GRADE_EMMA_PHY9A_Q1_2223', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, physci9a_section_id, q2_2223_term_id, phys_sci_9a_course_id, 'A-', 'Q2', 92.00, 3.70, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '09', 'StoredGrades', '2022-12-22', 'GRADE_EMMA_PHY9A_Q2_2223', 'G_EMMA_PHY9A_Q2_2223', encode(digest('GRADE_EMMA_PHY9A_Q2_2223', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, physci9a_section_id, s1_2223_term_id, phys_sci_9a_course_id, 'A', 'S1', 93.50, 4.00, 1.0, 1.0, 0, false, 'Science', 'Final', NULL, '09', 'StoredGrades', '2022-12-22', 'GRADE_EMMA_PHY9A_S1_2223', 'G_EMMA_PHY9A_S1_2223', encode(digest('GRADE_EMMA_PHY9A_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, physci9b_section_id, q3_2223_term_id, phys_sci_9b_course_id, 'B-', 'Q3', 80.00, 2.70, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '09', 'StoredGrades', '2023-03-16', 'GRADE_EMMA_PHY9B_Q3_2223', 'G_EMMA_PHY9B_Q3_2223', encode(digest('GRADE_EMMA_PHY9B_Q3_2223', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, physci9b_section_id, q4_2223_term_id, phys_sci_9b_course_id, 'B', 'Q4', 85.00, 3.00, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '09', 'StoredGrades', '2023-05-25', 'GRADE_EMMA_PHY9B_Q4_2223', 'G_EMMA_PHY9B_Q4_2223', encode(digest('GRADE_EMMA_PHY9B_Q4_2223', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, physci9b_section_id, s2_2223_term_id, phys_sci_9b_course_id, 'B-', 'S2', 82.50, 2.70, 1.0, 1.0, 0, false, 'Science', 'Final', NULL, '09', 'StoredGrades', '2023-05-25', 'GRADE_EMMA_PHY9B_S2_2223', 'G_EMMA_PHY9B_S2_2223', encode(digest('GRADE_EMMA_PHY9B_S2_2223', 'sha256'), 'hex'), 'mock_source');
  -- Grade 10 (2023-2024)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, english_10a_section_id, q1_2324_term_id, english_10a_course_id, 'A-', 'Q1', 90.00, 3.70, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2023-10-20', 'GRADE_EMMA_ENG10A_Q1_2324', 'G_EMMA_ENG10A_Q1_2324', encode(digest('GRADE_EMMA_ENG10A_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_10a_section_id, q2_2324_term_id, english_10a_course_id, 'A', 'Q2', 95.50, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2023-12-22', 'GRADE_EMMA_ENG10A_Q2_2324', 'G_EMMA_ENG10A_Q2_2324', encode(digest('GRADE_EMMA_ENG10A_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_10a_section_id, s1_2324_term_id, english_10a_course_id, 'A-', 'S1', 92.75, 3.70, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2023-12-22', 'GRADE_EMMA_ENG10A_S1_2324', 'G_EMMA_ENG10A_S1_2324', encode(digest('GRADE_EMMA_ENG10A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_10b_section_id, q3_2324_term_id, english_10b_course_id, 'A', 'Q3', 94.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2024-03-16', 'GRADE_EMMA_ENG10B_Q3_2324', 'G_EMMA_ENG10B_Q3_2324', encode(digest('GRADE_EMMA_ENG10B_Q3_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_10b_section_id, q4_2324_term_id, english_10b_course_id, 'A', 'Q4', 97.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2024-05-25', 'GRADE_EMMA_ENG10B_Q4_2324', 'G_EMMA_ENG10B_Q4_2324', encode(digest('GRADE_EMMA_ENG10B_Q4_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_10b_section_id, s2_2324_term_id, english_10b_course_id, 'A', 'S2', 95.50, 4.00, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2024-05-25', 'GRADE_EMMA_ENG10B_S2_2324', 'G_EMMA_ENG10B_S2_2324', encode(digest('GRADE_EMMA_ENG10B_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  
  (emma_johnson_student_id, algebra_1a_section_id, q1_2324_term_id, algebra_1a_course_id, 'C+', 'Q1', 78.00, 2.30, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2023-10-20', 'GRADE_EMMA_ALG1A_Q1_2324', 'G_EMMA_ALG1A_Q1_2324', encode(digest('GRADE_EMMA_ALG1A_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, algebra_1a_section_id, q2_2324_term_id, algebra_1a_course_id, 'B', 'Q2', 84.00, 3.00, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2023-12-22', 'GRADE_EMMA_ALG1A_Q2_2324', 'G_EMMA_ALG1A_Q2_2324', encode(digest('GRADE_EMMA_ALG1A_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, algebra_1a_section_id, s1_2324_term_id, algebra_1a_course_id, 'B-', 'S1', 81.00, 2.70, 1.0, 1.0, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2023-12-22', 'GRADE_EMMA_ALG1A_S1_2324', 'G_EMMA_ALG1A_S1_2324', encode(digest('GRADE_EMMA_ALG1A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, algebra_1b_section_id, q3_2324_term_id, algebra_1b_course_id, 'B+', 'Q3', 89.00, 3.30, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2024-03-16', 'GRADE_EMMA_ALG1B_Q3_2324', 'G_EMMA_ALG1B_Q3_2324', encode(digest('GRADE_EMMA_ALG1B_Q3_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, algebra_1b_section_id, q4_2324_term_id, algebra_1b_course_id, 'A', 'Q4', 93.50, 4.00, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2024-05-25', 'GRADE_EMMA_ALG1B_Q4_2324', 'G_EMMA_ALG1B_Q4_2324', encode(digest('GRADE_EMMA_ALG1B_Q4_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, algebra_1b_section_id, s2_2324_term_id, algebra_1b_course_id, 'A-', 'S2', 91.25, 3.70, 1.0, 1.0, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2024-05-25', 'GRADE_EMMA_ALG1B_S2_2324', 'G_EMMA_ALG1B_S2_2324', encode(digest('GRADE_EMMA_ALG1B_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  
  (emma_johnson_student_id, biology_a_section_id, q1_2324_term_id, biology_a_course_id, 'A-', 'Q1', 92.00, 3.70, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2023-10-20', 'GRADE_EMMA_BIO1A_Q1_2324', 'G_EMMA_BIO1A_Q1_2324', encode(digest('GRADE_EMMA_BIO1A_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, biology_a_section_id, q2_2324_term_id, biology_a_course_id, 'A', 'Q2', 95.00, 4.00, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2023-12-22', 'GRADE_EMMA_BIO1A_Q2_2324', 'G_EMMA_BIO1A_Q2_2324', encode(digest('GRADE_EMMA_BIO1A_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, biology_a_section_id, s1_2324_term_id, biology_a_course_id, 'A', 'S1', 93.50, 4.00, 1.0, 1.0, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2023-12-22', 'GRADE_EMMA_BIO1A_S1_2324', 'G_EMMA_BIO1A_S1_2324', encode(digest('GRADE_EMMA_BIO1A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, biology_b_section_id, q3_2324_term_id, biology_b_course_id, 'B', 'Q3', 85.00, 3.00, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2024-03-16', 'GRADE_EMMA_BIO1B_Q3_2324', 'G_EMMA_BIO1B_Q3_2324', encode(digest('GRADE_EMMA_BIO1B_Q3_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, biology_b_section_id, q4_2324_term_id, biology_b_course_id, 'B-', 'Q4', 80.00, 2.70, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2024-05-25', 'GRADE_EMMA_BIO1B_Q4_2324', 'G_EMMA_BIO1B_Q4_2324', encode(digest('GRADE_EMMA_BIO1B_Q4_2324', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, biology_b_section_id, s2_2324_term_id, biology_b_course_id, 'B-', 'S2', 82.50, 2.70, 1.0, 1.0, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2024-05-25', 'GRADE_EMMA_BIO1B_S2_2324', 'G_EMMA_BIO1B_S2_2324', encode(digest('GRADE_EMMA_BIO1B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 11 (2024-2025)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (emma_johnson_student_id, english_11a_section_id, q1_2425_term_id, english_11a_course_id, 'A-', 'Q1', 91.00, 3.70, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '11', 'StoredGrades', '2024-10-20', 'GRADE_EMMA_ENG11A_Q1_2425', 'G_EMMA_ENG11A_Q1_2425', encode(digest('GRADE_EMMA_ENG11A_Q1_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_11a_section_id, q2_2425_term_id, english_11a_course_id, 'A', 'Q2', 95.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '11', 'StoredGrades', '2024-12-22', 'GRADE_EMMA_ENG11A_Q2_2425', 'G_EMMA_ENG11A_Q2_2425', encode(digest('GRADE_EMMA_ENG11A_Q2_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_11a_section_id, s1_2425_term_id, english_11a_course_id, 'A', 'S1', 93.00, 4.00, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '11', 'StoredGrades', '2024-12-22', 'GRADE_EMMA_ENG11A_S1_2425', 'G_EMMA_ENG11A_S1_2425', encode(digest('GRADE_EMMA_ENG11A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_11b_section_id, q3_2425_term_id, english_11b_course_id, 'A', 'Q3', 96.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '11', 'StoredGrades', '2025-03-16', 'GRADE_EMMA_ENG11B_Q3_2425', 'G_EMMA_ENG11B_Q3_2425', encode(digest('GRADE_EMMA_ENG11B_Q3_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_11b_section_id, q4_2425_term_id, english_11b_course_id, 'A', 'Q4', 97.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '11', 'StoredGrades', '2025-05-25', 'GRADE_EMMA_ENG11B_Q4_2425', 'G_EMMA_ENG11B_Q4_2425', encode(digest('GRADE_EMMA_ENG11B_Q4_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, english_11b_section_id, s2_2425_term_id, english_11b_course_id, 'A', 'S2', 96.50, 4.00, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '11', 'StoredGrades', '2025-05-25', 'GRADE_EMMA_ENG11B_S2_2425', 'G_EMMA_ENG11B_S2_2425', encode(digest('GRADE_EMMA_ENG11B_S2_2425', 'sha256'), 'hex'), 'mock_source'),

  (emma_johnson_student_id, us_history_a_section_id, q1_2425_term_id, us_history_a_course_id, 'C', 'Q1', 75.00, 2.00, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '11', 'StoredGrades', '2024-10-20', 'GRADE_EMMA_USHISTA_Q1_2425', 'G_EMMA_USHISTA_Q1_2425', encode(digest('GRADE_EMMA_USHISTA_Q1_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, us_history_a_section_id, q2_2425_term_id, us_history_a_course_id, 'B-', 'Q2', 82.00, 2.70, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '11', 'StoredGrades', '2024-12-22', 'GRADE_EMMA_USHISTA_Q2_2425', 'G_EMMA_USHISTA_Q2_2425', encode(digest('GRADE_EMMA_USHISTA_Q2_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, us_history_a_section_id, s1_2425_term_id, us_history_a_course_id, 'C+', 'S1', 78.50, 2.30, 1.0, 1.0, 0, false, 'History', 'Final', NULL, '11', 'StoredGrades', '2024-12-22', 'GRADE_EMMA_USHISTA_S1_2425', 'G_EMMA_USHISTA_S1_2425', encode(digest('GRADE_EMMA_USHISTA_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, us_history_b_section_id, q3_2425_term_id, us_history_b_course_id, 'C+', 'Q3', 77.00, 2.30, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '11', 'StoredGrades', '2025-03-16', 'GRADE_EMMA_USHISTB_Q3_2425', 'G_EMMA_USHISTB_Q3_2425', encode(digest('GRADE_EMMA_USHISTB_Q3_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, us_history_b_section_id, q4_2425_term_id, us_history_b_course_id, 'B-', 'Q4', 80.00, 2.70, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '11', 'StoredGrades', '2025-05-25', 'GRADE_EMMA_USHISTB_Q4_2425', 'G_EMMA_USHISTB_Q4_2425', encode(digest('GRADE_EMMA_USHISTB_Q4_2425', 'sha256'), 'hex'), 'mock_source'), 
  (emma_johnson_student_id, us_history_b_section_id, s2_2425_term_id, us_history_b_course_id, 'C+', 'S2', 78.50, 2.30, 1.0, 1.0, 0, false, 'History', 'Final', NULL, '11', 'StoredGrades', '2025-05-25', 'GRADE_EMMA_USHISTB_S2_2425', 'G_EMMA_USHISTB_S2_2425', encode(digest('GRADE_EMMA_USHISTB_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  
  (emma_johnson_student_id, alg2a_section_id, q1_2425_term_id, algebra_2a_course_id, 'B-', 'Q1', 82.00, 2.70, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '11', 'StoredGrades', '2024-10-20', 'GRADE_EMMA_ALG2A_Q1_2425', 'G_EMMA_ALG2A_Q1_2425', encode(digest('GRADE_EMMA_ALG2A_Q1_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, alg2a_section_id, q2_2425_term_id, algebra_2a_course_id, 'B+', 'Q2', 88.00, 3.30, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '11', 'StoredGrades', '2024-12-22', 'GRADE_EMMA_ALG2A_Q2_2425', 'G_EMMA_ALG2A_Q2_2425', encode(digest('GRADE_EMMA_ALG2A_Q2_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, alg2a_section_id, s1_2425_term_id, algebra_2a_course_id, 'B', 'S1', 85.00, 3.00, 1.0, 1.0, 0, false, 'Math', 'Final', NULL, '11', 'StoredGrades', '2024-12-22', 'GRADE_EMMA_ALG2A_S1_2425', 'G_EMMA_ALG2A_S1_2425', encode(digest('GRADE_EMMA_ALG2A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, alg2b_section_id, q3_2425_term_id, algebra_2b_course_id, 'B', 'Q3', 84.00, 3.00, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '11', 'StoredGrades', '2025-03-16', 'GRADE_EMMA_ALG2B_Q3_2425', 'G_EMMA_ALG2B_Q3_2425', encode(digest('GRADE_EMMA_ALG2B_Q3_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, alg2b_section_id, q4_2425_term_id, algebra_2b_course_id, 'B', 'Q4', 86.00, 3.00, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '11', 'StoredGrades', '2025-05-25', 'GRADE_EMMA_ALG2B_Q4_2425', 'G_EMMA_ALG2B_Q4_2425', encode(digest('GRADE_EMMA_ALG2B_Q4_2425', 'sha256'), 'hex'), 'mock_source'),
  (emma_johnson_student_id, alg2b_section_id, s2_2425_term_id, algebra_2b_course_id, 'B', 'S2', 85.00, 3.00, 1.0, 1.0, 0, false, 'Math', 'Final', NULL, '11', 'StoredGrades', '2025-05-25', 'GRADE_EMMA_ALG2B_S2_2425', 'G_EMMA_ALG2B_S2_2425', encode(digest('GRADE_EMMA_ALG2B_S2_2425', 'sha256'), 'hex'), 'mock_source');

  -- Michael Chen's Grades (Current Grade 10)
  -- Grade 9 (2023-2024)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (michael_chen_student_id, english_9a_section_id, q1_2324_term_id, english_9a_course_id, 'B+', 'Q1', 88.00, 3.30, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '09', 'StoredGrades', '2023-10-20', 'GRADE_MICHAEL_ENG9A_Q1_2324', 'G_MICHAEL_ENG9A_Q1_2324', encode(digest('GRADE_MICHAEL_ENG9A_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_9a_section_id, q2_2324_term_id, english_9a_course_id, 'A-', 'Q2', 92.00, 3.70, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '09', 'StoredGrades', '2023-12-22', 'GRADE_MICHAEL_ENG9A_Q2_2324', 'G_MICHAEL_ENG9A_Q2_2324', encode(digest('GRADE_MICHAEL_ENG9A_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_9a_section_id, s1_2324_term_id, english_9a_course_id, 'A-', 'S1', 90.00, 3.70, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '09', 'StoredGrades', '2023-12-22', 'GRADE_MICHAEL_ENG9A_S1_2324', 'G_MICHAEL_ENG9A_S1_2324', encode(digest('GRADE_MICHAEL_ENG9A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_9b_section_id, q3_2324_term_id, english_9b_course_id, 'A', 'Q3', 94.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '09', 'StoredGrades', '2024-03-16', 'GRADE_MICHAEL_ENG9B_Q3_2324', 'G_MICHAEL_ENG9B_Q3_2324', encode(digest('GRADE_MICHAEL_ENG9B_Q3_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_9b_section_id, q4_2324_term_id, english_9b_course_id, 'A-', 'Q4', 91.00, 3.70, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '09', 'StoredGrades', '2024-05-25', 'GRADE_MICHAEL_ENG9B_Q4_2324', 'G_MICHAEL_ENG9B_Q4_2324', encode(digest('GRADE_MICHAEL_ENG9B_Q4_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_9b_section_id, s2_2324_term_id, english_9b_course_id, 'A-', 'S2', 92.50, 3.70, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '09', 'StoredGrades', '2024-05-25', 'GRADE_MICHAEL_ENG9B_S2_2324', 'G_MICHAEL_ENG9B_S2_2324', encode(digest('GRADE_MICHAEL_ENG9B_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  
  (michael_chen_student_id, whist9a_section_id, q1_2324_term_id, world_hist_9a_course_id, 'B', 'Q1', 85.00, 3.00, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '09', 'StoredGrades', '2023-10-20', 'GRADE_MICHAEL_WHIST9A_Q1_2324', 'G_MICHAEL_WHIST9A_Q1_2324', encode(digest('GRADE_MICHAEL_WHIST9A_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, whist9a_section_id, q2_2324_term_id, world_hist_9a_course_id, 'B-', 'Q2', 82.00, 2.70, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '09', 'StoredGrades', '2023-12-22', 'GRADE_MICHAEL_WHIST9A_Q2_2324', 'G_MICHAEL_WHIST9A_Q2_2324', encode(digest('GRADE_MICHAEL_WHIST9A_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, whist9a_section_id, s1_2324_term_id, world_hist_9a_course_id, 'B', 'S1', 83.50, 3.00, 1.0, 1.0, 0, false, 'History', 'Final', NULL, '09', 'StoredGrades', '2023-12-22', 'GRADE_MICHAEL_WHIST9A_S1_2324', 'G_MICHAEL_WHIST9A_S1_2324', encode(digest('GRADE_MICHAEL_WHIST9A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, whist9b_section_id, q3_2324_term_id, world_hist_9b_course_id, 'B+', 'Q3', 87.00, 3.30, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '09', 'StoredGrades', '2024-03-16', 'GRADE_MICHAEL_WHIST9B_Q3_2324', 'G_MICHAEL_WHIST9B_Q3_2324', encode(digest('GRADE_MICHAEL_WHIST9B_Q3_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, whist9b_section_id, q4_2324_term_id, world_hist_9b_course_id, 'A-', 'Q4', 90.00, 3.70, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '09', 'StoredGrades', '2024-05-25', 'GRADE_MICHAEL_WHIST9B_Q4_2324', 'G_MICHAEL_WHIST9B_Q4_2324', encode(digest('GRADE_MICHAEL_WHIST9B_Q4_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, whist9b_section_id, s2_2324_term_id, world_hist_9b_course_id, 'B+', 'S2', 88.50, 3.30, 1.0, 1.0, 0, false, 'History', 'Final', NULL, '09', 'StoredGrades', '2024-05-25', 'GRADE_MICHAEL_WHIST9B_S2_2324', 'G_MICHAEL_WHIST9B_S2_2324', encode(digest('GRADE_MICHAEL_WHIST9B_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  
  (michael_chen_student_id, physci9a_section_id, q1_2324_term_id, phys_sci_9a_course_id, 'A', 'Q1', 96.00, 4.00, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '09', 'StoredGrades', '2023-10-20', 'GRADE_MICHAEL_PHY9A_Q1_2324', 'G_MICHAEL_PHY9A_Q1_2324', encode(digest('GRADE_MICHAEL_PHY9A_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, physci9a_section_id, q2_2324_term_id, phys_sci_9a_course_id, 'A', 'Q2', 98.00, 4.00, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '09', 'StoredGrades', '2023-12-22', 'GRADE_MICHAEL_PHY9A_Q2_2324', 'G_MICHAEL_PHY9A_Q2_2324', encode(digest('GRADE_MICHAEL_PHY9A_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, physci9a_section_id, s1_2324_term_id, phys_sci_9a_course_id, 'A', 'S1', 97.00, 4.00, 1.0, 1.0, 0, false, 'Science', 'Final', NULL, '09', 'StoredGrades', '2023-12-22', 'GRADE_MICHAEL_PHY9A_S1_2324', 'G_MICHAEL_PHY9A_S1_2324', encode(digest('GRADE_MICHAEL_PHY9A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, physci9b_section_id, q3_2324_term_id, phys_sci_9b_course_id, 'A', 'Q3', 94.00, 4.00, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '09', 'StoredGrades', '2024-03-16', 'GRADE_MICHAEL_PHY9B_Q3_2324', 'G_MICHAEL_PHY9B_Q3_2324', encode(digest('GRADE_MICHAEL_PHY9B_Q3_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, physci9b_section_id, q4_2324_term_id, phys_sci_9b_course_id, 'A-', 'Q4', 92.00, 3.70, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '09', 'StoredGrades', '2024-05-25', 'GRADE_MICHAEL_PHY9B_Q4_2324', 'G_MICHAEL_PHY9B_Q4_2324', encode(digest('GRADE_MICHAEL_PHY9B_Q4_2324', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, physci9b_section_id, s2_2324_term_id, phys_sci_9b_course_id, 'A', 'S2', 93.00, 4.00, 1.0, 1.0, 0, false, 'Science', 'Final', NULL, '09', 'StoredGrades', '2024-05-25', 'GRADE_MICHAEL_PHY9B_S2_2324', 'G_MICHAEL_PHY9B_S2_2324', encode(digest('GRADE_MICHAEL_PHY9B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 10 (2024-2025)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (michael_chen_student_id, english_10a_section_id, q1_2425_term_id, english_10a_course_id, 'A-', 'Q1', 91.00, 3.70, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2024-10-20', 'GRADE_MICHAEL_ENG10A_Q1_2425', 'G_MICHAEL_ENG10A_Q1_2425', encode(digest('GRADE_MICHAEL_ENG10A_Q1_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_10a_section_id, q2_2425_term_id, english_10a_course_id, 'A', 'Q2', 93.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2024-12-22', 'GRADE_MICHAEL_ENG10A_Q2_2425', 'G_MICHAEL_ENG10A_Q2_2425', encode(digest('GRADE_MICHAEL_ENG10A_Q2_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_10a_section_id, s1_2425_term_id, english_10a_course_id, 'A-', 'S1', 92.00, 3.70, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2024-12-22', 'GRADE_MICHAEL_ENG10A_S1_2425', 'G_MICHAEL_ENG10A_S1_2425', encode(digest('GRADE_MICHAEL_ENG10A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_10b_section_id, q3_2425_term_id, english_10b_course_id, 'A', 'Q3', 95.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2025-03-16', 'GRADE_MICHAEL_ENG10B_Q3_2425', 'G_MICHAEL_ENG10B_Q3_2425', encode(digest('GRADE_MICHAEL_ENG10B_Q3_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_10b_section_id, q4_2425_term_id, english_10b_course_id, 'A', 'Q4', 94.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2025-05-25', 'GRADE_MICHAEL_ENG10B_Q4_2425', 'G_MICHAEL_ENG10B_Q4_2425', encode(digest('GRADE_MICHAEL_ENG10B_Q4_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, english_10b_section_id, s2_2425_term_id, english_10b_course_id, 'A', 'S2', 94.50, 4.00, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2025-05-25', 'GRADE_MICHAEL_ENG10B_S2_2425', 'G_MICHAEL_ENG10B_S2_2425', encode(digest('GRADE_MICHAEL_ENG10B_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  
  (michael_chen_student_id, algebra_1a_section_id, q1_2425_term_id, algebra_1a_course_id, 'A', 'Q1', 97.00, 4.00, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2024-10-20', 'GRADE_MICHAEL_ALG1A_Q1_2425', 'G_MICHAEL_ALG1A_Q1_2425', encode(digest('GRADE_MICHAEL_ALG1A_Q1_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, algebra_1a_section_id, q2_2425_term_id, algebra_1a_course_id, 'A-', 'Q2', 91.00, 3.70, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2024-12-22', 'GRADE_MICHAEL_ALG1A_Q2_2425', 'G_MICHAEL_ALG1A_Q2_2425', encode(digest('GRADE_MICHAEL_ALG1A_Q2_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, algebra_1a_section_id, s1_2425_term_id, algebra_1a_course_id, 'A', 'S1', 94.00, 4.00, 1.0, 1.0, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2024-12-22', 'GRADE_MICHAEL_ALG1A_S1_2425', 'G_MICHAEL_ALG1A_S1_2425', encode(digest('GRADE_MICHAEL_ALG1A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, algebra_1b_section_id, q3_2425_term_id, algebra_1b_course_id, 'A', 'Q3', 98.00, 4.00, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2025-03-16', 'GRADE_MICHAEL_ALG1B_Q3_2425', 'G_MICHAEL_ALG1B_Q3_2425', encode(digest('GRADE_MICHAEL_ALG1B_Q3_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, algebra_1b_section_id, q4_2425_term_id, algebra_1b_course_id, 'A', 'Q4', 99.00, 4.00, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2025-05-25', 'GRADE_MICHAEL_ALG1B_Q4_2425', 'G_MICHAEL_ALG1B_Q4_2425', encode(digest('GRADE_MICHAEL_ALG1B_Q4_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, algebra_1b_section_id, s2_2425_term_id, algebra_1b_course_id, 'A', 'S2', 98.50, 4.00, 1.0, 1.0, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2025-05-25', 'GRADE_MICHAEL_ALG1B_S2_2425', 'G_MICHAEL_ALG1B_S2_2425', encode(digest('GRADE_MICHAEL_ALG1B_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  
  (michael_chen_student_id, biology_a_section_id, q1_2425_term_id, biology_a_course_id, 'A', 'Q1', 94.00, 4.00, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2024-10-20', 'GRADE_MICHAEL_BIO1A_Q1_2425', 'G_MICHAEL_BIO1A_Q1_2425', encode(digest('GRADE_MICHAEL_BIO1A_Q1_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, biology_a_section_id, q2_2425_term_id, biology_a_course_id, 'A-', 'Q2', 91.00, 3.70, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2024-12-22', 'GRADE_MICHAEL_BIO1A_Q2_2425', 'G_MICHAEL_BIO1A_Q2_2425', encode(digest('GRADE_MICHAEL_BIO1A_Q2_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, biology_a_section_id, s1_2425_term_id, biology_a_course_id, 'A-', 'S1', 92.50, 3.70, 1.0, 1.0, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2024-12-22', 'GRADE_MICHAEL_BIO1A_S1_2425', 'G_MICHAEL_BIO1A_S1_2425', encode(digest('GRADE_MICHAEL_BIO1A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, biology_b_section_id, q3_2425_term_id, biology_b_course_id, 'B+', 'Q3', 89.00, 3.30, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2025-03-16', 'GRADE_MICHAEL_BIO1B_Q3_2425', 'G_MICHAEL_BIO1B_Q3_2425', encode(digest('GRADE_MICHAEL_BIO1B_Q3_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, biology_b_section_id, q4_2425_term_id, biology_b_course_id, 'B+', 'Q4', 87.00, 3.30, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2025-05-25', 'GRADE_MICHAEL_BIO1B_Q4_2425', 'G_MICHAEL_BIO1B_Q4_2425', encode(digest('GRADE_MICHAEL_BIO1B_Q4_2425', 'sha256'), 'hex'), 'mock_source'),
  (michael_chen_student_id, biology_b_section_id, s2_2425_term_id, biology_b_course_id, 'B+', 'S2', 88.00, 3.30, 1.0, 1.0, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2025-05-25', 'GRADE_MICHAEL_BIO1B_S2_2425', 'G_MICHAEL_BIO1B_S2_2425', encode(digest('GRADE_MICHAEL_BIO1B_S2_2425', 'sha256'), 'hex'), 'mock_source');

  -- ##################### Seed Sophia Rodriguez's Grades #####################

  -- Sophia Rodriguez's Grades (Current Grade 12)
  -- Grade 9 (2021-2022)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (sophia_rodriguez_student_id, english_9a_section_id, q1_2122_term_id, english_9a_course_id, 'A', 'Q1', 96.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '09', 'StoredGrades', '2021-10-20', 'GRADE_SOPHIA_ENG9A_Q1_2122', 'G_SOPHIA_ENG9A_Q1_2122', encode(digest('GRADE_SOPHIA_ENG9A_Q1_2122', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_9a_section_id, q2_2122_term_id, english_9a_course_id, 'A-', 'Q2', 92.00, 3.70, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '09', 'StoredGrades', '2021-12-22', 'GRADE_SOPHIA_ENG9A_Q2_2122', 'G_SOPHIA_ENG9A_Q2_2122', encode(digest('GRADE_SOPHIA_ENG9A_Q2_2122', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_9a_section_id, s1_2122_term_id, english_9a_course_id, 'A', 'S1', 94.00, 4.00, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '09', 'StoredGrades', '2021-12-22', 'GRADE_SOPHIA_ENG9A_S1_2122', 'G_SOPHIA_ENG9A_S1_2122', encode(digest('GRADE_SOPHIA_ENG9A_S1_2122', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_9b_section_id, q3_2122_term_id, english_9b_course_id, 'A-', 'Q3', 90.00, 3.70, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '09', 'StoredGrades', '2022-03-16', 'GRADE_SOPHIA_ENG9B_Q3_2122', 'G_SOPHIA_ENG9B_Q3_2122', encode(digest('GRADE_SOPHIA_ENG9B_Q3_2122', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_9b_section_id, q4_2122_term_id, english_9b_course_id, 'A-', 'Q4', 92.00, 3.70, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '09', 'StoredGrades', '2022-05-25', 'GRADE_SOPHIA_ENG9B_Q4_2122', 'G_SOPHIA_ENG9B_Q4_2122', encode(digest('GRADE_SOPHIA_ENG9B_Q4_2122', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_9b_section_id, s2_2122_term_id, english_9b_course_id, 'A-', 'S2', 91.00, 3.70, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '09', 'StoredGrades', '2022-05-25', 'GRADE_SOPHIA_ENG9B_S2_2122', 'G_SOPHIA_ENG9B_S2_2122', encode(digest('GRADE_SOPHIA_ENG9B_S2_2122', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, whist9a_section_id, q1_2122_term_id, world_hist_9a_course_id, 'B+', 'Q1', 89.00, 3.30, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '09', 'StoredGrades', '2021-10-20', 'GRADE_SOPHIA_WHIST9A_Q1_2122', 'G_SOPHIA_WHIST9A_Q1_2122', encode(digest('GRADE_SOPHIA_WHIST9A_Q1_2122', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, whist9a_section_id, q2_2122_term_id, world_hist_9a_course_id, 'B-', 'Q2', 81.00, 2.70, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '09', 'StoredGrades', '2021-12-22', 'GRADE_SOPHIA_WHIST9A_Q2_2122', 'G_SOPHIA_WHIST9A_Q2_2122', encode(digest('GRADE_SOPHIA_WHIST9A_Q2_2122', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, whist9a_section_id, s1_2122_term_id, world_hist_9a_course_id, 'B', 'S1', 85.00, 3.00, 1.0, 1.0, 0, false, 'History', 'Final', NULL, '09', 'StoredGrades', '2021-12-22', 'GRADE_SOPHIA_WHIST9A_S1_2122', 'G_SOPHIA_WHIST9A_S1_2122', encode(digest('GRADE_SOPHIA_WHIST9A_S1_2122', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, whist9b_section_id, q3_2122_term_id, world_hist_9b_course_id, 'B+', 'Q3', 87.00, 3.30, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '09', 'StoredGrades', '2022-03-16', 'GRADE_SOPHIA_WHIST9B_Q3_2122', 'G_SOPHIA_WHIST9B_Q3_2122', encode(digest('GRADE_SOPHIA_WHIST9B_Q3_2122', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, whist9b_section_id, q4_2122_term_id, world_hist_9b_course_id, 'B+', 'Q4', 89.00, 3.30, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '09', 'StoredGrades', '2022-05-25', 'GRADE_SOPHIA_WHIST9B_Q4_2122', 'G_SOPHIA_WHIST9B_Q4_2122', encode(digest('GRADE_SOPHIA_WHIST9B_Q4_2122', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, whist9b_section_id, s2_2122_term_id, world_hist_9b_course_id, 'B+', 'S2', 88.00, 3.30, 1.0, 1.0, 0, false, 'History', 'Final', NULL, '09', 'StoredGrades', '2022-05-25', 'GRADE_SOPHIA_WHIST9B_S2_2122', 'G_SOPHIA_WHIST9B_S2_2122', encode(digest('GRADE_SOPHIA_WHIST9B_S2_2122', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, physci9a_section_id, q1_2122_term_id, phys_sci_9a_course_id, 'A-', 'Q1', 90.00, 3.70, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '09', 'StoredGrades', '2021-10-20', 'GRADE_SOPHIA_PHY9A_Q1_2122', 'G_SOPHIA_PHY9A_Q1_2122', encode(digest('GRADE_SOPHIA_PHY9A_Q1_2122', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, physci9a_section_id, q2_2122_term_id, phys_sci_9a_course_id, 'A', 'Q2', 95.00, 4.00, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '09', 'StoredGrades', '2021-12-22', 'GRADE_SOPHIA_PHY9A_Q2_2122', 'G_SOPHIA_PHY9A_Q2_2122', encode(digest('GRADE_SOPHIA_PHY9A_Q2_2122', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, physci9a_section_id, s1_2122_term_id, phys_sci_9a_course_id, 'A-', 'S1', 92.50, 3.70, 1.0, 1.0, 0, false, 'Science', 'Final', NULL, '09', 'StoredGrades', '2021-12-22', 'GRADE_SOPHIA_PHY9A_S1_2122', 'G_SOPHIA_PHY9A_S1_2122', encode(digest('GRADE_SOPHIA_PHY9A_S1_2122', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, physci9b_section_id, q3_2122_term_id, phys_sci_9b_course_id, 'B', 'Q3', 84.00, 3.00, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '09', 'StoredGrades', '2022-03-16', 'GRADE_SOPHIA_PHY9B_Q3_2122', 'G_SOPHIA_PHY9B_Q3_2122', encode(digest('GRADE_SOPHIA_PHY9B_Q3_2122', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, physci9b_section_id, q4_2122_term_id, phys_sci_9b_course_id, 'B+', 'Q4', 89.00, 3.30, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '09', 'StoredGrades', '2022-05-25', 'GRADE_SOPHIA_PHY9B_Q4_2122', 'G_SOPHIA_PHY9B_Q4_2122', encode(digest('GRADE_SOPHIA_PHY9B_Q4_2122', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, physci9b_section_id, s2_2122_term_id, phys_sci_9b_course_id, 'B+', 'S2', 86.50, 3.30, 1.0, 1.0, 0, false, 'Science', 'Final', NULL, '09', 'StoredGrades', '2022-05-25', 'GRADE_SOPHIA_PHY9B_S2_2122', 'G_SOPHIA_PHY9B_S2_2122', encode(digest('GRADE_SOPHIA_PHY9B_S2_2122', 'sha256'), 'hex'), 'mock_source');
  -- Grade 10 (2022-2023)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (sophia_rodriguez_student_id, english_10a_section_id, q1_2223_term_id, english_10a_course_id, 'A', 'Q1', 97.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2022-10-20', 'GRADE_SOPHIA_ENG10A_Q1_2223', 'G_SOPHIA_ENG10A_Q1_2223', encode(digest('GRADE_SOPHIA_ENG10A_Q1_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_10a_section_id, q2_2223_term_id, english_10a_course_id, 'A', 'Q2', 93.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2022-12-22', 'GRADE_SOPHIA_ENG10A_Q2_2223', 'G_SOPHIA_ENG10A_Q2_2223', encode(digest('GRADE_SOPHIA_ENG10A_Q2_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_10a_section_id, s1_2223_term_id, english_10a_course_id, 'A', 'S1', 95.00, 4.00, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2022-12-22', 'GRADE_SOPHIA_ENG10A_S1_2223', 'G_SOPHIA_ENG10A_S1_2223', encode(digest('GRADE_SOPHIA_ENG10A_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_10b_section_id, q3_2223_term_id, english_10b_course_id, 'A', 'Q3', 95.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2023-03-16', 'GRADE_SOPHIA_ENG10B_Q3_2223', 'G_SOPHIA_ENG10B_Q3_2223', encode(digest('GRADE_SOPHIA_ENG10B_Q3_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_10b_section_id, q4_2223_term_id, english_10b_course_id, 'A', 'Q4', 97.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2023-05-25', 'GRADE_SOPHIA_ENG10B_Q4_2223', 'G_SOPHIA_ENG10B_Q4_2223', encode(digest('GRADE_SOPHIA_ENG10B_Q4_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_10b_section_id, s2_2223_term_id, english_10b_course_id, 'A', 'S2', 96.00, 4.00, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '10', 'StoredGrades', '2023-05-25', 'GRADE_SOPHIA_ENG10B_S2_2223', 'G_SOPHIA_ENG10B_S2_2223', encode(digest('GRADE_SOPHIA_ENG10B_S2_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, algebra_1a_section_id, q1_2223_term_id, algebra_1a_course_id, 'B+', 'Q1', 88.00, 3.30, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2022-10-20', 'GRADE_SOPHIA_ALG1A_Q1_2223', 'G_SOPHIA_ALG1A_Q1_2223', encode(digest('GRADE_SOPHIA_ALG1A_Q1_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, algebra_1a_section_id, q2_2223_term_id, algebra_1a_course_id, 'A', 'Q2', 96.00, 4.00, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2022-12-22', 'GRADE_SOPHIA_ALG1A_Q2_2223', 'G_SOPHIA_ALG1A_Q2_2223', encode(digest('GRADE_SOPHIA_ALG1A_Q2_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, algebra_1a_section_id, s1_2223_term_id, algebra_1a_course_id, 'A-', 'S1', 92.00, 3.70, 1.0, 1.0, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2022-12-22', 'GRADE_SOPHIA_ALG1A_S1_2223', 'G_SOPHIA_ALG1A_S1_2223', encode(digest('GRADE_SOPHIA_ALG1A_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, algebra_1b_section_id, q3_2223_term_id, algebra_1b_course_id, 'A', 'Q3', 93.00, 4.00, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2023-03-16', 'GRADE_SOPHIA_ALG1B_Q3_2223', 'G_SOPHIA_ALG1B_Q3_2223', encode(digest('GRADE_SOPHIA_ALG1B_Q3_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, algebra_1b_section_id, q4_2223_term_id, algebra_1b_course_id, 'A', 'Q4', 95.00, 4.00, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2023-05-25', 'GRADE_SOPHIA_ALG1B_Q4_2223', 'G_SOPHIA_ALG1B_Q4_2223', encode(digest('GRADE_SOPHIA_ALG1B_Q4_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, algebra_1b_section_id, s2_2223_term_id, algebra_1b_course_id, 'A', 'S2', 94.00, 4.00, 1.0, 1.0, 0, false, 'Math', 'Final', NULL, '10', 'StoredGrades', '2023-05-25', 'GRADE_SOPHIA_ALG1B_S2_2223', 'G_SOPHIA_ALG1B_S2_2223', encode(digest('GRADE_SOPHIA_ALG1B_S2_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, biology_a_section_id, q1_2223_term_id, biology_a_course_id, 'A-', 'Q1', 91.00, 3.70, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2022-10-20', 'GRADE_SOPHIA_BIOA_Q1_2223', 'G_SOPHIA_BIOA_Q1_2223', encode(digest('GRADE_SOPHIA_BIOA_Q1_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, biology_a_section_id, q2_2223_term_id, biology_a_course_id, 'A', 'Q2', 96.00, 4.00, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2022-12-22', 'GRADE_SOPHIA_BIOA_Q2_2223', 'G_SOPHIA_BIOA_Q2_2223', encode(digest('GRADE_SOPHIA_BIOA_Q2_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, biology_a_section_id, s1_2223_term_id, biology_a_course_id, 'A', 'S1', 93.50, 4.00, 1.0, 1.0, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2022-12-22', 'GRADE_SOPHIA_BIOA_S1_2223', 'G_SOPHIA_BIOA_S1_2223', encode(digest('GRADE_SOPHIA_BIOA_S1_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, biology_b_section_id, q3_2223_term_id, biology_b_course_id, 'A-', 'Q3', 92.00, 3.70, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2023-03-16', 'GRADE_SOPHIA_BIOB_Q3_2223', 'G_SOPHIA_BIOB_Q3_2223', encode(digest('GRADE_SOPHIA_BIOB_Q3_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, biology_b_section_id, q4_2223_term_id, biology_b_course_id, 'A-', 'Q4', 91.00, 3.70, 0.5, 0.5, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2023-05-25', 'GRADE_SOPHIA_BIOB_Q4_2223', 'G_SOPHIA_BIOB_Q4_2223', encode(digest('GRADE_SOPHIA_BIOB_Q4_2223', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, biology_b_section_id, s2_2223_term_id, biology_b_course_id, 'A-', 'S2', 91.50, 3.70, 1.0, 1.0, 0, false, 'Science', 'Final', NULL, '10', 'StoredGrades', '2023-05-25', 'GRADE_SOPHIA_BIOB_S2_2223', 'G_SOPHIA_BIOB_S2_2223', encode(digest('GRADE_SOPHIA_BIOB_S2_2223', 'sha256'), 'hex'), 'mock_source');
  -- Grade 11 (2023-2024)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (sophia_rodriguez_student_id, english_11a_section_id, q1_2324_term_id, english_11a_course_id, 'A-', 'Q1', 92.00, 3.70, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '11', 'StoredGrades', '2023-10-20', 'GRADE_SOPHIA_ENG11A_Q1_2324', 'G_SOPHIA_ENG11A_Q1_2324', encode(digest('GRADE_SOPHIA_ENG11A_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_11a_section_id, q2_2324_term_id, english_11a_course_id, 'B+', 'Q2', 89.00, 3.30, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '11', 'StoredGrades', '2023-12-22', 'GRADE_SOPHIA_ENG11A_Q2_2324', 'G_SOPHIA_ENG11A_Q2_2324', encode(digest('GRADE_SOPHIA_ENG11A_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_11a_section_id, s1_2324_term_id, english_11a_course_id, 'A-', 'S1', 90.50, 3.70, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '11', 'StoredGrades', '2023-12-22', 'GRADE_SOPHIA_ENG11A_S1_2324', 'G_SOPHIA_ENG11A_S1_2324', encode(digest('GRADE_SOPHIA_ENG11A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_11b_section_id, q3_2324_term_id, english_11b_course_id, 'A', 'Q3', 93.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '11', 'StoredGrades', '2024-03-16', 'GRADE_SOPHIA_ENG11B_Q3_2324', 'G_SOPHIA_ENG11B_Q3_2324', encode(digest('GRADE_SOPHIA_ENG11B_Q3_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_11b_section_id, q4_2324_term_id, english_11b_course_id, 'A-', 'Q4', 91.00, 3.70, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '11', 'StoredGrades', '2024-05-25', 'GRADE_SOPHIA_ENG11B_Q4_2324', 'G_SOPHIA_ENG11B_Q4_2324', encode(digest('GRADE_SOPHIA_ENG11B_Q4_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_11b_section_id, s2_2324_term_id, english_11b_course_id, 'A-', 'S2', 92.00, 3.70, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '11', 'StoredGrades', '2024-05-25', 'GRADE_SOPHIA_ENG11B_S2_2324', 'G_SOPHIA_ENG11B_S2_2324', encode(digest('GRADE_SOPHIA_ENG11B_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, us_history_a_section_id, q1_2324_term_id, us_history_a_course_id, 'A', 'Q1', 97.00, 4.00, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '11', 'StoredGrades', '2023-10-20', 'GRADE_SOPHIA_USHISTA_Q1_2324', 'G_SOPHIA_USHISTA_Q1_2324', encode(digest('GRADE_SOPHIA_USHISTA_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, us_history_a_section_id, q2_2324_term_id, us_history_a_course_id, 'A', 'Q2', 96.00, 4.00, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '11', 'StoredGrades', '2023-12-22', 'GRADE_SOPHIA_USHISTA_Q2_2324', 'G_SOPHIA_USHISTA_Q2_2324', encode(digest('GRADE_SOPHIA_USHISTA_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, us_history_a_section_id, s1_2324_term_id, us_history_a_course_id, 'A', 'S1', 97.00, 4.00, 1.0, 1.0, 0, false, 'History', 'Final', NULL, '11', 'StoredGrades', '2023-12-22', 'GRADE_SOPHIA_USHISTA_S1_2324', 'G_SOPHIA_USHISTA_S1_2324', encode(digest('GRADE_SOPHIA_USHISTA_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, us_history_b_section_id, q3_2324_term_id, us_history_b_course_id, 'A', 'Q3', 98.00, 4.00, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '11', 'StoredGrades', '2024-03-16', 'GRADE_SOPHIA_USHISTB_Q3_2324', 'G_SOPHIA_USHISTB_Q3_2324', encode(digest('GRADE_SOPHIA_USHISTB_Q3_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, us_history_b_section_id, q4_2324_term_id, us_history_b_course_id, 'A', 'Q4', 97.00, 4.00, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '11', 'StoredGrades', '2024-05-25', 'GRADE_SOPHIA_USHISTB_Q4_2324', 'G_SOPHIA_USHISTB_Q4_2324', encode(digest('GRADE_SOPHIA_USHISTB_Q4_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, us_history_b_section_id, s2_2324_term_id, us_history_b_course_id, 'A', 'S2', 98.00, 4.00, 1.0, 1.0, 0, false, 'History', 'Final', NULL, '11', 'StoredGrades', '2024-05-25', 'GRADE_SOPHIA_USHISTB_S2_2324', 'G_SOPHIA_USHISTB_S2_2324', encode(digest('GRADE_SOPHIA_USHISTB_S2_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, alg2a_section_id, q1_2324_term_id, algebra_2a_course_id, 'B+', 'Q1', 88.00, 3.30, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '11', 'StoredGrades', '2023-10-20', 'GRADE_SOPHIA_ALG2A_Q1_2324', 'G_SOPHIA_ALG2A_Q1_2324', encode(digest('GRADE_SOPHIA_ALG2A_Q1_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, alg2a_section_id, q2_2324_term_id, algebra_2a_course_id, 'B', 'Q2', 84.00, 3.00, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '11', 'StoredGrades', '2023-12-22', 'GRADE_SOPHIA_ALG2A_Q2_2324', 'G_SOPHIA_ALG2A_Q2_2324', encode(digest('GRADE_SOPHIA_ALG2A_Q2_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, alg2a_section_id, s1_2324_term_id, algebra_2a_course_id, 'B', 'S1', 86.00, 3.00, 1.0, 1.0, 0, false, 'Math', 'Final', NULL, '11', 'StoredGrades', '2023-12-22', 'GRADE_SOPHIA_ALG2A_S1_2324', 'G_SOPHIA_ALG2A_S1_2324', encode(digest('GRADE_SOPHIA_ALG2A_S1_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, alg2b_section_id, q3_2324_term_id, algebra_2b_course_id, 'B-', 'Q3', 80.00, 2.70, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '11', 'StoredGrades', '2024-03-16', 'GRADE_SOPHIA_ALG2B_Q3_2324', 'G_SOPHIA_ALG2B_Q3_2324', encode(digest('GRADE_SOPHIA_ALG2B_Q3_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, alg2b_section_id, q4_2324_term_id, algebra_2b_course_id, 'B', 'Q4', 84.00, 3.00, 0.5, 0.5, 0, false, 'Math', 'Final', NULL, '11', 'StoredGrades', '2024-05-25', 'GRADE_SOPHIA_ALG2B_Q4_2324', 'G_SOPHIA_ALG2B_Q4_2324', encode(digest('GRADE_SOPHIA_ALG2B_Q4_2324', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, alg2b_section_id, s2_2324_term_id, algebra_2b_course_id, 'B-', 'S2', 82.00, 2.70, 1.0, 1.0, 0, false, 'Math', 'Final', NULL, '11', 'StoredGrades', '2024-05-25', 'GRADE_SOPHIA_ALG2B_S2_2324', 'G_SOPHIA_ALG2B_S2_2324', encode(digest('GRADE_SOPHIA_ALG2B_S2_2324', 'sha256'), 'hex'), 'mock_source');
  -- Grade 12 (2024-2025)
  INSERT INTO student_grades (student_id, section_id, term_id, course_id, grade_letter, grade_code, grade_percent, gpa_points, credit_hours_earned, potential_credit_hours, gpa_added_value, exclude_from_gpa, credit_type, grade_status, comment, grade_level, source_api, source_updated_date, external_key, external_id, external_key_hash, external_source) VALUES
  (sophia_rodriguez_student_id, english_12a_section_id, q1_2425_term_id, english_12a_course_id, 'A', 'Q1', 94.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '12', 'StoredGrades', '2024-10-20', 'GRADE_SOPHIA_ENG12A_Q1_2425', 'G_SOPHIA_ENG12A_Q1_2425', encode(digest('GRADE_SOPHIA_ENG12A_Q1_2425', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_12a_section_id, q2_2425_term_id, english_12a_course_id, 'A', 'Q2', 98.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '12', 'StoredGrades', '2024-12-22', 'GRADE_SOPHIA_ENG12A_Q2_2425', 'G_SOPHIA_ENG12A_Q2_2425', encode(digest('GRADE_SOPHIA_ENG12A_Q2_2425', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_12a_section_id, s1_2425_term_id, english_12a_course_id, 'A', 'S1', 96.00, 4.00, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '12', 'StoredGrades', '2024-12-22', 'GRADE_SOPHIA_ENG12A_S1_2425', 'G_SOPHIA_ENG12A_S1_2425', encode(digest('GRADE_SOPHIA_ENG12A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_12b_section_id, q3_2425_term_id, english_12b_course_id, 'A', 'Q3', 96.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '12', 'StoredGrades', '2025-03-16', 'GRADE_SOPHIA_ENG12B_Q3_2425', 'G_SOPHIA_ENG12B_Q3_2425', encode(digest('GRADE_SOPHIA_ENG12B_Q3_2425', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_12b_section_id, q4_2425_term_id, english_12b_course_id, 'A', 'Q4', 98.00, 4.00, 0.5, 0.5, 0, false, 'English', 'Final', NULL, '12', 'StoredGrades', '2025-05-25', 'GRADE_SOPHIA_ENG12B_Q4_2425', 'G_SOPHIA_ENG12B_Q4_2425', encode(digest('GRADE_SOPHIA_ENG12B_Q4_2425', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, english_12b_section_id, s2_2425_term_id, english_12b_course_id, 'A', 'S2', 97.00, 4.00, 1.0, 1.0, 0, false, 'English', 'Final', NULL, '12', 'StoredGrades', '2025-05-25', 'GRADE_SOPHIA_ENG12B_S2_2425', 'G_SOPHIA_ENG12B_S2_2425', encode(digest('GRADE_SOPHIA_ENG12B_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, govt12a_section_id, q1_2425_term_id, govt_12a_course_id, 'A-', 'Q1', 90.00, 3.70, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '12', 'StoredGrades', '2024-10-20', 'GRADE_SOPHIA_GOVT12A_Q1_2425', 'G_SOPHIA_GOVT12A_Q1_2425', encode(digest('GRADE_SOPHIA_GOVT12A_Q1_2425', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, govt12a_section_id, q2_2425_term_id, govt_12a_course_id, 'A', 'Q2', 94.00, 4.00, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '12', 'StoredGrades', '2024-12-22', 'GRADE_SOPHIA_GOVT12A_Q2_2425', 'G_SOPHIA_GOVT12A_Q2_2425', encode(digest('GRADE_SOPHIA_GOVT12A_Q2_2425', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, govt12a_section_id, s1_2425_term_id, govt_12a_course_id, 'A-', 'S1', 92.00, 3.70, 1.0, 1.0, 0, false, 'History', 'Final', NULL, '12', 'StoredGrades', '2024-12-22', 'GRADE_SOPHIA_GOVT12A_S1_2425', 'G_SOPHIA_GOVT12A_S1_2425', encode(digest('GRADE_SOPHIA_GOVT12A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, govt12b_section_id, q3_2425_term_id, govt_12b_course_id, 'A', 'Q3', 95.00, 4.00, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '12', 'StoredGrades', '2025-03-16', 'GRADE_SOPHIA_GOVT12B_Q3_2425', 'G_SOPHIA_GOVT12B_Q3_2425', encode(digest('GRADE_SOPHIA_GOVT12B_Q3_2425', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, govt12b_section_id, q4_2425_term_id, govt_12b_course_id, 'A', 'Q4', 93.00, 4.00, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '12', 'StoredGrades', '2025-05-25', 'GRADE_SOPHIA_GOVT12B_Q4_2425', 'G_SOPHIA_GOVT12B_Q4_2425', encode(digest('GRADE_SOPHIA_GOVT12B_Q4_2425', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, govt12b_section_id, s2_2425_term_id, govt_12b_course_id, 'A', 'S2', 94.00, 4.00, 1.0, 1.0, 0, false, 'History', 'Final', NULL, '12', 'StoredGrades', '2025-05-25', 'GRADE_SOPHIA_GOVT12B_S2_2425', 'G_SOPHIA_GOVT12B_S2_2425', encode(digest('GRADE_SOPHIA_GOVT12B_S2_2425', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, econ12a_section_id, q1_2425_term_id, econ_12a_course_id, 'B+', 'Q1', 87.00, 3.30, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '12', 'StoredGrades', '2024-10-20', 'GRADE_SOPHIA_ECON12A_Q1_2425', 'G_SOPHIA_ECON12A_Q1_2425', encode(digest('GRADE_SOPHIA_ECON12A_Q1_2425', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, econ12a_section_id, q2_2425_term_id, econ_12a_course_id, 'B+', 'Q2', 89.00, 3.30, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '12', 'StoredGrades', '2024-12-22', 'GRADE_SOPHIA_ECON12A_Q2_2425', 'G_SOPHIA_ECON12A_Q2_2425', encode(digest('GRADE_SOPHIA_ECON12A_Q2_2425', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, econ12a_section_id, s1_2425_term_id, econ_12a_course_id, 'B+', 'S1', 88.00, 3.30, 1.0, 1.0, 0, false, 'History', 'Final', NULL, '12', 'StoredGrades', '2024-12-22', 'GRADE_SOPHIA_ECON12A_S1_2425', 'G_SOPHIA_ECON12A_S1_2425', encode(digest('GRADE_SOPHIA_ECON12A_S1_2425', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, econ12b_section_id, q3_2425_term_id, econ_12b_course_id, 'A-', 'Q3', 91.00, 3.70, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '12', 'StoredGrades', '2025-03-16', 'GRADE_SOPHIA_ECON12B_Q3_2425', 'G_SOPHIA_ECON12B_Q3_2425', encode(digest('GRADE_SOPHIA_ECON12B_Q3_2425', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, econ12b_section_id, q4_2425_term_id, econ_12b_course_id, 'A', 'Q4', 95.00, 4.00, 0.5, 0.5, 0, false, 'History', 'Final', NULL, '12', 'StoredGrades', '2025-05-25', 'GRADE_SOPHIA_ECON12B_Q4_2425', 'G_SOPHIA_ECON12B_Q4_2425', encode(digest('GRADE_SOPHIA_ECON12B_Q4_2425', 'sha256'), 'hex'), 'mock_source'),
  (sophia_rodriguez_student_id, econ12b_section_id, s2_2425_term_id, econ_12b_course_id, 'A', 'S2', 93.00, 4.00, 1.0, 1.0, 0, false, 'History', 'Final', NULL, '12', 'StoredGrades', '2025-05-25', 'GRADE_SOPHIA_ECON12B_S2_2425', 'G_SOPHIA_ECON12B_S2_2425', encode(digest('GRADE_SOPHIA_ECON12B_S2_2425', 'sha256'), 'hex'), 'mock_source');

END $$;