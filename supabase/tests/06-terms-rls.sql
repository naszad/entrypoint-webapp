-- ============================================================================
-- Terms RLS Tests
-- ============================================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS tests;
GRANT USAGE ON SCHEMA tests TO authenticated, anon;

SELECT plan(4);

-- ============================================================================
-- CLEANUP
-- ============================================================================
DELETE FROM public.terms WHERE external_key LIKE 'rls_terms_test_%';
DELETE FROM public.years WHERE year_external_id LIKE 'rls_terms_test_%';
DELETE FROM public.user_school_memberships WHERE user_id IN (SELECT user_id FROM public.users WHERE email LIKE 'rls_terms_test_%');
DELETE FROM public.users WHERE email LIKE 'rls_terms_test_%';
DELETE FROM auth.users WHERE email LIKE 'rls_terms_test_%';
DELETE FROM public.schools WHERE external_key LIKE 'rls_terms_test_%';
DELETE FROM public.customers WHERE name LIKE 'RLS Terms Test%';

-- ============================================================================
-- SETUP
-- ============================================================================

-- Customers
INSERT INTO public.customers (customer_id, name) VALUES 
  ('11110006-1111-1111-1111-111111111111'::uuid, 'RLS Terms Test Customer Alpha'),
  ('22220006-2222-2222-2222-222222222222'::uuid, 'RLS Terms Test Customer Beta');

-- Schools
INSERT INTO public.schools (school_id, customer_id, name, external_source, external_key, external_id, external_key_hash) VALUES 
  ('aaaa0006-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '11110006-1111-1111-1111-111111111111'::uuid, 'RLS Terms Test School Alpha', 'RLSTest', 'rls_terms_test_school_alpha', 'rls_terms_test_school_alpha', 'rls_terms_test_school_alpha_hash'),
  ('bbbb0006-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '22220006-2222-2222-2222-222222222222'::uuid, 'RLS Terms Test School Beta', 'RLSTest', 'rls_terms_test_school_beta', 'rls_terms_test_school_beta', 'rls_terms_test_school_beta_hash');

-- Years
INSERT INTO public.years (year_id, start_year, end_year, name, is_current, year_external_id) VALUES 
  ('cccc0006-cccc-cccc-cccc-cccccccccccc'::uuid, 2024, 2025, 'RLS Terms Test 2024-2025', false, 'rls_terms_test_year_2024');

-- Terms (scoped by school)
INSERT INTO public.terms (term_id, school_id, year_id, start_date, end_date, abbreviation, external_id, external_key, external_key_hash, external_source, customer_id) VALUES 
  ('dddd0006-dddd-dddd-dddd-dddddddddddd'::uuid, 'aaaa0006-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'cccc0006-cccc-cccc-cccc-cccccccccccc'::uuid, '2024-08-01', '2024-12-31', 'S1', 'rls_terms_test_term_alpha', 'rls_terms_test_term_alpha', 'rls_terms_test_term_alpha_hash', 'RLSTest', '11110006-1111-1111-1111-111111111111'::uuid),
  ('eeee0006-eeee-eeee-eeee-eeeeeeeeeeee'::uuid, 'bbbb0006-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'cccc0006-cccc-cccc-cccc-cccccccccccc'::uuid, '2024-08-01', '2024-12-31', 'S1', 'rls_terms_test_term_beta', 'rls_terms_test_term_beta', 'rls_terms_test_term_beta_hash', 'RLSTest', '22220006-2222-2222-2222-222222222222'::uuid);

-- Auth users
INSERT INTO auth.users (id, email, encrypted_password, aud, role, email_confirmed_at, created_at) VALUES 
  ('99990006-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'rls_terms_test_alpha@test.com', crypt('password', gen_salt('bf')), 'authenticated', 'authenticated', now(), now()),
  ('99990006-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'rls_terms_test_beta@test.com', crypt('password', gen_salt('bf')), 'authenticated', 'authenticated', now(), now());

-- Public users
INSERT INTO public.users (user_id, auth_user_id, first_name, last_name, email) VALUES 
  ('99990006-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '99990006-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'RLS', 'TermsAlpha', 'rls_terms_test_alpha@test.com'),
  ('99990006-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '99990006-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'RLS', 'TermsBeta', 'rls_terms_test_beta@test.com');

-- User school memberships
INSERT INTO public.user_school_memberships (user_id, school_id, role, created_at) VALUES 
  ('99990006-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'aaaa0006-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'member', now()),
  ('99990006-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'bbbb0006-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'member', now());

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
-- TESTS: Terms RLS (scoped by school)
-- ============================================================================
SELECT tests.authenticate_as('99990006-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid);

SELECT is(
  (SELECT COUNT(*) FROM public.terms WHERE term_id = 'dddd0006-dddd-dddd-dddd-dddddddddddd'::uuid)::integer,
  1, 'User Alpha can see Term Alpha'
);

SELECT is(
  (SELECT COUNT(*) FROM public.terms WHERE term_id = 'eeee0006-eeee-eeee-eeee-eeeeeeeeeeee'::uuid)::integer,
  0, 'User Alpha cannot see Term Beta'
);

SELECT tests.authenticate_as('99990006-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid);

SELECT is(
  (SELECT COUNT(*) FROM public.terms WHERE term_id = 'eeee0006-eeee-eeee-eeee-eeeeeeeeeeee'::uuid)::integer,
  1, 'User Beta can see Term Beta'
);

SELECT is(
  (SELECT COUNT(*) FROM public.terms WHERE term_id = 'dddd0006-dddd-dddd-dddd-dddddddddddd'::uuid)::integer,
  0, 'User Beta cannot see Term Alpha'
);

SELECT * FROM finish();
ROLLBACK;

