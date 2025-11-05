alter table "public"."sections" add column "school_id" uuid;

alter table "public"."sections" add constraint "sections_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.schools(school_id) not valid;

alter table "public"."sections" validate constraint "sections_school_id_fkey";

drop policy if exists "Allow Reading of Sections" on "public"."sections";

create policy "Allow Reading of Sections"
on "public"."sections"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (user_school_memberships usm
     CROSS JOIN LATERAL (SELECT get_current_school_id() AS current_school_id) app_context)
  WHERE ((usm.school_id = sections.school_id) AND (usm.user_id = ( SELECT auth.uid() AS uid)) AND ((app_context.current_school_id IS NULL) OR (sections.school_id = app_context.current_school_id))))));

drop policy if exists "Allow Reading of Student Grades" on "public"."student_grades";

create policy "Allow Reading of Student Grades"
on "public"."student_grades"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM ((sections s
     JOIN user_school_memberships usm ON ((usm.school_id = s.school_id)))
     CROSS JOIN LATERAL (SELECT get_current_school_id() AS current_school_id) app_context)
  WHERE ((s.section_id = student_grades.section_id) AND (usm.user_id = ( SELECT auth.uid() AS uid)) AND ((app_context.current_school_id IS NULL) OR (s.school_id = app_context.current_school_id))))));

drop policy if exists "Allow Reading of Section Enrollments" on "public"."section_enrollments";

create policy "Allow Reading of Section Enrollments"
on "public"."section_enrollments"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM ((sections s
     JOIN user_school_memberships usm ON ((usm.school_id = s.school_id)))
     CROSS JOIN LATERAL (SELECT get_current_school_id() AS current_school_id) app_context)
  WHERE ((s.section_id = section_enrollments.section_id) AND (usm.user_id = ( SELECT auth.uid() AS uid)) AND ((app_context.current_school_id IS NULL) OR (s.school_id = app_context.current_school_id))))));

