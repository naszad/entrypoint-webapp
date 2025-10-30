# Data Table & Filter Architecture

This guide explains how the shared data table experience works in the EntryPoint web app so feature teams can add new tables, extend filtering, or plug the UI into new back-end resources without duplicating logic.

## Front-end building blocks

### Column metadata and the `DataTable` shell
- Define table columns with TanStack Table `ColumnDef` objects and attach `ColumnMeta` so the shared shell knows which columns can filter or sort and what input to render (text, number, date, dropdown, or multi-select). Columns can also disable hiding so primary identifiers always remain visible.【F:src/components/DataTable/DataTable.tsx†L25-L196】【F:src/components/StudentColumns.tsx†L26-L130】【F:src/components/GradeColumns.tsx†L26-L134】
- Each column declaration maps to a `FilterValue` token (`{ id?, key, condition, value }`) that travels through the table pipeline. The optional `id` keeps multiple numeric conditions stable in the UI; it is ignored when serializing to the `filters` query string. Keep accessor keys steady—back-end services translate them into SQL column names with helpers like `getColumnName` / `getGradeColumnName`. When the key needs suffixes (`From`, `To`, `RecentOnly`) those helpers strip them before querying.【F:src/components/DataTable/DataTable.tsx†L33-L55】【F:src/libs/studentsService.ts†L94-L214】
- The `DataTable` component wires Mixpanel-friendly toolbar chips, optional action buttons, row click handlers, pagination UI, and remote multi-select loaders. It owns the TanStack table instance and hands column visibility changes to `useColumnVisibility`, which mirrors the `columns` URL parameter.【F:src/components/DataTable/DataTable.tsx†L58-L253】【F:src/components/DataTable/DataTableToolbar.tsx†L1-L150】【F:src/hooks/useColumnVisibility.ts†L1-L62】

### Filter UI widgets
- `FilterDropdown` renders the correct control for the column: condition select for free-text/number filters, dropdown lists, remote multi-select checklists, or date pickers with "Last N days" shortcuts. "Recent only" values disable the range inputs so we never send conflicting filters. Number columns now support stacking multiple comparison rows (e.g., GPA `gte 3.0` **and** `lte 3.5`). The dropdown also exposes column-level sort buttons.【F:src/components/DataTable/FilterDropdown.tsx†L10-L285】
- `MultiSelectFilter` keeps selections in sync with the parent hook and serializes them as pipe-delimited strings so the back-end can call Supabase `in` queries. Provide a `multiSelectRemoteSource` prop when options should come from the server (e.g., grade code sort order).【F:src/components/DataTable/MultiSelectFilter.tsx†L1-L142】【F:src/app/(protected)/(counselor)/grades/page.tsx†L189-L236】
- Toolbar chips show applied filters, normalize special keys (`RecentOnly` → base column label), and support clearing a single filter or wiping everything. This behavior lives in `DataTableToolbar` and `ToolbarFilters` so individual pages stay lightweight.【F:src/components/DataTable/DataTableToolbar.tsx†L1-L150】

### URL-synchronized state with `useTableParams`
- `useTableParams` is the contract between the table shell, the browser URL, and page-level data fetching. On mount it reads `filters`, `sort`, `pageNumber`, `pageSize`, and `mostRecentOnly` search params, restores control values, and exposes `handleApplyFilter`, `handleSort`, and pagination callbacks.【F:src/hooks/useTableParams.ts†L1-L326】
- Applying filters rewrites the `FilterValue[]` list. Multi-select inputs get the `'in'` condition with pipe-delimited values; date filters emit `From` (`gte`) and `To` (`lte`) entries; "recent only" numbers reuse the `'in'` condition but swap the suffix to `RecentOnly` so the server can derive a range. Every change resets to page 1.【F:src/hooks/useTableParams.ts†L332-L484】
- The hook deep-compares prior params, notifies the parent via `onParamsChange`, and updates the URL (preserving unrelated query params). Pagination values persist when `enablePagination` is true, and a `mostRecentOnly` flag flows straight through so detail pages can mirror the toggle state.【F:src/hooks/useTableParams.ts†L268-L324】
- `pageSize` remembers the last explicit choice by reading/writing the `pagination-pageSize` localStorage key, matching the pattern that the Students and Grades pages follow for first render defaults.【F:src/hooks/useTableParams.ts†L113-L131】【F:src/app/(protected)/(counselor)/students/page.tsx†L31-L46】【F:src/app/(protected)/(counselor)/grades/page.tsx†L82-L98】

### Column visibility and saved views
- `useColumnVisibility` hydrates the TanStack visibility state from the `columns` query string, pushes updates back into the URL, and leaves other parameters untouched. Toggling a column also flows into saved view payloads because the dialog serializes all current search params.【F:src/hooks/useColumnVisibility.ts†L1-L62】【F:src/components/SaveViewDialog.tsx†L26-L152】
- The `SaveViewDialog` captures `filters`, `sort`, `pageNumber`, `pageSize`, `columns`, and feature-specific params (like `mostRecentOnly`) as JSON when the user saves or overwrites a view. Handlers pass that payload to `reportsService` so both Students and Grades reuse the same backend persistence code.【F:src/components/SaveViewDialog.tsx†L35-L152】【F:src/app/(protected)/(counselor)/students/page.tsx†L103-L197】【F:src/app/(protected)/(counselor)/grades/page.tsx†L164-L205】

## URL & filter token format
Each active filter becomes a token serialized as `key:condition:value`, stored in the `filters` query param, and parsed back into a `FilterValue`. The table library does not decode/encode tokens itself—it trusts callers to create clean strings.

| Filter type | Token pattern | Notes |
|-------------|---------------|-------|
| Text / number | `columnId:condition:value` | Conditions come from `getFilterConditionsByType` (`contains`, `eq`, `gt`, etc.). Multiple numeric tokens for the same column (e.g., both `gte` and `lte`) create range-style filters.【F:src/components/DataTable/FilterDropdown.tsx†L108-L201】【F:src/utils/filterConditions.ts†L1-L35】 |
| Dropdown | `columnId:eq:value` | Options come from column metadata; clearing removes the token entirely.【F:src/components/DataTable/FilterDropdown.tsx†L126-L141】 |
| Multi-select | `columnId:in:value1\|value2` | Values are pipe-delimited. The hook keeps existing entries up to date so chips and saved views display the raw strings.【F:src/hooks/useTableParams.ts†L332-L420】【F:src/components/DataTable/MultiSelectFilter.tsx†L53-L83】 |
| Date range | `columnIdFrom:gte:YYYY-MM-DD`, `columnIdTo:lte:YYYY-MM-DD` | The UI prevents From/To from coexisting with the "Recent only" shortcut and the server strips suffixes before applying conditions.【F:src/components/DataTable/FilterDropdown.tsx†L142-L227】【F:src/libs/studentsService.ts†L147-L173】 |
| Recent only | `columnIdRecentOnly:in:NN` | `NN` is days back from today. Services convert it to an actual range when building Supabase queries.【F:src/hooks/useTableParams.ts†L332-L384】【F:src/libs/studentsService.ts†L160-L172】 |
| Numeric ranges | `columnId:gte:value`, `columnId:lte:value` | Combine multiple operators to express bounds (e.g., GPA between 3.0 and 3.5). Services coerce numeric strings before handing them to Supabase, so the same grammar works for grade level, GPA, etc.【F:src/components/DataTable/FilterDropdown.tsx†L108-L210】【F:src/libs/studentsService.ts†L139-L214】 |

Other query params follow consistent names: `sort=id:asc|desc`, `pageNumber`, `pageSize`, `columns=visibleColumnIds`, and feature switches like `mostRecentOnly=true`. `useTableParams` only manages the first four parameters, leaving domain-specific flags to each page so they can be persisted alongside filters.【F:src/hooks/useTableParams.ts†L288-L315】【F:src/app/(protected)/(counselor)/grades/page.tsx†L52-L162】

### Known inconsistency (needs fix)
The chat assistant tools percent-encode filter values before adding them to the `key:condition:value` tokens *and* encode the full query string, producing double-encoded values such as `Alex%2520Smith`. The DataTable hook and back-end services currently expect plain strings, so assistant-triggered filters with spaces arrive mangled. Fixing this will require decoding assistant-provided values (or avoiding the inner `encodeURIComponent`).【F:src/app/api/chat/route.ts†L60-L139】

## Using the table in a page
1. **Own the data fetch** – Implement `handleParamsChange` to translate the emitted `FilterValue[]` into the REST request the page needs. Students/Grades stringify filters, append sorting/pagination, and request counts for pagination totals.【F:src/app/(protected)/(counselor)/students/page.tsx†L48-L105】【F:src/app/(protected)/(counselor)/grades/page.tsx†L99-L148】
2. **Hydrate initial state** – Pull the first `pageSize` from search params or the shared localStorage key so refreshes preserve the user’s preference.【F:src/app/(protected)/(counselor)/students/page.tsx†L31-L47】【F:src/app/(protected)/(counselor)/grades/page.tsx†L31-L99】
3. **Pass DataTable props** – Provide `columns`, fetched `data`, `total` counts, and toggles for pagination, loading spinners, and optional features like `multiSelectRemoteSource` or `mostRecentOnly`. Keep page-level toggles (e.g., "Only most recent") in sync with `useTableParams` so saved views capture them.【F:src/app/(protected)/(counselor)/students/page.tsx†L188-L222】【F:src/app/(protected)/(counselor)/grades/page.tsx†L200-L239】
4. **Support exports or saved views** – When exporting, reuse the serialized `filters` from `useSearchParams` so downloads respect the current view. When saving views, feed the dialog’s payload to `reportsService` to persist under the current page key.【F:src/app/(protected)/(counselor)/students/page.tsx†L103-L183】【F:src/components/SaveViewDialog.tsx†L57-L152】【F:src/libs/reportsService.ts†L1-L200】

## Backend responsibilities
- API routes decode the query string into `FilterValue[]`, forward pagination and sort metadata, and toggle feature flags like `mostRecentOnly` before calling service layers.【F:src/app/api/students/route.ts†L1-L33】【F:src/app/api/grades/route.ts†L1-L35】
- `applyFilters` / `applyGradeFilters` translate tokens into Supabase builder calls, handling ilike matches, comparison operators, multi-select `in` clauses, and the "Recent only" shortcut. Filters targeting joined tables prepend the foreign table alias automatically.【F:src/libs/studentsService.ts†L139-L214】【F:src/libs/studentsService.ts†L217-L301】
- Data services manage special cases: GPA filtering happens post-query, counts mirror the same conditions (including GPA fallbacks), and grade queries switch between `student_grades` and `latest_student_grades` when `mostRecentOnly` is true.【F:src/libs/studentsService.ts†L303-L542】【F:src/libs/studentsService.ts†L830-L1114】
- Saved views and analytics reuse the exact filter grammar. `reportsService` expects the serialized params JSON from the dialog and applies the same translation logic when listing reports, so new tables that participate in saved views should lean on the existing helper rather than inventing a new format.【F:src/libs/reportsService.ts†L1-L200】

## Implementation checklist
- [ ] Define `ColumnDef` entries with `ColumnMeta` (filters, sorting, visibility defaults).
- [ ] Render `<DataTable>` with `enablePagination`, `onParamsChange`, and any feature toggles your page requires.
- [ ] Translate `FilterValue[]` into API requests and parse responses into the shape your table rows expect.
- [ ] Persist user preferences (`pageSize`, `columns`, domain toggles) via search params/localStorage so saved views capture them for free.
- [ ] Update back-end services to recognize new column keys or filter types (e.g., extend `getColumnName`) before exposing them in the UI.
- [ ] Document new filters or deviations in this guide so other teams can reuse the pattern.

## Open questions
- Fix the assistant’s double-encoding so automated filters match user-entered values (see Known inconsistency above).
- Consider centralizing filter decoding/encoding utilities if more surfaces generate tokens outside of `useTableParams`.
