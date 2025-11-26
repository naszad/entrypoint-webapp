-- ============================================================================
-- Meeting Notes Write RLS Tests (INSERT, UPDATE, DELETE)
-- ============================================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS tests;
GRANT USAGE ON SCHEMA tests TO authenticated, anon;

SELECT plan(7);

-- ============================================================================
-- CLEANUP
-- ============================================================================
DELETE FROM public.meeting_notes WHERE notes LIKE 'RLS Notes Write Test%';
DELETE FROM public.school_student_link WHERE student_id IN (SELECT student_id FROM public.students WHERE external_key LIKE 'rls_notes_write_test_%');
DELETE FROM public.students WHERE external_key LIKE 'rls_notes_write_test_%';
DELETE FROM public.user_school_memberships WHERE user_id IN (SELECT user_id FROM public.users WHERE email LIKE 'rls_notes_write_test_%');
DELETE FROM public.users WHERE email LIKE 'rls_notes_write_test_%';
DELETE FROM auth.users WHERE email LIKE 'rls_notes_write_test_%';
DELETE FROM public.schools WHERE external_key LIKE 'rls_notes_write_test_%';
DELETE FROM public.customers WHERE name LIKE 'RLS Notes Write Test%';

-- ============================================================================
-- SETUP
-- ============================================================================

-- Customers
INSERT INTO public.customers (customer_id, name) VALUES 
  ('11110009-1111-1111-1111-111111111111'::uuid, 'RLS Notes Write Test Customer Alpha');

-- Schools
INSERT INTO public.schools (school_id, customer_id, name, external_source, external_key, external_id, external_key_hash) VALUES 
  ('aaaa0009-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '11110009-1111-1111-1111-111111111111'::uuid, 'RLS Notes Write Test School Alpha', 'RLSTest', 'rls_notes_write_test_school_alpha', 'rls_notes_write_test_school_alpha', 'rls_notes_write_test_school_alpha_hash');

-- Students
INSERT INTO public.students (student_id, customer_id, first_name, last_name, full_name, grade_level, enrollment_status, external_source, external_id, external_key, external_key_hash) VALUES 
  ('11110009-0000-0000-0000-000000000001'::uuid, '11110009-1111-1111-1111-111111111111'::uuid, 'Student', 'ForNotes', 'Student ForNotes', 10, 'active', 'RLSTest', 'rls_notes_write_test_student', 'rls_notes_write_test_student', 'rls_notes_write_test_student_hash');

-- School student links
INSERT INTO public.school_student_link (student_id, school_id, start_date) VALUES 
  ('11110009-0000-0000-0000-000000000001'::uuid, 'aaaa0009-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '2024-08-01');

-- Auth users
INSERT INTO auth.users (id, email, encrypted_password, aud, role, email_confirmed_at, created_at) VALUES 
  ('99990009-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'rls_notes_write_test_alpha@test.com', crypt('password', gen_salt('bf')), 'authenticated', 'authenticated', now(), now()),
  ('99990009-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'rls_notes_write_test_beta@test.com', crypt('password', gen_salt('bf')), 'authenticated', 'authenticated', now(), now());

-- Public users
INSERT INTO public.users (user_id, auth_user_id, first_name, last_name, email) VALUES 
  ('99990009-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '99990009-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'RLS', 'NotesAlpha', 'rls_notes_write_test_alpha@test.com'),
  ('99990009-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '99990009-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'RLS', 'NotesBeta', 'rls_notes_write_test_beta@test.com');

-- User school memberships (both users in same school)
INSERT INTO public.user_school_memberships (user_id, school_id, role, created_at) VALUES 
  ('99990009-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'aaaa0009-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'member', now()),
  ('99990009-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'aaaa0009-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'member', now());

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
-- TESTS: Meeting Notes INSERT
-- ============================================================================
SELECT tests.authenticate_as('99990009-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid);

-- User Alpha can insert their own notes
SELECT lives_ok(
  $$INSERT INTO public.meeting_notes (meeting_note_id, student_id, user_id, notes, private, created_by, created_at) 
    VALUES ('0000c009-000c-000c-000c-00000000000a'::uuid, '11110009-0000-0000-0000-000000000001'::uuid, '99990009-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'RLS Notes Write Test - Alpha note', true, 'user', now())$$,
  'User Alpha can INSERT their own note'
);

-- User Alpha cannot insert notes as another user
SELECT throws_ok(
  $$INSERT INTO public.meeting_notes (meeting_note_id, student_id, user_id, notes, private, created_by, created_at) 
    VALUES ('0000c009-000c-000c-000c-00000000000b'::uuid, '11110009-0000-0000-0000-000000000001'::uuid, '99990009-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'RLS Notes Write Test - Fake Beta note', true, 'user', now())$$,
  'new row violates row-level security policy for table "meeting_notes"',
  'User Alpha cannot INSERT notes as another user'
);

-- ============================================================================
-- TESTS: Meeting Notes UPDATE
-- ============================================================================
-- User Alpha can update their own notes
SELECT lives_ok(
  $$UPDATE public.meeting_notes SET notes = 'RLS Notes Write Test - Alpha note updated' WHERE meeting_note_id = '0000c009-000c-000c-000c-00000000000a'::uuid$$,
  'User Alpha can UPDATE their own note'
);

-- ============================================================================
-- Create Beta's note for cross-user tests
-- ============================================================================
SELECT tests.authenticate_as('99990009-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid);

SELECT lives_ok(
  $$INSERT INTO public.meeting_notes (meeting_note_id, student_id, user_id, notes, private, created_by, created_at) 
    VALUES ('0000c009-000c-000c-000c-00000000000c'::uuid, '11110009-0000-0000-0000-000000000001'::uuid, '99990009-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'RLS Notes Write Test - Beta note', true, 'user', now())$$,
  'User Beta can INSERT their own note'
);

-- ============================================================================
-- TESTS: Cross-user restrictions
-- ============================================================================
-- User Beta cannot update Alpha's private note (since they can't see it)
SELECT is(
  (SELECT COUNT(*) FROM public.meeting_notes WHERE meeting_note_id = '0000c009-000c-000c-000c-00000000000a'::uuid)::integer,
  0, 'User Beta cannot see Alpha private note'
);

-- User Beta can see their own private note
SELECT is(
  (SELECT COUNT(*) FROM public.meeting_notes WHERE meeting_note_id = '0000c009-000c-000c-000c-00000000000c'::uuid)::integer,
  1, 'User Beta can see their own private note'
);

-- ============================================================================
-- TESTS: Meeting Notes DELETE
-- ============================================================================
SELECT tests.authenticate_as('99990009-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid);

SELECT lives_ok(
  $$DELETE FROM public.meeting_notes WHERE meeting_note_id = '0000c009-000c-000c-000c-00000000000a'::uuid$$,
  'User Alpha can DELETE their own note'
);

SELECT * FROM finish();
ROLLBACK;

