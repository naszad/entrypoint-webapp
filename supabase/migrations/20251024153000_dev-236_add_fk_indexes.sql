-- DEV-236: Add missing foreign key supporting indexes for performance
-- Rationale: Postgres does not automatically create indexes on referencing (child) table foreign key columns.
-- These indexes improve DELETE/UPDATE performance on parent tables and speed up joins/filtering.
-- Safe operation: Pure index creation, no data changes.
-- If you experience long locks in production, recreate using CONCURRENTLY manually (cannot use inside transactional migration wrappers).

-- NOTE: If Supabase migration runner wraps this file in a transaction, CREATE INDEX CONCURRENTLY is not allowed.
-- We use standard CREATE INDEX. For large tables you may optionally rebuild with CONCURRENTLY later.

-- =============================
-- chat / feedback
CREATE INDEX IF NOT EXISTS idx_chat_message_feedback_user_id ON public.chat_message_feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON public.chat_messages (chat_id);
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats (user_id);

-- contacts / customers
CREATE INDEX IF NOT EXISTS idx_contacts_customer_id ON public.contacts (customer_id);

-- courses
CREATE INDEX IF NOT EXISTS idx_courses_customer_id ON public.courses (customer_id);
CREATE INDEX IF NOT EXISTS idx_courses_school_id ON public.courses (school_id);

-- meeting notes
CREATE INDEX IF NOT EXISTS idx_meeting_notes_student_id ON public.meeting_notes (student_id);
CREATE INDEX IF NOT EXISTS idx_meeting_notes_user_id ON public.meeting_notes (user_id);

-- reports
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports (user_id);

-- school_student_link (composite PK (school_id, student_id) already covers student_id lookups; add single-column index for school_id FKs)
CREATE INDEX IF NOT EXISTS idx_school_student_link_school_id ON public.school_student_link (school_id);

-- schools
CREATE INDEX IF NOT EXISTS idx_schools_customer_id ON public.schools (customer_id);

-- section_enrollments
CREATE INDEX IF NOT EXISTS idx_section_enrollments_customer_id ON public.section_enrollments (customer_id);
CREATE INDEX IF NOT EXISTS idx_section_enrollments_section_id ON public.section_enrollments (section_id);
CREATE INDEX IF NOT EXISTS idx_section_enrollments_student_id ON public.section_enrollments (student_id);
CREATE INDEX IF NOT EXISTS idx_section_enrollments_term_id ON public.section_enrollments (term_id);

-- sections
CREATE INDEX IF NOT EXISTS idx_sections_course_id ON public.sections (course_id);
CREATE INDEX IF NOT EXISTS idx_sections_customer_id ON public.sections (customer_id);

-- student_contact_relationships (customer_id already indexed)
CREATE INDEX IF NOT EXISTS idx_student_contact_relationships_contact_id ON public.student_contact_relationships (contact_id);
CREATE INDEX IF NOT EXISTS idx_student_contact_relationships_school_id ON public.student_contact_relationships (school_id);
CREATE INDEX IF NOT EXISTS idx_student_contact_relationships_student_id ON public.student_contact_relationships (student_id);

-- student_daily_absences (customer_id already indexed)
CREATE INDEX IF NOT EXISTS idx_student_daily_absences_school_id ON public.student_daily_absences (school_id);
CREATE INDEX IF NOT EXISTS idx_student_daily_absences_student_id ON public.student_daily_absences (student_id);
CREATE INDEX IF NOT EXISTS idx_student_daily_absences_year_id ON public.student_daily_absences (year_id);

-- student_grades (student_id already indexed)
CREATE INDEX IF NOT EXISTS idx_student_grades_course_id ON public.student_grades (course_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_customer_id ON public.student_grades (customer_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_section_id ON public.student_grades (section_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_term_id ON public.student_grades (term_id);

-- student_tags (student_id already indexed)
CREATE INDEX IF NOT EXISTS idx_student_tags_canonical_value_id ON public.student_tags (canonical_value_id);
CREATE INDEX IF NOT EXISTS idx_student_tags_created_by_user_id ON public.student_tags (created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_student_tags_tag_id ON public.student_tags (tag_id);
CREATE INDEX IF NOT EXISTS idx_student_tags_updated_by_user_id ON public.student_tags (updated_by_user_id);

-- students
CREATE INDEX IF NOT EXISTS idx_students_customer_id ON public.students (customer_id);

-- tag_canonical_values (tag_id already indexed)
CREATE INDEX IF NOT EXISTS idx_tag_canonical_values_created_by_user_id ON public.tag_canonical_values (created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_tag_canonical_values_updated_by_user_id ON public.tag_canonical_values (updated_by_user_id);

-- tags (tag_category_id already indexed)
CREATE INDEX IF NOT EXISTS idx_tags_created_by_user_id ON public.tags (created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_tags_customer_id ON public.tags (customer_id);
CREATE INDEX IF NOT EXISTS idx_tags_updated_by_user_id ON public.tags (updated_by_user_id);

-- terms
CREATE INDEX IF NOT EXISTS idx_terms_customer_id ON public.terms (customer_id);
CREATE INDEX IF NOT EXISTS idx_terms_school_id ON public.terms (school_id);
CREATE INDEX IF NOT EXISTS idx_terms_year_id ON public.terms (year_id);

-- user_school_memberships (PK (school_id, user_id) covers user_id; add index for school_id FKs in joins if needed)
CREATE INDEX IF NOT EXISTS idx_user_school_memberships_school_id ON public.user_school_memberships (school_id);

-- END DEV-236
