-- ============================================================================
-- Chats and Chat Messages Write RLS Tests (INSERT, UPDATE, DELETE)
-- ============================================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS tests;
GRANT USAGE ON SCHEMA tests TO authenticated, anon;

SELECT plan(11);

-- ============================================================================
-- CLEANUP
-- ============================================================================
DELETE FROM public.chat_messages WHERE chat_id IN (SELECT chat_id FROM public.chats WHERE title LIKE 'RLS Chats Write Test%');
DELETE FROM public.chats WHERE title LIKE 'RLS Chats Write Test%';
DELETE FROM public.users WHERE email LIKE 'rls_chats_write_test_%';
DELETE FROM auth.users WHERE email LIKE 'rls_chats_write_test_%';

-- ============================================================================
-- SETUP
-- ============================================================================

-- Auth users
INSERT INTO auth.users (id, email, encrypted_password, aud, role, email_confirmed_at, created_at) VALUES 
  ('99990007-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'rls_chats_write_test_alpha@test.com', crypt('password', gen_salt('bf')), 'authenticated', 'authenticated', now(), now()),
  ('99990007-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'rls_chats_write_test_beta@test.com', crypt('password', gen_salt('bf')), 'authenticated', 'authenticated', now(), now());

-- Public users
INSERT INTO public.users (user_id, auth_user_id, first_name, last_name, email) VALUES 
  ('99990007-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '99990007-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'RLS', 'ChatsAlpha', 'rls_chats_write_test_alpha@test.com'),
  ('99990007-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '99990007-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'RLS', 'ChatsBeta', 'rls_chats_write_test_beta@test.com');

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
-- TESTS: Chats INSERT
-- ============================================================================
SELECT tests.authenticate_as('99990007-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid);

-- User Alpha can insert their own chat
SELECT lives_ok(
  $$INSERT INTO public.chats (chat_id, user_id, title, created_at, updated_at) 
    VALUES ('0000d007-000d-000d-000d-00000000000a'::uuid, '99990007-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'RLS Chats Write Test Alpha Chat', now(), now())$$,
  'User Alpha can INSERT their own chat'
);

-- User Alpha cannot insert a chat for another user
SELECT throws_ok(
  $$INSERT INTO public.chats (chat_id, user_id, title, created_at, updated_at) 
    VALUES ('0000d007-000d-000d-000d-00000000000b'::uuid, '99990007-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'RLS Chats Write Test Fake Beta Chat', now(), now())$$,
  'new row violates row-level security policy for table "chats"',
  'User Alpha cannot INSERT a chat for another user'
);

-- ============================================================================
-- TESTS: Chat Messages INSERT
-- ============================================================================
-- User Alpha can insert message into their own chat
SELECT lives_ok(
  $$INSERT INTO public.chat_messages (message_id, chat_id, role, parts, created_at) 
    VALUES ('0000e007-000e-000e-000e-00000000000a'::uuid, '0000d007-000d-000d-000d-00000000000a'::uuid, 'user', '{"text": "Test message"}'::json, now())$$,
  'User Alpha can INSERT message into their own chat'
);

-- ============================================================================
-- TESTS: Chats UPDATE
-- ============================================================================
-- User Alpha can update their own chat
SELECT lives_ok(
  $$UPDATE public.chats SET title = 'RLS Chats Write Test Alpha Chat Updated' WHERE chat_id = '0000d007-000d-000d-000d-00000000000a'::uuid$$,
  'User Alpha can UPDATE their own chat'
);

-- ============================================================================
-- TESTS: Chat Messages UPDATE
-- ============================================================================
-- User Alpha can update messages in their own chat
SELECT lives_ok(
  $$UPDATE public.chat_messages SET parts = '{"text": "Updated message"}'::json WHERE message_id = '0000e007-000e-000e-000e-00000000000a'::uuid$$,
  'User Alpha can UPDATE messages in their own chat'
);

-- ============================================================================
-- Create Beta's chat for cross-user tests
-- ============================================================================
SELECT tests.authenticate_as('99990007-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid);

SELECT lives_ok(
  $$INSERT INTO public.chats (chat_id, user_id, title, created_at, updated_at) 
    VALUES ('0000d007-000d-000d-000d-00000000000c'::uuid, '99990007-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'RLS Chats Write Test Beta Chat', now(), now())$$,
  'User Beta can INSERT their own chat'
);

SELECT lives_ok(
  $$INSERT INTO public.chat_messages (message_id, chat_id, role, parts, created_at) 
    VALUES ('0000e007-000e-000e-000e-00000000000c'::uuid, '0000d007-000d-000d-000d-00000000000c'::uuid, 'user', '{"text": "Beta message"}'::json, now())$$,
  'User Beta can INSERT message into their own chat'
);

-- ============================================================================
-- TESTS: Cross-user restrictions
-- ============================================================================
-- User Beta cannot update Alpha's chat
SELECT is(
  (SELECT COUNT(*) FROM public.chats WHERE chat_id = '0000d007-000d-000d-000d-00000000000a'::uuid)::integer,
  0, 'User Beta cannot see Alpha chat (so cannot update it)'
);

-- User Beta cannot insert message into Alpha's chat
SELECT throws_ok(
  $$INSERT INTO public.chat_messages (message_id, chat_id, role, parts, created_at) 
    VALUES ('0000e007-000e-000e-000e-00000000000d'::uuid, '0000d007-000d-000d-000d-00000000000a'::uuid, 'user', '{"text": "Sneaky message"}'::json, now())$$,
  'new row violates row-level security policy for table "chat_messages"',
  'User Beta cannot INSERT message into Alpha chat'
);

-- ============================================================================
-- TESTS: Chat Messages DELETE
-- ============================================================================
SELECT tests.authenticate_as('99990007-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid);

SELECT lives_ok(
  $$DELETE FROM public.chat_messages WHERE message_id = '0000e007-000e-000e-000e-00000000000a'::uuid$$,
  'User Alpha can DELETE messages from their own chat'
);

-- ============================================================================
-- TESTS: Chats DELETE
-- ============================================================================
SELECT lives_ok(
  $$DELETE FROM public.chats WHERE chat_id = '0000d007-000d-000d-000d-00000000000a'::uuid$$,
  'User Alpha can DELETE their own chat'
);

SELECT * FROM finish();
ROLLBACK;

