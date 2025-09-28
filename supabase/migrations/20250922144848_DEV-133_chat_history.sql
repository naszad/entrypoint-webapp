create table "public"."chat_messages" (
    "message_id" uuid not null default gen_random_uuid(),
    "chat_id" uuid not null,
    "role" character varying not null,
    "parts" json not null,
    "created_at" timestamp without time zone not null,
    "updated_at" timestamp without time zone,
    "metadata" json
);


alter table "public"."chat_messages" enable row level security;

create table "public"."chats" (
    "chat_id" uuid not null default gen_random_uuid(),
    "created_at" timestamp without time zone not null,
    "updated_at" timestamp without time zone not null,
    "deleted_at" timestamp without time zone,
    "title" text,
    "user_id" uuid not null
);


alter table "public"."chats" enable row level security;

CREATE UNIQUE INDEX chats_pkey ON public.chats USING btree (chat_id);

CREATE UNIQUE INDEX messages_pkey ON public.chat_messages USING btree (message_id);

alter table "public"."chat_messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "public"."chats" add constraint "chats_pkey" PRIMARY KEY using index "chats_pkey";

alter table "public"."chat_messages" add constraint "messages_chat_id_chats_chat_id_fk" FOREIGN KEY (chat_id) REFERENCES chats(chat_id) ON DELETE CASCADE not valid;

alter table "public"."chat_messages" validate constraint "messages_chat_id_chats_chat_id_fk";

alter table "public"."chats" add constraint "chats_user_id_users_user_id_fk" FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE not valid;

alter table "public"."chats" validate constraint "chats_user_id_users_user_id_fk";

grant delete on table "public"."chat_messages" to "anon";

grant insert on table "public"."chat_messages" to "anon";

grant references on table "public"."chat_messages" to "anon";

grant select on table "public"."chat_messages" to "anon";

grant trigger on table "public"."chat_messages" to "anon";

grant truncate on table "public"."chat_messages" to "anon";

grant update on table "public"."chat_messages" to "anon";

grant delete on table "public"."chat_messages" to "authenticated";

grant insert on table "public"."chat_messages" to "authenticated";

grant references on table "public"."chat_messages" to "authenticated";

grant select on table "public"."chat_messages" to "authenticated";

grant trigger on table "public"."chat_messages" to "authenticated";

grant truncate on table "public"."chat_messages" to "authenticated";

grant update on table "public"."chat_messages" to "authenticated";

grant delete on table "public"."chat_messages" to "service_role";

grant insert on table "public"."chat_messages" to "service_role";

grant references on table "public"."chat_messages" to "service_role";

grant select on table "public"."chat_messages" to "service_role";

grant trigger on table "public"."chat_messages" to "service_role";

grant truncate on table "public"."chat_messages" to "service_role";

grant update on table "public"."chat_messages" to "service_role";

grant delete on table "public"."chats" to "anon";

grant insert on table "public"."chats" to "anon";

grant references on table "public"."chats" to "anon";

grant select on table "public"."chats" to "anon";

grant trigger on table "public"."chats" to "anon";

grant truncate on table "public"."chats" to "anon";

grant update on table "public"."chats" to "anon";

grant delete on table "public"."chats" to "authenticated";

grant insert on table "public"."chats" to "authenticated";

grant references on table "public"."chats" to "authenticated";

grant select on table "public"."chats" to "authenticated";

grant trigger on table "public"."chats" to "authenticated";

grant truncate on table "public"."chats" to "authenticated";

grant update on table "public"."chats" to "authenticated";

grant delete on table "public"."chats" to "service_role";

grant insert on table "public"."chats" to "service_role";

grant references on table "public"."chats" to "service_role";

grant select on table "public"."chats" to "service_role";

grant trigger on table "public"."chats" to "service_role";

grant truncate on table "public"."chats" to "service_role";

grant update on table "public"."chats" to "service_role";

create policy "Users can only read messages from their own chats"
on "public"."chat_messages"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM chats
  WHERE ((chats.chat_id = chat_messages.chat_id) AND (chats.user_id = auth.uid())))));

create policy "Users can delete messages from their own chats"
on "public"."chat_messages"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM chats
  WHERE ((chats.chat_id = chat_messages.chat_id) AND (chats.user_id = auth.uid())))));


create policy "Users can insert messages into their own chats"
on "public"."chat_messages"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM chats
  WHERE ((chats.chat_id = chat_messages.chat_id) AND (chats.user_id = auth.uid())))));


create policy "Users can update messages in their own chats"
on "public"."chat_messages"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM chats
  WHERE ((chats.chat_id = chat_messages.chat_id) AND (chats.user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM chats
  WHERE ((chats.chat_id = chat_messages.chat_id) AND (chats.user_id = auth.uid())))));


create policy "Users can only read their own chats"
on "public"."chats"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));

create policy "Users can delete their own chats"
on "public"."chats"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));


create policy "Users can insert their own chats"
on "public"."chats"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can update their own chats"
on "public"."chats"
as permissive
for update
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



