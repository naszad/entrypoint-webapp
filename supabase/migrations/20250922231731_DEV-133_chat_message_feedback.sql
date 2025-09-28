create table "public"."chat_message_feedback" (
    "feedback_id" uuid not null default gen_random_uuid(),
    "message_id" uuid,
    "user_id" uuid,
    "sentiment" text not null,
    "comment" text,
    "tags" jsonb,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
);


alter table "public"."chat_message_feedback" enable row level security;

CREATE UNIQUE INDEX chat_message_feedback_message_id_user_id_key ON public.chat_message_feedback USING btree (message_id, user_id);

CREATE UNIQUE INDEX chat_message_feedback_pkey ON public.chat_message_feedback USING btree (feedback_id);

alter table "public"."chat_message_feedback" add constraint "chat_message_feedback_pkey" PRIMARY KEY using index "chat_message_feedback_pkey";

alter table "public"."chat_message_feedback" add constraint "chat_message_feedback_message_id_fkey" FOREIGN KEY (message_id) REFERENCES chat_messages(message_id) ON DELETE CASCADE not valid;

alter table "public"."chat_message_feedback" validate constraint "chat_message_feedback_message_id_fkey";

alter table "public"."chat_message_feedback" add constraint "chat_message_feedback_message_id_user_id_key" UNIQUE using index "chat_message_feedback_message_id_user_id_key";

alter table "public"."chat_message_feedback" add constraint "chat_message_feedback_sentiment_check" CHECK ((sentiment = ANY (ARRAY['positive'::text, 'negative'::text, 'neutral'::text]))) not valid;

alter table "public"."chat_message_feedback" validate constraint "chat_message_feedback_sentiment_check";

alter table "public"."chat_message_feedback" add constraint "chat_message_feedback_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."chat_message_feedback" validate constraint "chat_message_feedback_user_id_fkey";

grant delete on table "public"."chat_message_feedback" to "anon";

grant insert on table "public"."chat_message_feedback" to "anon";

grant references on table "public"."chat_message_feedback" to "anon";

grant select on table "public"."chat_message_feedback" to "anon";

grant trigger on table "public"."chat_message_feedback" to "anon";

grant truncate on table "public"."chat_message_feedback" to "anon";

grant update on table "public"."chat_message_feedback" to "anon";

grant delete on table "public"."chat_message_feedback" to "authenticated";

grant insert on table "public"."chat_message_feedback" to "authenticated";

grant references on table "public"."chat_message_feedback" to "authenticated";

grant select on table "public"."chat_message_feedback" to "authenticated";

grant trigger on table "public"."chat_message_feedback" to "authenticated";

grant truncate on table "public"."chat_message_feedback" to "authenticated";

grant update on table "public"."chat_message_feedback" to "authenticated";

grant delete on table "public"."chat_message_feedback" to "service_role";

grant insert on table "public"."chat_message_feedback" to "service_role";

grant references on table "public"."chat_message_feedback" to "service_role";

grant select on table "public"."chat_message_feedback" to "service_role";

grant trigger on table "public"."chat_message_feedback" to "service_role";

grant truncate on table "public"."chat_message_feedback" to "service_role";

grant update on table "public"."chat_message_feedback" to "service_role";

create policy "Users can create feedback for their own chat messages"
on "public"."chat_message_feedback"
as permissive
for insert
to public
with check (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM (chat_messages cm
     JOIN chats c ON ((cm.chat_id = c.chat_id)))
  WHERE ((cm.message_id = chat_message_feedback.message_id) AND (c.user_id = auth.uid()) AND (c.deleted_at IS NULL))))));


create policy "Users can delete their own feedback"
on "public"."chat_message_feedback"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own feedback"
on "public"."chat_message_feedback"
as permissive
for update
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can view their own feedback"
on "public"."chat_message_feedback"
as permissive
for select
to public
using ((auth.uid() = user_id));



