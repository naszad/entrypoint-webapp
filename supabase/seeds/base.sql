-- !!!                                                                                           !!!
-- !!!            DO NOT EVER ACCIDENTALLY RUN THIS FILE IN YOUR PRODUCTION DATABASE             !!!
-- !!!    this is meant for running locally to seed your database for contributing purposes      !!!

-- create local users (insiders)
-- test@email.com / password
INSERT INTO auth.users ( instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) 
VALUES 
  ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'test@email.com', crypt('password', gen_salt('bf')), current_timestamp, current_timestamp, current_timestamp, '{"provider":"email","providers":["email"]}', '{}', current_timestamp, current_timestamp, '', '', '', '');


-- test user email identity
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES 
  (uuid_generate_v4(), (SELECT id FROM auth.users WHERE email = 'test@email.com'), format('{"sub":"%s","email":"%s"}', (SELECT id FROM auth.users WHERE email = 'test@email.com')::text, 'test@email.com')::jsonb, 'email', uuid_generate_v4(), current_timestamp, current_timestamp, current_timestamp);

-- create a school and associate the user
INSERT INTO schools (
  name,
  school_number,
  city,
  state,
  country,
  address,
  phone,
  principal_name,
  principal_email,
  assistant_principal_name,
  assistant_principal_email,
  external_source,
  external_key,
  external_id,
  external_key_hash,
  external_name
) VALUES (
  'Lincoln High School',
  12345,
  'Indianapolis',
  'IN',
  'USA',
  '1234567890',
  '555-0123',
  'John Smith',
  'john.smith@test.com',
  'Jane Doe',
  'jane.doe@test.com',
  'mock_source',
  'MOCK_KEY_123',
  98765,
  encode(digest('MOCK_KEY_123', 'sha256'), 'hex'),
  'Lincoln HS'
);

-- create user-school membership
INSERT INTO user_school_memberships (
  user_id,
  school_id,
  name,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'test@email.com'),
  (SELECT school_id FROM schools WHERE name = 'Lincoln High School'),
  'admin',
  current_date,
  current_date
);


