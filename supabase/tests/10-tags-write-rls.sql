-- ============================================================================
-- Tags, Tag Canonical Values, and Student Tags Write RLS Tests
-- ============================================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS tests;
GRANT USAGE ON SCHEMA tests TO authenticated, anon;

SELECT plan(13);

-- ============================================================================
-- CLEANUP
-- ============================================================================
DELETE FROM public.student_tags WHERE value LIKE 'RLS Tags Write Test%';
DELETE FROM public.tag_canonical_values WHERE value LIKE 'RLS Tags Write Test%';
DELETE FROM public.tags WHERE name LIKE 'RLS Tags Write Test%';
DELETE FROM public.tag_categories WHERE name LIKE 'RLS Tags Write Test%';
DELETE FROM public.school_student_link WHERE student_id IN (SELECT student_id FROM public.students WHERE external_key LIKE 'rls_tags_write_test_%');
DELETE FROM public.students WHERE external_key LIKE 'rls_tags_write_test_%';
DELETE FROM public.user_school_memberships WHERE user_id IN (SELECT user_id FROM public.users WHERE email LIKE 'rls_tags_write_test_%');
DELETE FROM public.users WHERE email LIKE 'rls_tags_write_test_%';
DELETE FROM auth.users WHERE email LIKE 'rls_tags_write_test_%';
DELETE FROM public.schools WHERE external_key LIKE 'rls_tags_write_test_%';
DELETE FROM public.customers WHERE name LIKE 'RLS Tags Write Test%';

-- ============================================================================
-- SETUP
-- ============================================================================

-- Customers
INSERT INTO public.customers (customer_id, name) VALUES 
  ('11110010-1111-1111-1111-111111111111'::uuid, 'RLS Tags Write Test Customer Alpha'),
  ('22220010-2222-2222-2222-222222222222'::uuid, 'RLS Tags Write Test Customer Beta');

-- Schools
INSERT INTO public.schools (school_id, customer_id, name, external_source, external_key, external_id, external_key_hash) VALUES 
  ('aaaa0010-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '11110010-1111-1111-1111-111111111111'::uuid, 'RLS Tags Write Test School Alpha', 'RLSTest', 'rls_tags_write_test_school_alpha', 'rls_tags_write_test_school_alpha', 'rls_tags_write_test_school_alpha_hash'),
  ('bbbb0010-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '22220010-2222-2222-2222-222222222222'::uuid, 'RLS Tags Write Test School Beta', 'RLSTest', 'rls_tags_write_test_school_beta', 'rls_tags_write_test_school_beta', 'rls_tags_write_test_school_beta_hash');

-- Tag categories
INSERT INTO public.tag_categories (tag_category_id, name) VALUES 
  ('00060010-0006-0006-0006-000000000001'::uuid, 'RLS Tags Write Test Category');

-- Students
INSERT INTO public.students (student_id, customer_id, first_name, last_name, full_name, grade_level, enrollment_status, external_source, external_id, external_key, external_key_hash) VALUES 
  ('11110010-0000-0000-0000-000000000001'::uuid, '11110010-1111-1111-1111-111111111111'::uuid, 'Alice', 'TagsAlpha', 'Alice TagsAlpha', 10, 'active', 'RLSTest', 'rls_tags_write_test_student_alpha', 'rls_tags_write_test_student_alpha', 'rls_tags_write_test_student_alpha_hash'),
  ('22220010-0000-0000-0000-000000000001'::uuid, '22220010-2222-2222-2222-222222222222'::uuid, 'Bob', 'TagsBeta', 'Bob TagsBeta', 11, 'active', 'RLSTest', 'rls_tags_write_test_student_beta', 'rls_tags_write_test_student_beta', 'rls_tags_write_test_student_beta_hash');

-- School student links
INSERT INTO public.school_student_link (student_id, school_id, start_date) VALUES 
  ('11110010-0000-0000-0000-000000000001'::uuid, 'aaaa0010-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '2024-08-01'),
  ('22220010-0000-0000-0000-000000000001'::uuid, 'bbbb0010-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '2024-08-01');

-- Auth users
INSERT INTO auth.users (id, email, encrypted_password, aud, role, email_confirmed_at, created_at) VALUES 
  ('99990010-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'rls_tags_write_test_alpha@test.com', crypt('password', gen_salt('bf')), 'authenticated', 'authenticated', now(), now()),
  ('99990010-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'rls_tags_write_test_beta@test.com', crypt('password', gen_salt('bf')), 'authenticated', 'authenticated', now(), now());

-- Public users
INSERT INTO public.users (user_id, auth_user_id, first_name, last_name, email) VALUES 
  ('99990010-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '99990010-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'RLS', 'TagsAlpha', 'rls_tags_write_test_alpha@test.com'),
  ('99990010-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '99990010-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'RLS', 'TagsBeta', 'rls_tags_write_test_beta@test.com');

-- User school memberships
INSERT INTO public.user_school_memberships (user_id, school_id, role, created_at) VALUES 
  ('99990010-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'aaaa0010-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'member', now()),
  ('99990010-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'bbbb0010-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'member', now());

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
-- TESTS: Tags INSERT
-- ============================================================================
SELECT tests.authenticate_as('99990010-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid);

-- User Alpha can create tags for their customer
SELECT lives_ok(
  $$INSERT INTO public.tags (tag_id, customer_id, name, tag_category_id, created_by_user_id) 
    VALUES ('00070010-0007-0007-0007-000000000001'::uuid, '11110010-1111-1111-1111-111111111111'::uuid, 'RLS Tags Write Test Alpha Tag', '00060010-0006-0006-0006-000000000001'::uuid, '99990010-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid)$$,
  'User Alpha can INSERT tag for their customer'
);

-- ============================================================================
-- TESTS: Tag Canonical Values INSERT
-- ============================================================================
-- User Alpha can create canonical values for their tags
SELECT lives_ok(
  $$INSERT INTO public.tag_canonical_values (tag_canonical_value_id, tag_id, value, created_by_user_id) 
    VALUES ('00080010-0008-0008-0008-000000000001'::uuid, '00070010-0007-0007-0007-000000000001'::uuid, 'RLS Tags Write Test Value Alpha', '99990010-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid)$$,
  'User Alpha can INSERT canonical value for their tag'
);

-- ============================================================================
-- TESTS: Student Tags INSERT
-- ============================================================================
-- User Alpha can tag students in their school
SELECT lives_ok(
  $$INSERT INTO public.student_tags (student_tag_id, student_id, tag_id, value, source, created_by_user_id) 
    VALUES ('00090010-0009-0009-0009-000000000001'::uuid, '11110010-0000-0000-0000-000000000001'::uuid, '00070010-0007-0007-0007-000000000001'::uuid, 'RLS Tags Write Test Student Tag Alpha', 'manual', '99990010-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid)$$,
  'User Alpha can INSERT student tag for student in their school'
);

-- ============================================================================
-- TESTS: Student Tags UPDATE
-- ============================================================================
-- User Alpha can update their student tags
SELECT lives_ok(
  $$UPDATE public.student_tags SET value = 'RLS Tags Write Test Student Tag Alpha Updated' WHERE student_tag_id = '00090010-0009-0009-0009-000000000001'::uuid$$,
  'User Alpha can UPDATE their student tag'
);

-- ============================================================================
-- Create Beta's data for cross-user tests
-- ============================================================================
SELECT tests.authenticate_as('99990010-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid);

SELECT lives_ok(
  $$INSERT INTO public.tags (tag_id, customer_id, name, tag_category_id, created_by_user_id) 
    VALUES ('00070010-0007-0007-0007-000000000002'::uuid, '22220010-2222-2222-2222-222222222222'::uuid, 'RLS Tags Write Test Beta Tag', '00060010-0006-0006-0006-000000000001'::uuid, '99990010-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid)$$,
  'User Beta can INSERT tag for their customer'
);

SELECT lives_ok(
  $$INSERT INTO public.student_tags (student_tag_id, student_id, tag_id, value, source, created_by_user_id) 
    VALUES ('00090010-0009-0009-0009-000000000002'::uuid, '22220010-0000-0000-0000-000000000001'::uuid, '00070010-0007-0007-0007-000000000002'::uuid, 'RLS Tags Write Test Student Tag Beta', 'manual', '99990010-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid)$$,
  'User Beta can INSERT student tag for student in their school'
);

-- ============================================================================
-- TESTS: Cross-user restrictions
-- ============================================================================
-- User Beta cannot see Alpha's tags
SELECT is(
  (SELECT COUNT(*) FROM public.tags WHERE tag_id = '00070010-0007-0007-0007-000000000001'::uuid)::integer,
  0, 'User Beta cannot see Alpha tag'
);

-- User Beta cannot see Alpha's student tags
SELECT is(
  (SELECT COUNT(*) FROM public.student_tags WHERE student_tag_id = '00090010-0009-0009-0009-000000000001'::uuid)::integer,
  0, 'User Beta cannot see Alpha student tag'
);

-- User Beta can see their own tags
SELECT is(
  (SELECT COUNT(*) FROM public.tags WHERE tag_id = '00070010-0007-0007-0007-000000000002'::uuid)::integer,
  1, 'User Beta can see their own tag'
);

-- User Beta can see their own student tags
SELECT is(
  (SELECT COUNT(*) FROM public.student_tags WHERE student_tag_id = '00090010-0009-0009-0009-000000000002'::uuid)::integer,
  1, 'User Beta can see their own student tag'
);

-- ============================================================================
-- TESTS: Student Tags DELETE
-- ============================================================================
SELECT tests.authenticate_as('99990010-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid);

SELECT lives_ok(
  $$DELETE FROM public.student_tags WHERE student_tag_id = '00090010-0009-0009-0009-000000000001'::uuid$$,
  'User Alpha can DELETE their student tag'
);

-- User Alpha cannot delete Beta's student tag (can't see it)
SELECT is(
  (SELECT COUNT(*) FROM public.student_tags WHERE student_tag_id = '00090010-0009-0009-0009-000000000002'::uuid)::integer,
  0, 'User Alpha cannot see Beta student tag to delete it'
);

-- ============================================================================
-- Verify Beta's tag still exists after Alpha's operations
-- ============================================================================
SELECT tests.authenticate_as('99990010-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid);

SELECT is(
  (SELECT COUNT(*) FROM public.student_tags WHERE student_tag_id = '00090010-0009-0009-0009-000000000002'::uuid)::integer,
  1, 'Beta student tag still exists after Alpha operations'
);

SELECT * FROM finish();
ROLLBACK;

