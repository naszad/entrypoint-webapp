-- Add a boolean helper flag to absences_daily so AI prompts can rely on a stable
-- enrollment status indicator instead of string comparisons.

DROP VIEW IF EXISTS views.absences_daily;
DROP MATERIALIZED VIEW IF EXISTS views_cache.absences_daily;

CREATE MATERIALIZED VIEW views_cache.absences_daily AS
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
    st.enrollment_status,
    CASE WHEN st.enrollment_status = 'Active' THEN TRUE ELSE FALSE END AS is_student_active
FROM public.student_daily_absences AS sda
LEFT JOIN public.schools AS sch ON sch.school_id = sda.school_id
LEFT JOIN public.years AS y ON y.year_id = sda.year_id
LEFT JOIN public.students AS st ON st.student_id = sda.student_id
WHERE sda.school_id IS NOT NULL;

CREATE UNIQUE INDEX views_cache_attendance_daily_uq
  ON views_cache.absences_daily USING btree (student_daily_absence_id);
CREATE INDEX views_cache_attendance_daily_school_date_idx
  ON views_cache.absences_daily USING btree (school_id, absence_date);

CREATE OR REPLACE VIEW views.absences_daily AS
SELECT
    student_daily_absence_id,
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
    enrollment_status,
    is_student_active
FROM views_cache.absences_daily
WHERE public.get_current_school_id() IS NULL OR school_id = public.get_current_school_id();

COMMENT ON VIEW views.absences_daily IS 'Day by day absence records by student.';
COMMENT ON COLUMN views.absences_daily.absence_date IS 'The date of the absence record. You can use this with term information or dates to count absences.';
COMMENT ON COLUMN views.absences_daily.grade_level IS 'The grade level of the student for the absence record at the time the absence occurred.';
COMMENT ON COLUMN views.absences_daily.is_student_active IS 'Boolean helper for determining if this absence record is for an active student; this is true when enrollment_status is Active, false otherwise. Prefer this for filtering absence records for active students.';
