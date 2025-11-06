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

## Design Principles
1. **RLS Preservation:** Views must query underlying tables without bypassing RLS (no `SECURITY DEFINER`). Use `SECURITY BARRIER` to prevent planner optimizations that could circumvent filters.
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
