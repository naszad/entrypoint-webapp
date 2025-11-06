-- Adds the AI-facing student tags view under the `views` schema.
-- Safe to rerun while iterating.

DROP VIEW IF EXISTS views.student_tags;

CREATE OR REPLACE VIEW views.student_tags
WITH (security_barrier = true)
AS
WITH scoped_links AS (
  SELECT DISTINCT
    ssl.student_id,
    ssl.school_id
  FROM public.school_student_link ssl
  WHERE (
    public.get_current_school_id() IS NULL
    OR ssl.school_id = public.get_current_school_id()
  )
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
  FROM public.student_tags stg
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
  st.state_student_number
FROM tagged_students ts
JOIN public.students st ON st.student_id = ts.student_id
LEFT JOIN public.schools sch ON sch.school_id = ts.school_id
LEFT JOIN public.tags tg ON tg.tag_id = ts.tag_id
LEFT JOIN public.tag_categories tc ON tc.tag_category_id = tg.tag_category_id
LEFT JOIN public.tag_canonical_values tcv ON tcv.tag_canonical_value_id = ts.canonical_value_id
LEFT JOIN public.users creator ON creator.user_id = ts.created_by_user_id
LEFT JOIN public.users editor ON editor.user_id = ts.updated_by_user_id
WHERE ts.school_id IS NOT NULL
  AND (
    public.get_current_school_id() IS NULL
    OR ts.school_id = public.get_current_school_id()
  );

COMMENT ON VIEW views.student_tags IS 'Student tag assignments enriched with tag definitions and student metadata, filtered to the active school context without exposing school details.';

GRANT SELECT ON views.student_tags TO authenticated;
GRANT SELECT ON views.student_tags TO service_role;
