-- This file was created to attempt to repair a schema/migration drift.
-- Production had an untracked migration (probably from a db pull/push) called "remote_schema"
-- Dev had changes that weren't represented in migration files.
-- This file was created by diffing my local DB (with all migrations applied up to 20251024160500) against Dev

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION config.set_customer_config_values(p_customer_id uuid, p_key_values jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$DECLARE
  kv RECORD;
  v jsonb;
  actual_value jsonb;
  actual_is_secret boolean := false;
BEGIN
  -- ensure no search_path surprises
  PERFORM set_config('search_path', '', true);

  -- iterate keys in the jsonb object
  FOR kv IN SELECT key, value FROM jsonb_each(p_key_values) LOOP
    v := kv.value;
    actual_value := NULL;
    actual_is_secret := false;
    -- support two formats:
    -- 1) "key": <json_value>
    -- 2) "key": { "value": <json_value>, "is_secret": true/false }
    IF v ? 'value' THEN
      actual_value := v -> 'value';
    ELSE
      actual_value := v;
    END IF;

    IF v ? 'is_secret' THEN
      actual_is_secret := (v ->> 'is_secret')::boolean;
    END IF;

    INSERT INTO config.configuration (config_id, config_key, value, is_secret, customer_id, created_at, updated_at)
    VALUES (gen_random_uuid(), kv.key, actual_value, actual_is_secret, p_customer_id, now(), now())
    ON CONFLICT (customer_id, config_key)
    DO UPDATE
    SET
      value = EXCLUDED.value,
      is_secret = EXCLUDED.is_secret,
      updated_at = now();
  END LOOP;

  RETURN;
END;$function$
;


create extension if not exists "hypopg" with schema "extensions";

create extension if not exists "index_advisor" with schema "extensions";


revoke delete on table "public"."chat_message_feedback" from "anon";

revoke insert on table "public"."chat_message_feedback" from "anon";

revoke references on table "public"."chat_message_feedback" from "anon";

revoke select on table "public"."chat_message_feedback" from "anon";

revoke trigger on table "public"."chat_message_feedback" from "anon";

revoke truncate on table "public"."chat_message_feedback" from "anon";

revoke update on table "public"."chat_message_feedback" from "anon";

revoke delete on table "public"."chat_message_feedback" from "authenticated";

revoke insert on table "public"."chat_message_feedback" from "authenticated";

revoke references on table "public"."chat_message_feedback" from "authenticated";

revoke select on table "public"."chat_message_feedback" from "authenticated";

revoke trigger on table "public"."chat_message_feedback" from "authenticated";

revoke truncate on table "public"."chat_message_feedback" from "authenticated";

revoke update on table "public"."chat_message_feedback" from "authenticated";

revoke delete on table "public"."chat_message_feedback" from "service_role";

revoke insert on table "public"."chat_message_feedback" from "service_role";

revoke references on table "public"."chat_message_feedback" from "service_role";

revoke select on table "public"."chat_message_feedback" from "service_role";

revoke trigger on table "public"."chat_message_feedback" from "service_role";

revoke truncate on table "public"."chat_message_feedback" from "service_role";

revoke update on table "public"."chat_message_feedback" from "service_role";

revoke delete on table "public"."chat_messages" from "anon";

revoke insert on table "public"."chat_messages" from "anon";

revoke references on table "public"."chat_messages" from "anon";

revoke select on table "public"."chat_messages" from "anon";

revoke trigger on table "public"."chat_messages" from "anon";

revoke truncate on table "public"."chat_messages" from "anon";

revoke update on table "public"."chat_messages" from "anon";

revoke delete on table "public"."chat_messages" from "authenticated";

revoke insert on table "public"."chat_messages" from "authenticated";

revoke references on table "public"."chat_messages" from "authenticated";

revoke select on table "public"."chat_messages" from "authenticated";

revoke trigger on table "public"."chat_messages" from "authenticated";

revoke truncate on table "public"."chat_messages" from "authenticated";

revoke update on table "public"."chat_messages" from "authenticated";

revoke delete on table "public"."chat_messages" from "service_role";

revoke insert on table "public"."chat_messages" from "service_role";

revoke references on table "public"."chat_messages" from "service_role";

revoke select on table "public"."chat_messages" from "service_role";

revoke trigger on table "public"."chat_messages" from "service_role";

revoke truncate on table "public"."chat_messages" from "service_role";

revoke update on table "public"."chat_messages" from "service_role";

revoke delete on table "public"."chats" from "anon";

revoke insert on table "public"."chats" from "anon";

revoke references on table "public"."chats" from "anon";

revoke select on table "public"."chats" from "anon";

revoke trigger on table "public"."chats" from "anon";

revoke truncate on table "public"."chats" from "anon";

revoke update on table "public"."chats" from "anon";

revoke delete on table "public"."chats" from "authenticated";

revoke insert on table "public"."chats" from "authenticated";

revoke references on table "public"."chats" from "authenticated";

revoke select on table "public"."chats" from "authenticated";

revoke trigger on table "public"."chats" from "authenticated";

revoke truncate on table "public"."chats" from "authenticated";

revoke update on table "public"."chats" from "authenticated";

revoke delete on table "public"."chats" from "service_role";

revoke insert on table "public"."chats" from "service_role";

revoke references on table "public"."chats" from "service_role";

revoke select on table "public"."chats" from "service_role";

revoke trigger on table "public"."chats" from "service_role";

revoke truncate on table "public"."chats" from "service_role";

revoke update on table "public"."chats" from "service_role";

revoke delete on table "public"."contacts" from "anon";

revoke insert on table "public"."contacts" from "anon";

revoke references on table "public"."contacts" from "anon";

revoke select on table "public"."contacts" from "anon";

revoke trigger on table "public"."contacts" from "anon";

revoke truncate on table "public"."contacts" from "anon";

revoke update on table "public"."contacts" from "anon";

revoke delete on table "public"."contacts" from "authenticated";

revoke insert on table "public"."contacts" from "authenticated";

revoke references on table "public"."contacts" from "authenticated";

revoke select on table "public"."contacts" from "authenticated";

revoke trigger on table "public"."contacts" from "authenticated";

revoke truncate on table "public"."contacts" from "authenticated";

revoke update on table "public"."contacts" from "authenticated";

revoke delete on table "public"."contacts" from "service_role";

revoke insert on table "public"."contacts" from "service_role";

revoke references on table "public"."contacts" from "service_role";

revoke select on table "public"."contacts" from "service_role";

revoke trigger on table "public"."contacts" from "service_role";

revoke truncate on table "public"."contacts" from "service_role";

revoke update on table "public"."contacts" from "service_role";

revoke delete on table "public"."courses" from "anon";

revoke insert on table "public"."courses" from "anon";

revoke references on table "public"."courses" from "anon";

revoke select on table "public"."courses" from "anon";

revoke trigger on table "public"."courses" from "anon";

revoke truncate on table "public"."courses" from "anon";

revoke update on table "public"."courses" from "anon";

revoke delete on table "public"."courses" from "authenticated";

revoke insert on table "public"."courses" from "authenticated";

revoke references on table "public"."courses" from "authenticated";

revoke select on table "public"."courses" from "authenticated";

revoke trigger on table "public"."courses" from "authenticated";

revoke truncate on table "public"."courses" from "authenticated";

revoke update on table "public"."courses" from "authenticated";

revoke delete on table "public"."courses" from "service_role";

revoke insert on table "public"."courses" from "service_role";

revoke references on table "public"."courses" from "service_role";

revoke select on table "public"."courses" from "service_role";

revoke trigger on table "public"."courses" from "service_role";

revoke truncate on table "public"."courses" from "service_role";

revoke update on table "public"."courses" from "service_role";

revoke delete on table "public"."customers" from "anon";

revoke insert on table "public"."customers" from "anon";

revoke references on table "public"."customers" from "anon";

revoke select on table "public"."customers" from "anon";

revoke trigger on table "public"."customers" from "anon";

revoke truncate on table "public"."customers" from "anon";

revoke update on table "public"."customers" from "anon";

revoke delete on table "public"."customers" from "authenticated";

revoke insert on table "public"."customers" from "authenticated";

revoke references on table "public"."customers" from "authenticated";

revoke select on table "public"."customers" from "authenticated";

revoke trigger on table "public"."customers" from "authenticated";

revoke truncate on table "public"."customers" from "authenticated";

revoke update on table "public"."customers" from "authenticated";

revoke delete on table "public"."customers" from "service_role";

revoke insert on table "public"."customers" from "service_role";

revoke references on table "public"."customers" from "service_role";

revoke select on table "public"."customers" from "service_role";

revoke trigger on table "public"."customers" from "service_role";

revoke truncate on table "public"."customers" from "service_role";

revoke update on table "public"."customers" from "service_role";

revoke delete on table "public"."meeting_notes" from "anon";

revoke insert on table "public"."meeting_notes" from "anon";

revoke references on table "public"."meeting_notes" from "anon";

revoke select on table "public"."meeting_notes" from "anon";

revoke trigger on table "public"."meeting_notes" from "anon";

revoke truncate on table "public"."meeting_notes" from "anon";

revoke update on table "public"."meeting_notes" from "anon";

revoke delete on table "public"."meeting_notes" from "authenticated";

revoke insert on table "public"."meeting_notes" from "authenticated";

revoke references on table "public"."meeting_notes" from "authenticated";

revoke select on table "public"."meeting_notes" from "authenticated";

revoke trigger on table "public"."meeting_notes" from "authenticated";

revoke truncate on table "public"."meeting_notes" from "authenticated";

revoke update on table "public"."meeting_notes" from "authenticated";

revoke delete on table "public"."meeting_notes" from "service_role";

revoke insert on table "public"."meeting_notes" from "service_role";

revoke references on table "public"."meeting_notes" from "service_role";

revoke select on table "public"."meeting_notes" from "service_role";

revoke trigger on table "public"."meeting_notes" from "service_role";

revoke truncate on table "public"."meeting_notes" from "service_role";

revoke update on table "public"."meeting_notes" from "service_role";

revoke delete on table "public"."reports" from "anon";

revoke insert on table "public"."reports" from "anon";

revoke references on table "public"."reports" from "anon";

revoke select on table "public"."reports" from "anon";

revoke trigger on table "public"."reports" from "anon";

revoke truncate on table "public"."reports" from "anon";

revoke update on table "public"."reports" from "anon";

revoke delete on table "public"."reports" from "authenticated";

revoke insert on table "public"."reports" from "authenticated";

revoke references on table "public"."reports" from "authenticated";

revoke select on table "public"."reports" from "authenticated";

revoke trigger on table "public"."reports" from "authenticated";

revoke truncate on table "public"."reports" from "authenticated";

revoke update on table "public"."reports" from "authenticated";

revoke delete on table "public"."reports" from "service_role";

revoke insert on table "public"."reports" from "service_role";

revoke references on table "public"."reports" from "service_role";

revoke select on table "public"."reports" from "service_role";

revoke trigger on table "public"."reports" from "service_role";

revoke truncate on table "public"."reports" from "service_role";

revoke update on table "public"."reports" from "service_role";

revoke delete on table "public"."school_student_link" from "anon";

revoke insert on table "public"."school_student_link" from "anon";

revoke references on table "public"."school_student_link" from "anon";

revoke select on table "public"."school_student_link" from "anon";

revoke trigger on table "public"."school_student_link" from "anon";

revoke truncate on table "public"."school_student_link" from "anon";

revoke update on table "public"."school_student_link" from "anon";

revoke delete on table "public"."school_student_link" from "authenticated";

revoke insert on table "public"."school_student_link" from "authenticated";

revoke references on table "public"."school_student_link" from "authenticated";

revoke select on table "public"."school_student_link" from "authenticated";

revoke trigger on table "public"."school_student_link" from "authenticated";

revoke truncate on table "public"."school_student_link" from "authenticated";

revoke update on table "public"."school_student_link" from "authenticated";

revoke delete on table "public"."school_student_link" from "service_role";

revoke insert on table "public"."school_student_link" from "service_role";

revoke references on table "public"."school_student_link" from "service_role";

revoke select on table "public"."school_student_link" from "service_role";

revoke trigger on table "public"."school_student_link" from "service_role";

revoke truncate on table "public"."school_student_link" from "service_role";

revoke update on table "public"."school_student_link" from "service_role";

revoke delete on table "public"."schools" from "anon";

revoke insert on table "public"."schools" from "anon";

revoke references on table "public"."schools" from "anon";

revoke select on table "public"."schools" from "anon";

revoke trigger on table "public"."schools" from "anon";

revoke truncate on table "public"."schools" from "anon";

revoke update on table "public"."schools" from "anon";

revoke delete on table "public"."schools" from "authenticated";

revoke insert on table "public"."schools" from "authenticated";

revoke references on table "public"."schools" from "authenticated";

revoke select on table "public"."schools" from "authenticated";

revoke trigger on table "public"."schools" from "authenticated";

revoke truncate on table "public"."schools" from "authenticated";

revoke update on table "public"."schools" from "authenticated";

revoke delete on table "public"."schools" from "service_role";

revoke insert on table "public"."schools" from "service_role";

revoke references on table "public"."schools" from "service_role";

revoke select on table "public"."schools" from "service_role";

revoke trigger on table "public"."schools" from "service_role";

revoke truncate on table "public"."schools" from "service_role";

revoke update on table "public"."schools" from "service_role";

revoke delete on table "public"."section_enrollments" from "anon";

revoke insert on table "public"."section_enrollments" from "anon";

revoke references on table "public"."section_enrollments" from "anon";

revoke select on table "public"."section_enrollments" from "anon";

revoke trigger on table "public"."section_enrollments" from "anon";

revoke truncate on table "public"."section_enrollments" from "anon";

revoke update on table "public"."section_enrollments" from "anon";

revoke delete on table "public"."section_enrollments" from "authenticated";

revoke insert on table "public"."section_enrollments" from "authenticated";

revoke references on table "public"."section_enrollments" from "authenticated";

revoke select on table "public"."section_enrollments" from "authenticated";

revoke trigger on table "public"."section_enrollments" from "authenticated";

revoke truncate on table "public"."section_enrollments" from "authenticated";

revoke update on table "public"."section_enrollments" from "authenticated";

revoke delete on table "public"."section_enrollments" from "service_role";

revoke insert on table "public"."section_enrollments" from "service_role";

revoke references on table "public"."section_enrollments" from "service_role";

revoke select on table "public"."section_enrollments" from "service_role";

revoke trigger on table "public"."section_enrollments" from "service_role";

revoke truncate on table "public"."section_enrollments" from "service_role";

revoke update on table "public"."section_enrollments" from "service_role";

revoke delete on table "public"."sections" from "anon";

revoke insert on table "public"."sections" from "anon";

revoke references on table "public"."sections" from "anon";

revoke select on table "public"."sections" from "anon";

revoke trigger on table "public"."sections" from "anon";

revoke truncate on table "public"."sections" from "anon";

revoke update on table "public"."sections" from "anon";

revoke delete on table "public"."sections" from "authenticated";

revoke insert on table "public"."sections" from "authenticated";

revoke references on table "public"."sections" from "authenticated";

revoke select on table "public"."sections" from "authenticated";

revoke trigger on table "public"."sections" from "authenticated";

revoke truncate on table "public"."sections" from "authenticated";

revoke update on table "public"."sections" from "authenticated";

revoke delete on table "public"."sections" from "service_role";

revoke insert on table "public"."sections" from "service_role";

revoke references on table "public"."sections" from "service_role";

revoke select on table "public"."sections" from "service_role";

revoke trigger on table "public"."sections" from "service_role";

revoke truncate on table "public"."sections" from "service_role";

revoke update on table "public"."sections" from "service_role";

revoke delete on table "public"."student_contact_relationships" from "anon";

revoke insert on table "public"."student_contact_relationships" from "anon";

revoke references on table "public"."student_contact_relationships" from "anon";

revoke select on table "public"."student_contact_relationships" from "anon";

revoke trigger on table "public"."student_contact_relationships" from "anon";

revoke truncate on table "public"."student_contact_relationships" from "anon";

revoke update on table "public"."student_contact_relationships" from "anon";

revoke delete on table "public"."student_contact_relationships" from "authenticated";

revoke insert on table "public"."student_contact_relationships" from "authenticated";

revoke references on table "public"."student_contact_relationships" from "authenticated";

revoke select on table "public"."student_contact_relationships" from "authenticated";

revoke trigger on table "public"."student_contact_relationships" from "authenticated";

revoke truncate on table "public"."student_contact_relationships" from "authenticated";

revoke update on table "public"."student_contact_relationships" from "authenticated";

revoke delete on table "public"."student_contact_relationships" from "service_role";

revoke insert on table "public"."student_contact_relationships" from "service_role";

revoke references on table "public"."student_contact_relationships" from "service_role";

revoke select on table "public"."student_contact_relationships" from "service_role";

revoke trigger on table "public"."student_contact_relationships" from "service_role";

revoke truncate on table "public"."student_contact_relationships" from "service_role";

revoke update on table "public"."student_contact_relationships" from "service_role";

revoke delete on table "public"."student_daily_absences" from "anon";

revoke insert on table "public"."student_daily_absences" from "anon";

revoke references on table "public"."student_daily_absences" from "anon";

revoke select on table "public"."student_daily_absences" from "anon";

revoke trigger on table "public"."student_daily_absences" from "anon";

revoke truncate on table "public"."student_daily_absences" from "anon";

revoke update on table "public"."student_daily_absences" from "anon";

revoke delete on table "public"."student_daily_absences" from "authenticated";

revoke insert on table "public"."student_daily_absences" from "authenticated";

revoke references on table "public"."student_daily_absences" from "authenticated";

revoke select on table "public"."student_daily_absences" from "authenticated";

revoke trigger on table "public"."student_daily_absences" from "authenticated";

revoke truncate on table "public"."student_daily_absences" from "authenticated";

revoke update on table "public"."student_daily_absences" from "authenticated";

revoke delete on table "public"."student_daily_absences" from "service_role";

revoke insert on table "public"."student_daily_absences" from "service_role";

revoke references on table "public"."student_daily_absences" from "service_role";

revoke select on table "public"."student_daily_absences" from "service_role";

revoke trigger on table "public"."student_daily_absences" from "service_role";

revoke truncate on table "public"."student_daily_absences" from "service_role";

revoke update on table "public"."student_daily_absences" from "service_role";

revoke delete on table "public"."student_grades" from "anon";

revoke insert on table "public"."student_grades" from "anon";

revoke references on table "public"."student_grades" from "anon";

revoke select on table "public"."student_grades" from "anon";

revoke trigger on table "public"."student_grades" from "anon";

revoke truncate on table "public"."student_grades" from "anon";

revoke update on table "public"."student_grades" from "anon";

revoke delete on table "public"."student_grades" from "authenticated";

revoke insert on table "public"."student_grades" from "authenticated";

revoke references on table "public"."student_grades" from "authenticated";

revoke select on table "public"."student_grades" from "authenticated";

revoke trigger on table "public"."student_grades" from "authenticated";

revoke truncate on table "public"."student_grades" from "authenticated";

revoke update on table "public"."student_grades" from "authenticated";

revoke delete on table "public"."student_grades" from "service_role";

revoke insert on table "public"."student_grades" from "service_role";

revoke references on table "public"."student_grades" from "service_role";

revoke select on table "public"."student_grades" from "service_role";

revoke trigger on table "public"."student_grades" from "service_role";

revoke truncate on table "public"."student_grades" from "service_role";

revoke update on table "public"."student_grades" from "service_role";

revoke delete on table "public"."student_tags" from "anon";

revoke insert on table "public"."student_tags" from "anon";

revoke references on table "public"."student_tags" from "anon";

revoke select on table "public"."student_tags" from "anon";

revoke trigger on table "public"."student_tags" from "anon";

revoke truncate on table "public"."student_tags" from "anon";

revoke update on table "public"."student_tags" from "anon";

revoke delete on table "public"."student_tags" from "authenticated";

revoke insert on table "public"."student_tags" from "authenticated";

revoke references on table "public"."student_tags" from "authenticated";

revoke select on table "public"."student_tags" from "authenticated";

revoke trigger on table "public"."student_tags" from "authenticated";

revoke truncate on table "public"."student_tags" from "authenticated";

revoke update on table "public"."student_tags" from "authenticated";

revoke delete on table "public"."student_tags" from "service_role";

revoke insert on table "public"."student_tags" from "service_role";

revoke references on table "public"."student_tags" from "service_role";

revoke select on table "public"."student_tags" from "service_role";

revoke trigger on table "public"."student_tags" from "service_role";

revoke truncate on table "public"."student_tags" from "service_role";

revoke update on table "public"."student_tags" from "service_role";

revoke delete on table "public"."students" from "anon";

revoke insert on table "public"."students" from "anon";

revoke references on table "public"."students" from "anon";

revoke select on table "public"."students" from "anon";

revoke trigger on table "public"."students" from "anon";

revoke truncate on table "public"."students" from "anon";

revoke update on table "public"."students" from "anon";

revoke delete on table "public"."students" from "authenticated";

revoke insert on table "public"."students" from "authenticated";

revoke references on table "public"."students" from "authenticated";

revoke select on table "public"."students" from "authenticated";

revoke trigger on table "public"."students" from "authenticated";

revoke truncate on table "public"."students" from "authenticated";

revoke update on table "public"."students" from "authenticated";

revoke delete on table "public"."students" from "service_role";

revoke insert on table "public"."students" from "service_role";

revoke references on table "public"."students" from "service_role";

revoke select on table "public"."students" from "service_role";

revoke trigger on table "public"."students" from "service_role";

revoke truncate on table "public"."students" from "service_role";

revoke update on table "public"."students" from "service_role";

revoke delete on table "public"."tag_canonical_values" from "anon";

revoke insert on table "public"."tag_canonical_values" from "anon";

revoke references on table "public"."tag_canonical_values" from "anon";

revoke select on table "public"."tag_canonical_values" from "anon";

revoke trigger on table "public"."tag_canonical_values" from "anon";

revoke truncate on table "public"."tag_canonical_values" from "anon";

revoke update on table "public"."tag_canonical_values" from "anon";

revoke delete on table "public"."tag_canonical_values" from "authenticated";

revoke insert on table "public"."tag_canonical_values" from "authenticated";

revoke references on table "public"."tag_canonical_values" from "authenticated";

revoke select on table "public"."tag_canonical_values" from "authenticated";

revoke trigger on table "public"."tag_canonical_values" from "authenticated";

revoke truncate on table "public"."tag_canonical_values" from "authenticated";

revoke update on table "public"."tag_canonical_values" from "authenticated";

revoke delete on table "public"."tag_canonical_values" from "service_role";

revoke insert on table "public"."tag_canonical_values" from "service_role";

revoke references on table "public"."tag_canonical_values" from "service_role";

revoke select on table "public"."tag_canonical_values" from "service_role";

revoke trigger on table "public"."tag_canonical_values" from "service_role";

revoke truncate on table "public"."tag_canonical_values" from "service_role";

revoke update on table "public"."tag_canonical_values" from "service_role";

revoke delete on table "public"."tag_categories" from "anon";

revoke insert on table "public"."tag_categories" from "anon";

revoke references on table "public"."tag_categories" from "anon";

revoke select on table "public"."tag_categories" from "anon";

revoke trigger on table "public"."tag_categories" from "anon";

revoke truncate on table "public"."tag_categories" from "anon";

revoke update on table "public"."tag_categories" from "anon";

revoke delete on table "public"."tag_categories" from "authenticated";

revoke insert on table "public"."tag_categories" from "authenticated";

revoke references on table "public"."tag_categories" from "authenticated";

revoke select on table "public"."tag_categories" from "authenticated";

revoke trigger on table "public"."tag_categories" from "authenticated";

revoke truncate on table "public"."tag_categories" from "authenticated";

revoke update on table "public"."tag_categories" from "authenticated";

revoke delete on table "public"."tag_categories" from "service_role";

revoke insert on table "public"."tag_categories" from "service_role";

revoke references on table "public"."tag_categories" from "service_role";

revoke select on table "public"."tag_categories" from "service_role";

revoke trigger on table "public"."tag_categories" from "service_role";

revoke truncate on table "public"."tag_categories" from "service_role";

revoke update on table "public"."tag_categories" from "service_role";

revoke delete on table "public"."tags" from "anon";

revoke insert on table "public"."tags" from "anon";

revoke references on table "public"."tags" from "anon";

revoke select on table "public"."tags" from "anon";

revoke trigger on table "public"."tags" from "anon";

revoke truncate on table "public"."tags" from "anon";

revoke update on table "public"."tags" from "anon";

revoke delete on table "public"."tags" from "authenticated";

revoke insert on table "public"."tags" from "authenticated";

revoke references on table "public"."tags" from "authenticated";

revoke select on table "public"."tags" from "authenticated";

revoke trigger on table "public"."tags" from "authenticated";

revoke truncate on table "public"."tags" from "authenticated";

revoke update on table "public"."tags" from "authenticated";

revoke delete on table "public"."tags" from "service_role";

revoke insert on table "public"."tags" from "service_role";

revoke references on table "public"."tags" from "service_role";

revoke select on table "public"."tags" from "service_role";

revoke trigger on table "public"."tags" from "service_role";

revoke truncate on table "public"."tags" from "service_role";

revoke update on table "public"."tags" from "service_role";

revoke delete on table "public"."terms" from "anon";

revoke insert on table "public"."terms" from "anon";

revoke references on table "public"."terms" from "anon";

revoke select on table "public"."terms" from "anon";

revoke trigger on table "public"."terms" from "anon";

revoke truncate on table "public"."terms" from "anon";

revoke update on table "public"."terms" from "anon";

revoke delete on table "public"."terms" from "authenticated";

revoke insert on table "public"."terms" from "authenticated";

revoke references on table "public"."terms" from "authenticated";

revoke select on table "public"."terms" from "authenticated";

revoke trigger on table "public"."terms" from "authenticated";

revoke truncate on table "public"."terms" from "authenticated";

revoke update on table "public"."terms" from "authenticated";

revoke delete on table "public"."terms" from "service_role";

revoke insert on table "public"."terms" from "service_role";

revoke references on table "public"."terms" from "service_role";

revoke select on table "public"."terms" from "service_role";

revoke trigger on table "public"."terms" from "service_role";

revoke truncate on table "public"."terms" from "service_role";

revoke update on table "public"."terms" from "service_role";

revoke delete on table "public"."user_school_memberships" from "anon";

revoke insert on table "public"."user_school_memberships" from "anon";

revoke references on table "public"."user_school_memberships" from "anon";

revoke select on table "public"."user_school_memberships" from "anon";

revoke trigger on table "public"."user_school_memberships" from "anon";

revoke truncate on table "public"."user_school_memberships" from "anon";

revoke update on table "public"."user_school_memberships" from "anon";

revoke delete on table "public"."user_school_memberships" from "authenticated";

revoke insert on table "public"."user_school_memberships" from "authenticated";

revoke references on table "public"."user_school_memberships" from "authenticated";

revoke select on table "public"."user_school_memberships" from "authenticated";

revoke trigger on table "public"."user_school_memberships" from "authenticated";

revoke truncate on table "public"."user_school_memberships" from "authenticated";

revoke update on table "public"."user_school_memberships" from "authenticated";

revoke delete on table "public"."user_school_memberships" from "service_role";

revoke insert on table "public"."user_school_memberships" from "service_role";

revoke references on table "public"."user_school_memberships" from "service_role";

revoke select on table "public"."user_school_memberships" from "service_role";

revoke trigger on table "public"."user_school_memberships" from "service_role";

revoke truncate on table "public"."user_school_memberships" from "service_role";

revoke update on table "public"."user_school_memberships" from "service_role";

revoke delete on table "public"."users" from "anon";

revoke insert on table "public"."users" from "anon";

revoke references on table "public"."users" from "anon";

revoke select on table "public"."users" from "anon";

revoke trigger on table "public"."users" from "anon";

revoke truncate on table "public"."users" from "anon";

revoke update on table "public"."users" from "anon";

revoke delete on table "public"."users" from "authenticated";

revoke insert on table "public"."users" from "authenticated";

revoke references on table "public"."users" from "authenticated";

revoke select on table "public"."users" from "authenticated";

revoke trigger on table "public"."users" from "authenticated";

revoke truncate on table "public"."users" from "authenticated";

revoke update on table "public"."users" from "authenticated";

revoke delete on table "public"."users" from "service_role";

revoke insert on table "public"."users" from "service_role";

revoke references on table "public"."users" from "service_role";

revoke select on table "public"."users" from "service_role";

revoke trigger on table "public"."users" from "service_role";

revoke truncate on table "public"."users" from "service_role";

revoke update on table "public"."users" from "service_role";

revoke delete on table "public"."years" from "anon";

revoke insert on table "public"."years" from "anon";

revoke references on table "public"."years" from "anon";

revoke select on table "public"."years" from "anon";

revoke trigger on table "public"."years" from "anon";

revoke truncate on table "public"."years" from "anon";

revoke update on table "public"."years" from "anon";

revoke delete on table "public"."years" from "authenticated";

revoke insert on table "public"."years" from "authenticated";

revoke references on table "public"."years" from "authenticated";

revoke select on table "public"."years" from "authenticated";

revoke trigger on table "public"."years" from "authenticated";

revoke truncate on table "public"."years" from "authenticated";

revoke update on table "public"."years" from "authenticated";

revoke delete on table "public"."years" from "service_role";

revoke insert on table "public"."years" from "service_role";

revoke references on table "public"."years" from "service_role";

revoke select on table "public"."years" from "service_role";

revoke trigger on table "public"."years" from "service_role";

revoke truncate on table "public"."years" from "service_role";

revoke update on table "public"."years" from "service_role";

alter table "public"."user_school_memberships" drop constraint "user_school_memberships_user_id_users_user_id_fk";

create table "public"."pipeline_error_log" (
    "id" uuid not null default gen_random_uuid(),
    "run_id" uuid,
    "customer_id" text,
    "table_name" text,
    "conflict_key" text,
    "error_message" text,
    "student_external_id" text,
    "school_external_id" text,
    "year_external_id" text,
    "section_external_id" text,
    "record" jsonb,
    "created_at" timestamp without time zone default now()
);


CREATE UNIQUE INDEX pipeline_error_log_pkey ON public.pipeline_error_log USING btree (id);

alter table "public"."pipeline_error_log" add constraint "pipeline_error_log_pkey" PRIMARY KEY using index "pipeline_error_log_pkey";

alter table "public"."user_school_memberships" add constraint "user_school_memberships_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE not valid;

alter table "public"."user_school_memberships" validate constraint "user_school_memberships_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.calculate_added_value_gpa_2(p_student_id uuid, p_grade_codes text[], p_credit_types text[], p_year_labels text[], p_grade_levels integer[])
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
  total_points    NUMERIC := 0;
  total_credits   NUMERIC := 0;
  gpa             NUMERIC := NULL;
BEGIN
  -- Optimized: Single query with year filtering inline
  SELECT
    COALESCE(SUM(sg.gpa_points), 0),
    COALESCE(COUNT(*), 0)
  INTO total_points, total_credits
  FROM student_grades sg
  JOIN sections s ON sg.section_id = s.section_id
  JOIN courses c ON s.course_id = c.course_id
  LEFT JOIN terms t ON sg.term_id = t.term_id
  LEFT JOIN years y ON t.year_id = y.year_id
  WHERE sg.student_id = p_student_id
    AND sg.grade_status = 'Final'
    AND sg.exclude_from_gpa IS FALSE
    AND (p_grade_codes  IS NULL OR sg.grade_code   = ANY(p_grade_codes))
    AND (p_credit_types IS NULL OR sg.credit_type  = ANY(p_credit_types))
    AND (p_year_labels  IS NULL OR y.name = ANY(p_year_labels))
    AND (p_grade_levels IS NULL OR sg.grade_level::integer = ANY(p_grade_levels));

  IF total_credits > 0 THEN
    gpa := total_points / total_credits;
  END IF;
  
  RETURN gpa;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_credit_hour_weighted_gpa_2(p_student_id uuid, p_grade_codes text[], p_credit_types text[], p_year_labels text[], p_grade_levels integer[])
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
  total_points    NUMERIC := 0;
  total_credits   NUMERIC := 0;
  gpa             NUMERIC := NULL;
BEGIN
  -- Optimized: Single query with year filtering inline
  SELECT
    COALESCE(SUM(sg.gpa_points * c.credit_hours), 0),
    COALESCE(SUM(c.credit_hours), 0)
  INTO total_points, total_credits
  FROM student_grades sg
  JOIN sections s ON sg.section_id = s.section_id
  JOIN courses c ON s.course_id = c.course_id
  LEFT JOIN terms t ON sg.term_id = t.term_id
  LEFT JOIN years y ON t.year_id = y.year_id
  WHERE sg.student_id = p_student_id
    AND sg.grade_status = 'Final'
    AND sg.exclude_from_gpa IS FALSE
    AND (p_grade_codes  IS NULL OR sg.grade_code   = ANY(p_grade_codes))
    AND (p_credit_types IS NULL OR sg.credit_type  = ANY(p_credit_types))
    AND (p_year_labels  IS NULL OR y.name = ANY(p_year_labels))
    AND (p_grade_levels IS NULL OR sg.grade_level::integer = ANY(p_grade_levels));

  IF total_credits > 0 THEN
    gpa := total_points / total_credits;
  END IF;
  
  RETURN gpa;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_gpa_dispatch_2(p_student_id uuid, p_method text DEFAULT NULL::text, p_grade_codes text[] DEFAULT NULL::text[], p_credit_types text[] DEFAULT NULL::text[], p_year_labels text[] DEFAULT NULL::text[], p_grade_levels integer[] DEFAULT NULL::integer[])
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
  resolved_method TEXT;
  school_id_val   UUID;
  customer_id_val UUID;
  gpa             NUMERIC;
  config_value    JSONB;
BEGIN
  -- Minimal logging for performance
  RAISE NOTICE 'calculate_gpa_dispatch: student_id=%, method=%', p_student_id, p_method;
  -- Optimized: Get school and customer info in one query
  SELECT ssl.school_id, s.customer_id, s.gpa_config->>'default_method'
  INTO school_id_val, customer_id_val, resolved_method
  FROM school_student_link ssl
  LEFT JOIN schools s ON ssl.school_id = s.school_id
  WHERE ssl.student_id = p_student_id
  ORDER BY ssl.start_date DESC
  LIMIT 1;

  -- If p_method is NULL, look up the default method from configurations
  IF p_method IS NULL THEN
    -- First try to get method from customer-level configuration (optimized single query)
    IF customer_id_val IS NOT NULL THEN
      SELECT pc.value INTO config_value
      FROM public_configuration pc
      WHERE pc.config_key = 'gpa_grade_levels'
        AND pc.customer_id = customer_id_val
        AND pc.school_id IS NULL
        AND pc.user_id IS NULL
      LIMIT 1;
      
      IF config_value IS NOT NULL THEN
        resolved_method := config_value->>'default_method';
        -- Parse grade codes from config if available
        IF config_value ? 'grade_codes' THEN
          p_grade_codes := ARRAY(SELECT jsonb_array_elements_text(config_value->'grade_codes'));
        END IF;
      END IF;
    END IF;
  ELSE
    resolved_method := p_method;
  END IF;

  -- Default to 'simple' if no method is resolved
  IF resolved_method IS NULL THEN
    resolved_method := 'simple';
  END IF;

  -- Dispatch to the correct calculation function based on the method
  CASE resolved_method
    WHEN 'simple' THEN
      SELECT calculate_simple_gpa_2(
        p_student_id,
        p_grade_codes,
        p_credit_types,
        p_year_labels,
        p_grade_levels
      ) INTO gpa;
    WHEN 'added_value' THEN
      SELECT calculate_added_value_gpa_2(
        p_student_id,
        p_grade_codes,
        p_credit_types,
        p_year_labels,
        p_grade_levels
      ) INTO gpa;
    WHEN 'credit_hour_weighted' THEN
      SELECT calculate_credit_hour_weighted_gpa_2(
        p_student_id,
        p_grade_codes,
        p_credit_types,
        p_year_labels,
        p_grade_levels
      ) INTO gpa;
    ELSE
      RAISE EXCEPTION 'Unknown GPA calculation method: %', resolved_method;
  END CASE;

  RETURN gpa;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_gpa_for_students_2(p_student_ids uuid[], p_method text DEFAULT NULL::text, p_grade_codes text[] DEFAULT NULL::text[], p_credit_types text[] DEFAULT NULL::text[], p_year_labels text[] DEFAULT NULL::text[], p_grade_levels integer[] DEFAULT NULL::integer[])
 RETURNS TABLE(student_id uuid, gpa numeric)
 LANGUAGE plpgsql
AS $function$
DECLARE
    school_row RECORD;
    resolved_method TEXT;
BEGIN
    -- Get the school for the first student to determine the GPA calculation method
    SELECT s.* INTO school_row
    FROM schools s
    JOIN school_student_link ssl ON s.school_id = ssl.school_id
    WHERE ssl.student_id = p_student_ids[1]
    ORDER BY ssl.start_date DESC
    LIMIT 1;

    IF p_method IS NOT NULL THEN
        resolved_method := p_method;
    ELSIF school_row IS NOT NULL THEN
        -- Determine the method from gpa_config
        resolved_method := COALESCE((school_row.gpa_config->>'default_method')::TEXT, 'simple');
    ELSE
        -- Default to simple if school not found
        resolved_method := 'simple';
    END IF;

    -- Using the determined method, calculate GPA for all students in the list.
    RETURN QUERY
    SELECT
        s.id as student_id,
        calculate_gpa_dispatch_2(
            s.id, 
            resolved_method, 
            p_grade_codes, 
            p_credit_types, 
            p_year_labels,
            p_grade_levels
        ) as gpa
    FROM
        unnest(p_student_ids) AS s(id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_gpa_for_students_2(p_student_ids uuid[], p_method text DEFAULT NULL::text, p_grade_codes text[] DEFAULT NULL::text[], p_credit_types text[] DEFAULT NULL::text[], p_year_labels text[] DEFAULT NULL::text[], p_grade_levels integer[] DEFAULT NULL::integer[], p_customer_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(student_id uuid, gpa numeric)
 LANGUAGE plpgsql
AS $function$
DECLARE
    school_row RECORD;
    resolved_method TEXT;
    customer_id_val UUID;
BEGIN
    -- Get the school for the first student to determine the GPA calculation method
    SELECT s.* INTO school_row
    FROM schools s
    JOIN school_student_link ssl ON s.school_id = ssl.school_id
    WHERE ssl.student_id = p_student_ids[1]
    ORDER BY ssl.start_date DESC
    LIMIT 1;

    -- Determine customer_id
    IF p_customer_id IS NOT NULL THEN
        customer_id_val := p_customer_id;
    ELSIF school_row IS NOT NULL THEN
        customer_id_val := school_row.customer_id;
    END IF;

    IF p_method IS NOT NULL THEN
        resolved_method := p_method;
    ELSIF school_row IS NOT NULL THEN
        -- Determine the method from gpa_config
        resolved_method := COALESCE((school_row.gpa_config->>'default_method')::TEXT, 'simple');
    ELSE
        -- Default to simple if school not found
        resolved_method := 'simple';
    END IF;

    -- Using the determined method, calculate GPA for all students in the list.
    RETURN QUERY
    SELECT
        s.id as student_id,
        calculate_gpa_dispatch_2(
            s.id, 
            resolved_method, 
            p_grade_codes, 
            p_credit_types, 
            p_year_labels,
            p_grade_levels,
            customer_id_val
        ) as gpa
    FROM
        unnest(p_student_ids) AS s(id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_simple_gpa_2(p_student_id uuid, p_grade_codes text[], p_credit_types text[], p_year_labels text[], p_grade_levels integer[])
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
  total_points    NUMERIC := 0;
  total_credits   NUMERIC := 0;
  gpa             NUMERIC := NULL;
BEGIN
  -- Optimized: Single query with year filtering inline
  SELECT
    COALESCE(SUM(sg.gpa_points), 0),
    COALESCE(COUNT(*), 0)
  INTO total_points, total_credits
  FROM student_grades sg
  JOIN sections s ON sg.section_id = s.section_id
  JOIN courses c ON s.course_id = c.course_id
  LEFT JOIN terms t ON sg.term_id = t.term_id
  LEFT JOIN years y ON t.year_id = y.year_id
  WHERE sg.student_id = p_student_id
    AND sg.grade_status = 'Final'
    AND sg.exclude_from_gpa IS FALSE
    AND (p_grade_codes  IS NULL OR sg.grade_code   = ANY(p_grade_codes))
    AND (p_credit_types IS NULL OR sg.credit_type  = ANY(p_credit_types))
    AND (p_year_labels  IS NULL OR y.name = ANY(p_year_labels))
    AND (p_grade_levels IS NULL OR sg.grade_level::integer = ANY(p_grade_levels));

  IF total_credits > 0 THEN
    gpa := total_points / total_credits;
  END IF;
  
  RETURN gpa;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.associate_user_with_customer_schools(p_user_id uuid, p_customer_id uuid, p_membership_role text DEFAULT 'user'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- set a safe search_path for security definer functions
  PERFORM set_config('search_path', '', true);

  -- Insert memberships for every school with the provided customer_id
  INSERT INTO public.user_school_memberships (user_id, school_id, role, created_at)
  SELECT
    p_user_id AS user_id,
    s.school_id AS school_id,
    p_membership_role AS role,
    now() AS created_at
  FROM public.schools s
  WHERE s.customer_id = p_customer_id
  ON CONFLICT (user_id, school_id) DO NOTHING;

  RETURN;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_added_value_gpa(p_student_id uuid, p_grade_codes text[] DEFAULT NULL::text[], p_credit_types text[] DEFAULT NULL::text[], p_year_labels text[] DEFAULT NULL::text[], p_grade_levels integer[] DEFAULT NULL::integer[])
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
  total_points    NUMERIC := 0;
  total_credits   NUMERIC := 0;
  gpa             NUMERIC := NULL;
  term_ids_for_years UUID[];
BEGIN
  -- If p_year_labels is provided, get the corresponding term_ids
  IF p_year_labels IS NOT NULL THEN
    SELECT ARRAY_AGG(DISTINCT t.term_id) INTO term_ids_for_years
    FROM terms t
    JOIN years sy ON t.year_id = sy.year_id
    WHERE sy.name = ANY(p_year_labels);
  END IF;

  SELECT
    COALESCE(SUM(sg.gpa_points), 0),
    COALESCE(COUNT(*), 0)
  INTO total_points, total_credits
  FROM student_grades sg
  JOIN sections s ON sg.section_id = s.section_id
  JOIN courses c ON s.course_id = c.course_id
  WHERE sg.student_id = p_student_id
    AND sg.grade_status = 'Final'
    AND sg.exclude_from_gpa IS NOT TRUE
    AND (p_grade_codes  IS NULL OR sg.grade_code   = ANY(p_grade_codes))
    AND (p_credit_types IS NULL OR sg.credit_type  = ANY(p_credit_types))
    AND (p_year_labels  IS NULL OR sg.term_id      = ANY(term_ids_for_years))
    AND (p_grade_levels IS NULL OR sg.grade_level::integer = ANY(p_grade_levels))
    AND (sg.exclude_from_gpa IS FALSE);

  IF total_credits > 0 THEN
    gpa := ROUND(total_points / total_credits, 4);
  END IF;
  
  RETURN gpa;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_credit_hour_weighted_gpa(p_student_id uuid, p_grade_codes text[] DEFAULT NULL::text[], p_credit_types text[] DEFAULT NULL::text[], p_year_labels text[] DEFAULT NULL::text[], p_grade_levels integer[] DEFAULT NULL::integer[])
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
  total_points    NUMERIC := 0;
  total_credits   NUMERIC := 0;
  gpa             NUMERIC := NULL;
  term_ids_for_years UUID[];
BEGIN
  -- If p_year_labels is provided, get the corresponding term_ids
  IF p_year_labels IS NOT NULL THEN
    SELECT ARRAY_AGG(DISTINCT t.term_id) INTO term_ids_for_years
    FROM terms t
    JOIN years sy ON t.year_id = sy.year_id
    WHERE sy.name = ANY(p_year_labels);
  END IF;

  SELECT
    COALESCE(SUM(sg.gpa_points * c.credit_hours), 0),
    COALESCE(SUM(c.credit_hours), 0)
  INTO total_points, total_credits
  FROM student_grades sg
  JOIN sections s ON sg.section_id = s.section_id
  JOIN courses c ON s.course_id = c.course_id
  WHERE sg.student_id = p_student_id
    AND sg.grade_status = 'Final'
    AND sg.exclude_from_gpa IS NOT TRUE
    AND (p_grade_codes  IS NULL OR sg.grade_code   = ANY(p_grade_codes))
    AND (p_credit_types IS NULL OR sg.credit_type  = ANY(p_credit_types))
    AND (p_year_labels  IS NULL OR sg.term_id      = ANY(term_ids_for_years))
    AND (p_grade_levels IS NULL OR sg.grade_level::integer = ANY(p_grade_levels))
    AND (sg.exclude_from_gpa IS FALSE);

  IF total_credits > 0 THEN
    gpa := ROUND(total_points / total_credits, 4);
  END IF;
  
  RETURN gpa;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_gpa_dispatch(p_student_id uuid, p_method text DEFAULT NULL::text, p_grade_codes text[] DEFAULT NULL::text[], p_credit_types text[] DEFAULT NULL::text[], p_year_labels text[] DEFAULT NULL::text[], p_grade_levels integer[] DEFAULT NULL::integer[])
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
  resolved_method TEXT;
  school_id_val   UUID;
  customer_id_val UUID;
  gpa             NUMERIC;
  config_value    JSONB;
BEGIN
  -- Log input parameters
  RAISE NOTICE '=== calculate_gpa_dispatch called ===';
  RAISE NOTICE 'p_student_id: %', p_student_id;
  RAISE NOTICE 'p_method: %', p_method;
  RAISE NOTICE 'p_grade_codes: %', p_grade_codes;
  RAISE NOTICE 'p_credit_types: %', p_credit_types;
  RAISE NOTICE 'p_year_labels: %', p_year_labels;
  RAISE NOTICE 'p_grade_levels: %', p_grade_levels;
  -- Always derive customer_id from student's school
  RAISE NOTICE 'Looking up customer_id from student school...';
  -- Find the school_id for the given student
  SELECT ssl.school_id INTO school_id_val
  FROM school_student_link ssl
  WHERE ssl.student_id = p_student_id
  ORDER BY ssl.start_date DESC
  LIMIT 1;

  RAISE NOTICE 'Found school_id: %', school_id_val;

  -- Get customer_id from school if school is found
  IF school_id_val IS NOT NULL THEN
    SELECT s.customer_id INTO customer_id_val
    FROM schools s
    WHERE s.school_id = school_id_val;
    RAISE NOTICE 'Derived customer_id from school: %', customer_id_val;
  ELSE
    RAISE NOTICE 'No school found for student';
  END IF;

  -- If p_method is NULL, look up the default method from configurations
  IF p_method IS NULL THEN
    RAISE NOTICE 'No method provided, looking up from configurations...';
    -- First try to get method from customer-level configuration
    IF customer_id_val IS NOT NULL THEN
      RAISE NOTICE 'Checking customer-level config for customer_id: %', customer_id_val;
      SELECT pc.value INTO config_value
      FROM public_configuration pc
      WHERE pc.config_key = 'gpa_grade_levels'
        AND pc.customer_id = customer_id_val
        AND pc.school_id IS NULL
        AND pc.user_id IS NULL
      LIMIT 1;
      
      IF config_value IS NOT NULL THEN
        RAISE NOTICE 'Found customer-level config: %', config_value;
        -- Parse grade codes from config if available
        IF config_value ? 'grade_codes' THEN
          p_grade_codes := ARRAY(SELECT jsonb_array_elements_text(config_value->'grade_codes'));
          RAISE NOTICE 'Parsed grade_codes from config: %', p_grade_codes;
        END IF;
      ELSE
        RAISE NOTICE 'No customer-level config found';
      END IF;
    END IF;
    
    -- If no customer-level config found, try school-level config
    IF resolved_method IS NULL AND school_id_val IS NOT NULL THEN
      RAISE NOTICE 'Checking school-level config for school_id: %', school_id_val;
      SELECT s.gpa_config->>'default_method' INTO resolved_method
      FROM schools s
      WHERE s.school_id = school_id_val;
      RAISE NOTICE 'Resolved method from school config: %', resolved_method;
    END IF;
  ELSE
    resolved_method := p_method;
    RAISE NOTICE 'Using provided method: %', resolved_method;
  END IF;

  -- Default to 'simple' if no method is resolved
  IF resolved_method IS NULL THEN
    resolved_method := 'simple';
    RAISE NOTICE 'No method resolved, defaulting to: %', resolved_method;
  END IF;

  RAISE NOTICE 'Final resolved method: %', resolved_method;

  -- Dispatch to the correct calculation function based on the method
  CASE resolved_method
    WHEN 'simple' THEN
      RAISE NOTICE 'Calling calculate_simple_gpa...';
      SELECT calculate_simple_gpa(
        p_student_id,
        p_grade_codes,
        p_credit_types,
        p_year_labels,
        p_grade_levels
      ) INTO gpa;
    WHEN 'added_value' THEN
      RAISE NOTICE 'Calling calculate_added_value_gpa...';
      SELECT calculate_added_value_gpa(
        p_student_id,
        p_grade_codes,
        p_credit_types,
        p_year_labels,
        p_grade_levels
      ) INTO gpa;
    WHEN 'credit_hour_weighted' THEN
      RAISE NOTICE 'Calling calculate_credit_hour_weighted_gpa...';
      SELECT calculate_credit_hour_weighted_gpa(
        p_student_id,
        p_grade_codes,
        p_credit_types,
        p_year_labels,
        p_grade_levels
      ) INTO gpa;
    ELSE
      RAISE EXCEPTION 'Unknown GPA calculation method: %', resolved_method;
  END CASE;

  RAISE NOTICE 'Calculated GPA: %', gpa;
  RAISE NOTICE '=== calculate_gpa_dispatch completed ===';

  RETURN gpa;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_gpa_for_students(p_student_ids uuid[], p_method text DEFAULT NULL::text, p_grade_codes text[] DEFAULT NULL::text[], p_credit_types text[] DEFAULT NULL::text[], p_year_labels text[] DEFAULT NULL::text[], p_grade_levels integer[] DEFAULT NULL::integer[])
 RETURNS TABLE(student_id uuid, gpa numeric)
 LANGUAGE plpgsql
AS $function$
DECLARE
    school_row RECORD;
    resolved_method TEXT;
BEGIN
    -- Get the school for the first student to determine the GPA calculation method
    SELECT s.* INTO school_row
    FROM schools s
    JOIN school_student_link ssl ON s.school_id = ssl.school_id
    WHERE ssl.student_id = p_student_ids[1]
    ORDER BY ssl.start_date DESC
    LIMIT 1;

    IF p_method IS NOT NULL THEN
        resolved_method := p_method;
    ELSIF school_row IS NOT NULL THEN
        -- Determine the method from gpa_config
        resolved_method := COALESCE((school_row.gpa_config->>'default_method')::TEXT, 'simple');
    ELSE
        -- Default to simple if school not found
        resolved_method := 'simple';
    END IF;

    -- Using the determined method, calculate GPA for all students in the list.
    RETURN QUERY
    SELECT
        s.id as student_id,
        calculate_gpa_dispatch(
            s.id, 
            resolved_method, 
            p_grade_codes, 
            p_credit_types, 
            p_year_labels,
            p_grade_levels
        ) as gpa
    FROM
        unnest(p_student_ids) AS s(id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_simple_gpa(p_student_id uuid, p_grade_codes text[] DEFAULT NULL::text[], p_credit_types text[] DEFAULT NULL::text[], p_year_labels text[] DEFAULT NULL::text[], p_grade_levels integer[] DEFAULT NULL::integer[])
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
  total_points    NUMERIC := 0;
  total_credits   NUMERIC := 0;
  gpa             NUMERIC := NULL;
  term_ids_for_years UUID[];
BEGIN
  -- If p_year_labels is provided, get the corresponding term_ids
  IF p_year_labels IS NOT NULL THEN
    SELECT ARRAY_AGG(DISTINCT t.term_id) INTO term_ids_for_years
    FROM terms t
    JOIN years sy ON t.year_id = sy.year_id
    WHERE sy.name = ANY(p_year_labels);
  END IF;

  SELECT
    COALESCE(SUM(sg.gpa_points), 0),
    COALESCE(COUNT(*), 0)
  INTO total_points, total_credits
  FROM student_grades sg
  JOIN sections s ON sg.section_id = s.section_id
  JOIN courses c ON s.course_id = c.course_id
  WHERE sg.student_id = p_student_id
    AND sg.grade_status = 'Final'
    AND sg.exclude_from_gpa IS NOT TRUE
    AND (p_grade_codes  IS NULL OR sg.grade_code   = ANY(p_grade_codes))
    AND (p_credit_types IS NULL OR sg.credit_type  = ANY(p_credit_types))
    AND (p_year_labels  IS NULL OR sg.term_id      = ANY(term_ids_for_years))
    AND (p_grade_levels IS NULL OR sg.grade_level::integer = ANY(p_grade_levels))
    AND (sg.exclude_from_gpa IS FALSE);

  IF total_credits > 0 THEN
    gpa := ROUND(total_points / total_credits, 4);
  END IF;
  
  RETURN gpa;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_user_for_customer(p_email text, p_encrypted_password text, p_first_name text, p_last_name text, p_customer_id uuid, p_membership_role text DEFAULT 'member'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_id uuid := gen_random_uuid();
BEGIN
  -- set a safe search_path for security definer functions
  PERFORM set_config('search_path', '', true);

  -- 1) Insert into auth.users using a single UUID
  INSERT INTO auth.users (
    id, email, encrypted_password, aud, role, email_confirmed_at, created_at
  ) VALUES (
    v_id,
    lower(p_email),
    p_encrypted_password,
    'authenticated',
    'authenticated',
    now(),
    now()
  );

  -- 2) Insert into public.users (use same UUID)
  INSERT INTO public.users (
    user_id, auth_user_id, first_name, last_name, email
  ) VALUES (
    v_id,
    v_id,
    p_first_name,
    p_last_name,
    lower(p_email)
  );

  -- 3) Create memberships for every school for the provided customer_id
  INSERT INTO public.user_school_memberships (user_id, school_id, role, created_at)
  SELECT
    v_id AS user_id,
    s.school_id AS school_id,
    p_membership_role AS role,
    now() AS created_at
  FROM public.schools s
  WHERE s.customer_id = p_customer_id
  ON CONFLICT (user_id, school_id) DO NOTHING;

  RETURN v_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_user_with_membership(p_email text, p_encrypted_password text, p_first_name text, p_last_name text, p_school_id uuid, p_membership_role text DEFAULT 'user'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
  v_auth_user_id uuid;
  v_customer_id uuid;
  v_whitelist jsonb;
  v_domain text;
begin
  -- Step 0: Extract email domain
  v_domain := lower(split_part(p_email, '@', 2));

  -- Step 1: Get customer_id for the school
  select customer_id into v_customer_id
  from public.schools
  where school_id = p_school_id;

  if v_customer_id is null then
    raise exception 'Invalid school_id: %', p_school_id
      using hint = 'No matching school found';
  end if;

  -- Step 2: Get whitelist config
  select value into v_whitelist
  from public.public_configuration
  where config_key = 'email_domain_whitelist'
  and customer_id = v_customer_id;

  -- Step 3: Validate whitelist
  if v_whitelist is null 
     or not exists (
       select 1
       from jsonb_array_elements_text(v_whitelist) as domains
       where lower(domains) = v_domain
     )
  then
    raise exception 'Email domain is not whitelisted'
      using hint = 'Allowed domains are configured per customer';
  end if;

  -- Step 4: Check if auth user exists
  select id into v_auth_user_id
  from auth.users
  where lower(email) = lower(p_email)
  limit 1;

  if v_auth_user_id is null then
    insert into auth.users (
      id, email, encrypted_password, aud, role, email_confirmed_at, created_at
    )
    values (
      gen_random_uuid(),
      lower(p_email),
      p_encrypted_password,
      'authenticated',
      'authenticated',
      now(),
      now()
    )
    returning id into v_auth_user_id;
  end if;

  -- Step 5: Ensure public user exists
  if not exists (
    select 1 from public.users
    where auth_user_id = v_auth_user_id
  ) then
    insert into public.users (
      user_id,
      auth_user_id,
      first_name,
      last_name,
      full_name,
      email
    )
    values (
      v_auth_user_id,
      v_auth_user_id,
      p_first_name,
      p_last_name,
      p_first_name || ' ' || p_last_name,
      lower(p_email)
    );
  end if;

  -- Step 6: Insert membership if not exists
  insert into public.user_school_memberships (
    user_id,
    school_id,
    role,
    created_at,
    updated_at
  )
  values (
    v_auth_user_id,
    p_school_id,
    p_membership_role,
    now(),
    now()
  )
  on conflict (user_id, school_id) do nothing;

  -- Step 7: Return user_id
  return v_auth_user_id;

end;
$function$
;

CREATE OR REPLACE FUNCTION public.execute_safe_select(query_text text, p_selected_school_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  result JSON;
BEGIN
  IF p_selected_school_id IS NOT NULL THEN

    -- Set the school context so the query is scoped to the user's selected school.
    -- The third parameter is true, which means that the context will be reset after the current transaction.
    PERFORM set_config('app.current_school_id', p_selected_school_id::text, true);
  END IF;

  IF lower(query_text) NOT LIKE 'select%' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed.';
  END IF;

  EXECUTE 'SELECT json_agg(t) FROM (' || query_text || ') t' INTO result;
  
  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fetch_public_config(p_config_key text, p_user_id uuid DEFAULT NULL::uuid, p_school_id uuid DEFAULT NULL::uuid, p_customer_id uuid DEFAULT NULL::uuid)
 RETURNS SETOF public_configuration
 LANGUAGE plpgsql
 STABLE
AS $function$
declare
  v_school_id uuid;
  v_customer_id uuid;
begin
  if p_user_id is not null then
    select school_id
    into v_school_id
    from user_school_memberships
    where user_id = p_user_id
    limit 1;
  end if;

  if p_school_id is not null or v_school_id is not null then
    select customer_id
    into v_customer_id
    from schools
    where school_id = coalesce(p_school_id, v_school_id)
    limit 1;
  end if;

  if p_customer_id is not null then
    v_customer_id := p_customer_id;
  end if;

  return query
  select config_id, config_key, value, customer_id, school_id, user_id, created_at, updated_at
  from public_configuration pc
  where pc.config_key = p_config_key
    and (
      (p_user_id is not null and pc.user_id = p_user_id)
      or (coalesce(p_school_id, v_school_id) is not null and pc.school_id = coalesce(p_school_id, v_school_id) and pc.user_id is null)
      or (v_customer_id is not null and pc.customer_id = v_customer_id and pc.school_id is null and pc.user_id is null)
      or (pc.user_id is null and pc.school_id is null and pc.customer_id is null)
    )
  order by
    case
      when pc.user_id is not null then 1
      when pc.school_id is not null then 2
      when pc.customer_id is not null then 3
      else 4
    end
  limit 1;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_current_school_id()
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN current_setting('app.current_school_id')::uuid;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_current_student_grades(p_student_id uuid)
 RETURNS TABLE(course_id uuid, course_name text, course_number text, grade_letter text, grade_percent numeric, updated_at timestamp with time zone, term_abbreviation text)
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Return the latest grades for the current (or most recent) term in one go
  RETURN QUERY
    WITH term_dates AS (
      SELECT se.section_id, se.term_id, t.abbreviation,
             t.start_date::date AS term_start, t.end_date::date AS term_end
      FROM section_enrollments se
      JOIN terms t ON t.term_id = se.term_id
      WHERE se.student_id = p_student_id
        AND (se.start_date IS NULL OR se.start_date <= NOW())
        AND (se.end_date   IS NULL OR se.end_date   >= NOW())
    ),
    current_term AS (
      SELECT term_id, abbreviation
      FROM term_dates
      WHERE term_start <= NOW()::date AND term_end >= NOW()::date
      LIMIT 1
    ),
    fallback_term AS (
      -- Fallback to most recent term where the student has grades
      SELECT td.term_id, td.abbreviation
      FROM term_dates td
      JOIN student_grades sg ON sg.term_id = td.term_id AND sg.student_id = p_student_id
      GROUP BY td.term_id, td.abbreviation, td.term_end
      ORDER BY td.term_end DESC NULLS LAST
      LIMIT 1
    ),
    chosen_term AS (
      SELECT * FROM current_term
      UNION ALL
      SELECT * FROM fallback_term
      LIMIT 1
    ),
    enrolls AS (
      SELECT se.section_id, se.term_id
      FROM section_enrollments se
      JOIN chosen_term ct ON se.term_id = ct.term_id
      WHERE se.student_id = p_student_id
    ),
    latest_grades AS (
      SELECT DISTINCT ON (c.course_id)
        c.course_id,
        c.name               AS course_name,
        c.local_course_code  AS course_number,
        sg.grade_letter,
        sg.grade_percent,
        sg.source_updated_date::timestamp with time zone AS updated_at,
        ct.abbreviation      AS term_abbreviation
      FROM enrolls e
      JOIN sections s ON s.section_id = e.section_id
      JOIN courses c ON c.course_id = s.course_id
      LEFT JOIN student_grades sg ON sg.section_id = s.section_id
                                 AND sg.student_id = p_student_id
      JOIN chosen_term ct ON e.term_id = ct.term_id
      ORDER BY c.course_id, sg.updated_at DESC NULLS LAST
    )
    SELECT * FROM latest_grades ORDER BY course_name, course_number;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_last_n_years_final_terms_gpa(p_student_id uuid, p_n integer, p_grade_codes text[] DEFAULT NULL::text[])
 RETURNS TABLE(year_name text, grade_code text, gpa numeric)
 LANGUAGE plpgsql
AS $function$
declare
  v_current_end_year int;
  v_min_end_year int;
  v_grade_codes text[];
begin
  -- 1. Get current end year
  select end_year into v_current_end_year
  from public.years
  where is_current = true
  limit 1;

  if v_current_end_year is null then
    raise exception 'No current year found in years table';
  end if;

  -- 2. Compute range for past N years
  v_min_end_year := v_current_end_year - (p_n - 1);

  -- 3. Return raw rows
  return query
    select 
      y.name as year_name,
      sg.grade_code,
      round(avg(sg.gpa_points)::numeric, 2) as gpa
    from student_grades sg
    join terms t on sg.term_id = t.term_id
    join years y on t.year_id = y.year_id
    where sg.student_id = p_student_id
      and sg.grade_status = 'Final'
      and y.end_year between v_min_end_year and v_current_end_year
      and (
        p_grade_codes is null 
        or sg.grade_code = any(p_grade_codes)
      )
    group by y.name, sg.grade_code
    order by y.name, sg.grade_code;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_public_table_schema(p_table_name text)
 RETURNS TABLE(column_name text, data_type text, comment text)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        c.column_name::text,
        c.data_type::text,
        pg_catalog.col_description(
            format('%I.%I', c.table_schema, c.table_name)::regclass,
            c.ordinal_position
        )::text AS comment
    FROM
        information_schema.columns AS c
    WHERE
        c.table_schema = 'public' AND c.table_name = p_table_name;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_student_daily_absences_and_tardies(p_student_id uuid)
 RETURNS TABLE(total_absences bigint, total_tardies bigint)
 LANGUAGE plpgsql
AS $function$
declare
  v_current_year_id uuid;
begin
  -- 1. Get current school year ID
  select year_id into v_current_year_id
  from public.years
  where is_current = true
  limit 1;

  if v_current_year_id is null then
    raise exception 'No current year found in years table';
  end if;

  -- 2. Return total absences and tardies for the current school year
  return query
    select 
      -- Total absences: count of records in student_daily_absences for current year
      coalesce((
        select count(*)
        from public.student_daily_absences sda
        where sda.student_id = p_student_id
          and sda.year_id = v_current_year_id
      ), 0)::bigint as total_absences,
      
      -- Total tardies: sum of tardies from section_enrollments for current year terms
      coalesce((
        select sum(se.tardies)
        from public.section_enrollments se
        join public.terms t on se.term_id = t.term_id
        where se.student_id = p_student_id
          and t.year_id = v_current_year_id
          and se.tardies > 0
      ), 0)::bigint as total_tardies;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_student_year_labels(p_student_id uuid)
 RETURNS text[]
 LANGUAGE plpgsql
AS $function$
DECLARE
    year_labels TEXT[];
BEGIN
    SELECT ARRAY_AGG(DISTINCT sy.name ORDER BY sy.name DESC) INTO year_labels
    FROM student_grades sg
    JOIN terms t ON sg.term_id = t.term_id
    JOIN years sy ON t.year_id = sy.year_id
    WHERE sg.student_id = p_student_id;
    
    RETURN year_labels;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_email_domain_whitelisted(p_email_domain text, p_school_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
declare
  v_customer_id uuid;
  v_whitelist jsonb;
  v_is_whitelisted boolean := false;
begin
  -- Step 1: Get customer_id for the school
  select customer_id into v_customer_id
  from public.schools
  where school_id = p_school_id;

  if v_customer_id is null then
    -- Invalid school_id: return false (no match)
    return false;
  end if;

  -- Step 2: Get whitelist config
  select value into v_whitelist
  from public.public_configuration
  where config_key = 'email_domain_whitelist'
    and customer_id = v_customer_id;

  -- Step 3: Check if domain exists in whitelist array
  if v_whitelist is not null then
    select exists (
      select 1
      from jsonb_array_elements_text(v_whitelist) as domains
      where lower(domains) = lower(p_email_domain)
    )
    into v_is_whitelisted;
  end if;

  -- Step 4: Return boolean result
  return coalesce(v_is_whitelisted, false);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.list_public_tables()
 RETURNS TABLE(name text, comment text)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        t.table_name::text AS name,
        pg_catalog.obj_description(
            format('%I.%I', t.table_schema, t.table_name)::regclass,
            'pg_class'
        )::text AS comment
    FROM
        information_schema.tables AS t
    WHERE
        t.table_schema = 'public' AND t.table_type = 'BASE TABLE';
END;
$function$
;



