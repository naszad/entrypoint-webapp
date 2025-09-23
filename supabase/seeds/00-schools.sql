-- These are globals/defaults
INSERT INTO config.configuration (config_key, value, is_secret, customer_id)
SELECT 'grade_code_sort' AS config_key, '["Q1", "Q2", "S1", "Q3", "Q4", "S2"]'::jsonb AS value, false as is_secret, NULL::uuid UNION
SELECT 'final_grade_codes' AS config_key, '["S1", "S2"]'::jsonb AS value, false as is_secret, NULL::uuid UNION
SELECT 'email_domain_whitelist' AS config_key, '[["entrypointsrm.com", "gmail.com"]]'::jsonb AS value, false as is_secret, customer_id from customers where name = 'Lincoln Township District';

DO $$
DECLARE
  new_customer_id uuid := '48aac272-392f-4086-9dd3-4e4defaf3c18';
BEGIN
  -- create customer
  INSERT INTO customers (customer_id, name) VALUES (new_customer_id, 'Lincoln Township District');

  -- Seed config values for the new customer
  PERFORM config.set_customer_config_values(
    new_customer_id,
    '{
      "is_active": false,
      "grade_code_sort": ["Q1", "Q2", "E1", "S1", "Q3", "Q4", "E2", "S2"],
      "final_grade_code": ["S1", "S2"],
      "gpa_grade_levels": [9, 10, 11, 12],
      "email_domain_whitelist": ["entrypointsrm.com", "gmail.com"]
    }'::jsonb
  );

  -- create schools
  INSERT INTO public.schools (
    customer_id,
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
    external_name,
    gpa_config
  ) VALUES (
    new_customer_id,
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
    encode(extensions.digest('MOCK_KEY_123', 'sha256'), 'hex'),
    'Lincoln HS',
    '{ "default_method": "simple" }'::JSONB
  );

  INSERT INTO public.schools (
    customer_id,
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
    new_customer_id,
    'Washington High School',
    54321,
    'Indianapolis',
    'IN',
    'USA',
    '0987654321',
    '555-3210',
    'Mary Sue',
    'mary.sue@test.com',
    'Peter Pan',
    'peter.pan@test.com',
    'mock_source',
    'MOCK_KEY_456',
    56789,
    encode(extensions.digest('MOCK_KEY_456', 'sha256'), 'hex'),
    'Washington HS'
  );
END $$;
