# Analytics Events & Naming Guide

This document defines conventions for Mixpanel event names and properties in the EntryPoint SRM webapp. Keep events low-cardinality, privacy-safe, and consistent across product surfaces.

## Principles

1. Human-readable, action-first names (Object + Verb).  
2. No PII or raw user-entered text (avoid names, freeform values).  
3. Prefer boolean / enum / count props over raw strings.  
4. Normalize dynamic paths (e.g., `/students/:id`) before sending.  
5. Avoid value proliferation (no arbitrary filter values, just column keys).  
6. Track intent ("Report Opened") rather than implementation ("Clicked Row").  
7. One clear event per conceptual action; avoid redundant synonyms.  
8. Keep property keys snake_case; event names Title Case.  
9. Use the `page` prop to indicate the origin context (where action was taken).  
10. Fail silent if analytics not initialized (never block UX).
11. Register persistent context (`customer_*`, `school_*`, panel state, etc.) via `mixpanelClient` helpers—do not duplicate this work in feature code.

## Event Naming Patterns

| Pattern | Examples | Notes |
|---------|----------|-------|
| `<Page> <Action>` | Students Export, Students Report Saved | Page-scoped actions. |
| `<Domain> <Action>` | Report Opened | Cross-page domain objects. |
| `<Page> Filters Applied` | Students Filters Applied | Only when filter set meaningfully changes. |
| `<Page> View` | Page View | |

Avoid trailing punctuation, internal slashes, or dynamic fragments.

## Current Event Catalog

### 1. Page View
- When: Route change detected (normalized).  
- Event: `Page View`  
- Props:
  - `page`: normalized path (e.g., `/students/some-guid/profile` → `/students/:id/profile`)
  - `path`: raw pathname
  - `has_query`: boolean

### 2. Students Filters Applied
- When: Filter set on `/students` changes (distinct column keys change).
- Event: `Students Filters Applied`
- Props:
  - `page`: `/students`
  - `filter_count`: number of distinct filtered columns
  - `filter_keys`: array of column IDs

### 3. Students Export
- When: Successful CSV export from Students table.
- Event: `Students Export`
- Props:
  - `page`: `/students`
  - `filter_count`: number of distinct filtered columns
  - `filter_keys`: array of column IDs
  - `column_count`: number of columns included in export

### 4. Students Report Saved
- When: User saves a report (view) from Students page.
- Event: `Students Report Saved`
- Props:
  - `page`: `/students`
  - `has_description`: boolean
  - `param_length`: character length of serialized params payload

### 5. Report Opened
- When: User opens a saved report from Reports page list.
- Event: `Report Opened`
- Props:
  - `page`: `/reports` (origin page)
  - `target_page`: destination route (e.g., `/students`)
  - `has_filters`: boolean (were any filters encoded?)
  - `filter_keys`: array of distinct column keys (if present)

## Property Naming Conventions

| Category | Convention | Example |
|----------|------------|---------|
| Booleans | `has_`, `is_` prefix | `has_filters`, `is_multi_school` |
| Counts | suffix `_count` | `filter_count`, `column_count` |
| Arrays | plural noun | `filter_keys` |
| Length | `_length` or explicit | `param_length` |
| Context | `page`, `target_page`, `customer_id`, `customer_name`, `school_id`, `school_name` | Provide origin & tenancy context |

## Adding a New Event

1. Define: What user intent are we capturing? (Write in one sentence.)  
2. Name: Apply patterns; avoid implementation verbs like "Click" unless necessary.  
3. Properties: Keep minimal. Use existing keys when semantics match.  
4. Cardinality Review: Ensure no unbounded unique values (IDs, free text).  
5. Implement: Use `trackEvent(name, props)` from `mixpanelClient`. The helper queues events until Mixpanel is ready and injects registered context automatically—send only action-specific props.  
6. For user identity/context updates (login, logout, school switch) or when you need to set persistent super properties, call the exported helpers (`identifyUser`, `refreshSuperProperties`, `registerSuperProperties`, `resetMixpanel`) instead of touching the SDK directly.  
7. Test Locally: In dev, `window.mixpanel` is exposed—verify in console.  
8. Update This Doc: Add event under catalog with when + props table.  

### Registering Super Properties

- Use `registerSuperProperties({ key: value })` from `mixpanelClient` to persist contextual flags (e.g., current panel state).  
- The helper checks initialization and silently no-ops if Mixpanel is unavailable, so do not import `mixpanel-browser` directly.  
- Call it inside React effects or other lifecycle hooks when the underlying state changes:  

```tsx
useEffect(() => {
  registerSuperProperties({ chat_panel_open: isChatAssistantOpen });
}, [isChatAssistantOpen]);
```

- Avoid registering empty objects; the helper already guards against this.

## Do / Don't Examples

| Do | Why | Don't | Why |
|----|-----|-------|-----|
| Students Report Saved | Describes outcome | Save Button Clicked | Implementation detail only |
| Report Opened | Intent-based | Report Row Clicked | UI interaction, not intent |
| Students Filters Applied | Debounced semantic change | Filter Dropdown Closed | Non-outcome noise |

## Handling Dynamic Data Safely

- Never include student names, IDs, emails, or freeform search strings.  
- Collapse repeated actions unless each instance represents separate intent (e.g., keep each export).  

## Retrofits / Cleanup

If an event becomes noisy or obsolete:
1. Hide it in Mixpanel Lexicon (do not delete historic data unless compliance asks).  
2. Deprecate in code (leave a comment) before removal if dashboards depend on it.  
3. Remove references after confirming no active reports rely on it.

## Future Candidates (Not Yet Implemented)
- Student Profile Viewed (on navigating to `/students/:id`)
- Tag Added / Tag Removed (batch operations aggregated?)
- GPA Report Generated (once advanced reporting shipped)
- Bulk Action Executed (when multi-select operations introduced)

## QA Checklist Before Shipping an Event
- [ ] Event name follows conventions
- [ ] No PII in props
- [ ] Cardinality bounded
- [ ] Properties documented here
- [ ] Tested in development (network request visible)

---
Questions or proposals: open a PR modifying this file or leave a note in the analytics planning doc.
