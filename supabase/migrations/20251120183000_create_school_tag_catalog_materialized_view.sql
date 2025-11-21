-- Materialized view that aggregates tag catalog metadata per school so the application can
-- fetch descriptors without scanning base tag assignments on every request.
DROP VIEW IF EXISTS views.school_tag_catalog;
DROP MATERIALIZED VIEW IF EXISTS views_cache.school_tag_catalog;

CREATE MATERIALIZED VIEW views_cache.school_tag_catalog AS
WITH school_tags AS (
  SELECT
    s.school_id,
    s.customer_id,
    t.tag_id,
    t.name AS tag_name,
    t.is_multi_value,
    t.tag_category_id,
    tc.name AS tag_category_name
  FROM public.schools s
  JOIN public.tags t ON t.customer_id = s.customer_id
  LEFT JOIN public.tag_categories tc ON tc.tag_category_id = t.tag_category_id
),
usage_stats AS (
  SELECT
    st.school_id,
    st.tag_id,
    COUNT(*)::bigint AS usage_count,
    COUNT(DISTINCT st.student_id)::bigint AS student_count,
    MAX(st.updated_at) AS last_seen,
    JSONB_AGG(DISTINCT TRIM(st.value)) FILTER (WHERE st.value IS NOT NULL AND TRIM(st.value) <> '') AS observed_values,
    COUNT(DISTINCT TRIM(st.value)) FILTER (WHERE st.value IS NOT NULL AND TRIM(st.value) <> '') AS observed_value_count
  FROM views.student_tags st
  GROUP BY st.school_id, st.tag_id
),
canonical_values AS (
  SELECT
    tcv.tag_id,
    JSONB_AGG(DISTINCT TRIM(tcv.value)) FILTER (WHERE tcv.value IS NOT NULL AND TRIM(tcv.value) <> '') AS canonical_values,
    COUNT(DISTINCT TRIM(tcv.value)) FILTER (WHERE tcv.value IS NOT NULL AND TRIM(tcv.value) <> '') AS canonical_value_count
  FROM public.tag_canonical_values tcv
  GROUP BY tcv.tag_id
)
SELECT
  st.school_id,
  st.customer_id,
  st.tag_id,
  st.tag_name,
  st.is_multi_value,
  st.tag_category_id,
  st.tag_category_name,
  COALESCE(us.usage_count, 0)::bigint AS usage_count,
  COALESCE(us.student_count, 0)::bigint AS student_count,
  us.last_seen,
  COALESCE(us.observed_value_count, 0)::bigint AS observed_value_count,
  COALESCE(cv.canonical_value_count, 0)::bigint AS canonical_value_count,
  COALESCE(us.observed_values, '[]'::jsonb) AS observed_values,
  COALESCE(cv.canonical_values, '[]'::jsonb) AS canonical_values,
  COALESCE(
    (
      SELECT TO_JSONB(ARRAY_AGG(val ORDER BY val))
      FROM (
        SELECT DISTINCT val
        FROM (
          SELECT JSONB_ARRAY_ELEMENTS_TEXT(COALESCE(us.observed_values, '[]'::jsonb)) AS val
          UNION ALL
          SELECT JSONB_ARRAY_ELEMENTS_TEXT(COALESCE(cv.canonical_values, '[]'::jsonb)) AS val
        ) merged
      ) deduped
    ),
    '[]'::jsonb
  ) AS all_values
FROM school_tags st
LEFT JOIN usage_stats us ON us.school_id = st.school_id AND us.tag_id = st.tag_id
LEFT JOIN canonical_values cv ON cv.tag_id = st.tag_id
WITH DATA;

CREATE UNIQUE INDEX views_cache_school_tag_catalog_school_tag_idx
  ON views_cache.school_tag_catalog (school_id, tag_id);

CREATE INDEX views_cache_school_tag_catalog_usage_idx
  ON views_cache.school_tag_catalog (school_id, usage_count DESC, last_seen DESC NULLS LAST, tag_name ASC);

CREATE VIEW views.school_tag_catalog AS
SELECT
  school_id,
  customer_id,
  tag_id,
  tag_name,
  is_multi_value,
  tag_category_id,
  tag_category_name,
  usage_count,
  student_count,
  last_seen,
  observed_value_count,
  canonical_value_count,
  observed_values,
  canonical_values,
  all_values
FROM views_cache.school_tag_catalog
WHERE public.get_current_school_id() IS NULL OR school_id = public.get_current_school_id();

COMMENT ON MATERIALIZED VIEW views_cache.school_tag_catalog IS 'Aggregated tag metadata per school used to accelerate AI tag catalog lookups.';
COMMENT ON VIEW views.school_tag_catalog IS 'Exposes aggregated tag metadata filtered by current school context.';

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
    REFRESH MATERIALIZED VIEW CONCURRENTLY views_cache.school_tag_catalog;
  ELSIF view_name = 'school_tag_catalog' THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY views_cache.school_tag_catalog;
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
  PERFORM views_admin.refresh_cache('school_tag_catalog');
  PERFORM views_admin.refresh_cache('meeting_notes');
END;$function$
;
