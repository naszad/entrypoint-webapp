-- DEV-274: enable pg_cron and schedule base refresh job
SET search_path TO public;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    EXECUTE 'CREATE EXTENSION pg_cron WITH SCHEMA pg_catalog';
  END IF;
END;
$$;

-- Ensure postgres role can access cron metadata.
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Helper function to refresh cache views in bulk.
DROP FUNCTION IF EXISTS views_admin.refresh_cache_bulk();
CREATE SCHEMA IF NOT EXISTS views_admin;

CREATE OR REPLACE FUNCTION views_admin.refresh_cache(view_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, views_cache
AS $$
BEGIN
  IF view_name IS NULL THEN
    RAISE EXCEPTION 'view_name cannot be null';
  END IF;

  IF view_name = 'student_profiles' THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY views_cache.student_profiles;
  ELSIF view_name = 'grades' THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY views_cache.grades;
  ELSIF view_name = 'attendance_daily' THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY views_cache.attendance_daily;
  ELSIF view_name = 'attendance_summary' THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY views_cache.attendance_summary;
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
END;
$$;

CREATE OR REPLACE FUNCTION views_admin.refresh_cache_bulk()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, views_cache
AS $$
BEGIN
  PERFORM set_config('app.current_school_id', NULL, true);

  PERFORM views_admin.refresh_cache('student_profiles');
  PERFORM views_admin.refresh_cache('grades');
  PERFORM views_admin.refresh_cache('attendance_daily');
  PERFORM views_admin.refresh_cache('attendance_summary');
  PERFORM views_admin.refresh_cache('contacts');
  PERFORM views_admin.refresh_cache('course_enrollments');
  PERFORM views_admin.refresh_cache('courses_reference');
  PERFORM views_admin.refresh_cache('terms_reference');
  PERFORM views_admin.refresh_cache('student_tags');
  PERFORM views_admin.refresh_cache('meeting_notes');
END;
$$;

-- Ensure cron job exists to run nightly at 5 AM UTC.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'views_cache_refresh_nightly') THEN
    PERFORM cron.unschedule('views_cache_refresh_nightly');
  END IF;
  PERFORM cron.schedule(
    'views_cache_refresh_nightly',
    '0 5 * * *',
    'SELECT views_admin.refresh_cache_bulk();'
  );
END;
$$;
