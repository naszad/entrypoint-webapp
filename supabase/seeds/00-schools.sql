-- !!!                                                                                           !!!
-- !!!            DO NOT EVER ACCIDENTALLY RUN THIS FILE IN YOUR PRODUCTION DATABASE             !!!
-- !!!    this is meant for running locally to seed your database for contributing purposes      !!!

-- create customers (using this specific id to match what's in Dagster)
INSERT INTO customers (customer_id, name) VALUES ('48aac272-392f-4086-9dd3-4e4defaf3c18', 'Lincoln Township District');

-- create schools
INSERT INTO schools (
  -- customer_id,
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
  -- (SELECT customer_id FROM customers WHERE name = 'Lincoln Township District'),
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

