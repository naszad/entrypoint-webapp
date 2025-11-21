-- Populate nominal date fields for years and expose them through a lightweight
-- years_reference view in the AI-visible schema.

UPDATE public.years
SET
    nominal_start_date = make_date(start_year, 8, 1),
    nominal_end_date = make_date(end_year, 7, 31)
WHERE
    nominal_start_date IS DISTINCT FROM make_date(start_year, 8, 1)
    OR nominal_end_date IS DISTINCT FROM make_date(end_year, 7, 31);

DROP VIEW IF EXISTS views.years_reference;

CREATE VIEW views.years_reference AS
SELECT
    y.year_id,
    y.year_external_id,
    y.name AS year_name,
    y.start_year,
    y.end_year,
    y.nominal_start_date,
    y.nominal_end_date,
    daterange(y.nominal_start_date, y.nominal_end_date, '[]') AS nominal_date_range,
    y.is_current
FROM public.years AS y;

COMMENT ON VIEW views.years_reference IS
    'Academic year metadata. Join on this to determine a year_id only if needed for other queries to scope data by school year.';

COMMENT ON COLUMN views.years_reference.nominal_start_date IS
    'A nominal start date for the academic year, set to August 1 of the start_year. Useful for date range comparisons.';
COMMENT ON COLUMN views.years_reference.nominal_end_date IS
    'A nominal end date for the academic year, set to July 31 of the end_year. Useful for date range comparisons.';
COMMENT ON COLUMN views.years_reference.nominal_date_range IS
    'A daterange representing the nominal start and end dates for the academic year.';
COMMENT ON COLUMN views.years_reference.year_name IS
    'A human-readable label for the academic year in the format "YYYY-YYYY".';
COMMENT ON COLUMN views.years_reference.is_current IS
    'Indicates whether the academic year is the current year.';


-- Revising the comment on terms_reference view because the AI kept using it for years.
COMMENT ON VIEW views.terms_reference IS 'The list of all academic terms (semesters, quarters, etc.) used by the school. Note that terms may overlap in time. A term is NOT the same thing as a school year (even though some terms are a full year in length). Don''t EVER use a term_id for a year_id in a query.';

COMMENT ON COLUMN views.absences_summary.is_current_year IS 'Whether this absences record is from the current active academic year for the school.';