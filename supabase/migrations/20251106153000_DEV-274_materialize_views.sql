-- DEV-274: convert AI-facing views to materialized cache with wrappers
SET search_path TO public;

-- Ensure cache schema exists and remains internal-only.
CREATE SCHEMA IF NOT EXISTS views_cache;
REVOKE ALL ON SCHEMA views_cache FROM PUBLIC;
GRANT USAGE ON SCHEMA views_cache TO postgres;
GRANT USAGE ON SCHEMA views_cache TO service_role;

-- =============================
-- student_profiles
-- =============================
DROP VIEW IF EXISTS views.student_profiles;
DROP MATERIALIZED VIEW IF EXISTS views_cache.student_profiles;

CREATE MATERIALIZED VIEW views_cache.student_profiles AS
WITH school_configs AS (
  SELECT
    ssl.school_id,
    (
      SELECT array_agg(elem.value)
      FROM jsonb_array_elements_text(cfg.value) AS elem(value)
    ) AS finalized_grade_codes
  FROM (
    SELECT DISTINCT ssl_1.school_id
    FROM school_student_link ssl_1
    WHERE ssl_1.school_id IS NOT NULL
  ) AS ssl
  LEFT JOIN LATERAL (
    SELECT fetch_public_config.value
    FROM fetch_public_config('final_grade_code', NULL::uuid, ssl.school_id, NULL::uuid)
    LIMIT 1
  ) AS cfg ON TRUE
), gpa_results AS (
  SELECT
    sc.school_id,
    gpa_calc.student_id,
    gpa_calc.gpa
  FROM school_configs sc
  JOIN LATERAL (
    SELECT
      calculate_gpa_for_students.student_id,
      calculate_gpa_for_students.gpa
    FROM calculate_gpa_for_students(
      (
        SELECT array_agg(DISTINCT ssl_1.student_id)
        FROM school_student_link ssl_1
        WHERE ssl_1.school_id = sc.school_id
      ),
      NULL::text,
      sc.finalized_grade_codes,
      NULL::text[],
      NULL::text[],
      NULL::integer[]
    ) AS calculate_gpa_for_students(student_id, gpa)
  ) AS gpa_calc ON TRUE
  WHERE gpa_calc.student_id IS NOT NULL
), scoped_links AS (
  SELECT
    ssl.student_id,
    ssl.school_id,
    ssl.start_date,
    ssl.end_date,
    ssl.created_at,
    ssl.updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY ssl.student_id,
                   ssl.school_id,
                   COALESCE(ssl.start_date, DATE '-infinity'),
                   COALESCE(ssl.end_date, DATE 'infinity')
      ORDER BY COALESCE(ssl.updated_at, ssl.created_at) DESC,
               ssl.created_at DESC
    ) AS row_rank
  FROM school_student_link ssl
  WHERE ssl.school_id IS NOT NULL
)
SELECT
  st.student_id,
  sl.school_id,
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
  sl.start_date AS school_start_date,
  sl.end_date AS school_end_date,
  CASE
    WHEN ((sl.start_date IS NULL OR sl.start_date <= CURRENT_DATE)
      AND (sl.end_date IS NULL OR sl.end_date >= CURRENT_DATE))
      THEN TRUE
    ELSE FALSE
  END AS is_current_enrollment,
  sc.city AS school_city,
  sc.state AS school_state,
  COALESCE(sl.start_date, DATE '0001-01-01') AS school_start_key,
  COALESCE(sl.end_date, DATE '9999-12-31') AS school_end_key
FROM students st
LEFT JOIN scoped_links sl ON sl.student_id = st.student_id AND sl.row_rank = 1
LEFT JOIN schools sc ON sc.school_id = sl.school_id
LEFT JOIN gpa_results ON gpa_results.student_id = st.student_id
  AND gpa_results.school_id = sl.school_id
WHERE sl.school_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS views_cache_student_profiles_uq
  ON views_cache.student_profiles (
    student_id,
    school_id,
    school_start_key,
    school_end_key
  );
CREATE INDEX IF NOT EXISTS views_cache_student_profiles_school_grade_idx
  ON views_cache.student_profiles (school_id, grade_level);
CREATE INDEX IF NOT EXISTS views_cache_student_profiles_school_status_idx
  ON views_cache.student_profiles (school_id, enrollment_status);

REFRESH MATERIALIZED VIEW views_cache.student_profiles;

CREATE OR REPLACE VIEW views.student_profiles
WITH (security_barrier) AS
SELECT
  student_id,
  school_id,
  school_name,
  customer_id,
  gpa,
  full_name,
  first_name,
  middle_name,
  last_name,
  grade_level,
  enrollment_status,
  homeroom_name,
  graduation_year,
  student_number,
  state_student_number,
  lunch_id,
  gender,
  date_of_birth,
  race,
  email,
  phone,
  address_physical_street,
  address_physical_city,
  address_physical_state,
  address_physical_postal_code,
  address_mailing_street,
  address_mailing_city,
  address_mailing_state,
  address_mailing_postal_code,
  locker_number,
  locker_combination,
  created_at,
  updated_at,
  school_start_date,
  school_end_date,
  is_current_enrollment,
  school_city,
  school_state
FROM views_cache.student_profiles
WHERE get_current_school_id() IS NULL
   OR school_id = get_current_school_id();

GRANT SELECT ON views.student_profiles TO authenticated;
GRANT SELECT ON views.student_profiles TO service_role;

-- =============================
-- grades
-- =============================
DROP VIEW IF EXISTS views.grades;
DROP MATERIALIZED VIEW IF EXISTS views_cache.grades;

CREATE MATERIALIZED VIEW views_cache.grades AS
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
      PARTITION BY sg.student_id, sg.section_id,
                   COALESCE(sg.grade_code, ''),
                   COALESCE(sg.grade_status, '')
      ORDER BY COALESCE(sg.source_updated_date::timestamptz, sg.updated_at, sg.created_at) DESC,
               sg.updated_at DESC,
               sg.created_at DESC,
               sg.grade_id DESC
    ) AS row_rank
  FROM student_grades sg
  JOIN sections s ON s.section_id = sg.section_id
  JOIN courses c ON c.course_id = s.course_id
  LEFT JOIN terms t ON t.term_id = sg.term_id
  LEFT JOIN years y ON y.year_id = t.year_id
)
SELECT
  grade_id,
  student_id,
  section_id,
  COALESCE(term_id, joined_term_id) AS term_id,
  COALESCE(course_id, joined_course_id) AS course_id,
  school_id,
  COALESCE(sg_customer_id, course_customer_id) AS customer_id,
  course_name,
  course_number,
  local_course_code,
  state_course_code,
  section_number,
  section_grade_level,
  teacher_name,
  grade_letter,
  grade_code,
  grade_percent,
  gpa_points,
  credit_hours_earned,
  credit_type,
  grade_status,
  (grade_status = 'Final') AS is_final_grade,
  grade_comment,
  grade_level AS grade_level_reported,
  source_api,
  source_updated_date,
  created_at,
  updated_at,
  potential_credit_hours,
  gpa_added_value,
  exclude_from_gpa,
  term_abbreviation,
  term_start_date,
  term_end_date,
  year_id,
  year_name,
  start_year AS year_start_year,
  end_year AS year_end_year
FROM scoped_grades
WHERE row_rank = 1;

CREATE UNIQUE INDEX IF NOT EXISTS views_cache_grades_uq
  ON views_cache.grades (grade_id);
CREATE INDEX IF NOT EXISTS views_cache_grades_student_course_idx
  ON views_cache.grades (student_id, course_id);
CREATE INDEX IF NOT EXISTS views_cache_grades_school_year_status_idx
  ON views_cache.grades (school_id, year_id, grade_status);

REFRESH MATERIALIZED VIEW views_cache.grades;

CREATE OR REPLACE VIEW views.grades
WITH (security_barrier) AS
SELECT *
FROM views_cache.grades
WHERE school_id IS NOT NULL
  AND (get_current_school_id() IS NULL OR school_id = get_current_school_id());

GRANT SELECT ON views.grades TO authenticated;
GRANT SELECT ON views.grades TO service_role;

-- =============================
-- attendance_daily
-- =============================
DROP VIEW IF EXISTS views.attendance_daily;
DROP MATERIALIZED VIEW IF EXISTS views_cache.attendance_daily;

CREATE MATERIALIZED VIEW views_cache.attendance_daily AS
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
FROM student_daily_absences sda
LEFT JOIN schools sch ON sch.school_id = sda.school_id
LEFT JOIN years y ON y.year_id = sda.year_id
LEFT JOIN students st ON st.student_id = sda.student_id
WHERE sda.school_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS views_cache_attendance_daily_uq
  ON views_cache.attendance_daily (student_daily_absence_id);
CREATE INDEX IF NOT EXISTS views_cache_attendance_daily_school_date_idx
  ON views_cache.attendance_daily (school_id, absence_date);

REFRESH MATERIALIZED VIEW views_cache.attendance_daily;

CREATE OR REPLACE VIEW views.attendance_daily
WITH (security_barrier) AS
SELECT *
FROM views_cache.attendance_daily
WHERE get_current_school_id() IS NULL
   OR school_id = get_current_school_id();

GRANT SELECT ON views.attendance_daily TO authenticated;
GRANT SELECT ON views.attendance_daily TO service_role;

-- =============================
-- attendance_summary
-- =============================
DROP VIEW IF EXISTS views.attendance_summary;
DROP MATERIALIZED VIEW IF EXISTS views_cache.attendance_summary;

CREATE MATERIALIZED VIEW views_cache.attendance_summary AS
WITH daily_absence_totals AS (
  SELECT
    sda.student_id,
    sda.school_id,
    sda.year_id,
    COUNT(*) AS total_absences,
    MIN(sda.absence_date) AS first_absence_date,
    MAX(sda.absence_date) AS last_absence_date
  FROM student_daily_absences sda
  WHERE sda.school_id IS NOT NULL
  GROUP BY sda.student_id, sda.school_id, sda.year_id
), course_attendance_totals AS (
  SELECT
    se.student_id,
    c.school_id,
    y.year_id,
    SUM(GREATEST(COALESCE(se.tardies, 0), 0)) AS total_tardies,
    SUM(GREATEST(COALESCE(se.absences, 0), 0)) AS total_course_absences
  FROM section_enrollments se
  JOIN sections s ON s.section_id = se.section_id
  JOIN courses c ON c.course_id = s.course_id
  LEFT JOIN terms t ON t.term_id = se.term_id
  LEFT JOIN years y ON y.year_id = t.year_id
  WHERE c.school_id IS NOT NULL
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
    COALESCE(d.total_absences, 0) AS total_absences,
    COALESCE(c.total_tardies, 0) AS total_tardies,
    COALESCE(c.total_course_absences, 0) AS total_course_absences,
    d.first_absence_date,
    d.last_absence_date
  FROM combined_keys ck
  LEFT JOIN daily_absence_totals d ON d.student_id = ck.student_id
    AND d.school_id = ck.school_id
    AND COALESCE(d.year_id, '00000000-0000-0000-0000-000000000000') = COALESCE(ck.year_id, '00000000-0000-0000-0000-000000000000')
  LEFT JOIN course_attendance_totals c ON c.student_id = ck.student_id
    AND c.school_id = ck.school_id
    AND COALESCE(c.year_id, '00000000-0000-0000-0000-000000000000') = COALESCE(ck.year_id, '00000000-0000-0000-0000-000000000000')
)
SELECT
  combined.student_id,
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
FROM combined
LEFT JOIN students st ON st.student_id = combined.student_id
LEFT JOIN schools sch ON sch.school_id = combined.school_id
LEFT JOIN years y ON y.year_id = combined.year_id
WHERE combined.student_id IS NOT NULL
  AND combined.school_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS views_cache_attendance_summary_uq
  ON views_cache.attendance_summary (student_id, school_id, year_key);
CREATE INDEX IF NOT EXISTS views_cache_attendance_summary_school_year_idx
  ON views_cache.attendance_summary (school_id, year_id);

REFRESH MATERIALIZED VIEW views_cache.attendance_summary;

CREATE OR REPLACE VIEW views.attendance_summary
WITH (security_barrier) AS
SELECT
  student_id,
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
FROM views_cache.attendance_summary
WHERE get_current_school_id() IS NULL
  OR school_id = get_current_school_id();

GRANT SELECT ON views.attendance_summary TO authenticated;
GRANT SELECT ON views.attendance_summary TO service_role;

-- =============================
-- contacts
-- =============================
DROP VIEW IF EXISTS views.contacts;
DROP MATERIALIZED VIEW IF EXISTS views_cache.contacts;

CREATE MATERIALIZED VIEW views_cache.contacts AS
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
FROM student_contact_relationships scr
JOIN contacts c ON c.contact_id = scr.contact_id
JOIN students st ON st.student_id = scr.student_id
LEFT JOIN schools sch ON sch.school_id = scr.school_id
WHERE scr.school_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS views_cache_contacts_uq
  ON views_cache.contacts (student_contact_relationship_id);
CREATE INDEX IF NOT EXISTS views_cache_contacts_school_student_idx
  ON views_cache.contacts (school_id, student_id);

REFRESH MATERIALIZED VIEW views_cache.contacts;

CREATE OR REPLACE VIEW views.contacts
WITH (security_barrier) AS
SELECT *
FROM views_cache.contacts
WHERE get_current_school_id() IS NULL
   OR school_id = get_current_school_id();

GRANT SELECT ON views.contacts TO authenticated;
GRANT SELECT ON views.contacts TO service_role;

-- =============================
-- meeting_notes
-- =============================
DROP VIEW IF EXISTS views.meeting_notes;
DROP MATERIALIZED VIEW IF EXISTS views_cache.meeting_notes;

CREATE MATERIALIZED VIEW views_cache.meeting_notes AS
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
      ORDER BY COALESCE(ssl.updated_at, ssl.created_at) DESC,
               COALESCE(ssl.end_date, CURRENT_DATE) DESC,
               ssl.start_date DESC
    ) AS row_rank
  FROM school_student_link ssl
  WHERE ssl.school_id IS NOT NULL
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
  FROM meeting_notes mn
  LEFT JOIN scoped_links sl ON sl.student_id = mn.student_id AND sl.row_rank = 1
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
    WHEN ((vn.school_start_date IS NULL OR vn.school_start_date <= CURRENT_DATE)
      AND (vn.school_end_date IS NULL OR vn.school_end_date >= CURRENT_DATE))
      THEN TRUE
    ELSE FALSE
  END AS is_current_enrollment,
  u.first_name AS author_first_name,
  u.last_name AS author_last_name,
  u.email AS author_email
FROM visible_notes vn
JOIN students st ON st.student_id = vn.student_id
LEFT JOIN schools sch ON sch.school_id = vn.school_id
LEFT JOIN users u ON u.user_id = vn.user_id
WHERE vn.school_id IS NOT NULL
  AND vn.private = FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS views_cache_meeting_notes_uq
  ON views_cache.meeting_notes (meeting_note_id);
CREATE INDEX IF NOT EXISTS views_cache_meeting_notes_school_created_idx
  ON views_cache.meeting_notes (school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS views_cache_meeting_notes_student_idx
  ON views_cache.meeting_notes (student_id, school_id);

REFRESH MATERIALIZED VIEW views_cache.meeting_notes;

CREATE OR REPLACE VIEW views.meeting_notes
WITH (security_barrier) AS
SELECT *
FROM views_cache.meeting_notes
WHERE get_current_school_id() IS NULL
   OR school_id = get_current_school_id();

GRANT SELECT ON views.meeting_notes TO authenticated;
GRANT SELECT ON views.meeting_notes TO service_role;

-- =============================
-- student_tags
-- =============================
DROP VIEW IF EXISTS views.student_tags;
DROP MATERIALIZED VIEW IF EXISTS views_cache.student_tags;

CREATE MATERIALIZED VIEW views_cache.student_tags AS
WITH scoped_links AS (
  SELECT DISTINCT
    ssl.student_id,
    ssl.school_id
  FROM school_student_link ssl
  WHERE ssl.school_id IS NOT NULL
), tagged_students AS (
  SELECT
    stg.student_tag_id,
    stg.student_id,
    stg.tag_id,
    stg.value,
    stg.canonical_value_id,
    stg.source,
    stg.created_by_user_id,
    stg.updated_by_user_id,
    stg.created_at,
    stg.updated_at,
    sl.school_id
  FROM student_tags stg
  JOIN scoped_links sl ON sl.student_id = stg.student_id
)
SELECT
  ts.student_tag_id,
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
FROM tagged_students ts
JOIN students st ON st.student_id = ts.student_id
LEFT JOIN schools sch ON sch.school_id = ts.school_id
LEFT JOIN tags tg ON tg.tag_id = ts.tag_id
LEFT JOIN tag_categories tc ON tc.tag_category_id = tg.tag_category_id
LEFT JOIN tag_canonical_values tcv ON tcv.tag_canonical_value_id = ts.canonical_value_id
LEFT JOIN users creator ON creator.user_id = ts.created_by_user_id
LEFT JOIN users editor ON editor.user_id = ts.updated_by_user_id
WHERE ts.school_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS views_cache_student_tags_uq
  ON views_cache.student_tags (student_tag_id);
CREATE INDEX IF NOT EXISTS views_cache_student_tags_school_tag_idx
  ON views_cache.student_tags (school_id, tag_id);
CREATE INDEX IF NOT EXISTS views_cache_student_tags_school_student_idx
  ON views_cache.student_tags (school_id, student_id);

REFRESH MATERIALIZED VIEW views_cache.student_tags;

CREATE OR REPLACE VIEW views.student_tags
WITH (security_barrier) AS
SELECT
  student_tag_id,
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
  state_student_number
FROM views_cache.student_tags
WHERE get_current_school_id() IS NULL
   OR school_id = get_current_school_id();

GRANT SELECT ON views.student_tags TO authenticated;
GRANT SELECT ON views.student_tags TO service_role;

-- =============================
-- course_enrollments
-- =============================
DROP VIEW IF EXISTS views.course_enrollments;
DROP MATERIALIZED VIEW IF EXISTS views_cache.course_enrollments;

CREATE MATERIALIZED VIEW views_cache.course_enrollments AS
WITH scoped_enrollments AS (
  SELECT
    se.section_enrollment_id,
    se.student_id,
    se.section_id,
    se.term_id,
    se.start_date,
    se.end_date,
    se.transaction_date,
    se.created_at,
    se.updated_at,
    se.customer_id AS enrollment_customer_id,
    s.course_id,
    s.section_number,
    s.course_number,
    s.grade_level AS section_grade_level,
    s.teacher_name,
    s.no_of_students,
    s.customer_id AS section_customer_id,
    COALESCE(s.school_id, c.school_id) AS school_id,
    c.name AS course_name,
    c.local_course_code,
    c.state_course_code,
    c.credit_type,
    c.customer_id AS course_customer_id
  FROM section_enrollments se
  JOIN sections s ON s.section_id = se.section_id
  JOIN courses c ON c.course_id = s.course_id
)
SELECT
  se.section_enrollment_id,
  se.student_id,
  se.section_id,
  se.course_id,
  se.term_id,
  se.school_id,
  sch.name AS school_name,
  COALESCE(st.customer_id, sch.customer_id, se.enrollment_customer_id, se.section_customer_id, se.course_customer_id) AS customer_id,
  st.full_name AS student_full_name,
  st.grade_level AS student_grade_level,
  st.enrollment_status AS student_enrollment_status,
  st.student_number,
  st.state_student_number,
  se.course_name,
  se.course_number,
  se.local_course_code,
  se.state_course_code,
  se.credit_type,
  se.section_number,
  se.section_grade_level,
  se.teacher_name,
  se.start_date AS enrollment_start_date,
  se.end_date AS enrollment_end_date,
  se.transaction_date,
  se.created_at,
  se.updated_at,
  t.abbreviation AS term_abbreviation,
  t.start_date AS term_start_date,
  t.end_date AS term_end_date,
  y.year_id,
  y.name AS year_name,
  y.start_year AS year_start_year,
  y.end_year AS year_end_year,
  y.is_current AS is_current_year,
  CASE
    WHEN ((se.start_date IS NULL OR se.start_date <= CURRENT_DATE)
      AND (se.end_date IS NULL OR se.end_date >= CURRENT_DATE))
      THEN TRUE
    ELSE FALSE
  END AS is_current_enrollment
FROM scoped_enrollments se
JOIN students st ON st.student_id = se.student_id
LEFT JOIN schools sch ON sch.school_id = se.school_id
LEFT JOIN terms t ON t.term_id = se.term_id
LEFT JOIN years y ON y.year_id = t.year_id
WHERE se.school_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS views_cache_course_enrollments_uq
  ON views_cache.course_enrollments (section_enrollment_id);
CREATE INDEX IF NOT EXISTS views_cache_course_enrollments_current_idx
  ON views_cache.course_enrollments (school_id, student_id, is_current_enrollment);
CREATE INDEX IF NOT EXISTS views_cache_course_enrollments_course_idx
  ON views_cache.course_enrollments (school_id, course_id);

REFRESH MATERIALIZED VIEW views_cache.course_enrollments;

CREATE OR REPLACE VIEW views.course_enrollments
WITH (security_barrier) AS
SELECT *
FROM views_cache.course_enrollments
WHERE get_current_school_id() IS NULL
   OR school_id = get_current_school_id();

GRANT SELECT ON views.course_enrollments TO authenticated;
GRANT SELECT ON views.course_enrollments TO service_role;

-- =============================
-- courses_reference
-- =============================
DROP VIEW IF EXISTS views.courses_reference;
DROP MATERIALIZED VIEW IF EXISTS views_cache.courses_reference;

CREATE MATERIALIZED VIEW views_cache.courses_reference AS
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
FROM courses c
LEFT JOIN schools sch ON sch.school_id = c.school_id
LEFT JOIN sections s ON s.course_id = c.course_id
WHERE c.school_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS views_cache_courses_reference_uq
  ON views_cache.courses_reference (course_id, section_id);
CREATE INDEX IF NOT EXISTS views_cache_courses_reference_course_number_idx
  ON views_cache.courses_reference (school_id, course_number);
CREATE INDEX IF NOT EXISTS views_cache_courses_reference_section_number_idx
  ON views_cache.courses_reference (school_id, section_number);

REFRESH MATERIALIZED VIEW views_cache.courses_reference;

CREATE OR REPLACE VIEW views.courses_reference
WITH (security_barrier) AS
SELECT *
FROM views_cache.courses_reference
WHERE get_current_school_id() IS NULL
   OR school_id = get_current_school_id();

GRANT SELECT ON views.courses_reference TO authenticated;
GRANT SELECT ON views.courses_reference TO service_role;

-- =============================
-- terms_reference
-- =============================
DROP VIEW IF EXISTS views.terms_reference;
DROP MATERIALIZED VIEW IF EXISTS views_cache.terms_reference;

CREATE MATERIALIZED VIEW views_cache.terms_reference AS
WITH scoped_terms AS (
  SELECT
    t.term_id,
    t.school_id,
    t.year_id,
    t.abbreviation,
    t.external_name,
    t.start_date,
    t.end_date,
    t.created_at,
    t.updated_at,
    t.customer_id,
    CASE
      WHEN t.start_date ~ '^\d{4}-\d{2}-\d{2}$' THEN t.start_date::date
      ELSE NULL::date
    END AS parsed_start_date,
    CASE
      WHEN t.end_date ~ '^\d{4}-\d{2}-\d{2}$' THEN t.end_date::date
      ELSE NULL::date
    END AS parsed_end_date
  FROM terms t
  WHERE t.school_id IS NOT NULL
)
SELECT
  st.term_id,
  st.school_id,
  sch.name AS school_name,
  COALESCE(st.customer_id, sch.customer_id) AS customer_id,
  COALESCE(NULLIF(st.external_name, ''), st.abbreviation) AS term_name,
  st.abbreviation AS term_abbreviation,
  st.start_date AS term_start_date_raw,
  st.end_date AS term_end_date_raw,
  st.parsed_start_date AS term_start_date,
  st.parsed_end_date AS term_end_date,
  st.created_at,
  st.updated_at,
  st.year_id,
  y.name AS year_name,
  y.start_year AS year_start_year,
  y.end_year AS year_end_year,
  y.is_current AS is_current_year,
  CASE
    WHEN st.parsed_start_date IS NULL OR st.parsed_end_date IS NULL THEN NULL
    WHEN st.parsed_start_date <= CURRENT_DATE AND st.parsed_end_date >= CURRENT_DATE THEN TRUE
    ELSE FALSE
  END AS is_current_term
FROM scoped_terms st
LEFT JOIN schools sch ON sch.school_id = st.school_id
LEFT JOIN years y ON y.year_id = st.year_id;

CREATE UNIQUE INDEX IF NOT EXISTS views_cache_terms_reference_uq
  ON views_cache.terms_reference (term_id);
CREATE INDEX IF NOT EXISTS views_cache_terms_reference_school_start_idx
  ON views_cache.terms_reference (school_id, term_start_date);

REFRESH MATERIALIZED VIEW views_cache.terms_reference;

CREATE OR REPLACE VIEW views.terms_reference
WITH (security_barrier) AS
SELECT *
FROM views_cache.terms_reference
WHERE get_current_school_id() IS NULL
   OR school_id = get_current_school_id();

GRANT SELECT ON views.terms_reference TO authenticated;
GRANT SELECT ON views.terms_reference TO service_role;

-- =============================
-- attendance helper functions remain unchanged except discovery.
-- Update list_views to avoid exposing cache objects.
CREATE OR REPLACE FUNCTION views.list_views()
RETURNS TABLE(name text, comment text)
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'views'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.relname::text AS name,
    obj_description(c.oid, 'pg_class')::text AS comment
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'views'
    AND c.relkind = 'v'
    AND pg_catalog.pg_table_is_visible(c.oid);
END;
$$;

-- Ensure the helper wrappers in public remain intact.
CREATE OR REPLACE FUNCTION public.list_views()
RETURNS TABLE(name text, comment text)
LANGUAGE sql
AS $$
  SELECT * FROM views.list_views();
$$;

-- Comments
COMMENT ON SCHEMA views_cache IS 'Internal cache of materialized projections backing the AI-safe views schema.';
COMMENT ON MATERIALIZED VIEW views_cache.student_profiles IS 'Materialized student profile data per school/student link. Wrapped by views.student_profiles.';
COMMENT ON MATERIALIZED VIEW views_cache.grades IS 'Materialized latest grade records per student/course. Wrapped by views.grades.';
COMMENT ON MATERIALIZED VIEW views_cache.attendance_daily IS 'Materialized daily attendance detail records. Wrapped by views.attendance_daily.';
COMMENT ON MATERIALIZED VIEW views_cache.attendance_summary IS 'Materialized per-student attendance summaries. Wrapped by views.attendance_summary.';
COMMENT ON MATERIALIZED VIEW views_cache.contacts IS 'Materialized student contact relationships. Wrapped by views.contacts.';
COMMENT ON MATERIALIZED VIEW views_cache.meeting_notes IS 'Materialized public meeting notes with student context. Wrapped by views.meeting_notes.';
COMMENT ON MATERIALIZED VIEW views_cache.student_tags IS 'Materialized student tag assignments and metadata. Wrapped by views.student_tags.';
COMMENT ON MATERIALIZED VIEW views_cache.course_enrollments IS 'Materialized course enrollment projections. Wrapped by views.course_enrollments.';
COMMENT ON MATERIALIZED VIEW views_cache.courses_reference IS 'Materialized course and section catalog. Wrapped by views.courses_reference.';
COMMENT ON MATERIALIZED VIEW views_cache.terms_reference IS 'Materialized term catalog with parsed dates. Wrapped by views.terms_reference.';
