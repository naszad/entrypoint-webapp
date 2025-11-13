-- Ensure student_tags exposes the current school context for each assignment.
-- The materialized view now derives the active school using the same ranking
-- approach as the student profiles cache, and the view surfaces school_id to
-- downstream consumers.

DROP VIEW IF EXISTS views.student_tags;

DROP MATERIALIZED VIEW IF EXISTS views_cache.student_tags;

CREATE MATERIALIZED VIEW views_cache.student_tags AS
WITH ranked_links AS (
  SELECT
    ssl.student_id,
    ssl.school_id,
    ssl.start_date,
    ssl.end_date,
    ssl.created_at,
    ssl.updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY ssl.student_id
      ORDER BY
        CASE
          WHEN (
            (ssl.start_date IS NULL OR ssl.start_date <= CURRENT_DATE)
            AND (ssl.end_date IS NULL OR ssl.end_date >= CURRENT_DATE)
          ) THEN 0
          ELSE 1
        END,
        COALESCE(ssl.updated_at, ssl.created_at) DESC,
        ssl.created_at DESC
    ) AS row_rank
  FROM public.school_student_link ssl
  WHERE ssl.school_id IS NOT NULL
), current_links AS (
  SELECT
    student_id,
    school_id
  FROM ranked_links
  WHERE row_rank = 1
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
    cl.school_id
  FROM public.student_tags stg
  JOIN current_links cl ON cl.student_id = stg.student_id
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
JOIN public.students st ON st.student_id = ts.student_id
LEFT JOIN public.schools sch ON sch.school_id = ts.school_id
LEFT JOIN public.tags tg ON tg.tag_id = ts.tag_id
LEFT JOIN public.tag_categories tc ON tc.tag_category_id = tg.tag_category_id
LEFT JOIN public.tag_canonical_values tcv ON tcv.tag_canonical_value_id = ts.canonical_value_id
LEFT JOIN public.users creator ON creator.user_id = ts.created_by_user_id
LEFT JOIN public.users editor ON editor.user_id = ts.updated_by_user_id
WHERE ts.school_id IS NOT NULL;

CREATE UNIQUE INDEX views_cache_student_tags_uq
  ON views_cache.student_tags (student_tag_id);

CREATE INDEX views_cache_student_tags_school_tag_idx
  ON views_cache.student_tags (school_id, tag_id);

CREATE INDEX views_cache_student_tags_school_student_idx
  ON views_cache.student_tags (school_id, student_id);

CREATE VIEW views.student_tags
WITH (security_barrier = true)
AS
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
  state_student_number,
  school_id
FROM views_cache.student_tags
WHERE (
  public.get_current_school_id() IS NULL
  OR school_id = public.get_current_school_id()
);

COMMENT ON VIEW views.student_tags IS 'Student tag assignments enriched with tag definitions and student metadata, scoped to the active school context.';

GRANT SELECT ON views.student_tags TO authenticated;
GRANT SELECT ON views.student_tags TO service_role;
