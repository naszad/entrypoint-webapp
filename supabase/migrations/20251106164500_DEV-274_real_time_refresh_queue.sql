-- DEV-274: trigger-driven refresh queue for frequently changing views
SET search_path TO public;

-- Queue table to track pending refresh requests.
CREATE TABLE IF NOT EXISTS views_cache.refresh_queue (
  view_name text PRIMARY KEY,
  requested_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE views_cache.refresh_queue IS 'Queue of materialized views that need near-real-time refreshes.';

-- Ensure existing triggers are removed before redefining helper functions.
DROP TRIGGER IF EXISTS student_tags_refresh_queue_trigger ON student_tags;
DROP TRIGGER IF EXISTS meeting_notes_refresh_queue_trigger ON meeting_notes;

-- Helper to enqueue refresh requests.
DROP FUNCTION IF EXISTS views_admin.queue_refresh(text);
CREATE OR REPLACE FUNCTION views_admin.queue_refresh(p_view_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, views_cache
AS $$
BEGIN
  IF p_view_name IS NULL THEN
    RAISE EXCEPTION 'view_name cannot be null';
  END IF;

  INSERT INTO views_cache.refresh_queue (view_name, requested_at)
  VALUES (p_view_name, now())
  ON CONFLICT (view_name)
  DO UPDATE SET requested_at = EXCLUDED.requested_at;
END;
$$;

-- Trigger helpers for frequently changing sources.
DROP FUNCTION IF EXISTS views_admin.enqueue_student_tags_refresh();
CREATE OR REPLACE FUNCTION views_admin.enqueue_student_tags_refresh()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, views_cache
AS $$
BEGIN
  PERFORM views_admin.queue_refresh('student_tags');
  RETURN NULL;
END;
$$;

DROP FUNCTION IF EXISTS views_admin.enqueue_meeting_notes_refresh();
CREATE OR REPLACE FUNCTION views_admin.enqueue_meeting_notes_refresh()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, views_cache
AS $$
BEGIN
  PERFORM views_admin.queue_refresh('meeting_notes');
  RETURN NULL;
END;
$$;

-- Attach statement-level triggers so we enqueue once per statement.
CREATE TRIGGER student_tags_refresh_queue_trigger
AFTER INSERT OR UPDATE OR DELETE ON student_tags
FOR EACH STATEMENT EXECUTE FUNCTION views_admin.enqueue_student_tags_refresh();

CREATE TRIGGER meeting_notes_refresh_queue_trigger
AFTER INSERT OR UPDATE OR DELETE ON meeting_notes
FOR EACH STATEMENT EXECUTE FUNCTION views_admin.enqueue_meeting_notes_refresh();

-- Worker that processes queued refreshes.
DROP FUNCTION IF EXISTS views_admin.process_refresh_queue();
CREATE OR REPLACE FUNCTION views_admin.process_refresh_queue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, views_cache
AS $$
DECLARE
  pending_view text;
BEGIN
  PERFORM set_config('app.current_school_id', NULL, true);

  FOR pending_view IN
    SELECT q.view_name
    FROM views_cache.refresh_queue AS q
    ORDER BY q.requested_at
  LOOP
    BEGIN
      PERFORM views_admin.refresh_cache(pending_view);
      DELETE FROM views_cache.refresh_queue AS q
      WHERE q.view_name = pending_view;
    EXCEPTION WHEN OTHERS THEN
      -- Leave the row in the queue for retry and continue.
      RAISE NOTICE 'Failed to refresh %, will retry: %', pending_view, SQLERRM;
    END;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION views_admin.process_refresh_queue() IS 'Processes queued materialized view refresh requests for near-real-time updates.';

-- Cron worker every five minutes for near-real-time refreshes.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'views_cache_refresh_realtime') THEN
    PERFORM cron.unschedule('views_cache_refresh_realtime');
  END IF;
  PERFORM cron.schedule(
    'views_cache_refresh_realtime',
    '*/5 * * * *',
    'SELECT views_admin.process_refresh_queue();'
  );
END;
$$;
