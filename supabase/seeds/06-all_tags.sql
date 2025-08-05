-- !!!                                                                                           !!!
-- !!!            DO NOT EVER ACCIDENTALLY RUN THIS FILE IN YOUR PRODUCTION DATABASE             !!!
-- !!!    This is meant for running locally to seed your database for contributing purposes      !!!

DO $$
DECLARE

  mock_user_id uuid;
  lincoln_customer_id uuid;
  emma_johnson_student_id uuid;
  michael_chen_student_id uuid;
  sophia_rodriguez_student_id uuid;
  noah_miller_student_id uuid;
  lucas_martinez_student_id uuid;
  charlotte_davis_student_id uuid;
  benjamin_wilson_student_id uuid;
  amelia_taylor_student_id uuid;
  ethan_anderson_student_id uuid;

  -- Tag Category IDs
  goals_category_id uuid;
  athletics_category_id uuid;
  medical_category_id uuid;
  hobbies_category_id uuid;
  academics_category_id uuid;

  -- Tag IDs
  target_college_tag_id uuid;
  career_interest_tag_id uuid;
  plays_sport_tag_id uuid;
  allergy_tag_id uuid;
  graduation_track_tag_id uuid;
  instrument_played_tag_id uuid;

  -- Tag Canonical Value IDs
  purdue_canonical_id uuid;
  mit_canonical_id uuid;
  iu_canonical_id uuid;
  notre_dame_canonical_id uuid;
  computer_science_canonical_id uuid;
  engineering_canonical_id uuid;
  medicine_canonical_id uuid;
  baseball_canonical_id uuid;
  tennis_canonical_id uuid;
  football_canonical_id uuid;
  peanut_canonical_id uuid;
  soy_canonical_id uuid;
  academic_honors_canonical_id uuid;
  guitar_canonical_id uuid;
  piano_canonical_id uuid;
  violin_canonical_id uuid;

BEGIN

  -- Ensure a mock user exists to be the creator of tags
  INSERT INTO users (user_id, auth_user_id, first_name, last_name, email)
  VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Mock', 'User', 'mock.user@entrypoint.edu')
  ON CONFLICT (email) DO NOTHING;
  SELECT user_id INTO mock_user_id FROM users WHERE email = 'mock.user@entrypoint.edu' LIMIT 1;
  
  SELECT customer_id INTO lincoln_customer_id FROM customers WHERE name = 'Lincoln Township District' LIMIT 1;

  SELECT student_id INTO emma_johnson_student_id FROM students WHERE email = 'emma.johnson@student.edu' LIMIT 1;
  SELECT student_id INTO michael_chen_student_id FROM students WHERE email = 'michael.chen@student.edu' LIMIT 1;
  SELECT student_id INTO sophia_rodriguez_student_id FROM students WHERE email = 'sophia.rodriguez@student.edu' LIMIT 1;
  SELECT student_id INTO noah_miller_student_id FROM students WHERE email = 'noah.miller@student.edu' LIMIT 1;
  SELECT student_id INTO lucas_martinez_student_id FROM students WHERE email = 'lucas.martinez@student.edu' LIMIT 1;
  SELECT student_id INTO charlotte_davis_student_id FROM students WHERE email = 'charlotte.davis@student.edu' LIMIT 1;
  SELECT student_id INTO benjamin_wilson_student_id FROM students WHERE email = 'benjamin.wilson@student.edu' LIMIT 1;
  SELECT student_id INTO amelia_taylor_student_id FROM students WHERE email = 'amelia.taylor@student.edu' LIMIT 1;
  SELECT student_id INTO ethan_anderson_student_id FROM students WHERE email = 'ethan.anderson@student.edu' LIMIT 1;

  -- Seed Tag Categories

  INSERT INTO tag_categories (name) VALUES 
  ('Goals'), ('Athletics'), ('Medical'), ('Hobbies and Interests'), ('Academics')
  ON CONFLICT (name) DO NOTHING;

  SELECT tag_category_id INTO goals_category_id FROM tag_categories WHERE name = 'Goals' LIMIT 1;
  SELECT tag_category_id INTO athletics_category_id FROM tag_categories WHERE name = 'Athletics' LIMIT 1;
  SELECT tag_category_id INTO medical_category_id FROM tag_categories WHERE name = 'Medical' LIMIT 1;
  SELECT tag_category_id INTO hobbies_category_id FROM tag_categories WHERE name = 'Hobbies and Interests' LIMIT 1;
  SELECT tag_category_id INTO academics_category_id FROM tag_categories WHERE name = 'Academics' LIMIT 1;

  --Seed Tags (Tag Definitions)

  INSERT INTO tags (tag_category_id, customer_id, name, is_multi_value, created_by_user_id) VALUES
  (goals_category_id, lincoln_customer_id, 'Target College', true, mock_user_id),
  (goals_category_id, lincoln_customer_id, 'Career Interest', true, mock_user_id),
  (athletics_category_id, lincoln_customer_id, 'Plays Sport', true, mock_user_id),
  (medical_category_id, lincoln_customer_id, 'Allergy', true, mock_user_id),
  (hobbies_category_id, lincoln_customer_id, 'Instrument Played', true, mock_user_id),
  (academics_category_id, lincoln_customer_id, 'Graduation Track', false, mock_user_id)
  ON CONFLICT (tag_category_id, customer_id, name) DO NOTHING;

  SELECT tag_id INTO target_college_tag_id FROM tags WHERE name = 'Target College' AND customer_id = lincoln_customer_id LIMIT 1;
  SELECT tag_id INTO career_interest_tag_id FROM tags WHERE name = 'Career Interest' AND customer_id = lincoln_customer_id LIMIT 1;
  SELECT tag_id INTO plays_sport_tag_id FROM tags WHERE name = 'Plays Sport' AND customer_id = lincoln_customer_id LIMIT 1;
  SELECT tag_id INTO allergy_tag_id FROM tags WHERE name = 'Allergy' AND customer_id = lincoln_customer_id LIMIT 1;
  SELECT tag_id INTO instrument_played_tag_id FROM tags WHERE name = 'Instrument Played' AND customer_id = lincoln_customer_id LIMIT 1;
  SELECT tag_id INTO graduation_track_tag_id FROM tags WHERE name = 'Graduation Track' AND customer_id = lincoln_customer_id LIMIT 1;
  
  -- Seed Tag Canonical Values

  INSERT INTO tag_canonical_values (tag_id, value, created_by_user_id) VALUES

  (target_college_tag_id, 'Purdue University', mock_user_id),
  (target_college_tag_id, 'Massachusetts Institute of Technology', mock_user_id),
  (target_college_tag_id, 'Indiana University', mock_user_id),
  (target_college_tag_id, 'University of Notre Dame', mock_user_id),

  (career_interest_tag_id, 'Computer Science', mock_user_id),
  (career_interest_tag_id, 'Engineering', mock_user_id),
  (career_interest_tag_id, 'Medicine', mock_user_id),

  (plays_sport_tag_id, 'Baseball', mock_user_id),
  (plays_sport_tag_id, 'Tennis', mock_user_id),
  (plays_sport_tag_id, 'Football', mock_user_id),

  (allergy_tag_id, 'Peanut', mock_user_id),
  (allergy_tag_id, 'Soy', mock_user_id),

  (graduation_track_tag_id, 'Academic Honors', mock_user_id),

  (instrument_played_tag_id, 'Guitar', mock_user_id),
  (instrument_played_tag_id, 'Piano', mock_user_id),
  (instrument_played_tag_id, 'Violin', mock_user_id)
  ON CONFLICT (tag_id, value) DO NOTHING;
  
  SELECT tag_canonical_value_id INTO purdue_canonical_id FROM tag_canonical_values WHERE tag_id = target_college_tag_id AND value = 'Purdue University' LIMIT 1;
  SELECT tag_canonical_value_id INTO mit_canonical_id FROM tag_canonical_values WHERE tag_id = target_college_tag_id AND value = 'Massachusetts Institute of Technology' LIMIT 1;
  SELECT tag_canonical_value_id INTO iu_canonical_id FROM tag_canonical_values WHERE tag_id = target_college_tag_id AND value = 'Indiana University' LIMIT 1;
  SELECT tag_canonical_value_id INTO notre_dame_canonical_id FROM tag_canonical_values WHERE tag_id = target_college_tag_id AND value = 'University of Notre Dame' LIMIT 1;
  SELECT tag_canonical_value_id INTO computer_science_canonical_id FROM tag_canonical_values WHERE tag_id = career_interest_tag_id AND value = 'Computer Science' LIMIT 1;
  SELECT tag_canonical_value_id INTO engineering_canonical_id FROM tag_canonical_values WHERE tag_id = career_interest_tag_id AND value = 'Engineering' LIMIT 1;
  SELECT tag_canonical_value_id INTO medicine_canonical_id FROM tag_canonical_values WHERE tag_id = career_interest_tag_id AND value = 'Medicine' LIMIT 1;
  SELECT tag_canonical_value_id INTO baseball_canonical_id FROM tag_canonical_values WHERE tag_id = plays_sport_tag_id AND value = 'Baseball' LIMIT 1;
  SELECT tag_canonical_value_id INTO tennis_canonical_id FROM tag_canonical_values WHERE tag_id = plays_sport_tag_id AND value = 'Tennis' LIMIT 1;
  SELECT tag_canonical_value_id INTO football_canonical_id FROM tag_canonical_values WHERE tag_id = plays_sport_tag_id AND value = 'Football' LIMIT 1;
  SELECT tag_canonical_value_id INTO peanut_canonical_id FROM tag_canonical_values WHERE tag_id = allergy_tag_id AND value = 'Peanut' LIMIT 1;
  SELECT tag_canonical_value_id INTO soy_canonical_id FROM tag_canonical_values WHERE tag_id = allergy_tag_id AND value = 'Soy' LIMIT 1;
  SELECT tag_canonical_value_id INTO academic_honors_canonical_id FROM tag_canonical_values WHERE tag_id = graduation_track_tag_id AND value = 'Academic Honors' LIMIT 1;
  SELECT tag_canonical_value_id INTO guitar_canonical_id FROM tag_canonical_values WHERE tag_id = instrument_played_tag_id AND value = 'Guitar' LIMIT 1;
  SELECT tag_canonical_value_id INTO piano_canonical_id FROM tag_canonical_values WHERE tag_id = instrument_played_tag_id AND value = 'Piano' LIMIT 1;
  SELECT tag_canonical_value_id INTO violin_canonical_id FROM tag_canonical_values WHERE tag_id = instrument_played_tag_id AND value = 'Violin' LIMIT 1;

  -- Seed Student Tags

  -- Emma Johnson (11th Grade)
  INSERT INTO student_tags (student_id, tag_id, value, canonical_value_id, source, created_by_user_id) VALUES
  (emma_johnson_student_id, target_college_tag_id, 'Purdue', purdue_canonical_id, 'ai', mock_user_id),
  (emma_johnson_student_id, target_college_tag_id, 'MIT', mit_canonical_id, 'ai', mock_user_id),
  (emma_johnson_student_id, career_interest_tag_id, 'Computer Science', computer_science_canonical_id, 'ai', mock_user_id),
  (emma_johnson_student_id, plays_sport_tag_id, 'Tennis', tennis_canonical_id, 'manual', mock_user_id);
  
  -- Michael Chen (10th Grade)
  INSERT INTO student_tags (student_id, tag_id, value, canonical_value_id, source, created_by_user_id) VALUES
  (michael_chen_student_id, target_college_tag_id, 'Indiana University', iu_canonical_id, 'manual', mock_user_id),
  (michael_chen_student_id, career_interest_tag_id, 'Engineering', engineering_canonical_id, 'manual', mock_user_id),
  (michael_chen_student_id, plays_sport_tag_id, 'Baseball', baseball_canonical_id, 'manual', mock_user_id),
  (michael_chen_student_id, graduation_track_tag_id, 'Academic Honors', academic_honors_canonical_id, 'import', mock_user_id);

  --Sophia Rodriguez (12th Grade)
  INSERT INTO student_tags (student_id, tag_id, value, canonical_value_id, source, created_by_user_id) VALUES
  (sophia_rodriguez_student_id, target_college_tag_id, 'Notre Dame', notre_dame_canonical_id, 'manual', mock_user_id),
  (sophia_rodriguez_student_id, career_interest_tag_id, 'Medicine', medicine_canonical_id, 'manual', mock_user_id),
  (sophia_rodriguez_student_id, allergy_tag_id, 'Peanuts', peanut_canonical_id, 'import', mock_user_id);

  -- Noah Miller (12th Grade)
  INSERT INTO student_tags (student_id, tag_id, value, canonical_value_id, source, created_by_user_id) VALUES
  (noah_miller_student_id, plays_sport_tag_id, 'Football', football_canonical_id, 'manual', mock_user_id),
  (noah_miller_student_id, instrument_played_tag_id, 'Guitar', guitar_canonical_id, 'manual', mock_user_id);

  --Lucas Martinez (11th Grade)
  INSERT INTO student_tags (student_id, tag_id, value, canonical_value_id, source, created_by_user_id) VALUES
  (lucas_martinez_student_id, plays_sport_tag_id, 'Baseball', baseball_canonical_id, 'manual', mock_user_id),
  (lucas_martinez_student_id, allergy_tag_id, 'Soy', soy_canonical_id, 'import', mock_user_id);

  -- Charlotte Davis (11th Grade)
  INSERT INTO student_tags (student_id, tag_id, value, canonical_value_id, source, created_by_user_id) VALUES
  (charlotte_davis_student_id, target_college_tag_id, 'Purdue U.', purdue_canonical_id, 'manual', mock_user_id),
  (charlotte_davis_student_id, instrument_played_tag_id, 'Piano (Keyboard)', piano_canonical_id, 'ai', mock_user_id);

  -- Benjamin Wilson (10th Grade)
  INSERT INTO student_tags (student_id, tag_id, value, canonical_value_id, source, created_by_user_id) VALUES
  (benjamin_wilson_student_id, plays_sport_tag_id, 'Football', football_canonical_id, 'manual', mock_user_id),
  (benjamin_wilson_student_id, graduation_track_tag_id, 'Academic Honors', academic_honors_canonical_id, 'import', mock_user_id);

  -- Amelia Taylor (10th Grade)
  INSERT INTO student_tags (student_id, tag_id, value, canonical_value_id, source, created_by_user_id) VALUES
  (amelia_taylor_student_id, instrument_played_tag_id, 'Violin', violin_canonical_id, 'manual', mock_user_id);

  -- Ethan Anderson (9th Grade)
  INSERT INTO student_tags (student_id, tag_id, value, canonical_value_id, source, created_by_user_id) VALUES
  (ethan_anderson_student_id, career_interest_tag_id, 'Undecided', engineering_canonical_id, 'manual', mock_user_id); -- Example of non-matching value linked to a canonical for review
  
END $$;