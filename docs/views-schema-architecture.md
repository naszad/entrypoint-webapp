# Views Schema Architecture

## Goal
Create a dedicated `views` schema that exposes curated read-only projections tailored for AI-driven SQL tooling and reporting. This keeps application logic simple while restricting the AI to safe, denormalized datasets that honor existing row-level security (RLS).

## Current Scope
- **`views.student_profiles`:** Student demographics, enrollment linkage, school metadata, and computed GPA.
- **`views.grades`:** Latest grade details per student/course section with course, term, and year context for simplified performance analysis.
- **`views.attendance_daily`:** Daily absence records enriched with school-year metadata for straightforward attendance lookups.
- **`views.attendance_summary`:** Aggregated absences and tardies per student and school year, combining daily absences with section-level counts.
- **`views.contacts`:** Student-to-contact relationships with contact details, preferred channels, and relationship metadata.
- **`views.meeting_notes`:** Public meeting notes per student and school, enriched with student context and author details while excluding private entries.
- **`views.student_tags`:** Student tag assignments plus tag definitions and canonical values, scoped to the selected school without returning school identifiers.
- **`views.course_enrollments`:** Section enrollments per student with course, section, term, and school-year context so AI tooling can answer schedule questions without relying on posted grades.
- **AI RPC helpers:** Functions `views.list_views`, `views.get_view_schema`, and `views.execute_safe_select` expose only curated schema metadata and query execution within this schema. Legacy `public.*` wrappers simply delegate to these implementations for RPC compatibility.
- **`views.terms_reference`:** Term catalog constrained to the active school, exposing friendly names, parsed start/end dates, and current-term status alongside school-year context.
- **`views.courses_reference`:** Course catalog with associated section details for quick schedule and staffing lookups.
- **GPA Handling:** A `gpa_results` CTE batches calls to `public.calculate_gpa_for_students` per school, using finalized grade codes from configuration when available. This keeps GPA calculation cost amortized and aligned with school-specific rules.
- **School Context:** Each view enforces the active school via `public.get_current_school_id()` so existing RLS policies on the underlying tables continue to apply.

## Materialized Cache Strategy
We now persist the heavy projections in a dedicated `views_cache` schema. Each relation there is a materialized view (e.g., `views_cache.student_profiles`) populated without `get_current_school_id()` filtering so cached data spans every school. Supporting indexes provide a unique key for concurrent refreshes and accelerate the most common predicates (school, student, term, status).

The outward-facing objects remain in the `views` schema as `SECURITY BARRIER` wrapper views that select from `views_cache.*` and reapply the per-request `get_current_school_id()` predicate. This keeps the AI sandbox stable while letting the application and reporting layers enjoy cached data. Helper functions (`views.list_views`, `views.get_view_schema`, `views.execute_safe_select`) continue to expose only `views.*`, so AI tooling never sees the cache directly.

Refresh cadence:
- Nightly bulk refresh: `views_admin.refresh_cache_bulk()` orchestrates the long-lived datasets (`student_profiles`, `grades`, `course_enrollments`, `attendance_daily`, `attendance_summary`, `terms_reference`, `courses_reference`, `contacts`). A `pg_cron` job (`views_cache_refresh_nightly`) runs this at 05:00 UTC.
- Near-real-time queue: `views_cache.student_tags` and `views_cache.meeting_notes` enqueue refresh requests into `views_cache.refresh_queue` via statement-level triggers on their source tables. A `pg_cron` worker (`views_cache_refresh_realtime`) runs every five minutes and drains the queue with `views_admin.process_refresh_queue()`.

Automation lives in the `views_admin` schema. The helper `views_admin.refresh_cache(view_name text)` wraps individual `REFRESH MATERIALIZED VIEW CONCURRENTLY` calls, while `views_admin.refresh_cache_bulk()` sets `app.current_school_id` to `NULL` and executes the nightly set. Always invoke these helpers from jobs or pipelines rather than hitting the materialized views directly so the security model stays centralized.

Operationally, `views_admin` is our control plane:
- **Schema ownership:** lives beside `views`/`views_cache` and stores helper routines only—no data tables.
- **Job scheduling:** the nightly `pg_cron` job (`views_cache_refresh_nightly`) runs from the service role and calls `views_admin.refresh_cache_bulk()`. Granting access to the `cron` schema is handled in migration `20251106161000_DEV-274_enable_pg_cron_and_refresh_jobs.sql`.
- **Extension guardrails:** the migration enables `pg_cron` (schema `pg_catalog`) and explicitly grants the `postgres` role access to `cron.*`, ensuring jobs remain manageable via SQL migrations instead of the dashboard.
- **Near-real-time queue:** migration `20251106164500_DEV-274_real_time_refresh_queue.sql` adds `views_cache.refresh_queue`, trigger helpers, and the five-minute cron job `views_cache_refresh_realtime` which calls `views_admin.process_refresh_queue()`.
- **Least-privilege execution:** helper routines inside `views_admin` run as `SECURITY DEFINER` with a constrained `search_path`, allowing statement-level triggers on `student_tags` and `meeting_notes` to enqueue refreshes while keeping AI-facing schemas locked down.
- **Student profile dedupe:** the base materialization in `20251106153000_DEV-274_materialize_views.sql` uses `ROW_NUMBER()` to collapse duplicate school/student link records and stores normalized `school_start_key` / `school_end_key` columns so the unique index required for concurrent refreshes remains valid.
- **Attendance summary key:** the same migration introduces a `year_key` column backing `views_cache.attendance_summary`, removing expression-based uniqueness so concurrent refreshes stay safe while the wrapper view hides the internal key.

## Design Principles
1. **RLS Preservation:** Views must query underlying tables without bypassing RLS (no `SECURITY DEFINER` on the user-facing wrappers). Use `SECURITY BARRIER` to prevent planner optimizations that could circumvent filters.
2. **Schema Confinement:** Queries running through AI tooling will be restricted to the `views` schema. Expose only columns safe for AI consumption.
3. **Denormalized, Readable Columns:** Favor friendly column aliases (e.g., `is_current_enrollment`, `relationship_created_at`). Document any derived fields via `COMMENT ON` statements.
4. **Performance Awareness:** Expensive computations (like GPA) should be batched or materialized as needed. Monitor query plans and consider indexes on underlying tables when a view gains heavy usage.
5. **Idempotent Migrations:** Use `CREATE SCHEMA IF NOT EXISTS`, `DROP VIEW IF EXISTS`, and `CREATE OR REPLACE VIEW` so migrations can be rerun while iterating on the design.

## Extending the Schema
When adding new views:
- Start with a migration that defines/updates the view under `views.*` and grants `SELECT` to `authenticated` and `service_role` roles.
- Keep the same filtering pattern to respect `get_current_school_id()`.
- Cache or pre-compute heavy aggregations (attendance rollups, grade summaries) using CTEs, materialized views, or helper functions.
- Document business intent and usage notes in this file as well as SQL `COMMENT` statements.
