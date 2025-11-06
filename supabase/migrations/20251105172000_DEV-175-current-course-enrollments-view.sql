-- Adds the AI-facing current course enrollments view under the `views` schema.
-- Safe to rerun while iterating on the view definition.

CREATE SCHEMA IF NOT EXISTS views;

DROP VIEW IF EXISTS views.current_course_enrollments;
DROP VIEW IF EXISTS views.course_enrollments;

CREATE OR REPLACE VIEW views.course_enrollments
WITH (security_barrier = true)
AS
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
  FROM public.section_enrollments se
  JOIN public.sections s ON s.section_id = se.section_id
  JOIN public.courses c ON c.course_id = s.course_id
  WHERE (
    public.get_current_school_id() IS NULL
    OR c.school_id = public.get_current_school_id()
  )
)
SELECT
  se.section_enrollment_id,
  se.student_id,
  se.section_id,
  se.course_id,
  se.term_id,
  se.school_id,
  sch.name AS school_name,
  COALESCE(
    st.customer_id,
    sch.customer_id,
    se.enrollment_customer_id,
    se.section_customer_id,
    se.course_customer_id
  ) AS customer_id,
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
    WHEN (se.start_date IS NULL OR se.start_date <= CURRENT_DATE)
      AND (se.end_date IS NULL OR se.end_date >= CURRENT_DATE)
    THEN true
    ELSE false
  END AS is_current_enrollment
FROM scoped_enrollments se
JOIN public.students st ON st.student_id = se.student_id
LEFT JOIN public.schools sch ON sch.school_id = se.school_id
LEFT JOIN public.terms t ON t.term_id = se.term_id
LEFT JOIN public.years y ON y.year_id = t.year_id
WHERE se.school_id IS NOT NULL
  AND (
    public.get_current_school_id() IS NULL
    OR se.school_id = public.get_current_school_id()
  );

COMMENT ON VIEW views.course_enrollments IS 'Course and section enrollments per student, including enrollment windows, course context, and active term metadata scoped to the selected school.';

GRANT SELECT ON views.course_enrollments TO authenticated;
GRANT SELECT ON views.course_enrollments TO service_role;
