alter table "public"."section_enrollments" drop constraint if exists "section_enrollments_student_id_section_id_term_id_unique";

drop index if exists "public"."section_enrollments_student_id_section_id_term_id_unique";
