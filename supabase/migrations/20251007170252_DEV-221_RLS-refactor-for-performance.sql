drop policy if exists "Allow Access to Own Notes" on "public"."meeting_notes";

drop policy if exists "Allow Reading of Students" on "public"."students";

drop policy if exists "Users can create feedback for their own chat messages" on "public"."chat_message_feedback";

drop policy if exists "Users can delete their own feedback" on "public"."chat_message_feedback";

drop policy if exists "Users can update their own feedback" on "public"."chat_message_feedback";

drop policy if exists "Users can view their own feedback" on "public"."chat_message_feedback";

drop policy if exists "Users can delete messages from their own chats" on "public"."chat_messages";

drop policy if exists "Users can insert messages into their own chats" on "public"."chat_messages";

drop policy if exists "Users can only read messages from their own chats" on "public"."chat_messages";

drop policy if exists "Users can update messages in their own chats" on "public"."chat_messages";

drop policy if exists "Users can delete their own chats" on "public"."chats";

drop policy if exists "Users can insert their own chats" on "public"."chats";

drop policy if exists "Users can only read their own chats" on "public"."chats";

drop policy if exists "Users can update their own chats" on "public"."chats";

drop policy if exists "Allow Reading of Courses" on "public"."courses";

drop policy if exists "Allow Access to Non-Private Notes for Students in User Schools" on "public"."meeting_notes";

drop policy if exists "Allow Delete Own Notes" on "public"."meeting_notes";

drop policy if exists "Allow Insert Own Notes" on "public"."meeting_notes";

drop policy if exists "Allow Update Own Notes" on "public"."meeting_notes";

drop policy if exists "Allow Reading of Student School Links" on "public"."school_student_link";

drop policy if exists "Allow Reading of Schools" on "public"."schools";

drop policy if exists "Allow Reading of Section Enrollments" on "public"."section_enrollments";

drop policy if exists "Allow Reading of Sections" on "public"."sections";

drop policy if exists "Allow Reading of Student Daily Absences" on "public"."student_daily_absences";

drop policy if exists "Allow Reading of Student Grades" on "public"."student_grades";

drop policy if exists "Allow Deleting Student Tags" on "public"."student_tags";

drop policy if exists "Allow Inserting Student Tags" on "public"."student_tags";

drop policy if exists "Allow Reading of Student Tags" on "public"."student_tags";

drop policy if exists "Allow Updating Student Tags" on "public"."student_tags";

drop policy if exists "Allow Reading of Tag Canonical Values" on "public"."tag_canonical_values";

drop policy if exists "Allow Reading of Tag Categories" on "public"."tag_categories";

drop policy if exists "Allow Inserting Tags" on "public"."tags";

drop policy if exists "Allow Reading of Tags" on "public"."tags";

drop policy if exists "Allow Reading of Terms" on "public"."terms";

drop index if exists "public"."student_daily_absences_external_key_hash_idx";

drop policy if exists "Allow Access to Students in User Schools" on "public"."students";
create policy "Allow Access to Students in User Schools"
on "public"."students"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (user_school_memberships usm
     JOIN school_student_link ssl ON ((usm.school_id = ssl.school_id)))
  WHERE ((usm.user_id = ( SELECT auth.uid() AS uid)) AND (ssl.student_id = students.student_id) AND ((( SELECT get_current_school_id() AS get_current_school_id) IS NULL) OR (ssl.school_id = ( SELECT get_current_school_id() AS get_current_school_id)))))));


create policy "Users can create feedback for their own chat messages"
on "public"."chat_message_feedback"
as permissive
for insert
to public
with check (((( SELECT auth.uid() AS uid) = user_id) AND (EXISTS ( SELECT 1
   FROM (chat_messages cm
     JOIN chats c ON ((cm.chat_id = c.chat_id)))
  WHERE ((cm.message_id = chat_message_feedback.message_id) AND (c.user_id = ( SELECT auth.uid() AS uid)) AND (c.deleted_at IS NULL))))));


create policy "Users can delete their own feedback"
on "public"."chat_message_feedback"
as permissive
for delete
to public
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can update their own feedback"
on "public"."chat_message_feedback"
as permissive
for update
to public
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can view their own feedback"
on "public"."chat_message_feedback"
as permissive
for select
to public
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can delete messages from their own chats"
on "public"."chat_messages"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM chats
  WHERE ((chats.chat_id = chat_messages.chat_id) AND (chats.user_id = ( SELECT auth.uid() AS uid))))));


create policy "Users can insert messages into their own chats"
on "public"."chat_messages"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM chats
  WHERE ((chats.chat_id = chat_messages.chat_id) AND (chats.user_id = ( SELECT auth.uid() AS uid))))));


create policy "Users can only read messages from their own chats"
on "public"."chat_messages"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM chats
  WHERE ((chats.chat_id = chat_messages.chat_id) AND (chats.user_id = ( SELECT auth.uid() AS uid))))));


create policy "Users can update messages in their own chats"
on "public"."chat_messages"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM chats
  WHERE ((chats.chat_id = chat_messages.chat_id) AND (chats.user_id = ( SELECT auth.uid() AS uid))))))
with check ((EXISTS ( SELECT 1
   FROM chats
  WHERE ((chats.chat_id = chat_messages.chat_id) AND (chats.user_id = ( SELECT auth.uid() AS uid))))));


create policy "Users can delete their own chats"
on "public"."chats"
as permissive
for delete
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can insert their own chats"
on "public"."chats"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can only read their own chats"
on "public"."chats"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can update their own chats"
on "public"."chats"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "Allow Reading of Courses"
on "public"."courses"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (user_school_memberships usm
     CROSS JOIN LATERAL ( SELECT ( SELECT get_current_school_id() AS get_current_school_id) AS current_school_id) app_context)
  WHERE ((usm.user_id = ( SELECT auth.uid() AS uid)) AND (usm.school_id = courses.school_id) AND ((app_context.current_school_id IS NULL) OR (usm.school_id = app_context.current_school_id))))));


create policy "Allow Access to Non-Private Notes for Students in User Schools"
on "public"."meeting_notes"
as permissive
for select
to authenticated
using (((user_id = ( SELECT auth.uid() AS uid)) OR ((private = false) AND (EXISTS ( SELECT 1
   FROM (user_school_memberships usm
     JOIN school_student_link ssl ON ((usm.school_id = ssl.school_id)))
  WHERE ((usm.user_id = ( SELECT auth.uid() AS uid)) AND (ssl.student_id = meeting_notes.student_id)))))));


create policy "Allow Delete Own Notes"
on "public"."meeting_notes"
as permissive
for delete
to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));


create policy "Allow Insert Own Notes"
on "public"."meeting_notes"
as permissive
for insert
to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));


create policy "Allow Update Own Notes"
on "public"."meeting_notes"
as permissive
for update
to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));


create policy "Allow Reading of Student School Links"
on "public"."school_student_link"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (user_school_memberships usm
     CROSS JOIN LATERAL ( SELECT ( SELECT get_current_school_id() AS get_current_school_id) AS current_school_id) app_context)
  WHERE ((usm.user_id = ( SELECT auth.uid() AS uid)) AND (usm.school_id = school_student_link.school_id) AND ((app_context.current_school_id IS NULL) OR (usm.school_id = app_context.current_school_id))))));


create policy "Allow Reading of Schools"
on "public"."schools"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_school_memberships usm
  WHERE ((usm.user_id = ( SELECT auth.uid() AS uid)) AND (usm.school_id = schools.school_id)))));


create policy "Allow Reading of Section Enrollments"
on "public"."section_enrollments"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (((sections s
     JOIN courses c ON ((s.course_id = c.course_id)))
     JOIN user_school_memberships usm ON ((usm.school_id = c.school_id)))
     CROSS JOIN LATERAL ( SELECT ( SELECT get_current_school_id() AS get_current_school_id) AS current_school_id) app_context)
  WHERE ((s.section_id = section_enrollments.section_id) AND (usm.user_id = ( SELECT auth.uid() AS uid)) AND ((app_context.current_school_id IS NULL) OR (c.school_id = app_context.current_school_id))))));


create policy "Allow Reading of Sections"
on "public"."sections"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM ((courses c
     JOIN user_school_memberships usm ON ((usm.school_id = c.school_id)))
     CROSS JOIN LATERAL ( SELECT ( SELECT get_current_school_id() AS get_current_school_id) AS current_school_id) app_context)
  WHERE ((c.course_id = sections.course_id) AND (usm.user_id = ( SELECT auth.uid() AS uid)) AND ((app_context.current_school_id IS NULL) OR (c.school_id = app_context.current_school_id))))));


create policy "Allow Reading of Student Daily Absences"
on "public"."student_daily_absences"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_school_memberships usm
  WHERE ((usm.user_id = ( SELECT auth.uid() AS uid)) AND (usm.school_id = student_daily_absences.school_id)))));


create policy "Allow Reading of Student Grades"
on "public"."student_grades"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (((sections s
     JOIN courses c ON ((s.course_id = c.course_id)))
     JOIN user_school_memberships usm ON ((usm.school_id = c.school_id)))
     CROSS JOIN LATERAL ( SELECT ( SELECT get_current_school_id() AS get_current_school_id) AS current_school_id) app_context)
  WHERE ((s.section_id = student_grades.section_id) AND (usm.user_id = ( SELECT auth.uid() AS uid)) AND ((app_context.current_school_id IS NULL) OR (c.school_id = app_context.current_school_id))))));


create policy "Allow Deleting Student Tags"
on "public"."student_tags"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM (user_school_memberships usm
     JOIN school_student_link ssl ON ((usm.school_id = ssl.school_id)))
  WHERE ((usm.user_id = ( SELECT auth.uid() AS uid)) AND (ssl.student_id = student_tags.student_id)))));


create policy "Allow Inserting Student Tags"
on "public"."student_tags"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM (user_school_memberships usm
     JOIN school_student_link ssl ON ((usm.school_id = ssl.school_id)))
  WHERE ((usm.user_id = ( SELECT auth.uid() AS uid)) AND (ssl.student_id = student_tags.student_id)))));


create policy "Allow Reading of Student Tags"
on "public"."student_tags"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (user_school_memberships usm
     JOIN school_student_link ssl ON ((usm.school_id = ssl.school_id)))
  WHERE ((usm.user_id = ( SELECT auth.uid() AS uid)) AND (ssl.student_id = student_tags.student_id)))));


create policy "Allow Updating Student Tags"
on "public"."student_tags"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM (user_school_memberships usm
     JOIN school_student_link ssl ON ((usm.school_id = ssl.school_id)))
  WHERE ((usm.user_id = ( SELECT auth.uid() AS uid)) AND (ssl.student_id = student_tags.student_id)))));


create policy "Allow Reading of Tag Canonical Values"
on "public"."tag_canonical_values"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (tags t
     JOIN user_school_memberships usm ON ((EXISTS ( SELECT 1
           FROM schools s
          WHERE ((s.customer_id = t.customer_id) AND (s.school_id = usm.school_id))))))
  WHERE ((t.tag_id = tag_canonical_values.tag_id) AND (usm.user_id = ( SELECT auth.uid() AS uid))))));


create policy "Allow Reading of Tag Categories"
on "public"."tag_categories"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) IS NOT NULL));


create policy "Allow Inserting Tags"
on "public"."tags"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM (user_school_memberships usm
     JOIN schools s ON ((usm.school_id = s.school_id)))
  WHERE ((usm.user_id = ( SELECT auth.uid() AS uid)) AND (s.customer_id = s.customer_id)))));


create policy "Allow Reading of Tags"
on "public"."tags"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (user_school_memberships usm
     JOIN schools s ON ((usm.school_id = s.school_id)))
  WHERE ((usm.user_id = ( SELECT auth.uid() AS uid)) AND (s.customer_id = tags.customer_id)))));


create policy "Allow Reading of Terms"
on "public"."terms"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (user_school_memberships usm
     CROSS JOIN LATERAL ( SELECT ( SELECT get_current_school_id() AS get_current_school_id) AS current_school_id) app_context)
  WHERE ((usm.user_id = ( SELECT auth.uid() AS uid)) AND (usm.school_id = terms.school_id) AND ((app_context.current_school_id IS NULL) OR (usm.school_id = app_context.current_school_id))))));



