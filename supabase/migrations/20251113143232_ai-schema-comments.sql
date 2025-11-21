alter view if exists "views"."grades" rename to "student_grades";

drop index if exists "views_cache"."views_cache_attendance_daily_school_date_idx";

drop index if exists "views_cache"."views_cache_attendance_daily_uq";

drop index if exists "views_cache"."views_cache_attendance_summary_school_year_idx";

drop index if exists "views_cache"."views_cache_attendance_summary_uq";

drop view if exists "views"."attendance_daily";
drop view if exists "views"."absences_daily";

drop view if exists "views"."attendance_summary";
drop view if exists "views"."absences_summary";

drop materialized view if exists "views_cache"."attendance_daily";
drop materialized view if exists "views_cache"."absences_daily";

drop materialized view if exists "views_cache"."attendance_summary";
drop materialized view if exists "views_cache"."absences_summary";

drop view if exists "views"."student_tags";

drop materialized view if exists "views_cache"."student_tags";

alter table "public"."sections" add column if not exists "term_id" uuid;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'sections_term_id_fkey'
          AND conrelid = 'public.sections'::regclass
    ) THEN
        ALTER TABLE public.sections
        ADD CONSTRAINT sections_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.terms(term_id) not valid;
    END IF;
END $$;

alter table "public"."sections" validate constraint "sections_term_id_fkey";

set check_function_bodies = off;

create materialized view "views_cache"."absences_daily" as  SELECT sda.student_daily_absence_id,
    sda.student_id,
    sda.school_id,
    COALESCE(sda.customer_id, sch.customer_id) AS customer_id,
    sda.year_id,
    y.name AS year_name,
    y.start_year AS year_start_year,
    y.end_year AS year_end_year,
    y.is_current AS is_current_year,
    sda.absence_date,
    sda.normalized_absence_code,
    sda.sis_code,
    sda.created_at,
    sda.updated_at,
    st.grade_level,
    st.enrollment_status
   FROM (((public.student_daily_absences sda
     LEFT JOIN public.schools sch ON ((sch.school_id = sda.school_id)))
     LEFT JOIN public.years y ON ((y.year_id = sda.year_id)))
     LEFT JOIN public.students st ON ((st.student_id = sda.student_id)))
  WHERE (sda.school_id IS NOT NULL);


create materialized view "views_cache"."absences_summary" as  WITH daily_absence_totals AS (
         SELECT sda.student_id,
            sda.school_id,
            sda.year_id,
            count(*) AS total_absences,
            min(sda.absence_date) AS first_absence_date,
            max(sda.absence_date) AS last_absence_date
           FROM public.student_daily_absences sda
          WHERE (sda.school_id IS NOT NULL)
          GROUP BY sda.student_id, sda.school_id, sda.year_id
        ), course_attendance_totals AS (
         SELECT se.student_id,
            c.school_id,
            y_1.year_id,
            sum(GREATEST(COALESCE(se.tardies, 0), 0)) AS total_tardies,
            sum(GREATEST(COALESCE(se.absences, 0), 0)) AS total_course_absences
           FROM ((((public.section_enrollments se
             JOIN public.sections s ON ((s.section_id = se.section_id)))
             JOIN public.courses c ON ((c.course_id = s.course_id)))
             LEFT JOIN public.terms t ON ((t.term_id = se.term_id)))
             LEFT JOIN public.years y_1 ON ((y_1.year_id = t.year_id)))
          WHERE (c.school_id IS NOT NULL)
          GROUP BY se.student_id, c.school_id, y_1.year_id
        ), combined_keys AS (
         SELECT daily_absence_totals.student_id,
            daily_absence_totals.school_id,
            daily_absence_totals.year_id
           FROM daily_absence_totals
        UNION
         SELECT course_attendance_totals.student_id,
            course_attendance_totals.school_id,
            course_attendance_totals.year_id
           FROM course_attendance_totals
        ), combined AS (
         SELECT ck.student_id,
            ck.school_id,
            ck.year_id,
            COALESCE(d.total_absences, (0)::bigint) AS total_absences,
            COALESCE(c.total_tardies, (0)::bigint) AS total_tardies,
            COALESCE(c.total_course_absences, (0)::bigint) AS total_course_absences,
            d.first_absence_date,
            d.last_absence_date
           FROM ((combined_keys ck
             LEFT JOIN daily_absence_totals d ON (((d.student_id = ck.student_id) AND (d.school_id = ck.school_id) AND (COALESCE(d.year_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(ck.year_id, '00000000-0000-0000-0000-000000000000'::uuid)))))
             LEFT JOIN course_attendance_totals c ON (((c.student_id = ck.student_id) AND (c.school_id = ck.school_id) AND (COALESCE(c.year_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(ck.year_id, '00000000-0000-0000-0000-000000000000'::uuid)))))
        )
 SELECT combined.student_id,
    combined.school_id,
    COALESCE(st.customer_id, sch.customer_id) AS customer_id,
    combined.year_id,
    COALESCE(combined.year_id, '00000000-0000-0000-0000-000000000000'::uuid) AS year_key,
    y.name AS year_name,
    y.start_year AS year_start_year,
    y.end_year AS year_end_year,
    y.is_current AS is_current_year,
    combined.total_absences,
    combined.total_tardies,
    combined.total_course_absences,
    combined.first_absence_date,
    combined.last_absence_date,
    st.grade_level,
    st.enrollment_status
   FROM (((combined
     LEFT JOIN public.students st ON ((st.student_id = combined.student_id)))
     LEFT JOIN public.schools sch ON ((sch.school_id = combined.school_id)))
     LEFT JOIN public.years y ON ((y.year_id = combined.year_id)))
  WHERE ((combined.student_id IS NOT NULL) AND (combined.school_id IS NOT NULL));


CREATE OR REPLACE FUNCTION views_admin.process_refresh_queue()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'views_cache'
AS $function$DECLARE
  pending_view text;
BEGIN
  PERFORM set_config('app.current_school_id', NULL, true);

  FOR pending_view IN
    SELECT q.view_name
    FROM views_cache.refresh_queue AS q
    ORDER BY q.requested_at
  LOOP
    BEGIN
      PERFORM views_admin.refresh_cache(pending_view);
      DELETE FROM views_cache.refresh_queue AS q
      WHERE q.view_name = pending_view;
    EXCEPTION WHEN OTHERS THEN
      -- Leave the row in the queue for retry and continue.
      RAISE NOTICE 'Failed to refresh %, will retry: %', pending_view, SQLERRM;
    END;
  END LOOP;
END;$function$
;

CREATE OR REPLACE FUNCTION views_admin.queue_refresh(p_view_name text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'views_cache'
AS $function$BEGIN
  IF p_view_name IS NULL THEN
    RAISE EXCEPTION 'view_name cannot be null';
  END IF;

  INSERT INTO views_cache.refresh_queue (view_name, requested_at)
  VALUES (p_view_name, now())
  ON CONFLICT (view_name)
  DO UPDATE SET requested_at = EXCLUDED.requested_at;
END;$function$
;

CREATE OR REPLACE FUNCTION views_admin.refresh_cache(view_name text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'views_cache'
AS $function$BEGIN
  IF view_name IS NULL THEN
    RAISE EXCEPTION 'view_name cannot be null';
  END IF;

  IF view_name = 'student_profiles' THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY views_cache.student_profiles;
  ELSIF view_name = 'grades' THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY views_cache.grades;
  ELSIF view_name = 'absences_daily' THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY views_cache.absences_daily;
  ELSIF view_name = 'absences_summary' THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY views_cache.absences_summary;
  ELSIF view_name = 'contacts' THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY views_cache.contacts;
  ELSIF view_name = 'meeting_notes' THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY views_cache.meeting_notes;
  ELSIF view_name = 'student_tags' THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY views_cache.student_tags;
  ELSIF view_name = 'course_enrollments' THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY views_cache.course_enrollments;
  ELSIF view_name = 'courses_reference' THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY views_cache.courses_reference;
  ELSIF view_name = 'terms_reference' THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY views_cache.terms_reference;
  ELSE
    RAISE EXCEPTION 'Unknown cached view: %', view_name;
  END IF;
END;$function$
;

CREATE OR REPLACE FUNCTION views_admin.refresh_cache_bulk()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'views_cache'
AS $function$BEGIN
  PERFORM set_config('app.current_school_id', NULL, true);

  PERFORM views_admin.refresh_cache('student_profiles');
  PERFORM views_admin.refresh_cache('grades');
  PERFORM views_admin.refresh_cache('absences_daily');
  PERFORM views_admin.refresh_cache('absences_summary');
  PERFORM views_admin.refresh_cache('contacts');
  PERFORM views_admin.refresh_cache('course_enrollments');
  PERFORM views_admin.refresh_cache('courses_reference');
  PERFORM views_admin.refresh_cache('terms_reference');
  PERFORM views_admin.refresh_cache('student_tags');
  PERFORM views_admin.refresh_cache('meeting_notes');
END;$function$
;

create materialized view "views_cache"."student_tags" as  WITH ranked_links AS (
         SELECT ssl.student_id,
            ssl.school_id,
            ssl.start_date,
            ssl.end_date,
            ssl.created_at,
            ssl.updated_at,
            row_number() OVER (PARTITION BY ssl.student_id ORDER BY
                CASE
                    WHEN (((ssl.start_date IS NULL) OR (ssl.start_date <= CURRENT_DATE)) AND ((ssl.end_date IS NULL) OR (ssl.end_date >= CURRENT_DATE))) THEN 0
                    ELSE 1
                END, COALESCE(ssl.updated_at, ssl.created_at) DESC, ssl.created_at DESC) AS row_rank
           FROM public.school_student_link ssl
          WHERE (ssl.school_id IS NOT NULL)
        ), current_links AS (
         SELECT ranked_links.student_id,
            ranked_links.school_id
           FROM ranked_links
          WHERE (ranked_links.row_rank = 1)
        ), tagged_students AS (
         SELECT stg.student_tag_id,
            stg.student_id,
            stg.tag_id,
            stg.value,
            stg.canonical_value_id,
            stg.source,
            stg.created_by_user_id,
            stg.updated_by_user_id,
            stg.created_at,
            stg.updated_at,
            cl.school_id
           FROM (public.student_tags stg
             JOIN current_links cl ON ((cl.student_id = stg.student_id)))
        )
 SELECT ts.student_tag_id,
    ts.student_id,
    ts.tag_id,
    ts.canonical_value_id,
    COALESCE(st.customer_id, sch.customer_id, tg.customer_id) AS customer_id,
    tg.name AS tag_name,
    tg.is_multi_value,
    tg.tag_category_id,
    tc.name AS tag_category_name,
    ts.value,
    ts.source,
    tcv.value AS canonical_value,
    tcv.search_key_words AS canonical_search_key_words,
    ts.created_at,
    ts.updated_at,
    ts.created_by_user_id,
    ts.updated_by_user_id,
    st.full_name AS student_full_name,
    st.grade_level AS student_grade_level,
    st.enrollment_status AS student_enrollment_status,
    st.student_number,
    st.state_student_number,
    ts.school_id
   FROM (((((((tagged_students ts
     JOIN public.students st ON ((st.student_id = ts.student_id)))
     LEFT JOIN public.schools sch ON ((sch.school_id = ts.school_id)))
     LEFT JOIN public.tags tg ON ((tg.tag_id = ts.tag_id)))
     LEFT JOIN public.tag_categories tc ON ((tc.tag_category_id = tg.tag_category_id)))
     LEFT JOIN public.tag_canonical_values tcv ON ((tcv.tag_canonical_value_id = ts.canonical_value_id)))
     LEFT JOIN public.users creator ON ((creator.user_id = ts.created_by_user_id)))
     LEFT JOIN public.users editor ON ((editor.user_id = ts.updated_by_user_id)))
  WHERE (ts.school_id IS NOT NULL);


create or replace view "views"."absences_daily" as  SELECT student_daily_absence_id,
    student_id,
    school_id,
    customer_id,
    year_id,
    year_name,
    year_start_year,
    year_end_year,
    is_current_year,
    absence_date,
    normalized_absence_code,
    sis_code,
    created_at,
    updated_at,
    grade_level,
    enrollment_status
   FROM views_cache.absences_daily
  WHERE ((public.get_current_school_id() IS NULL) OR (school_id = public.get_current_school_id()));


create or replace view "views"."absences_summary" as  SELECT student_id,
    school_id,
    customer_id,
    year_id,
    year_name,
    year_start_year,
    year_end_year,
    is_current_year,
    total_absences,
    total_tardies,
    total_course_absences,
    first_absence_date,
    last_absence_date,
    grade_level,
    enrollment_status
   FROM views_cache.absences_summary
  WHERE ((public.get_current_school_id() IS NULL) OR (school_id = public.get_current_school_id()));


create or replace view "views"."student_tags" as  SELECT student_tag_id,
    student_id,
    tag_id,
    canonical_value_id,
    customer_id,
    tag_name,
    is_multi_value,
    tag_category_id,
    tag_category_name,
    value,
    source,
    canonical_value,
    canonical_search_key_words,
    created_at,
    updated_at,
    created_by_user_id,
    updated_by_user_id,
    student_full_name,
    student_grade_level,
    student_enrollment_status,
    student_number,
    state_student_number,
    school_id
   FROM views_cache.student_tags
  WHERE ((public.get_current_school_id() IS NULL) OR (school_id = public.get_current_school_id()));


CREATE INDEX views_cache_attendance_daily_school_date_idx ON views_cache.absences_daily USING btree (school_id, absence_date);

CREATE UNIQUE INDEX views_cache_attendance_daily_uq ON views_cache.absences_daily USING btree (student_daily_absence_id);

CREATE INDEX views_cache_attendance_summary_school_year_idx ON views_cache.absences_summary USING btree (school_id, year_id);

CREATE UNIQUE INDEX views_cache_attendance_summary_uq ON views_cache.absences_summary USING btree (student_id, school_id, year_key);

CREATE UNIQUE INDEX IF NOT EXISTS views_cache_student_tags_uq
  ON views_cache.student_tags (student_tag_id);
CREATE INDEX IF NOT EXISTS views_cache_student_tags_school_tag_idx
  ON views_cache.student_tags (school_id, tag_id);
CREATE INDEX IF NOT EXISTS views_cache_student_tags_school_student_idx
  ON views_cache.student_tags (school_id, student_id);

-- View comments
COMMENT ON VIEW views.student_profiles IS 'Core information about students: name, gpa, grade level, graduation year, etc.';
COMMENT ON VIEW views.student_grades IS 'Student grade records for individual classes/sections. Do not use the grade point data on this view directly, it can only be used as part of GPA calc functions.';
COMMENT ON VIEW views.absences_daily IS 'Day by day absence records by student.';
COMMENT ON VIEW views.absences_summary IS 'Aggregate absences for each student by school year.';
COMMENT ON VIEW views.contacts IS 'The contacts for a student — mother, father, etc - and their emails/phones';
COMMENT ON VIEW views.meeting_notes IS 'The notes from counselor-student meetings. You may search this for single students, but not in aggregate.';
COMMENT ON VIEW views.course_enrollments IS 'Each record represents a student taking a section of a course. (Sections are instances of a course.) Contains both current and past course enrollments. DO NOT use this view for questions about active students or enrolled students in the school generally; rely on student_profiles instead.';
COMMENT ON VIEW views.courses_reference IS 'The list of all course sections (a section is an instance of a course).';
COMMENT ON VIEW views.terms_reference IS 'The list of all academic terms (semesters, quarters, etc.) used by the school. Note that terms may overlap in time.';

-- Student comments
COMMENT ON COLUMN views.student_profiles.gpa IS 'The student''s cumulative Grade Point Average (GPA) across all completed courses.';
COMMENT ON COLUMN views.student_profiles.grade_level IS 'The current grade level of the student, e.g. 9, 10, 11 etc.';
COMMENT ON COLUMN views.student_profiles.graduation_year IS 'The expected graduation year of the student, e.g. 2024, 2025 etc.';
COMMENT ON COLUMN views.student_profiles.enrollment_status IS 'The current enrollment status of the student; will be Active for any currently enrolled student.';
COMMENT ON COLUMN views.student_profiles.student_number IS 'The user-facing numeric identifier for the student, often assigned by the school''s SIS. Sometimes referred to as a Student ID (not to be confused with our internal hidden identifier, student_id).';

-- Grades comments
COMMENT ON COLUMN views.student_grades.section_grade_level IS 'The grade level this course section is for, e.g. 9, 10, 11 etc.';
COMMENT ON COLUMN views.student_grades.potential_credit_hours IS 'The number of credit hours that can be earned by the student taking this course when completed.';
COMMENT ON COLUMN views.student_grades.gpa_points IS 'The grade points the student earned for this course section, e.g. 4.0 for an A, 3.0 for a B etc. Do not use this column directly, it is only useful as part of GPA calculation functions.';
COMMENT ON COLUMN views.student_grades.grade_letter IS 'The letter grade the student earned for this grade code/term in this course section, e.g. A, B, C, etc.';
COMMENT ON COLUMN views.student_grades.is_final_grade IS 'Whether this grade record is considered a final (versus in progress or current) grade. Once final, a grade will not change. Typically associated with ends of terms.';
COMMENT ON COLUMN views.student_grades.grade_percent IS 'The numeric percentage grade the student earned for this grade code/term in this course section, e.g. 92.5 for 92.5%.';
COMMENT ON COLUMN views.student_grades.grade_code IS 'The code for this grade record, e.g. Q1, S1, E2, etc. Defines the scope/meaning of the grade. Possible values are dependent on the school.';
COMMENT ON COLUMN views.student_grades.term_abbreviation IS 'The short name for the term (e.g. semester, quarter) this grade is associated with, e.g. Q1, S2, etc. Often matches the grade_code but not always.';

-- Absences comments
COMMENT ON COLUMN views.absences_summary.total_absences IS 'The total number of absences the student had in the school year.';
COMMENT ON COLUMN views.absences_summary.total_tardies IS 'The total number of times the student was tardy (late) to any class in the school year.';
COMMENT ON COLUMN views.absences_summary.is_current_year IS 'Whether this school year is the current active year for the school.';
COMMENT ON COLUMN views.absences_summary.grade_level IS 'The grade level of the student for the absence summary.';

COMMENT ON COLUMN views.absences_daily.absence_date IS 'The date of the absence record. You can use this with term information or dates to count absences.';
COMMENT ON COLUMN views.absences_daily.grade_level IS 'The grade level of the student for the absence record at the time the absence occurred.';


-- Contacts comments
COMMENT ON COLUMN views.contacts.relation_to_student IS 'The relationship of the contact to the student, e.g. mother, father, guardian, grandparent.';
COMMENT ON COLUMN views.contacts.first_name IS 'The first name of the contact.';
COMMENT ON COLUMN views.contacts.last_name IS 'The last name of the contact.';
COMMENT ON COLUMN views.contacts.grade_level IS 'The current grade level of the student.';
COMMENT ON COLUMN views.contacts.enrollment_status IS 'The enrollment status of the student (Active, Inactive, etc.).';

-- Tag comments
COMMENT ON COLUMN views.student_tags.tag_name IS 'The name of the tag assigned to the student. If this is a multi-value tag, the student may have multiple records with the same tag name but different values.';
COMMENT ON COLUMN views.student_tags.tag_category_name IS 'The category this tag belongs to, e.g. "Goals", "Extracurriculars", etc. Exists to provide context for the tag and for grouping.';
COMMENT ON COLUMN views.student_tags.value IS 'The value associated with the tag for the student. This is used when a tag can have multiple values.';
COMMENT ON COLUMN views.student_tags.canonical_value IS 'The standardized canonical value for the tag, if applicable. This helps with consistent reporting and searching across similar tag values.';
COMMENT ON COLUMN views.student_tags.is_multi_value IS 'Indicates whether the tag is one that has a value, or (if false) is a boolean tag (the student either has the tag, or does not).';
COMMENT ON COLUMN views.student_tags.student_number IS 'The user-facing numeric student identifier.';

-- Term comments
COMMENT ON COLUMN views.terms_reference.term_name IS 'The full name of the academic term, e.g. "Fall 2023", "Spring 2024". Can be set by the school to match their terminology.';
COMMENT ON COLUMN views.terms_reference.term_abbreviation IS 'The short name or code for the academic term, e.g. "Q1", "S2". Used for concise display and references. Only unique within a school year context.';
COMMENT ON COLUMN views.terms_reference.is_current_term IS 'Indicates whether this term is the current active term for the school. Note that there can be multiple overlapping current terms. Make sure not to double count things when you join to current terms.';

-- Course/section comments
COMMENT ON COLUMN views.courses_reference.course_name IS 'The name of the course, e.g. "Algebra I", "World History", etc.';
COMMENT ON COLUMN views.courses_reference.local_course_code IS 'The code for the course used by the school, e.g. "MATH101", "HIST202", etc. Used for concise identification of the course. Unique within a school.';
COMMENT ON COLUMN views.courses_reference.credit_type IS 'The type of credit awarded for completing the course, e.g. "MATH", "ENG", "SCI", etc. Can be set by the school to match their reporting needs.';
COMMENT ON COLUMN views.courses_reference.section_number IS 'The specific section number for this instance of the course, e.g. "001", "A", etc. Used to differentiate between multiple offerings of the same course.';
COMMENT ON COLUMN views.courses_reference.no_of_students IS 'The total number of students enrolled in this course section.';
COMMENT ON COLUMN views.courses_reference.section_grade_level IS 'The grade level this course section is intended for, e.g. 9, 10, 11 etc. Will sometimes be 0 or NULL if the section is open to multiple grade levels.';

-- Student course enrollment comments
COMMENT ON COLUMN views.course_enrollments.course_name IS 'The name of the course the student is enrolled in, e.g. "Biology 1", "English 9", etc.';
COMMENT ON COLUMN views.course_enrollments.local_course_code IS 'The school''s code for the course the student is enrolled in, e.g. "BIO101", "ENG201", etc.';
COMMENT ON COLUMN views.course_enrollments.section_number IS 'The specific section number for this instance of the course, e.g. "001", "A", etc.';
COMMENT ON COLUMN views.course_enrollments.term_abbreviation IS 'The short name for the term (e.g. semester, quarter) this enrollment is associated with, e.g. Q1, S2, etc.';
COMMENT ON COLUMN views.course_enrollments.section_grade_level IS 'The grade level this course section is intended for, e.g. 9, 10, 11 etc. May be 0 or NULL if the section is open to multiple grade levels.';
COMMENT ON COLUMN views.course_enrollments.student_enrollment_status IS 'The current **school level** enrollment status (NOT this course) of the student, e.g. Active, etc.';
COMMENT ON COLUMN views.course_enrollments.is_current_enrollment IS 'Indicates if the student is currently enrolled in this course section as of today. A student may have past enrollments in sections they are no longer attending.';