-- ============================================================================
-- Sections, Section Enrollments, and Student Grades RLS Tests
-- ============================================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS tests;
GRANT USAGE ON SCHEMA tests TO authenticated, anon;

SELECT plan(13);

-- ============================================================================
-- CLEANUP: Remove any conflicting data first
-- ============================================================================
DELETE FROM public.student_grades WHERE external_key LIKE 'rls_sec_test_%';
DELETE FROM public.section_enrollments WHERE external_key LIKE 'rls_sec_test_%';
DELETE FROM public.sections WHERE external_key LIKE 'rls_sec_test_%';
DELETE FROM public.courses WHERE external_key LIKE 'rls_sec_test_%';
DELETE FROM public.school_student_link WHERE student_id IN (
  SELECT student_id FROM public.students WHERE external_key LIKE 'rls_sec_test_%'
);
DELETE FROM public.students WHERE external_key LIKE 'rls_sec_test_%';
DELETE FROM public.terms WHERE external_key LIKE 'rls_sec_test_%';
DELETE FROM public.years WHERE year_external_id LIKE 'rls_sec_test_%';
DELETE FROM public.user_school_memberships WHERE user_id IN (
  SELECT user_id FROM public.users WHERE email LIKE 'rls_sec_test_%'
);
DELETE FROM public.users WHERE email LIKE 'rls_sec_test_%';
DELETE FROM auth.users WHERE email LIKE 'rls_sec_test_%';
DELETE FROM public.schools WHERE external_key LIKE 'rls_sec_test_%';
DELETE FROM public.customers WHERE name LIKE 'RLS Sec Test%';

-- ============================================================================
-- SETUP: Create isolated test fixtures
-- ============================================================================

-- Customers
INSERT INTO public.customers (customer_id, name) VALUES 
  ('11110001-1111-1111-1111-111111111111'::uuid, 'RLS Sec Test Customer Alpha'),
  ('22220001-2222-2222-2222-222222222222'::uuid, 'RLS Sec Test Customer Beta');

-- Schools
INSERT INTO public.schools (school_id, customer_id, name, external_source, external_key, external_id, external_key_hash) VALUES 
  ('aaaa0001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '11110001-1111-1111-1111-111111111111'::uuid, 'RLS Sec Test School Alpha', 'RLSTest', 'rls_sec_test_school_alpha', 'rls_sec_test_school_alpha', 'rls_sec_test_school_alpha_hash'),
  ('bbbb0001-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '22220001-2222-2222-2222-222222222222'::uuid, 'RLS Sec Test School Beta', 'RLSTest', 'rls_sec_test_school_beta', 'rls_sec_test_school_beta', 'rls_sec_test_school_beta_hash');

-- Years
INSERT INTO public.years (year_id, start_year, end_year, name, is_current, year_external_id) VALUES 
  ('cccc0001-cccc-cccc-cccc-cccccccccccc'::uuid, 2024, 2025, 'RLS Sec Test 2024-2025', false, 'rls_sec_test_year_2024');

-- Terms
INSERT INTO public.terms (term_id, school_id, year_id, start_date, end_date, abbreviation, external_id, external_key, external_key_hash, external_source, customer_id) VALUES 
  ('dddd0001-dddd-dddd-dddd-dddddddddddd'::uuid, 'aaaa0001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'cccc0001-cccc-cccc-cccc-cccccccccccc'::uuid, '2024-08-01', '2024-12-31', 'S1', 'rls_sec_test_term_alpha', 'rls_sec_test_term_alpha', 'rls_sec_test_term_alpha_hash', 'RLSTest', '11110001-1111-1111-1111-111111111111'::uuid),
  ('eeee0001-eeee-eeee-eeee-eeeeeeeeeeee'::uuid, 'bbbb0001-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'cccc0001-cccc-cccc-cccc-cccccccccccc'::uuid, '2024-08-01', '2024-12-31', 'S1', 'rls_sec_test_term_beta', 'rls_sec_test_term_beta', 'rls_sec_test_term_beta_hash', 'RLSTest', '22220001-2222-2222-2222-222222222222'::uuid);

-- Students
INSERT INTO public.students (student_id, customer_id, first_name, last_name, full_name, grade_level, enrollment_status, external_source, external_id, external_key, external_key_hash) VALUES 
  ('11110001-0000-0000-0000-000000000001'::uuid, '11110001-1111-1111-1111-111111111111'::uuid, 'Alice', 'SecAlpha', 'Alice SecAlpha', 10, 'active', 'RLSTest', 'rls_sec_test_student_alpha', 'rls_sec_test_student_alpha', 'rls_sec_test_student_alpha_hash'),
  ('22220001-0000-0000-0000-000000000001'::uuid, '22220001-2222-2222-2222-222222222222'::uuid, 'Bob', 'SecBeta', 'Bob SecBeta', 11, 'active', 'RLSTest', 'rls_sec_test_student_beta', 'rls_sec_test_student_beta', 'rls_sec_test_student_beta_hash');

-- School student links
INSERT INTO public.school_student_link (student_id, school_id, start_date) VALUES 
  ('11110001-0000-0000-0000-000000000001'::uuid, 'aaaa0001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '2024-08-01'),
  ('22220001-0000-0000-0000-000000000001'::uuid, 'bbbb0001-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '2024-08-01');

-- Courses (important: school_id determines RLS access)
INSERT INTO public.courses (course_id, school_id, name, external_source, external_id, external_key, external_key_hash, customer_id) VALUES 
  ('00010001-0001-0001-0001-000000000001'::uuid, 'aaaa0001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'RLS Sec Test Math Alpha', 'RLSTest', 'rls_sec_test_course_alpha', 'rls_sec_test_course_alpha', 'rls_sec_test_course_alpha_hash', '11110001-1111-1111-1111-111111111111'::uuid),
  ('00010001-0001-0001-0001-000000000002'::uuid, 'bbbb0001-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'RLS Sec Test Math Beta', 'RLSTest', 'rls_sec_test_course_beta', 'rls_sec_test_course_beta', 'rls_sec_test_course_beta_hash', '22220001-2222-2222-2222-222222222222'::uuid);

-- Sections (linked to courses) - MUST include school_id for RLS!
INSERT INTO public.sections (section_id, course_id, term_id, school_id, no_of_students, section_number, course_number, grade_level, external_source, external_id, external_key, external_key_hash, customer_id) VALUES 
  ('00020001-0002-0002-0002-000000000001'::uuid, '00010001-0001-0001-0001-000000000001'::uuid, 'dddd0001-dddd-dddd-dddd-dddddddddddd'::uuid, 'aaaa0001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 30, 1, 'MATH101', '10', 'RLSTest', 'rls_sec_test_section_alpha', 'rls_sec_test_section_alpha', 'rls_sec_test_section_alpha_hash', '11110001-1111-1111-1111-111111111111'::uuid),
  ('00020001-0002-0002-0002-000000000002'::uuid, '00010001-0001-0001-0001-000000000002'::uuid, 'eeee0001-eeee-eeee-eeee-eeeeeeeeeeee'::uuid, 'bbbb0001-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 25, 1, 'MATH102', '12', 'RLSTest', 'rls_sec_test_section_beta', 'rls_sec_test_section_beta', 'rls_sec_test_section_beta_hash', '22220001-2222-2222-2222-222222222222'::uuid);

-- Section enrollments
INSERT INTO public.section_enrollments (section_enrollment_id, section_id, term_id, student_id, external_source, external_id, external_key, external_key_hash, customer_id) VALUES 
  ('00030001-0003-0003-0003-000000000001'::uuid, '00020001-0002-0002-0002-000000000001'::uuid, 'dddd0001-dddd-dddd-dddd-dddddddddddd'::uuid, '11110001-0000-0000-0000-000000000001'::uuid, 'RLSTest', 'rls_sec_test_enroll_alpha', 'rls_sec_test_enroll_alpha', 'rls_sec_test_enroll_alpha_hash', '11110001-1111-1111-1111-111111111111'::uuid),
  ('00030001-0003-0003-0003-000000000002'::uuid, '00020001-0002-0002-0002-000000000002'::uuid, 'eeee0001-eeee-eeee-eeee-eeeeeeeeeeee'::uuid, '22220001-0000-0000-0000-000000000001'::uuid, 'RLSTest', 'rls_sec_test_enroll_beta', 'rls_sec_test_enroll_beta', 'rls_sec_test_enroll_beta_hash', '22220001-2222-2222-2222-222222222222'::uuid);

-- Student grades
INSERT INTO public.student_grades (grade_id, student_id, section_id, term_id, course_id, grade_code, grade_status, source_updated_date, external_key, external_id, external_key_hash, customer_id) VALUES 
  ('00040001-0004-0004-0004-000000000001'::uuid, '11110001-0000-0000-0000-000000000001'::uuid, '00020001-0002-0002-0002-000000000001'::uuid, 'dddd0001-dddd-dddd-dddd-dddddddddddd'::uuid, '00010001-0001-0001-0001-000000000001'::uuid, 'A', 'final', '2024-12-01', 'rls_sec_test_grade_alpha', 'rls_sec_test_grade_alpha', 'rls_sec_test_grade_alpha_hash', '11110001-1111-1111-1111-111111111111'::uuid),
  ('00040001-0004-0004-0004-000000000002'::uuid, '22220001-0000-0000-0000-000000000001'::uuid, '00020001-0002-0002-0002-000000000002'::uuid, 'eeee0001-eeee-eeee-eeee-eeeeeeeeeeee'::uuid, '00010001-0001-0001-0001-000000000002'::uuid, 'B', 'final', '2024-12-01', 'rls_sec_test_grade_beta', 'rls_sec_test_grade_beta', 'rls_sec_test_grade_beta_hash', '22220001-2222-2222-2222-222222222222'::uuid);

-- Auth users
INSERT INTO auth.users (id, email, encrypted_password, aud, role, email_confirmed_at, created_at) VALUES 
  ('99990001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'rls_sec_test_alpha@test.com', crypt('password', gen_salt('bf')), 'authenticated', 'authenticated', now(), now()),
  ('99990001-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'rls_sec_test_beta@test.com', crypt('password', gen_salt('bf')), 'authenticated', 'authenticated', now(), now());

-- Public users
INSERT INTO public.users (user_id, auth_user_id, first_name, last_name, email) VALUES 
  ('99990001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '99990001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'RLS', 'SecAlpha', 'rls_sec_test_alpha@test.com'),
  ('99990001-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '99990001-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'RLS', 'SecBeta', 'rls_sec_test_beta@test.com');

-- User school memberships
INSERT INTO public.user_school_memberships (user_id, school_id, role, created_at) VALUES 
  ('99990001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'aaaa0001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'member', now()),
  ('99990001-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'bbbb0001-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'member', now());

-- ============================================================================
-- VERIFY: Data was inserted correctly (as postgres, bypasses RLS)
-- ============================================================================
DO $$
DECLARE
  section_count integer;
  course_count integer;
  membership_count integer;
  course_school uuid;
  user_school uuid;
BEGIN
  SELECT COUNT(*) INTO section_count FROM public.sections WHERE section_id = '00020001-0002-0002-0002-000000000001'::uuid;
  SELECT COUNT(*) INTO course_count FROM public.courses WHERE course_id = '00010001-0001-0001-0001-000000000001'::uuid;
  SELECT COUNT(*) INTO membership_count FROM public.user_school_memberships WHERE user_id = '99990001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid AND school_id = 'aaaa0001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;
  SELECT school_id INTO course_school FROM public.courses WHERE course_id = '00010001-0001-0001-0001-000000000001'::uuid;
  SELECT school_id INTO user_school FROM public.user_school_memberships WHERE user_id = '99990001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid LIMIT 1;
  
  IF section_count = 0 THEN
    RAISE EXCEPTION 'Section Alpha was not inserted!';
  END IF;
  IF course_count = 0 THEN
    RAISE EXCEPTION 'Course Alpha was not inserted!';
  END IF;
  IF membership_count = 0 THEN
    RAISE EXCEPTION 'User-School membership was not inserted!';
  END IF;
  IF course_school != 'aaaa0001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid THEN
    RAISE EXCEPTION 'Course school_id mismatch! Expected aaaa0001... got %', course_school;
  END IF;
  IF user_school != 'aaaa0001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid THEN
    RAISE EXCEPTION 'User school_id mismatch! Expected aaaa0001... got %', user_school;
  END IF;
END $$;

-- ============================================================================
-- Helper function
-- ============================================================================
CREATE OR REPLACE FUNCTION tests.authenticate_as(p_user_id uuid) RETURNS void AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', p_user_id::text, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);
END;
$$ LANGUAGE plpgsql;
GRANT EXECUTE ON FUNCTION tests.authenticate_as(uuid) TO authenticated, anon;

-- ============================================================================
-- VERIFY (as postgres): Section has correct course_id before RLS kicks in
-- ============================================================================
SELECT is(
  (SELECT course_id::text FROM public.sections WHERE section_id = '00020001-0002-0002-0002-000000000001'::uuid),
  '00010001-0001-0001-0001-000000000001',
  'PRE-RLS: Section Alpha has correct course_id'
);

-- ============================================================================
-- TESTS: First verify auth.uid() and memberships work
-- ============================================================================
SELECT tests.authenticate_as('99990001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid);

SELECT is(
  auth.uid()::text,
  '99990001-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'PREREQUISITE: auth.uid() returns correct user'
);

SELECT is(
  (SELECT COUNT(*) FROM public.user_school_memberships WHERE user_id = auth.uid())::integer,
  1, 'PREREQUISITE: User Alpha has school membership visible'
);

SELECT is(
  (SELECT COUNT(*) FROM public.courses WHERE course_id = '00010001-0001-0001-0001-000000000001'::uuid)::integer,
  1, 'PREREQUISITE: User Alpha can see Course Alpha'
);

-- Debug: Test the exact RLS subquery manually
SELECT is(
  (SELECT COUNT(*) FROM 
    (SELECT 1
     FROM public.courses c
     JOIN public.user_school_memberships usm ON usm.school_id = c.school_id
     WHERE c.course_id = '00010001-0001-0001-0001-000000000001'::uuid
       AND usm.user_id = auth.uid()) sq)::integer,
  1, 'DEBUG: RLS subquery finds course-membership match'
);


-- ============================================================================
-- TESTS: Sections RLS
-- ============================================================================
SELECT is(
  (SELECT COUNT(*) FROM public.sections WHERE section_id = '00020001-0002-0002-0002-000000000001'::uuid)::integer,
  1, 'User Alpha can see Section Alpha'
);

SELECT is(
  (SELECT COUNT(*) FROM public.sections WHERE section_id = '00020001-0002-0002-0002-000000000002'::uuid)::integer,
  0, 'User Alpha cannot see Section Beta'
);

-- ============================================================================
-- TESTS: Section Enrollments RLS
-- ============================================================================
SELECT is(
  (SELECT COUNT(*) FROM public.section_enrollments WHERE section_enrollment_id = '00030001-0003-0003-0003-000000000001'::uuid)::integer,
  1, 'User Alpha can see Section Enrollment Alpha'
);

SELECT is(
  (SELECT COUNT(*) FROM public.section_enrollments WHERE section_enrollment_id = '00030001-0003-0003-0003-000000000002'::uuid)::integer,
  0, 'User Alpha cannot see Section Enrollment Beta'
);

-- ============================================================================
-- TESTS: Student Grades RLS
-- ============================================================================
SELECT is(
  (SELECT COUNT(*) FROM public.student_grades WHERE grade_id = '00040001-0004-0004-0004-000000000001'::uuid)::integer,
  1, 'User Alpha can see Student Grade Alpha'
);

SELECT is(
  (SELECT COUNT(*) FROM public.student_grades WHERE grade_id = '00040001-0004-0004-0004-000000000002'::uuid)::integer,
  0, 'User Alpha cannot see Student Grade Beta'
);

-- ============================================================================
-- TESTS: Cross-check with User Beta
-- ============================================================================
SELECT tests.authenticate_as('99990001-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid);

SELECT is(
  (SELECT COUNT(*) FROM public.sections WHERE section_id = '00020001-0002-0002-0002-000000000002'::uuid)::integer,
  1, 'User Beta can see Section Beta'
);

SELECT is(
  (SELECT COUNT(*) FROM public.sections WHERE section_id = '00020001-0002-0002-0002-000000000001'::uuid)::integer,
  0, 'User Beta cannot see Section Alpha'
);

SELECT * FROM finish();
ROLLBACK;

