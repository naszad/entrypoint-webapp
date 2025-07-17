-- !!!                                                                                           !!!
-- !!!            DO NOT EVER ACCIDENTALLY RUN THIS FILE IN YOUR PRODUCTION DATABASE             !!!
-- !!!    This is meant for running locally to seed your database for contributing purposes      !!!

-- Seed Terms

DO $$
DECLARE
  lincoln_hs_id uuid;
  year_34_id uuid;
  year_33_id uuid;
BEGIN
  SELECT school_id INTO lincoln_hs_id FROM schools WHERE name = 'Lincoln High School' LIMIT 1;
  SELECT year_id INTO year_34_id FROM years WHERE year_external_id = '34' LIMIT 1;
  SELECT year_id INTO year_33_id FROM years WHERE year_external_id = '33' LIMIT 1;


  INSERT INTO terms (
    term_id, school_id, start_date, end_date, abbreviation, year_id,
    external_id, external_name, external_key, external_key_hash, external_source
  ) VALUES
  (
    gen_random_uuid(), lincoln_hs_id, '2024-08-15', '2024-10-18', 'Q1', year_34_id,
    'TERM_Q1_2425_LHS', 'Quarter 1 2024-2025', 'LHS_Q1_2425', encode(digest('LHS_Q1_2425', 'sha256'), 'hex'), 'mock_source'
  ),
  (
    gen_random_uuid(), lincoln_hs_id, '2024-10-21', '2024-12-20', 'Q2', year_34_id,
    'TERM_Q2_2425_LHS', 'Quarter 2 2024-2025', 'LHS_Q2_2425', encode(digest('LHS_Q2_2425', 'sha256'), 'hex'), 'mock_source'
  ),
  (
    gen_random_uuid(), lincoln_hs_id, '2025-01-06', '2025-03-14', 'Q3', year_34_id,
    'TERM_Q3_2425_LHS', 'Quarter 3 2024-2025', 'LHS_Q3_2425', encode(digest('LHS_Q3_2425', 'sha256'), 'hex'), 'mock_source'
  ),
  (
    gen_random_uuid(), lincoln_hs_id, '2025-03-17', '2025-05-23', 'Q4', year_34_id,
    'TERM_Q4_2425_LHS', 'Quarter 4 2024-2025', 'LHS_Q4_2425', encode(digest('LHS_Q4_2425', 'sha256'), 'hex'), 'mock_source'
  );

  INSERT INTO terms (
    term_id, school_id, start_date, end_date, abbreviation, year_id,
    external_id, external_name, external_key, external_key_hash, external_source
  ) VALUES
  (
    gen_random_uuid(), lincoln_hs_id, '2023-08-15', '2023-10-18', 'Q1', year_33_id,
    'TERM_Q1_2324_LHS', 'Quarter 1 2023-2024', 'LHS_Q1_2324', encode(digest('LHS_Q1_2324', 'sha256'), 'hex'), 'mock_source'
  ),
  (
    gen_random_uuid(), lincoln_hs_id, '2023-10-21', '2023-12-20', 'Q2', year_33_id,
    'TERM_Q2_2324_LHS', 'Quarter 2 2023-2024', 'LHS_Q2_2324', encode(digest('LHS_Q2_2324', 'sha256'), 'hex'), 'mock_source'
  ),
  (
    gen_random_uuid(), lincoln_hs_id, '2024-01-06', '2024-03-14', 'Q3', year_33_id,
    'TERM_Q3_2324_LHS', 'Quarter 3 2023-2024', 'LHS_Q3_2324', encode(digest('LHS_Q3_2324', 'sha256'), 'hex'), 'mock_source'
  ),
  (
    gen_random_uuid(), lincoln_hs_id, '2024-03-17', '2024-05-23', 'Q4', year_33_id,
    'TERM_Q4_2324_LHS', 'Quarter 4 2023-2024', 'LHS_Q4_2324', encode(digest('LHS_Q4_2324', 'sha256'), 'hex'), 'mock_source'
  );

  INSERT INTO terms (
    term_id, school_id, start_date, end_date, abbreviation, year_id,
    external_id, external_name, external_key, external_key_hash, external_source
  ) VALUES
  (
    gen_random_uuid(), lincoln_hs_id, '2024-08-15', '2024-12-20', 'S1', year_34_id,
    'TERM_S1_2425_LHS', 'Semester 1 2024-2025', 'LHS_S1_2425', encode(digest('LHS_S1_2425', 'sha256'), 'hex'), 'mock_source'
  ),
  (
    gen_random_uuid(), lincoln_hs_id, '2025-01-06', '2025-05-23', 'S2', year_34_id,
    'TERM_S2_2425_LHS', 'Semester 2 2024-2025', 'LHS_S2_2425', encode(digest('LHS_S2_2425', 'sha256'), 'hex'), 'mock_source'
  );

  INSERT INTO terms (
    term_id, school_id, start_date, end_date, abbreviation, year_id,
    external_id, external_name, external_key, external_key_hash, external_source
  ) VALUES
  (
    gen_random_uuid(), lincoln_hs_id, '2023-08-15', '2023-12-20', 'S1', year_33_id,
    'TERM_S1_2324_LHS', 'Semester 1 2023-2024', 'LHS_S1_2324', encode(digest('LHS_S1_2324', 'sha256'), 'hex'), 'mock_source'
  ),
  (
    gen_random_uuid(), lincoln_hs_id, '2024-01-06', '2024-05-23', 'S2', year_33_id,
    'TERM_S2_2324_LHS', 'Semester 2 2023-2024', 'LHS_S2_2324', encode(digest('LHS_S2_2324', 'sha256'), 'hex'), 'mock_source'
  );
END $$;

-- Seed Courses

DO $$
DECLARE
  lincoln_hs_id uuid;
BEGIN
  SELECT school_id INTO lincoln_hs_id FROM schools WHERE name = 'Lincoln High School' LIMIT 1;

  INSERT INTO courses (
    course_id, school_id, name, local_course_code, state_course_code,
    external_key, external_id, external_key_hash, external_source, external_name
  ) VALUES
  (
    gen_random_uuid(), lincoln_hs_id, 'English 10 A', 'ENG10A', 'ST_ENG10A',
    'COURSE_ENG10A_LHS', 'C_ENG10A', encode(digest('COURSE_ENG10A_LHS', 'sha256'), 'hex'), 'mock_source', 'English Grade 10 A'
  ),
  (
    gen_random_uuid(), lincoln_hs_id, 'English 10 B', 'ENG10B', 'ST_ENG10B',
    'COURSE_ENG10B_LHS', 'C_ENG10B', encode(digest('COURSE_ENG10B_LHS', 'sha256'), 'hex'), 'mock_source', 'English Grade 10 B'
  ),
  (
    gen_random_uuid(), lincoln_hs_id, 'Algebra I A', 'ALG1A', 'ST_ALG1A',
    'COURSE_ALG1A_LHS', 'C_ALG1A', encode(digest('COURSE_ALG1A_LHS', 'sha256'), 'hex'), 'mock_source', 'Algebra I A'
  ),
  (
    gen_random_uuid(), lincoln_hs_id, 'Algebra I B', 'ALG1B', 'ST_ALG1B',
    'COURSE_ALG1B_LHS', 'C_ALG1B', encode(digest('COURSE_ALG1B_LHS', 'sha256'), 'hex'), 'mock_source', 'Algebra I B'
  ),
  (
    gen_random_uuid(), lincoln_hs_id, 'US History A', 'USHISTA', 'ST_USHISTA',
    'COURSE_USHISTA_LHS', 'C_USHISTA', encode(digest('COURSE_USHISTA_LHS', 'sha256'), 'hex'), 'mock_source', 'United States History A'
  ),
  (
    gen_random_uuid(), lincoln_hs_id, 'US History B', 'USHISTB', 'ST_USHISTB',
    'COURSE_USHISTB_LHS', 'C_USHISTB', encode(digest('COURSE_USHISTB_LHS', 'sha256'), 'hex'), 'mock_source', 'United States History B'
  ),
  (
    gen_random_uuid(), lincoln_hs_id, 'Biology A', 'BIO1A', 'ST_BIO1A',
    'COURSE_BIO1A_LHS', 'C_BIO1A', encode(digest('COURSE_BIO1A_LHS', 'sha256'), 'hex'), 'mock_source', 'Biology I A'
  ),
  (
    gen_random_uuid(), lincoln_hs_id, 'Biology B', 'BIO1B', 'ST_BIO1B',
    'COURSE_BIO1B_LHS', 'C_BIO1B', encode(digest('COURSE_BIO1B_LHS', 'sha256'), 'hex'), 'mock_source', 'Biology I B'
  ),
  (
    gen_random_uuid(), lincoln_hs_id, 'English 11 A', 'ENG11A', 'ST_ENG11A',
    'COURSE_ENG11A_LHS', 'C_ENG11A', encode(digest('COURSE_ENG11A_LHS', 'sha256'), 'hex'), 'mock_source', 'English Grade 11 A'
  ),
  (
    gen_random_uuid(), lincoln_hs_id, 'English 11 B', 'ENG11B', 'ST_ENG11B',
    'COURSE_ENG11B_LHS', 'C_ENG11B', encode(digest('COURSE_ENG11B_LHS', 'sha256'), 'hex'), 'mock_source', 'English Grade 11 B'
  ),
  (
    gen_random_uuid(), lincoln_hs_id, 'English 12 A', 'ENG12A', 'ST_ENG12A',
    'COURSE_ENG12A_LHS', 'C_ENG12A', encode(digest('COURSE_ENG12A_LHS', 'sha256'), 'hex'), 'mock_source', 'English Grade 12 A'
  ),
  (
    gen_random_uuid(), lincoln_hs_id, 'English 12 B', 'ENG12B', 'ST_ENG12B',
    'COURSE_ENG12B_LHS', 'C_ENG12B', encode(digest('COURSE_ENG12B_LHS', 'sha256'), 'hex'), 'mock_source', 'English Grade 12 B'
  );
END $$;

-- Seed Sections

DO $$
DECLARE
  lincoln_hs_id uuid;
  eng10a_course_id uuid;
  eng10b_course_id uuid;
  alg1a_course_id uuid;
  alg1b_course_id uuid;
  ushista_course_id uuid;
  ushistb_course_id uuid;
  bio1a_course_id uuid;
  bio1b_course_id uuid;
  eng11a_course_id uuid;
  eng11b_course_id uuid;
  eng12a_course_id uuid;
  eng12b_course_id uuid;
BEGIN
  SELECT school_id INTO lincoln_hs_id FROM schools WHERE name = 'Lincoln High School' LIMIT 1;
  SELECT course_id INTO eng10a_course_id FROM courses WHERE name = 'English 10 A' AND school_id = lincoln_hs_id LIMIT 1;
  SELECT course_id INTO eng10b_course_id FROM courses WHERE name = 'English 10 B' AND school_id = lincoln_hs_id LIMIT 1;
  SELECT course_id INTO alg1a_course_id FROM courses WHERE name = 'Algebra I A' AND school_id = lincoln_hs_id LIMIT 1;
  SELECT course_id INTO alg1b_course_id FROM courses WHERE name = 'Algebra I B' AND school_id = lincoln_hs_id LIMIT 1;
  SELECT course_id INTO ushista_course_id FROM courses WHERE name = 'US History A' AND school_id = lincoln_hs_id LIMIT 1;
  SELECT course_id INTO ushistb_course_id FROM courses WHERE name = 'US History B' AND school_id = lincoln_hs_id LIMIT 1;
  SELECT course_id INTO bio1a_course_id FROM courses WHERE name = 'Biology A' AND school_id = lincoln_hs_id LIMIT 1;
  SELECT course_id INTO bio1b_course_id FROM courses WHERE name = 'Biology B' AND school_id = lincoln_hs_id LIMIT 1;
  SELECT course_id INTO eng11a_course_id FROM courses WHERE name = 'English 11 A' AND school_id = lincoln_hs_id LIMIT 1;
  SELECT course_id INTO eng11b_course_id FROM courses WHERE name = 'English 11 B' AND school_id = lincoln_hs_id LIMIT 1;
  SELECT course_id INTO eng12a_course_id FROM courses WHERE name = 'English 12 A' AND school_id = lincoln_hs_id LIMIT 1;
  SELECT course_id INTO eng12b_course_id FROM courses WHERE name = 'English 12 B' AND school_id = lincoln_hs_id LIMIT 1;

  -- Sections for English 10A
  INSERT INTO sections (
    section_id, course_id, no_of_students, section_number, course_number, grade_level,
    external_key, external_id, external_key_hash, external_source
  ) VALUES
  (
    gen_random_uuid(), eng10a_course_id, 25, 101, (SELECT local_course_code FROM courses WHERE course_id = eng10a_course_id), 10,
    'SEC_ENG10A_101_LHS', 'S_ENG10A_101', encode(digest('SEC_ENG10A_101_LHS', 'sha256'), 'hex'), 'mock_source'
  );

  -- Sections for English 10B
  INSERT INTO sections (
    section_id, course_id, no_of_students, section_number, course_number, grade_level,
    external_key, external_id, external_key_hash, external_source
  ) VALUES
  (
    gen_random_uuid(), eng10b_course_id, 25, 102, (SELECT local_course_code FROM courses WHERE course_id = eng10b_course_id), 10,
    'SEC_ENG10B_102_LHS', 'S_ENG10B_102', encode(digest('SEC_ENG10B_102_LHS', 'sha256'), 'hex'), 'mock_source'
  );

  -- Sections for Algebra I A
  INSERT INTO sections (
    section_id, course_id, no_of_students, section_number, course_number, grade_level,
    external_key, external_id, external_key_hash, external_source
  ) VALUES
  (
    gen_random_uuid(), alg1a_course_id, 28, 201, (SELECT local_course_code FROM courses WHERE course_id = alg1a_course_id), 10, -- Common for 9th or 10th
    'SEC_ALG1A_201_LHS', 'S_ALG1A_201', encode(digest('SEC_ALG1A_201_LHS', 'sha256'), 'hex'), 'mock_source'
  );

  -- Sections for Algebra I B
  INSERT INTO sections (
    section_id, course_id, no_of_students, section_number, course_number, grade_level,
    external_key, external_id, external_key_hash, external_source
  ) VALUES
  (
    gen_random_uuid(), alg1b_course_id, 28, 202, (SELECT local_course_code FROM courses WHERE course_id = alg1b_course_id), 10, -- Common for 9th or 10th
    'SEC_ALG1B_202_LHS', 'S_ALG1B_202', encode(digest('SEC_ALG1B_202_LHS', 'sha256'), 'hex'), 'mock_source'
  );

  -- Sections for US History A
  INSERT INTO sections (
    section_id, course_id, no_of_students, section_number, course_number, grade_level,
    external_key, external_id, external_key_hash, external_source
  ) VALUES
  (
    gen_random_uuid(), ushista_course_id, 30, 301, (SELECT local_course_code FROM courses WHERE course_id = ushista_course_id), 11,
    'SEC_USHISTA_301_LHS', 'S_USHISTA_301', encode(digest('SEC_USHISTA_301_LHS', 'sha256'), 'hex'), 'mock_source'
  );

  -- Sections for US History B
  INSERT INTO sections (
    section_id, course_id, no_of_students, section_number, course_number, grade_level,
    external_key, external_id, external_key_hash, external_source
  ) VALUES
  (
    gen_random_uuid(), ushistb_course_id, 30, 302, (SELECT local_course_code FROM courses WHERE course_id = ushistb_course_id), 11,
    'SEC_USHISTB_302_LHS', 'S_USHISTB_302', encode(digest('SEC_USHISTB_302_LHS', 'sha256'), 'hex'), 'mock_source'
  );

  -- Sections for Biology A
  INSERT INTO sections (
    section_id, course_id, no_of_students, section_number, course_number, grade_level,
    external_key, external_id, external_key_hash, external_source
  ) VALUES
  (
    gen_random_uuid(), bio1a_course_id, 26, 401, (SELECT local_course_code FROM courses WHERE course_id = bio1a_course_id), 10,
    'SEC_BIO1A_401_LHS', 'S_BIO1A_401', encode(digest('SEC_BIO1A_401_LHS', 'sha256'), 'hex'), 'mock_source'
  );

  -- Sections for Biology B
  INSERT INTO sections (
    section_id, course_id, no_of_students, section_number, course_number, grade_level,
    external_key, external_id, external_key_hash, external_source
  ) VALUES
  (
    gen_random_uuid(), bio1b_course_id, 26, 402, (SELECT local_course_code FROM courses WHERE course_id = bio1b_course_id), 10,
    'SEC_BIO1B_402_LHS', 'S_BIO1B_402', encode(digest('SEC_BIO1B_402_LHS', 'sha256'), 'hex'), 'mock_source'
  );

    -- Sections for English 11 A
  INSERT INTO sections (
    section_id, course_id, no_of_students, section_number, course_number, grade_level,
    external_key, external_id, external_key_hash, external_source
  ) VALUES
  (
    gen_random_uuid(), eng11a_course_id, 25, 102, (SELECT local_course_code FROM courses WHERE course_id = eng11a_course_id), 11,
    'SEC_ENG11A_102_LHS', 'S_ENG11A_102', encode(digest('SEC_ENG11A_102_LHS', 'sha256'), 'hex'), 'mock_source'
  );

    -- Sections for English 11 B
  INSERT INTO sections (
    section_id, course_id, no_of_students, section_number, course_number, grade_level,
    external_key, external_id, external_key_hash, external_source
  ) VALUES
  (
    gen_random_uuid(), eng11b_course_id, 25, 103, (SELECT local_course_code FROM courses WHERE course_id = eng11b_course_id), 11,
    'SEC_ENG11B_103_LHS', 'S_ENG11B_103', encode(digest('SEC_ENG11B_103_LHS', 'sha256'), 'hex'), 'mock_source'
  );

    -- Sections for English 12 A
  INSERT INTO sections (
    section_id, course_id, no_of_students, section_number, course_number, grade_level,
    external_key, external_id, external_key_hash, external_source
  ) VALUES
  (
    gen_random_uuid(), eng12a_course_id, 25, 104, (SELECT local_course_code FROM courses WHERE course_id = eng12a_course_id), 12,
    'SEC_ENG12A_104_LHS', 'S_ENG12A_104', encode(digest('SEC_ENG12A_104_LHS', 'sha256'), 'hex'), 'mock_source'
  );

    -- Sections for English 12 B
  INSERT INTO sections (
    section_id, course_id, no_of_students, section_number, course_number, grade_level,
    external_key, external_id, external_key_hash, external_source
  ) VALUES
  (
    gen_random_uuid(), eng12b_course_id, 25, 105, (SELECT local_course_code FROM courses WHERE course_id = eng12b_course_id), 12,
    'SEC_ENG12B_105_LHS', 'S_ENG12B_105', encode(digest('SEC_ENG12B_105_LHS', 'sha256'), 'hex'), 'mock_source'
  );
END $$;