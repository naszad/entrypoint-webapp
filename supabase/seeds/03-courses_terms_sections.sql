-- !!!                                                                                           !!!
-- !!!            DO NOT EVER ACCIDENTALLY RUN THIS FILE IN YOUR PRODUCTION DATABASE             !!!
-- !!!    This is meant for running locally to seed your database for contributing purposes      !!!

-- Seed Terms

DO $$
DECLARE
  lincoln_hs_id uuid;
  year_34_id uuid;
BEGIN
  SELECT school_id INTO lincoln_hs_id FROM schools WHERE name = 'Lincoln High School' LIMIT 1;
  SELECT year_id INTO year_34_id FROM years WHERE year_external_id = '34' LIMIT 1;


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
    gen_random_uuid(), lincoln_hs_id, 'English 10', 'ENG10', 'ST_ENG10',
    'COURSE_ENG10_LHS', 'C_ENG10', encode(digest('COURSE_ENG10_LHS', 'sha256'), 'hex'), 'mock_source', 'English Grade 10'
  ),
  (
    gen_random_uuid(), lincoln_hs_id, 'Algebra I', 'ALG1', 'ST_ALG1',
    'COURSE_ALG1_LHS', 'C_ALG1', encode(digest('COURSE_ALG1_LHS', 'sha256'), 'hex'), 'mock_source', 'Algebra I'
  ),
  (
    gen_random_uuid(), lincoln_hs_id, 'US History', 'USHIST', 'ST_USHIST',
    'COURSE_USHIST_LHS', 'C_USHIST', encode(digest('COURSE_USHIST_LHS', 'sha256'), 'hex'), 'mock_source', 'United States History'
  ),
  (
    gen_random_uuid(), lincoln_hs_id, 'Biology', 'BIO1', 'ST_BIO1',
    'COURSE_BIO1_LHS', 'C_BIO1', encode(digest('COURSE_BIO1_LHS', 'sha256'), 'hex'), 'mock_source', 'Biology I'
  ),
  (
    gen_random_uuid(), lincoln_hs_id, 'English 11', 'ENG11', 'ST_ENG11',
    'COURSE_ENG11_LHS', 'C_ENG11', encode(digest('COURSE_ENG11_LHS', 'sha256'), 'hex'), 'mock_source', 'English Grade 11'
  ),
  (
    gen_random_uuid(), lincoln_hs_id, 'English 12', 'ENG12', 'ST_ENG12',
    'COURSE_ENG12_LHS', 'C_ENG12', encode(digest('COURSE_ENG12_LHS', 'sha256'), 'hex'), 'mock_source', 'English Grade 12'
  );
END $$;

-- Seed Sections

DO $$
DECLARE
  lincoln_hs_id uuid;
  eng10_course_id uuid;
  alg1_course_id uuid;
  ushist_course_id uuid;
  bio1_course_id uuid;
  eng11_course_id uuid;
  eng12_course_id uuid;
BEGIN
  SELECT school_id INTO lincoln_hs_id FROM schools WHERE name = 'Lincoln High School' LIMIT 1;
  SELECT course_id INTO eng10_course_id FROM courses WHERE name = 'English 10' AND school_id = lincoln_hs_id LIMIT 1;
  SELECT course_id INTO alg1_course_id FROM courses WHERE name = 'Algebra I' AND school_id = lincoln_hs_id LIMIT 1;
  SELECT course_id INTO ushist_course_id FROM courses WHERE name = 'US History' AND school_id = lincoln_hs_id LIMIT 1;
  SELECT course_id INTO bio1_course_id FROM courses WHERE name = 'Biology' AND school_id = lincoln_hs_id LIMIT 1;
  SELECT course_id INTO eng11_course_id FROM courses WHERE name = 'English 11' AND school_id = lincoln_hs_id LIMIT 1;
  SELECT course_id INTO eng12_course_id FROM courses WHERE name = 'English 12' AND school_id = lincoln_hs_id LIMIT 1;

  -- Sections for English 10
  INSERT INTO sections (
    section_id, course_id, no_of_students, section_number, course_number, grade_level,
    external_key, external_id, external_key_hash, external_source
  ) VALUES
  (
    gen_random_uuid(), eng10_course_id, 25, 101, (SELECT local_course_code FROM courses WHERE course_id = eng10_course_id), 10,
    'SEC_ENG10_101_LHS', 'S_ENG10_101', encode(digest('SEC_ENG10_101_LHS', 'sha256'), 'hex'), 'mock_source'
  );

  -- Sections for Algebra I
  INSERT INTO sections (
    section_id, course_id, no_of_students, section_number, course_number, grade_level,
    external_key, external_id, external_key_hash, external_source
  ) VALUES
  (
    gen_random_uuid(), alg1_course_id, 28, 201, (SELECT local_course_code FROM courses WHERE course_id = alg1_course_id), 10, -- Common for 9th or 10th
    'SEC_ALG1_201_LHS', 'S_ALG1_201', encode(digest('SEC_ALG1_201_LHS', 'sha256'), 'hex'), 'mock_source'
  );

  -- Sections for US History
  INSERT INTO sections (
    section_id, course_id, no_of_students, section_number, course_number, grade_level,
    external_key, external_id, external_key_hash, external_source
  ) VALUES
  (
    gen_random_uuid(), ushist_course_id, 30, 301, (SELECT local_course_code FROM courses WHERE course_id = ushist_course_id), 11,
    'SEC_USHIST_301_LHS', 'S_USHIST_301', encode(digest('SEC_USHIST_301_LHS', 'sha256'), 'hex'), 'mock_source'
  );

  -- Sections for Biology
  INSERT INTO sections (
    section_id, course_id, no_of_students, section_number, course_number, grade_level,
    external_key, external_id, external_key_hash, external_source
  ) VALUES
  (
    gen_random_uuid(), bio1_course_id, 26, 401, (SELECT local_course_code FROM courses WHERE course_id = bio1_course_id), 10,
    'SEC_BIO1_401_LHS', 'S_BIO1_401', encode(digest('SEC_BIO1_401_LHS', 'sha256'), 'hex'), 'mock_source'
  );

    -- Sections for English 11
  INSERT INTO sections (
    section_id, course_id, no_of_students, section_number, course_number, grade_level,
    external_key, external_id, external_key_hash, external_source
  ) VALUES
  (
    gen_random_uuid(), eng11_course_id, 25, 102, (SELECT local_course_code FROM courses WHERE course_id = eng11_course_id), 11,
    'SEC_ENG11_102_LHS', 'S_ENG11_102', encode(digest('SEC_ENG11_102_LHS', 'sha256'), 'hex'), 'mock_source'
  );

    -- Sections for English 12
  INSERT INTO sections (
    section_id, course_id, no_of_students, section_number, course_number, grade_level,
    external_key, external_id, external_key_hash, external_source
  ) VALUES
  (
    gen_random_uuid(), eng12_course_id, 25, 103, (SELECT local_course_code FROM courses WHERE course_id = eng12_course_id), 12,
    'SEC_ENG12_103_LHS', 'S_ENG12_103', encode(digest('SEC_ENG12_103_LHS', 'sha256'), 'hex'), 'mock_source'
  );
END $$;