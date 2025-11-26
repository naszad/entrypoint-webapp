-- ============================================================================
-- Chats and Meeting Notes RLS Tests
-- ============================================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS tests;
GRANT USAGE ON SCHEMA tests TO authenticated, anon;

SELECT plan(10);

-- ============================================================================
-- CLEANUP
-- ============================================================================
DELETE FROM public.chat_messages WHERE chat_id IN (SELECT chat_id FROM public.chats WHERE title LIKE 'RLS Chat Test%');
DELETE FROM public.chats WHERE title LIKE 'RLS Chat Test%';
DELETE FROM public.meeting_notes WHERE notes LIKE 'RLS Note Test%';
DELETE FROM public.school_student_link WHERE student_id IN (SELECT student_id FROM public.students WHERE external_key LIKE 'rls_chat_test_%');
DELETE FROM public.students WHERE external_key LIKE 'rls_chat_test_%';
DELETE FROM public.user_school_memberships WHERE user_id IN (SELECT user_id FROM public.users WHERE email LIKE 'rls_chat_test_%');
DELETE FROM public.users WHERE email LIKE 'rls_chat_test_%';
DELETE FROM auth.users WHERE email LIKE 'rls_chat_test_%';
DELETE FROM public.schools WHERE external_key LIKE 'rls_chat_test_%';
DELETE FROM public.customers WHERE name LIKE 'RLS Chat Test%';

-- ============================================================================
-- SETUP
-- ============================================================================

-- Customers
INSERT INTO public.customers (customer_id, name) VALUES 
  ('11110003-1111-1111-1111-111111111111'::uuid, 'RLS Chat Test Customer Alpha');

-- Schools
INSERT INTO public.schools (school_id, customer_id, name, external_source, external_key, external_id, external_key_hash) VALUES 
  ('aaaa0003-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '11110003-1111-1111-1111-111111111111'::uuid, 'RLS Chat Test School Alpha', 'RLSTest', 'rls_chat_test_school_alpha', 'rls_chat_test_school_alpha', 'rls_chat_test_school_alpha_hash');

-- Students (for meeting notes)
INSERT INTO public.students (student_id, customer_id, first_name, last_name, full_name, grade_level, enrollment_status, external_source, external_id, external_key, external_key_hash) VALUES 
  ('11110003-0000-0000-0000-000000000001'::uuid, '11110003-1111-1111-1111-111111111111'::uuid, 'Student', 'ForNotes', 'Student ForNotes', 10, 'active', 'RLSTest', 'rls_chat_test_student', 'rls_chat_test_student', 'rls_chat_test_student_hash');

-- School student links
INSERT INTO public.school_student_link (student_id, school_id, start_date) VALUES 
  ('11110003-0000-0000-0000-000000000001'::uuid, 'aaaa0003-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '2024-08-01');

-- Auth users
INSERT INTO auth.users (id, email, encrypted_password, aud, role, email_confirmed_at, created_at) VALUES 
  ('99990003-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'rls_chat_test_alpha@test.com', crypt('password', gen_salt('bf')), 'authenticated', 'authenticated', now(), now()),
  ('99990003-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'rls_chat_test_beta@test.com', crypt('password', gen_salt('bf')), 'authenticated', 'authenticated', now(), now());

-- Public users
INSERT INTO public.users (user_id, auth_user_id, first_name, last_name, email) VALUES 
  ('99990003-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '99990003-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'RLS', 'ChatAlpha', 'rls_chat_test_alpha@test.com'),
  ('99990003-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '99990003-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'RLS', 'ChatBeta', 'rls_chat_test_beta@test.com');

-- User school memberships
INSERT INTO public.user_school_memberships (user_id, school_id, role, created_at) VALUES 
  ('99990003-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'aaaa0003-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'member', now()),
  ('99990003-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'aaaa0003-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'member', now());

-- Chats (user-owned)
INSERT INTO public.chats (chat_id, user_id, title, created_at, updated_at) VALUES 
  ('0000d003-000d-000d-000d-00000000000a'::uuid, '99990003-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'RLS Chat Test Alpha Chat', now(), now()),
  ('0000d003-000d-000d-000d-00000000000b'::uuid, '99990003-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'RLS Chat Test Beta Chat', now(), now());

-- Chat messages
INSERT INTO public.chat_messages (message_id, chat_id, role, parts, created_at) VALUES 
  ('0000e003-000e-000e-000e-00000000000a'::uuid, '0000d003-000d-000d-000d-00000000000a'::uuid, 'user', '{"text": "Alpha message"}'::json, now()),
  ('0000e003-000e-000e-000e-00000000000b'::uuid, '0000d003-000d-000d-000d-00000000000b'::uuid, 'user', '{"text": "Beta message"}'::json, now());

-- Meeting notes
INSERT INTO public.meeting_notes (meeting_note_id, student_id, user_id, notes, private, created_by, created_at) VALUES 
  ('0000c003-000c-000c-000c-00000000000a'::uuid, '11110003-0000-0000-0000-000000000001'::uuid, '99990003-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'RLS Note Test - Alpha private note', true, 'user', now()),
  ('0000c003-000c-000c-000c-00000000000b'::uuid, '11110003-0000-0000-0000-000000000001'::uuid, '99990003-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'RLS Note Test - Alpha public note', false, 'user', now()),
  ('0000c003-000c-000c-000c-00000000000c'::uuid, '11110003-0000-0000-0000-000000000001'::uuid, '99990003-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'RLS Note Test - Beta private note', true, 'user', now());

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
-- TESTS: Chats RLS (user-owned)
-- ============================================================================
SELECT tests.authenticate_as('99990003-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid);

SELECT is(
  (SELECT COUNT(*) FROM public.chats WHERE chat_id = '0000d003-000d-000d-000d-00000000000a'::uuid)::integer,
  1, 'User Alpha can see their own chat'
);

SELECT is(
  (SELECT COUNT(*) FROM public.chats WHERE chat_id = '0000d003-000d-000d-000d-00000000000b'::uuid)::integer,
  0, 'User Alpha cannot see Beta chat'
);

-- ============================================================================
-- TESTS: Chat Messages RLS (via chat ownership)
-- ============================================================================
SELECT is(
  (SELECT COUNT(*) FROM public.chat_messages WHERE message_id = '0000e003-000e-000e-000e-00000000000a'::uuid)::integer,
  1, 'User Alpha can see messages in their chat'
);

SELECT is(
  (SELECT COUNT(*) FROM public.chat_messages WHERE message_id = '0000e003-000e-000e-000e-00000000000b'::uuid)::integer,
  0, 'User Alpha cannot see messages in Beta chat'
);

-- ============================================================================
-- TESTS: Meeting Notes RLS
-- ============================================================================
SELECT is(
  (SELECT COUNT(*) FROM public.meeting_notes WHERE meeting_note_id = '0000c003-000c-000c-000c-00000000000a'::uuid)::integer,
  1, 'User Alpha can see their own private note'
);

SELECT is(
  (SELECT COUNT(*) FROM public.meeting_notes WHERE meeting_note_id = '0000c003-000c-000c-000c-00000000000b'::uuid)::integer,
  1, 'User Alpha can see their own public note'
);

-- User Alpha should NOT see Beta's private note, but MIGHT see their public note for same student
SELECT is(
  (SELECT COUNT(*) FROM public.meeting_notes WHERE meeting_note_id = '0000c003-000c-000c-000c-00000000000c'::uuid)::integer,
  0, 'User Alpha cannot see Beta private note'
);

-- ============================================================================
-- TESTS: Cross-check with User Beta
-- ============================================================================
SELECT tests.authenticate_as('99990003-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid);

SELECT is(
  (SELECT COUNT(*) FROM public.chats WHERE chat_id = '0000d003-000d-000d-000d-00000000000b'::uuid)::integer,
  1, 'User Beta can see their own chat'
);

SELECT is(
  (SELECT COUNT(*) FROM public.chats WHERE chat_id = '0000d003-000d-000d-000d-00000000000a'::uuid)::integer,
  0, 'User Beta cannot see Alpha chat'
);

SELECT is(
  (SELECT COUNT(*) FROM public.meeting_notes WHERE meeting_note_id = '0000c003-000c-000c-000c-00000000000c'::uuid)::integer,
  1, 'User Beta can see their own private note'
);

SELECT * FROM finish();
ROLLBACK;

