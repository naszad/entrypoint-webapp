-- ============================================================================
-- Tags and Contacts RLS Tests
-- ============================================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS tests;
GRANT USAGE ON SCHEMA tests TO authenticated, anon;

SELECT plan(12);

-- ============================================================================
-- CLEANUP
-- ============================================================================
DELETE FROM public.student_tags WHERE value LIKE 'RLS Tag Test%';
DELETE FROM public.tag_canonical_values WHERE value LIKE 'RLS Tag Test%';
DELETE FROM public.tags WHERE name LIKE 'RLS Tag Test%';
DELETE FROM public.tag_categories WHERE name LIKE 'RLS Tag Test%';
DELETE FROM public.student_contact_relationships WHERE relation_to_student LIKE 'rls_tag_test%';
DELETE FROM public.contacts WHERE external_key LIKE 'rls_tag_test_%';
DELETE FROM public.school_student_link WHERE student_id IN (SELECT student_id FROM public.students WHERE external_key LIKE 'rls_tag_test_%');
DELETE FROM public.students WHERE external_key LIKE 'rls_tag_test_%';
DELETE FROM public.user_school_memberships WHERE user_id IN (SELECT user_id FROM public.users WHERE email LIKE 'rls_tag_test_%');
DELETE FROM public.users WHERE email LIKE 'rls_tag_test_%';
DELETE FROM auth.users WHERE email LIKE 'rls_tag_test_%';
DELETE FROM public.schools WHERE external_key LIKE 'rls_tag_test_%';
DELETE FROM public.customers WHERE name LIKE 'RLS Tag Test%';

-- ============================================================================
-- SETUP
-- ============================================================================

-- Customers
INSERT INTO public.customers (customer_id, name) VALUES 
  ('11110004-1111-1111-1111-111111111111'::uuid, 'RLS Tag Test Customer Alpha'),
  ('22220004-2222-2222-2222-222222222222'::uuid, 'RLS Tag Test Customer Beta');

-- Schools
INSERT INTO public.schools (school_id, customer_id, name, external_source, external_key, external_id, external_key_hash) VALUES 
  ('aaaa0004-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '11110004-1111-1111-1111-111111111111'::uuid, 'RLS Tag Test School Alpha', 'RLSTest', 'rls_tag_test_school_alpha', 'rls_tag_test_school_alpha', 'rls_tag_test_school_alpha_hash'),
  ('bbbb0004-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '22220004-2222-2222-2222-222222222222'::uuid, 'RLS Tag Test School Beta', 'RLSTest', 'rls_tag_test_school_beta', 'rls_tag_test_school_beta', 'rls_tag_test_school_beta_hash');

-- Students
INSERT INTO public.students (student_id, customer_id, first_name, last_name, full_name, grade_level, enrollment_status, external_source, external_id, external_key, external_key_hash) VALUES 
  ('11110004-0000-0000-0000-000000000001'::uuid, '11110004-1111-1111-1111-111111111111'::uuid, 'Alice', 'TagAlpha', 'Alice TagAlpha', 10, 'active', 'RLSTest', 'rls_tag_test_student_alpha', 'rls_tag_test_student_alpha', 'rls_tag_test_student_alpha_hash'),
  ('22220004-0000-0000-0000-000000000001'::uuid, '22220004-2222-2222-2222-222222222222'::uuid, 'Bob', 'TagBeta', 'Bob TagBeta', 11, 'active', 'RLSTest', 'rls_tag_test_student_beta', 'rls_tag_test_student_beta', 'rls_tag_test_student_beta_hash');

-- School student links
INSERT INTO public.school_student_link (student_id, school_id, start_date) VALUES 
  ('11110004-0000-0000-0000-000000000001'::uuid, 'aaaa0004-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '2024-08-01'),
  ('22220004-0000-0000-0000-000000000001'::uuid, 'bbbb0004-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '2024-08-01');

-- Auth users
INSERT INTO auth.users (id, email, encrypted_password, aud, role, email_confirmed_at, created_at) VALUES 
  ('99990004-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'rls_tag_test_alpha@test.com', crypt('password', gen_salt('bf')), 'authenticated', 'authenticated', now(), now()),
  ('99990004-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'rls_tag_test_beta@test.com', crypt('password', gen_salt('bf')), 'authenticated', 'authenticated', now(), now());

-- Public users
INSERT INTO public.users (user_id, auth_user_id, first_name, last_name, email) VALUES 
  ('99990004-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '99990004-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'RLS', 'TagAlpha', 'rls_tag_test_alpha@test.com'),
  ('99990004-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '99990004-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'RLS', 'TagBeta', 'rls_tag_test_beta@test.com');

-- User school memberships
INSERT INTO public.user_school_memberships (user_id, school_id, role, created_at) VALUES 
  ('99990004-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'aaaa0004-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'member', now()),
  ('99990004-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'bbbb0004-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'member', now());

-- Tag categories (shared across all)
INSERT INTO public.tag_categories (tag_category_id, name) VALUES 
  ('00060004-0006-0006-0006-000000000001'::uuid, 'RLS Tag Test Category');

-- Tags (customer-scoped)
INSERT INTO public.tags (tag_id, customer_id, name, tag_category_id, created_by_user_id) VALUES 
  ('00070004-0007-0007-0007-000000000001'::uuid, '11110004-1111-1111-1111-111111111111'::uuid, 'RLS Tag Test Alpha Tag', '00060004-0006-0006-0006-000000000001'::uuid, '99990004-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
  ('00070004-0007-0007-0007-000000000002'::uuid, '22220004-2222-2222-2222-222222222222'::uuid, 'RLS Tag Test Beta Tag', '00060004-0006-0006-0006-000000000001'::uuid, '99990004-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid);

-- Tag canonical values
INSERT INTO public.tag_canonical_values (tag_canonical_value_id, tag_id, value, created_by_user_id) VALUES 
  ('00080004-0008-0008-0008-000000000001'::uuid, '00070004-0007-0007-0007-000000000001'::uuid, 'RLS Tag Test Value Alpha', '99990004-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
  ('00080004-0008-0008-0008-000000000002'::uuid, '00070004-0007-0007-0007-000000000002'::uuid, 'RLS Tag Test Value Beta', '99990004-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid);

-- Student tags
INSERT INTO public.student_tags (student_tag_id, student_id, tag_id, value, source, created_by_user_id) VALUES 
  ('00090004-0009-0009-0009-000000000001'::uuid, '11110004-0000-0000-0000-000000000001'::uuid, '00070004-0007-0007-0007-000000000001'::uuid, 'RLS Tag Test Student Tag Alpha', 'manual', '99990004-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
  ('00090004-0009-0009-0009-000000000002'::uuid, '22220004-0000-0000-0000-000000000001'::uuid, '00070004-0007-0007-0007-000000000002'::uuid, 'RLS Tag Test Student Tag Beta', 'manual', '99990004-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid);

-- Contacts
INSERT INTO public.contacts (contact_id, customer_id, first_name, last_name, external_source, external_id, external_key, external_key_hash) VALUES 
  ('000a0004-000a-000a-000a-00000000000a'::uuid, '11110004-1111-1111-1111-111111111111'::uuid, 'Parent', 'TagAlpha', 'RLSTest', 'rls_tag_test_contact_alpha', 'rls_tag_test_contact_alpha', 'rls_tag_test_contact_alpha_hash'),
  ('000a0004-000a-000a-000a-00000000000b'::uuid, '22220004-2222-2222-2222-222222222222'::uuid, 'Parent', 'TagBeta', 'RLSTest', 'rls_tag_test_contact_beta', 'rls_tag_test_contact_beta', 'rls_tag_test_contact_beta_hash');

-- Student contact relationships
INSERT INTO public.student_contact_relationships (student_contact_relationship_id, student_id, contact_id, school_id, customer_id, relation_to_student) VALUES 
  ('000b0004-000b-000b-000b-00000000000a'::uuid, '11110004-0000-0000-0000-000000000001'::uuid, '000a0004-000a-000a-000a-00000000000a'::uuid, 'aaaa0004-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '11110004-1111-1111-1111-111111111111'::uuid, 'rls_tag_test_parent_alpha'),
  ('000b0004-000b-000b-000b-00000000000b'::uuid, '22220004-0000-0000-0000-000000000001'::uuid, '000a0004-000a-000a-000a-00000000000b'::uuid, 'bbbb0004-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '22220004-2222-2222-2222-222222222222'::uuid, 'rls_tag_test_parent_beta');

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
-- TESTS: Tags RLS (customer-scoped)
-- ============================================================================
SELECT tests.authenticate_as('99990004-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid);

SELECT is(
  (SELECT COUNT(*) FROM public.tags WHERE tag_id = '00070004-0007-0007-0007-000000000001'::uuid)::integer,
  1, 'User Alpha can see Alpha tag'
);

SELECT is(
  (SELECT COUNT(*) FROM public.tags WHERE tag_id = '00070004-0007-0007-0007-000000000002'::uuid)::integer,
  0, 'User Alpha cannot see Beta tag'
);

-- ============================================================================
-- TESTS: Tag Categories RLS (visible to all authenticated)
-- ============================================================================
SELECT is(
  (SELECT COUNT(*) FROM public.tag_categories WHERE tag_category_id = '00060004-0006-0006-0006-000000000001'::uuid)::integer,
  1, 'User Alpha can see tag category'
);

-- ============================================================================
-- TESTS: Tag Canonical Values RLS
-- ============================================================================
SELECT is(
  (SELECT COUNT(*) FROM public.tag_canonical_values WHERE tag_canonical_value_id = '00080004-0008-0008-0008-000000000001'::uuid)::integer,
  1, 'User Alpha can see Alpha canonical value'
);

SELECT is(
  (SELECT COUNT(*) FROM public.tag_canonical_values WHERE tag_canonical_value_id = '00080004-0008-0008-0008-000000000002'::uuid)::integer,
  0, 'User Alpha cannot see Beta canonical value'
);

-- ============================================================================
-- TESTS: Student Tags RLS
-- ============================================================================
SELECT is(
  (SELECT COUNT(*) FROM public.student_tags WHERE student_tag_id = '00090004-0009-0009-0009-000000000001'::uuid)::integer,
  1, 'User Alpha can see Alpha student tag'
);

SELECT is(
  (SELECT COUNT(*) FROM public.student_tags WHERE student_tag_id = '00090004-0009-0009-0009-000000000002'::uuid)::integer,
  0, 'User Alpha cannot see Beta student tag'
);

-- ============================================================================
-- TESTS: Contacts RLS
-- ============================================================================
SELECT is(
  (SELECT COUNT(*) FROM public.contacts WHERE contact_id = '000a0004-000a-000a-000a-00000000000a'::uuid)::integer,
  1, 'User Alpha can see Alpha contact'
);

SELECT is(
  (SELECT COUNT(*) FROM public.contacts WHERE contact_id = '000a0004-000a-000a-000a-00000000000b'::uuid)::integer,
  0, 'User Alpha cannot see Beta contact'
);

-- ============================================================================
-- TESTS: Student Contact Relationships RLS
-- ============================================================================
SELECT is(
  (SELECT COUNT(*) FROM public.student_contact_relationships WHERE student_contact_relationship_id = '000b0004-000b-000b-000b-00000000000a'::uuid)::integer,
  1, 'User Alpha can see Alpha relationship'
);

SELECT is(
  (SELECT COUNT(*) FROM public.student_contact_relationships WHERE student_contact_relationship_id = '000b0004-000b-000b-000b-00000000000b'::uuid)::integer,
  0, 'User Alpha cannot see Beta relationship'
);

SELECT pass('Tags and contacts RLS tests complete');

SELECT * FROM finish();
ROLLBACK;

