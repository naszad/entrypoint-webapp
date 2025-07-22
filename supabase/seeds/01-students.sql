-- Insert three students
INSERT INTO students (
  first_name,
  last_name,
  email,
  phone,
  grade_level,
  gender,
  date_of_birth,
  external_source,
  external_key,
  external_id,
  external_key_hash,
  external_name,
  graduation_year,
  enrollment_status,
  homeroom_name,
  full_name
) VALUES 
  (
    'Emma',
    'Johnson',
    'emma.johnson@student.edu',
    '555-0101',
    11,
    'female',
    '2007-05-15',
    'mock_source',
    'STUDENT_001',
    1001,
    encode(digest('STUDENT_001', 'sha256'), 'hex'),
    'Emma J',
    2025,
    'active',
    'Room 101',
    'Emma Johnson'
  ),
  (
    'Michael',
    'Chen',
    'michael.chen@student.edu',
    '555-0102',
    10,
    'male',
    '2008-08-22',
    'mock_source',
    'STUDENT_002',
    1002,
    encode(digest('STUDENT_002', 'sha256'), 'hex'),
    'Michael C',
    2026,
    'active',
    'Room 102',
    'Michael Chen'
  ),
  (
    'Sophia',
    'Rodriguez',
    'sophia.rodriguez@student.edu',
    '555-0103',
    12,
    'female',
    '2006-03-10',
    'mock_source',
    'STUDENT_003',
    1003,
    encode(digest('STUDENT_003', 'sha256'), 'hex'),
    'Sophia R',
    2024,
    'active',
    'Room 103',
    'Sophia Rodriguez'
  );

-- Associate all above students with Lincoln High School
INSERT INTO school_student_link (
  student_id,
  school_id,
  start_date,
  end_date,
  created_at,
  updated_at
)
SELECT 
  student_id,
  (SELECT school_id FROM schools WHERE name = 'Lincoln High School'),
  current_date,
  NULL,
  current_date,
  current_date
FROM students
WHERE email IN (
  'emma.johnson@student.edu',
  'michael.chen@student.edu',
  'sophia.rodriguez@student.edu'
);

-- Insert seven new students for Lincoln High School
INSERT INTO students (
  first_name,
  last_name,
  email,
  phone,
  grade_level,
  gender,
  date_of_birth,
  external_source,
  external_key,
  external_id,
  external_key_hash,
  external_name,
  graduation_year,
  enrollment_status,
  homeroom_name,
  full_name
) VALUES 
  (
    'Noah',
    'Miller',
    'noah.miller@student.edu',
    '555-0104',
    12,
    'male',
    '2006-07-20',
    'mock_source',
    'STUDENT_007',
    1007,
    encode(digest('STUDENT_007', 'sha256'), 'hex'),
    'Noah M',
    2024,
    'active',
    'Room 104',
    'Noah Miller'
  ),
  (
    'Isabella',
    'Garcia',
    'isabella.garcia@student.edu',
    '555-0105',
    12,
    'female',
    '2006-09-01',
    'mock_source',
    'STUDENT_008',
    1008,
    encode(digest('STUDENT_008', 'sha256'), 'hex'),
    'Isabella G',
    2024,
    'active',
    'Room 105',
    'Isabella Garcia'
  ),
  (
    'Lucas',
    'Martinez',
    'lucas.martinez@student.edu',
    '555-0106',
    11,
    'male',
    '2007-04-18',
    'mock_source',
    'STUDENT_009',
    1009,
    encode(digest('STUDENT_009', 'sha256'), 'hex'),
    'Lucas M',
    2025,
    'active',
    'Room 106',
    'Lucas Martinez'
  ),
    (
    'Charlotte',
    'Davis',
    'charlotte.davis@student.edu',
    '555-0107',
    11,
    'female',
    '2007-10-30',
    'mock_source',
    'STUDENT_010',
    1010,
    encode(digest('STUDENT_010', 'sha256'), 'hex'),
    'Charlotte D',
    2025,
    'active',
    'Room 107',
    'Charlotte Davis'
  ),
  (
    'Benjamin',
    'Wilson',
    'benjamin.wilson@student.edu',
    '555-0108',
    10,
    'male',
    '2008-01-25',
    'mock_source',
    'STUDENT_011',
    1011,
    encode(digest('STUDENT_011', 'sha256'), 'hex'),
    'Benjamin W',
    2026,
    'active',
    'Room 108',
    'Benjamin Wilson'
  ),
    (
    'Amelia',
    'Taylor',
    'amelia.taylor@student.edu',
    '555-0109',
    10,
    'female',
    '2008-11-05',
    'mock_source',
    'STUDENT_012',
    1012,
    encode(digest('STUDENT_012', 'sha256'), 'hex'),
    'Amelia T',
    2026,
    'active',
    'Room 109',
    'Amelia Taylor'
  ),
  (
    'Ethan',
    'Anderson',
    'ethan.anderson@student.edu',
    '555-0110',
    9,
    'male',
    '2009-08-17',
    'mock_source',
    'STUDENT_013',
    1013,
    encode(digest('STUDENT_013', 'sha256'), 'hex'),
    'Ethan A',
    2027,
    'active',
    'Room 110',
    'Ethan Anderson'
  );

-- Associate all new students with Lincoln High School
INSERT INTO school_student_link (
  student_id,
  school_id,
  start_date,
  end_date,
  created_at,
  updated_at
)
SELECT 
  student_id,
  (SELECT school_id FROM schools WHERE name = 'Lincoln High School'),
  current_date,
  NULL,
  current_date,
  current_date
FROM students
WHERE email IN (
  'noah.miller@student.edu',
  'isabella.garcia@student.edu',
  'lucas.martinez@student.edu',
  'charlotte.davis@student.edu',
  'benjamin.wilson@student.edu',
  'amelia.taylor@student.edu',
  'ethan.anderson@student.edu'
);

-- Insert three students for Washington High School
INSERT INTO students (
  first_name,
  last_name,
  email,
  phone,
  grade_level,
  gender,
  date_of_birth,
  external_source,
  external_key,
  external_id,
  external_key_hash,
  external_name,
  graduation_year,
  enrollment_status,
  homeroom_name,
  full_name
) VALUES 
  (
    'James',
    'Williams',
    'james.williams@student.edu',
    '555-0201',
    9,
    'male',
    '2009-02-10',
    'mock_source',
    'STUDENT_004',
    1004,
    encode(digest('STUDENT_004', 'sha256'), 'hex'),
    'James W',
    2027,
    'active',
    'Room 201',
    'James Williams'
  ),
  (
    'Olivia',
    'Brown',
    'olivia.brown@student.edu',
    '555-0202',
    10,
    'female',
    '2008-06-25',
    'mock_source',
    'STUDENT_005',
    1005,
    encode(digest('STUDENT_005', 'sha256'), 'hex'),
    'Olivia B',
    2026,
    'active',
    'Room 202',
    'Olivia Brown'
  ),
  (
    'Liam',
    'Jones',
    'liam.jones@student.edu',
    '555-0203',
    11,
    'male',
    '2007-11-12',
    'mock_source',
    'STUDENT_006',
    1006,
    encode(digest('STUDENT_006', 'sha256'), 'hex'),
    'Liam J',
    2025,
    'active',
    'Room 203',
    'Liam Jones'
  );

-- Associate students with Washington High School
INSERT INTO school_student_link (
  student_id,
  school_id,
  start_date,
  end_date,
  created_at,
  updated_at
)
SELECT 
  student_id,
  (SELECT school_id FROM schools WHERE name = 'Washington High School'),
  current_date,
  NULL,
  current_date,
  current_date
FROM students
WHERE email IN (
  'james.williams@student.edu',
  'olivia.brown@student.edu',
  'liam.jones@student.edu'
);
