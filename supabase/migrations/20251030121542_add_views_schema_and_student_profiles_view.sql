-- Idempotent migration introducing the `views` schema and initial student_profiles view
-- This file can be re-run safely as we iterate on the schema.

-- Ensure the schema exists without replacing it if already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_namespace
    WHERE nspname = 'views'
  ) THEN
    EXECUTE 'CREATE SCHEMA views AUTHORIZATION postgres';
  END IF;
END
$$;

-- Lock down the schema and grant only the roles we expect to query from the application
REVOKE ALL ON SCHEMA views FROM PUBLIC;
GRANT USAGE ON SCHEMA views TO authenticated;
GRANT USAGE ON SCHEMA views TO service_role;

COMMENT ON SCHEMA views IS 'Application-facing views optimized for AI and reporting access. Underlying table RLS remains in effect.';

-- Build (or refresh) the student_profiles projection
DROP VIEW IF EXISTS views.student_profiles;

CREATE OR REPLACE VIEW views.student_profiles
WITH (security_barrier = true)
AS
WITH school_configs AS (
  SELECT
    s.school_id,
    (
      SELECT array_agg(elem.value)
      FROM jsonb_array_elements_text(cfg.value) elem(value)
    ) AS finalized_grade_codes
  FROM (
    SELECT DISTINCT ssl.school_id
    FROM public.school_student_link ssl
    WHERE ssl.school_id IS NOT NULL
      AND (
        public.get_current_school_id() IS NULL
        OR ssl.school_id = public.get_current_school_id()
      )
  ) s
  LEFT JOIN LATERAL (
    SELECT fetch_public_config.value
    FROM public.fetch_public_config('final_grade_code', NULL::uuid, s.school_id, NULL::uuid) fetch_public_config(config_id, config_key, value, customer_id, school_id, user_id, created_at, updated_at)
    LIMIT 1
  ) cfg ON true
), gpa_results AS (
  SELECT
    sc.school_id,
    gpa_calc.student_id,
    gpa_calc.gpa
  FROM school_configs sc
  JOIN LATERAL (
    SELECT *
    FROM public.calculate_gpa_for_students(
      (
        SELECT array_agg(DISTINCT ssl.student_id)
        FROM public.school_student_link ssl
        WHERE ssl.school_id = sc.school_id
      ),
      NULL::text,
      sc.finalized_grade_codes,
      NULL::text[],
      NULL::text[],
      NULL::integer[]
    )
  ) gpa_calc ON true
  WHERE gpa_calc.student_id IS NOT NULL
)
SELECT
  st.student_id,
  ssl.school_id,
  sc.name AS school_name,
  COALESCE(sc.customer_id, st.customer_id) AS customer_id,
  gpa_results.gpa,
  st.full_name,
  st.first_name,
  st.middle_name,
  st.last_name,
  st.grade_level,
  st.enrollment_status,
  st.homeroom_name,
  st.graduation_year,
  st.student_number,
  st.state_student_number,
  st.lunch_id,
  st.gender,
  st.date_of_birth,
  st.race,
  st.email,
  st.phone,
  st.address_physical_street,
  st.address_physical_city,
  st.address_physical_state,
  st.address_physical_postal_code,
  st.address_mailing_street,
  st.address_mailing_city,
  st.address_mailing_state,
  st.address_mailing_postal_code,
  st.locker_number,
  st.locker_combination,
  st.created_at,
  st.updated_at,
  ssl.start_date AS school_start_date,
  ssl.end_date AS school_end_date,
  CASE
    WHEN (ssl.start_date IS NULL OR ssl.start_date <= CURRENT_DATE)
     AND (ssl.end_date IS NULL OR ssl.end_date >= CURRENT_DATE)
    THEN true
    ELSE false
  END AS is_current_enrollment,
  sc.city AS school_city,
  sc.state AS school_state
FROM public.students st
LEFT JOIN public.school_student_link ssl
  ON ssl.student_id = st.student_id
LEFT JOIN public.schools sc
  ON sc.school_id = ssl.school_id
LEFT JOIN gpa_results
  ON gpa_results.student_id = st.student_id
 AND gpa_results.school_id = ssl.school_id
WHERE (
  public.get_current_school_id() IS NULL
  OR ssl.school_id = public.get_current_school_id()
);

COMMENT ON VIEW views.student_profiles IS 'Student demographic and enrollment details per school, filtered by selected school context when provided.';

GRANT SELECT ON views.student_profiles TO authenticated;
GRANT SELECT ON views.student_profiles TO service_role;

-- Build (or refresh) the student_grades projection
DROP VIEW IF EXISTS views.grades;

CREATE OR REPLACE VIEW views.grades
WITH (security_barrier = true)
AS
WITH scoped_grades AS (
  SELECT
    sg.grade_id,
    sg.student_id,
    sg.section_id,
    sg.term_id,
    sg.course_id,
    sg.grade_letter,
    sg.grade_code,
    sg.grade_percent,
    sg.gpa_points,
    sg.credit_hours_earned,
    sg.credit_type,
    sg.grade_status,
    sg.comment AS grade_comment,
    sg.grade_level,
    sg.source_api,
    sg.source_updated_date,
    sg.created_at,
    sg.updated_at,
    sg.customer_id AS sg_customer_id,
    sg.potential_credit_hours,
    sg.gpa_added_value,
    sg.exclude_from_gpa,
  s.section_number,
  s.course_number,
  s.grade_level AS section_grade_level,
  s.teacher_name,
  c.course_id AS joined_course_id,
  c.name AS course_name,
  c.local_course_code,
  c.state_course_code,
  c.school_id,
  c.customer_id AS course_customer_id,
    t.term_id AS joined_term_id,
    t.abbreviation AS term_abbreviation,
    t.start_date AS term_start_date,
    t.end_date AS term_end_date,
    y.year_id,
    y.name AS year_name,
    y.start_year,
    y.end_year,
    ROW_NUMBER() OVER (
      PARTITION BY sg.student_id, sg.section_id, COALESCE(sg.grade_code, ''), COALESCE(sg.grade_status, '')
      ORDER BY
        COALESCE(sg.source_updated_date, sg.updated_at, sg.created_at) DESC,
        sg.updated_at DESC,
        sg.created_at DESC,
        sg.grade_id DESC
    ) AS row_rank
  FROM public.student_grades sg
  JOIN public.sections s ON s.section_id = sg.section_id
  JOIN public.courses c ON c.course_id = s.course_id
  LEFT JOIN public.terms t ON t.term_id = sg.term_id
  LEFT JOIN public.years y ON y.year_id = t.year_id
  WHERE (
    public.get_current_school_id() IS NULL
    OR c.school_id = public.get_current_school_id()
  )
), latest_grades AS (
  SELECT *
  FROM scoped_grades
  WHERE row_rank = 1
)
SELECT
  lg.grade_id,
  lg.student_id,
  lg.section_id,
  COALESCE(lg.term_id, lg.joined_term_id) AS term_id,
  COALESCE(lg.course_id, lg.joined_course_id) AS course_id,
  lg.school_id,
  COALESCE(lg.sg_customer_id, lg.course_customer_id) AS customer_id,
  lg.course_name,
  lg.course_number,
  lg.local_course_code,
  lg.state_course_code,
  lg.section_number,
  lg.section_grade_level,
  lg.teacher_name,
  lg.grade_letter,
  lg.grade_code,
  lg.grade_percent,
  lg.gpa_points,
  lg.credit_hours_earned,
  lg.credit_type,
  lg.grade_status,
  (lg.grade_status = 'Final') AS is_final_grade,
  lg.grade_comment,
  lg.grade_level AS grade_level_reported,
  lg.source_api,
  lg.source_updated_date,
  lg.created_at,
  lg.updated_at,
  lg.potential_credit_hours,
  lg.gpa_added_value,
  lg.exclude_from_gpa,
  lg.term_abbreviation,
  lg.term_start_date,
  lg.term_end_date,
  lg.year_id,
  lg.year_name,
  lg.start_year AS year_start_year,
  lg.end_year AS year_end_year
FROM latest_grades lg;

COMMENT ON VIEW views.grades IS 'Latest grade details per student and course section, including course, term, and year metadata.';

GRANT SELECT ON views.grades TO authenticated;
GRANT SELECT ON views.grades TO service_role;

-- Build (or refresh) the student_attendance_daily projection
DROP VIEW IF EXISTS views.attendance_daily;

CREATE OR REPLACE VIEW views.attendance_daily
WITH (security_barrier = true)
AS
SELECT
  sda.student_daily_absence_id,
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
FROM public.student_daily_absences sda
LEFT JOIN public.schools sch ON sch.school_id = sda.school_id
LEFT JOIN public.years y ON y.year_id = sda.year_id
LEFT JOIN public.students st ON st.student_id = sda.student_id
WHERE (
  public.get_current_school_id() IS NULL
  OR sda.school_id = public.get_current_school_id()
);

COMMENT ON VIEW views.attendance_daily IS 'Daily student absence records with school-year context, filtered by selected school when provided.';

GRANT SELECT ON views.attendance_daily TO authenticated;
GRANT SELECT ON views.attendance_daily TO service_role;

-- Build (or refresh) the student_attendance_summary projection
DROP VIEW IF EXISTS views.attendance_summary;

CREATE OR REPLACE VIEW views.attendance_summary
WITH (security_barrier = true)
AS
WITH daily_absence_totals AS (
  SELECT
    sda.student_id,
    sda.school_id,
    sda.year_id,
    COUNT(*)::bigint AS total_absences,
    MIN(sda.absence_date) AS first_absence_date,
    MAX(sda.absence_date) AS last_absence_date
  FROM public.student_daily_absences sda
  WHERE (
    public.get_current_school_id() IS NULL
    OR sda.school_id = public.get_current_school_id()
  )
  GROUP BY sda.student_id, sda.school_id, sda.year_id
), course_attendance_totals AS (
  SELECT
    se.student_id,
    c.school_id,
    y.year_id,
    SUM(GREATEST(COALESCE(se.tardies, 0), 0))::bigint AS total_tardies,
    SUM(GREATEST(COALESCE(se.absences, 0), 0))::bigint AS total_course_absences
  FROM public.section_enrollments se
  JOIN public.sections s ON s.section_id = se.section_id
  JOIN public.courses c ON c.course_id = s.course_id
  LEFT JOIN public.terms t ON t.term_id = se.term_id
  LEFT JOIN public.years y ON y.year_id = t.year_id
  WHERE (
    public.get_current_school_id() IS NULL
    OR c.school_id = public.get_current_school_id()
  )
  GROUP BY se.student_id, c.school_id, y.year_id
), combined_keys AS (
  SELECT student_id, school_id, year_id
  FROM daily_absence_totals
  UNION
  SELECT student_id, school_id, year_id
  FROM course_attendance_totals
), combined AS (
  SELECT
    ck.student_id,
    ck.school_id,
    ck.year_id,
    COALESCE(d.total_absences, 0)::bigint AS total_absences,
    COALESCE(c.total_tardies, 0)::bigint AS total_tardies,
    COALESCE(c.total_course_absences, 0)::bigint AS total_course_absences,
    d.first_absence_date,
    d.last_absence_date
  FROM combined_keys ck
  LEFT JOIN daily_absence_totals d
    ON d.student_id = ck.student_id
   AND d.school_id = ck.school_id
   AND COALESCE(d.year_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(ck.year_id, '00000000-0000-0000-0000-000000000000'::uuid)
  LEFT JOIN course_attendance_totals c
    ON c.student_id = ck.student_id
   AND c.school_id = ck.school_id
   AND COALESCE(c.year_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(ck.year_id, '00000000-0000-0000-0000-000000000000'::uuid)
)
SELECT
  combined.student_id,
  combined.school_id,
  COALESCE(st.customer_id, sch.customer_id) AS customer_id,
  combined.year_id,
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
FROM combined
LEFT JOIN public.students st ON st.student_id = combined.student_id
LEFT JOIN public.schools sch ON sch.school_id = combined.school_id
LEFT JOIN public.years y ON y.year_id = combined.year_id
WHERE combined.student_id IS NOT NULL
  AND combined.school_id IS NOT NULL;

COMMENT ON VIEW views.attendance_summary IS 'Aggregated attendance metrics (absences and tardies) per student and school year, filtered by selected school when provided.';

GRANT SELECT ON views.attendance_summary TO authenticated;
GRANT SELECT ON views.attendance_summary TO service_role;

-- Build (or refresh) the student_contacts projection
DROP VIEW IF EXISTS views.contacts;

CREATE OR REPLACE VIEW views.contacts
WITH (security_barrier = true)
AS
SELECT
  scr.student_contact_relationship_id,
  scr.student_id,
  scr.contact_id,
  scr.school_id,
  COALESCE(scr.customer_id, c.customer_id, st.customer_id, sch.customer_id) AS customer_id,
  scr.relation_to_student,
  scr.created_at AS relationship_created_at,
  scr.updated_at AS relationship_updated_at,
  c.first_name,
  c.last_name,
  c.email_address,
  c.phone_mobile,
  c.phone_preferred,
  c.gender,
  c.source_updated_date,
  c.created_at AS contact_created_at,
  c.updated_at AS contact_updated_at,
  st.full_name AS student_full_name,
  st.grade_level,
  st.enrollment_status
FROM public.student_contact_relationships scr
JOIN public.contacts c ON c.contact_id = scr.contact_id
JOIN public.students st ON st.student_id = scr.student_id
LEFT JOIN public.schools sch ON sch.school_id = scr.school_id
WHERE (
  public.get_current_school_id() IS NULL
  OR scr.school_id = public.get_current_school_id()
);

COMMENT ON VIEW views.contacts IS 'Student-to-contact relationships with contact details and relationship metadata, filtered by selected school when provided.';

GRANT SELECT ON views.contacts TO authenticated;
GRANT SELECT ON views.contacts TO service_role;

-- Build (or refresh) the meeting_notes projection
DROP VIEW IF EXISTS views.meeting_notes;

CREATE OR REPLACE VIEW views.meeting_notes
WITH (security_barrier = true)
AS
WITH scoped_links AS (
  SELECT
    ssl.student_id,
    ssl.school_id,
    ssl.start_date,
    ssl.end_date,
    ssl.created_at,
    ssl.updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY ssl.student_id, ssl.school_id
      ORDER BY
        COALESCE(ssl.updated_at, ssl.created_at) DESC,
        COALESCE(ssl.end_date, CURRENT_DATE) DESC,
        ssl.start_date DESC
    ) AS row_rank
  FROM public.school_student_link ssl
  WHERE (
    public.get_current_school_id() IS NULL
    OR ssl.school_id = public.get_current_school_id()
  )
), visible_notes AS (
  SELECT
    mn.meeting_note_id,
    mn.student_id,
    mn.user_id,
    mn.created_by,
    mn.private,
    mn.summary,
    mn.notes,
    mn.transcript,
    mn.update_log,
    mn.created_at,
    mn.updated_at,
    sl.school_id,
    sl.start_date AS school_start_date,
    sl.end_date AS school_end_date,
    sl.created_at AS link_created_at,
    sl.updated_at AS link_updated_at
  FROM public.meeting_notes mn
  LEFT JOIN scoped_links sl
    ON sl.student_id = mn.student_id
   AND sl.row_rank = 1
)
SELECT
  vn.meeting_note_id,
  vn.student_id,
  vn.school_id,
  COALESCE(st.customer_id, sch.customer_id) AS customer_id,
  vn.user_id,
  vn.created_by,
  vn.private,
  vn.summary,
  vn.notes,
  vn.transcript,
  vn.update_log,
  vn.created_at,
  vn.updated_at,
  st.full_name AS student_full_name,
  st.grade_level AS student_grade_level,
  st.enrollment_status AS student_enrollment_status,
  st.student_number,
  st.state_student_number,
  vn.school_start_date,
  vn.school_end_date,
  CASE
    WHEN (vn.school_start_date IS NULL OR vn.school_start_date <= CURRENT_DATE)
     AND (vn.school_end_date IS NULL OR vn.school_end_date >= CURRENT_DATE)
    THEN true
    ELSE false
  END AS is_current_enrollment,
  u.first_name AS author_first_name,
  u.last_name AS author_last_name,
  u.email AS author_email
FROM visible_notes vn
JOIN public.students st ON st.student_id = vn.student_id
LEFT JOIN public.schools sch ON sch.school_id = vn.school_id
LEFT JOIN public.users u ON u.user_id = vn.user_id
WHERE vn.school_id IS NOT NULL
  AND (
    public.get_current_school_id() IS NULL
    OR vn.school_id = public.get_current_school_id()
  )
  AND vn.private = false;

COMMENT ON VIEW views.meeting_notes IS 'Public meeting notes per student and school with student and author context, filtered to the active school and excluding private entries.';

GRANT SELECT ON views.meeting_notes TO authenticated;
GRANT SELECT ON views.meeting_notes TO service_role;

-- Build (or refresh) the terms_reference projection
DROP VIEW IF EXISTS views.terms_reference;

CREATE OR REPLACE VIEW views.terms_reference
WITH (security_barrier = true)
AS
SELECT
  t.term_id,
  t.school_id,
  COALESCE(t.customer_id, sch.customer_id) AS customer_id,
  t.abbreviation,
  t.start_date,
  t.end_date,
  t.created_at,
  t.updated_at,
  t.year_id,
  y.name AS year_name,
  y.start_year,
  y.end_year,
  y.is_current AS is_current_year
FROM public.terms t
LEFT JOIN public.schools sch ON sch.school_id = t.school_id
LEFT JOIN public.years y ON y.year_id = t.year_id
WHERE (
  public.get_current_school_id() IS NULL
  OR t.school_id = public.get_current_school_id()
);

COMMENT ON VIEW views.terms_reference IS 'Reference list of terms for the selected school context, including associated school year details.';

GRANT SELECT ON views.terms_reference TO authenticated;
GRANT SELECT ON views.terms_reference TO service_role;

-- Build (or refresh) the courses_reference projection
DROP VIEW IF EXISTS views.courses_reference;

CREATE OR REPLACE VIEW views.courses_reference
WITH (security_barrier = true)
AS
SELECT
  c.course_id,
  c.school_id,
  COALESCE(c.customer_id, sch.customer_id) AS customer_id,
  c.name AS course_name,
  c.local_course_code,
  c.state_course_code,
  c.credit_type,
  c.created_at,
  c.updated_at,
  s.section_id,
  s.section_number,
  s.course_number,
  s.grade_level AS section_grade_level,
  s.teacher_name,
  s.no_of_students,
  s.transaction_date,
  s.created_at AS section_created_at,
  s.updated_at AS section_updated_at
FROM public.courses c
LEFT JOIN public.schools sch ON sch.school_id = c.school_id
LEFT JOIN public.sections s ON s.course_id = c.course_id
WHERE (
  public.get_current_school_id() IS NULL
  OR c.school_id = public.get_current_school_id()
);

COMMENT ON VIEW views.courses_reference IS 'Course catalog with associated section details for the selected school context.';

GRANT SELECT ON views.courses_reference TO authenticated;
GRANT SELECT ON views.courses_reference TO service_role;
