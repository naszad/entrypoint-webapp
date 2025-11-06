-- Refreshes the AI-facing terms reference view under the `views` schema.
-- Safe to rerun while iterating on the view definition.

DROP VIEW IF EXISTS views.terms_reference;

CREATE OR REPLACE VIEW views.terms_reference
WITH (security_barrier = true)
AS
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
      WHEN t.start_date ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN t.start_date::date
      ELSE NULL::date
    END AS parsed_start_date,
    CASE
      WHEN t.end_date ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN t.end_date::date
      ELSE NULL::date
    END AS parsed_end_date
  FROM public.terms t
  WHERE (
    public.get_current_school_id() IS NULL
    OR t.school_id = public.get_current_school_id()
  )
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
    WHEN st.parsed_start_date <= CURRENT_DATE AND st.parsed_end_date >= CURRENT_DATE THEN true
    ELSE false
  END AS is_current_term
FROM scoped_terms st
LEFT JOIN public.schools sch ON sch.school_id = st.school_id
LEFT JOIN public.years y ON y.year_id = st.year_id
WHERE st.school_id IS NOT NULL;

COMMENT ON VIEW views.terms_reference IS 'Term catalog scoped to the selected school, including friendly term label, school context, parsed start/end dates, and linked school year metadata.';

GRANT SELECT ON views.terms_reference TO authenticated;
GRANT SELECT ON views.terms_reference TO service_role;
