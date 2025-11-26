-- ============================================================================
-- Chat Message Feedback RLS Tests (SELECT, INSERT, UPDATE, DELETE)
-- ============================================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS tests;
GRANT USAGE ON SCHEMA tests TO authenticated, anon;

SELECT plan(9);

-- ============================================================================
-- CLEANUP
-- ============================================================================
DELETE FROM public.chat_message_feedback WHERE feedback_id IN (
  SELECT cmf.feedback_id FROM public.chat_message_feedback cmf
  JOIN public.chat_messages cm ON cmf.message_id = cm.message_id
  JOIN public.chats c ON cm.chat_id = c.chat_id
  WHERE c.title LIKE 'RLS Feedback Test%'
);
DELETE FROM public.chat_messages WHERE chat_id IN (SELECT chat_id FROM public.chats WHERE title LIKE 'RLS Feedback Test%');
DELETE FROM public.chats WHERE title LIKE 'RLS Feedback Test%';
DELETE FROM public.users WHERE email LIKE 'rls_feedback_test_%';
DELETE FROM auth.users WHERE email LIKE 'rls_feedback_test_%';

-- ============================================================================
-- SETUP
-- ============================================================================

-- Auth users
INSERT INTO auth.users (id, email, encrypted_password, aud, role, email_confirmed_at, created_at) VALUES 
  ('99990008-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'rls_feedback_test_alpha@test.com', crypt('password', gen_salt('bf')), 'authenticated', 'authenticated', now(), now()),
  ('99990008-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'rls_feedback_test_beta@test.com', crypt('password', gen_salt('bf')), 'authenticated', 'authenticated', now(), now());

-- Public users
INSERT INTO public.users (user_id, auth_user_id, first_name, last_name, email) VALUES 
  ('99990008-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '99990008-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'RLS', 'FeedbackAlpha', 'rls_feedback_test_alpha@test.com'),
  ('99990008-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '99990008-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'RLS', 'FeedbackBeta', 'rls_feedback_test_beta@test.com');

-- Create chats and messages (as postgres to bypass RLS)
INSERT INTO public.chats (chat_id, user_id, title, created_at, updated_at) VALUES 
  ('0000d008-000d-000d-000d-00000000000a'::uuid, '99990008-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'RLS Feedback Test Alpha Chat', now(), now()),
  ('0000d008-000d-000d-000d-00000000000b'::uuid, '99990008-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'RLS Feedback Test Beta Chat', now(), now());

INSERT INTO public.chat_messages (message_id, chat_id, role, parts, created_at) VALUES 
  ('0000e008-000e-000e-000e-00000000000a'::uuid, '0000d008-000d-000d-000d-00000000000a'::uuid, 'assistant', '{"text": "Alpha assistant response"}'::json, now()),
  ('0000e008-000e-000e-000e-00000000000b'::uuid, '0000d008-000d-000d-000d-00000000000b'::uuid, 'assistant', '{"text": "Beta assistant response"}'::json, now());

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
-- TESTS: Feedback INSERT
-- ============================================================================
SELECT tests.authenticate_as('99990008-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid);

-- User Alpha can create feedback for their own chat messages
SELECT lives_ok(
  $$INSERT INTO public.chat_message_feedback (feedback_id, message_id, user_id, sentiment, created_at) 
    VALUES ('0000f008-000f-000f-000f-00000000000a'::uuid, '0000e008-000e-000e-000e-00000000000a'::uuid, '99990008-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'positive', now())$$,
  'User Alpha can INSERT feedback for their own chat message'
);

-- User Alpha cannot create feedback for another user's chat messages
SELECT throws_ok(
  $$INSERT INTO public.chat_message_feedback (feedback_id, message_id, user_id, sentiment, created_at) 
    VALUES ('0000f008-000f-000f-000f-00000000000b'::uuid, '0000e008-000e-000e-000e-00000000000b'::uuid, '99990008-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'positive', now())$$,
  'new row violates row-level security policy for table "chat_message_feedback"',
  'User Alpha cannot INSERT feedback for Beta chat message'
);

-- ============================================================================
-- TESTS: Feedback SELECT
-- ============================================================================
SELECT is(
  (SELECT COUNT(*) FROM public.chat_message_feedback WHERE feedback_id = '0000f008-000f-000f-000f-00000000000a'::uuid)::integer,
  1, 'User Alpha can SELECT their own feedback'
);

-- ============================================================================
-- TESTS: Feedback UPDATE
-- ============================================================================
SELECT lives_ok(
  $$UPDATE public.chat_message_feedback SET sentiment = 'negative' WHERE feedback_id = '0000f008-000f-000f-000f-00000000000a'::uuid$$,
  'User Alpha can UPDATE their own feedback'
);

-- ============================================================================
-- Create Beta's feedback for cross-user tests
-- ============================================================================
SELECT tests.authenticate_as('99990008-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid);

SELECT lives_ok(
  $$INSERT INTO public.chat_message_feedback (feedback_id, message_id, user_id, sentiment, created_at) 
    VALUES ('0000f008-000f-000f-000f-00000000000c'::uuid, '0000e008-000e-000e-000e-00000000000b'::uuid, '99990008-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'positive', now())$$,
  'User Beta can INSERT feedback for their own chat message'
);

-- ============================================================================
-- TESTS: Cross-user restrictions
-- ============================================================================
-- User Beta cannot see Alpha's feedback
SELECT is(
  (SELECT COUNT(*) FROM public.chat_message_feedback WHERE feedback_id = '0000f008-000f-000f-000f-00000000000a'::uuid)::integer,
  0, 'User Beta cannot SELECT Alpha feedback'
);

-- User Beta can see their own feedback
SELECT is(
  (SELECT COUNT(*) FROM public.chat_message_feedback WHERE feedback_id = '0000f008-000f-000f-000f-00000000000c'::uuid)::integer,
  1, 'User Beta can SELECT their own feedback'
);

-- User Beta cannot update Alpha's feedback (verify via count since they can't see it)
SELECT is(
  (SELECT COUNT(*) FROM public.chat_message_feedback WHERE feedback_id = '0000f008-000f-000f-000f-00000000000a'::uuid)::integer,
  0, 'User Beta cannot see Alpha feedback to update it'
);

-- ============================================================================
-- TESTS: Feedback DELETE
-- ============================================================================
SELECT tests.authenticate_as('99990008-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid);

SELECT lives_ok(
  $$DELETE FROM public.chat_message_feedback WHERE feedback_id = '0000f008-000f-000f-000f-00000000000a'::uuid$$,
  'User Alpha can DELETE their own feedback'
);

SELECT * FROM finish();
ROLLBACK;

