-- ============================================================================
-- Schools RLS Tests
-- ============================================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS tests;
GRANT USAGE ON SCHEMA tests TO authenticated, anon;

SELECT plan(4);

-- ============================================================================
-- SETUP: Minimal fixtures for school tests
-- ============================================================================

-- Cleanup any existing test data
DELETE FROM public.user_school_memberships WHERE user_id IN ('99999999-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '99999999-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid);
DELETE FROM public.users WHERE user_id IN ('99999999-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '99999999-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid);
DELETE FROM auth.users WHERE id IN ('99999999-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '99999999-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid);
DELETE FROM public.schools WHERE school_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid);
DELETE FROM public.schools WHERE external_key IN ('rls_test_school_alpha', 'rls_test_school_beta');
DELETE FROM public.customers WHERE customer_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid);

-- Create customers
INSERT INTO public.customers (customer_id, name) VALUES 
  ('11111111-1111-1111-1111-111111111111'::uuid, 'RLS Test Customer Alpha'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'RLS Test Customer Beta');

-- Create schools
INSERT INTO public.schools (school_id, customer_id, name, external_source, external_key, external_id, external_key_hash) VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'RLS Test School Alpha', 'RLSTest', 'rls_test_school_alpha', 'rls_test_school_alpha', 'rls_test_school_alpha_hash'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'RLS Test School Beta', 'RLSTest', 'rls_test_school_beta', 'rls_test_school_beta', 'rls_test_school_beta_hash');

-- Create auth users
INSERT INTO auth.users (id, email, encrypted_password, aud, role, email_confirmed_at, created_at) VALUES 
  ('99999999-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'rls_schools_alpha@test.com', crypt('password', gen_salt('bf')), 'authenticated', 'authenticated', now(), now()),
  ('99999999-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'rls_schools_beta@test.com', crypt('password', gen_salt('bf')), 'authenticated', 'authenticated', now(), now());

-- Create public users
INSERT INTO public.users (user_id, auth_user_id, first_name, last_name, email) VALUES 
  ('99999999-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '99999999-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'RLS', 'Alpha', 'rls_schools_alpha@test.com'),
  ('99999999-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '99999999-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'RLS', 'Beta', 'rls_schools_beta@test.com');

-- Create memberships
INSERT INTO public.user_school_memberships (user_id, school_id, role, created_at) VALUES 
  ('99999999-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'member', now()),
  ('99999999-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'member', now());

-- ============================================================================
-- Helper function (inline for this test file)
-- ============================================================================
CREATE OR REPLACE FUNCTION tests.authenticate_as(p_user_id uuid) RETURNS void AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', p_user_id::text, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);
END;
$$ LANGUAGE plpgsql;
GRANT EXECUTE ON FUNCTION tests.authenticate_as(uuid) TO authenticated, anon;

-- ============================================================================
-- TESTS
-- ============================================================================
SELECT tests.authenticate_as('99999999-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid);

SELECT is(
  (SELECT COUNT(*) FROM public.schools WHERE school_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid)::integer,
  1, 'User Alpha can see School Alpha'
);

SELECT is(
  (SELECT COUNT(*) FROM public.schools WHERE school_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid)::integer,
  0, 'User Alpha cannot see School Beta'
);

SELECT tests.authenticate_as('99999999-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid);

SELECT is(
  (SELECT COUNT(*) FROM public.schools WHERE school_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid)::integer,
  1, 'User Beta can see School Beta'
);

SELECT is(
  (SELECT COUNT(*) FROM public.schools WHERE school_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid)::integer,
  0, 'User Beta cannot see School Alpha'
);

SELECT * FROM finish();
ROLLBACK;

