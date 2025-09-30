# Saved Views & Reports Architecture

Saved views let users capture the current state of any data table (filters, sorting, pagination, and column visibility) and reopen it later from the consolidated Reports list. This document explains how the capture flow, Supabase persistence, and management UI fit together so new tables can participate without reimplementing the plumbing. Pair this with the [Data Table & Filter Architecture](./data-table-architecture.md) guide for details on how filter tokens and URL params are produced.

## Saving a view from a table surface

1. **Open the dialog** – Tables render the shared `<SaveViewDialog>` button in their header. The dialog resets its internal form state every time it opens and uses `useSearchParams()` to read the current query string so it can serialize whatever the page has synchronized (filters, sort, page size, column visibility, domain toggles, etc.).【F:src/components/SaveViewDialog.tsx†L26-L153】
2. **Validate the name** – `handleSaveClick` prevents empty names and queries `getReportExistsByName` with the current user ID. If a duplicate exists, the dialog flips into an overwrite confirmation state so users can affirm the replacement instead of silently failing.【F:src/components/SaveViewDialog.tsx†L43-L150】
3. **Serialize params** – When saving, the dialog copies every search param key/value pair into a plain object and stringifies it. The resulting payload (name, optional description, serialized params) is handed to the parent page via `onSave`. Because the values come from `URLSearchParams`, they are always strings—avoid storing non-string state in the URL if the view needs to persist it.【F:src/components/SaveViewDialog.tsx†L57-L76】
4. **Call the reports service** – Table pages (Students, Grades, etc.) pass the dialog payload into the `saveReport` server action along with a `pageName` (used when reopening) and the authenticated user ID. Success and failure messages are surfaced via the shared `<Alert>` component, and analytics fire after a successful save to track feature usage.【F:src/app/(protected)/(counselor)/students/page.tsx†L105-L224】【F:src/app/(protected)/(counselor)/grades/page.tsx†L164-L237】

### Capture checklist for new tables
- Synchronize every piece of state that should persist (filters, sort, pagination, column visibility, domain toggles) into the URL before rendering `<SaveViewDialog>` so the dialog can scrape it.
- Provide a stable `pageName` when calling `saveReport`; the Reports page navigates back to this path when the user reopens the view.【F:src/app/(protected)/(counselor)/students/page.tsx†L115-L134】【F:src/app/(protected)/(counselor)/grades/page.tsx†L174-L187】
- Enforce that only logged-in users can save views by checking `user?.user_id` before invoking the server action, matching the existing pages.

## Supabase persistence contract

All saved views live in the `reports` table. `src/libs/reportsService.ts` exposes the contract used by UI surfaces and API routes.

- **`saveReport`** performs an upsert on `(user_id, lower(name))`. Existing reports are updated (including `page_name`, `description`, `params`, and `updated_at`), while new ones insert with the provided metadata. Every code path returns a friendly success message so calling pages can show a toast.【F:src/libs/reportsService.ts†L175-L236】
- **`getReportExistsByName`** powers duplicate-name validation in both the save and edit dialogs. It compares case-insensitive names scoped to the user and can exclude a specific `report_id` when editing.【F:src/libs/reportsService.ts†L151-L173】【F:src/components/EditReportDialog.tsx†L48-L112】
- **`fetchReportsByCriteria`** accepts the shared `FilterValue` tokens plus sort/pagination metadata. It maps friendly column keys to Supabase column names, translates `RecentOnly` shortcuts into an actual date range, and supports multi-select values (pipe-delimited) by switching between `.in` and `.eq` conditions. Always pass the authenticated user ID; the query is scoped to a single owner.【F:src/libs/reportsService.ts†L22-L149】
- **`updateReport` / `deleteReport`** update metadata or remove a view after confirming ownership. Both return success messages so the UI can refresh the listing and notify the user.【F:src/libs/reportsService.ts†L238-L292】

API routes wrap these helpers for client usage. The `/api/reports` endpoint parses the serialized filter tokens from the query string, forwards pagination/sort info, and returns the Supabase results to the Reports page.【F:src/app/api/reports/route.ts†L1-L34】

## Reports index experience

The `/reports` page surfaces every saved view for the current user using the shared DataTable components.【F:src/app/(protected)/(counselor)/reports/page.tsx†L22-L225】 Key behaviors:

- **Columns & filtering** – `ReportColumns` defines text filters for `name`/`description`, a sortable date column for `updated_at`, and an actions column for edit/delete controls. The metadata mirrors other tables so the filter dropdowns render automatically.【F:src/components/ReportColumns.tsx†L1-L95】
- **Opening a view** – Clicking a report row parses the stored `params` JSON, rebuilds a URL with those search params, and pushes the router to `page_name`. Analytics capture which target route opened and whether filters were present, following the Mixpanel conventions.【F:src/app/(protected)/(counselor)/reports/page.tsx†L36-L68】【F:src/hooks/useReportsAnalytics.ts†L1-L15】
- **Editing** – The inline dropdown launches `EditReportDialog`, which reuses the duplicate-name check and updates Supabase through `updateReport`. On success the page refreshes the table and shows a success alert.【F:src/app/(protected)/(counselor)/reports/page.tsx†L74-L108】【F:src/components/EditReportDialog.tsx†L15-L115】【F:src/libs/reportsService.ts†L238-L267】
- **Deleting** – Choosing Delete opens a confirmation dialog; on approval the page calls `deleteReport`, refreshes the listing, and shows feedback. Handle errors by surfacing the returned message just like save/edit flows.【F:src/app/(protected)/(counselor)/reports/page.tsx†L74-L225】【F:src/libs/reportsService.ts†L269-L292】

## Implementation tips & pitfalls

- **Route hygiene** – `page_name` should always be a valid, routable path (e.g., `/students`). If you rename or relocate a page, plan a migration to update existing reports; stale paths will lead to dead navigation when reopened.【F:src/app/(protected)/(counselor)/reports/page.tsx†L36-L53】
- **Stable param keys** – The params blob stores the raw query-string keys. Renaming filter keys or toggles can break saved views created before the change. Prefer introducing new keys while still honoring the old ones, then migrate existing records if deprecating them.
- **String-only values** – Because URLSearchParams are strings, avoid relying on complex objects in the serialized payload. When boolean toggles are needed (e.g., `mostRecentOnly=true`), keep them as string flags and coerce on read, as the Grades page does when hydrating state.【F:src/app/(protected)/(counselor)/grades/page.tsx†L31-L162】
- **Pagination defaults** – Saved views capture whatever `pageNumber` / `pageSize` were in the URL. Ensure your table surfaces set these params when the table loads so reopening a report restores the intended slice of data.【F:src/app/(protected)/(counselor)/students/page.tsx†L31-L221】【F:src/app/(protected)/(counselor)/reports/page.tsx†L124-L188】
- **Analytics coverage** – When adding new pages, emit consistent Mixpanel events after successful saves or when launching a report so product teams can track adoption.【F:src/app/(protected)/(counselor)/students/page.tsx†L121-L182】【F:src/hooks/useReportsAnalytics.ts†L1-L15】

By following these conventions, teams can add saved-view support to additional tables with minimal bespoke code while keeping the Reports surface cohesive.
