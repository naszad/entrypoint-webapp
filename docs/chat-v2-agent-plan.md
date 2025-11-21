# Chat Assistant v2 – Developer Guide

> Reference documentation for EntryPoint SRM’s second-generation chat assistant. Use this guide when debugging the runtime, wiring new agents or tools, or onboarding teammates. The v2 experience is **still gated** by the `NEXT_PUBLIC_CHAT_ASSISTANT_VERSION=v2` environment flag.

## Feature Status & Activation
- Frontend continues to mount the existing `ChatAssistant` component; setting `NEXT_PUBLIC_CHAT_ASSISTANT_VERSION` to `v2` switches transport calls to `/api/chat-v2`.
- Legacy and v2 chats share the same `chats` and `chat_messages` tables, so no migration is required when toggling the flag.
- Auth, cookies, and Supabase tenancy (selected school + customer) remain prerequisites for every request.

## Architecture Snapshot
- **Runtime entry point**: `src/ai/index.ts` exposes tool factories, `createAgentRegistry`, and `createAgentRuntime`. The runtime is instantiated once per request inside `app/api/chat-v2/route.ts`.
- **Router**: `src/ai/router.ts` gathers routing directives, renders the agent catalog for the LLM via `generateObject`, and normalizes the response before delegation.
- **Agents**: `src/ai/agents/` contains the ToolLoopAgent implementations. Shared rules live in `baseInstructions.ts`.
- **Tools & utilities**: `src/ai/tools/` plus supporting helpers (`schemaSummary.ts`, `temporalContextGate.ts`, `utils/termCatalog.ts`, etc.) provide deterministic context that keeps the LLM grounded in real data.
- **API surface**: `app/api/chat-v2/route.ts` authenticates, merges persisted chat history with incoming UI messages, performs routing, streams responses with `createAgentUIStream`, and persists assistant turns (including routing metadata).
- **UI**: `src/components/ChatAssistant.tsx` chooses the v2 endpoint at runtime, renders streamed responses, and surfaces navigation buttons emitted by tool outputs.

## Chat Request Lifecycle
1. **Client dispatch** – `ChatAssistant` posts the merged message list, chat id, and optionally a dev-selected model to `/api/chat-v2`.
2. **Auth & history** – The API route authenticates via Supabase, loads prior messages for `chatId`, persists the new user turn, and composes a compact conversation summary.
3. **Runtime creation** – `createAgentRuntime` receives the resolved `LanguageModel` plus a `ToolContext` (Supabase client, selected school/customer, user id). It builds the agent registry and shares a request-scoped SQL evaluation cache.
4. **Routing** – `runtime.decide` invokes `routeAgent`, which prompts the classifier model with agent metadata, guardrails, and the conversation summary to pick the best specialist or fall back to clarification.
5. **Streaming execution** – The selected agent runs inside `createAgentUIStream`, using ToolLoopAgent orchestration to call tools deterministically and stream messages back to the client UI.
6. **Persistence & telemetry** – Assistant turns are written to `chat_messages` with `metadata.v2` capturing `{ agentId, reason, signals }`. Console logs within agents and tools (e.g., view selection, temporal decisions) provide additional observability during development.

## Key Modules & Directories
- `src/ai/index.ts` – Public exports plus `createAgentRuntime`, which wraps the registry and router.
- `src/ai/agents/index.ts` – Instantiates each agent and defines `agentRoutingProfiles` consumed by the router.
- `src/ai/router.ts` – LLM-powered router with default directives tuned for SRM workflows, including deep-analysis biasing rules.
- `src/ai/tools/` – Tool factories with Zod schemas. Notable helpers include `selectRelevantViewsTool`, `cohortSpecTool`, `sqlPlanTool`, `evaluateSqlTool`, `executeSqlTool`, `tagCatalog`, `findTaggedStudentsTool`, and `getCurrentDateTool`.
- `src/ai/schemaSummary.ts` & `src/ai/temporalContextGate.ts` – Build schema summaries and decide when academic term context is necessary before SQL planning.
- `src/app/api/chat-v2/route.ts` – Handles request orchestration, persistence, and streaming.
- `src/components/ChatAssistant.tsx` – Chooses v1 vs v2 endpoint, handles tool-rendered navigation buttons, and maintains local chat state.

## Agent Catalog (via `agentRoutingProfiles`)
- **generalAssistant** – Clarifies ambiguous questions, answers high-level product usage, and owns `get_academic_terms`. Acts as fallback when routing confidence is low.
- **studentNavigation** – Builds filtered `/students` URLs using `filterStudentsTool` and `navigateTool`. Enforces supported column/operators from `studentFilterCapabilitiesGuide`.
- **gradesNavigation** – Same pattern for `/grades`, honoring the “Most recent” toggle and grade-specific filters.
- **studentLookup** – Disambiguates individual students using Supabase lookups and returns profile links before continuing workflows.
- **tagInsights** – Surfaces qualitative tag metadata and can list tagged students through `findTaggedStudentsTool`.
- **deepAnalysis** – Orchestrates the deterministic analytics pipeline (detailed below) for multi-constraint qualitative + quantitative questions.
- **sqlGenerator** – Explicit SQL workflow agent used when counselors request query text or another agent delegates SQL creation directly.

Routing directives in `router.ts` bias quantitative requests, rankings, and follow-up analytics to the deep-analysis orchestrator while reserving SQL generator for explicit SQL asks.

## Deep Analysis Orchestrator (Agent `deepAnalysis`)
The deep-analysis agent encapsulates a guarded pipeline so complex counseling questions produce audited, reproducible answers. The key stages inside `createDeepAnalysisPipelineTool` are:
- **Context capture** – `prepareStep` stores the latest user question and a short conversation summary so every downstream prompt references accurate context. The agent forces a single `run_deep_analysis` invocation per counselor turn.
- **Tag catalog hydration** – `fetchSchoolTagCatalog` loads descriptors and metadata (usage counts, recency, value samples). Failures short-circuit with a counselor-friendly error.
- **Relevant view selection & schema summary** – `selectRelevantViews` ranks curated analytics views for the question. The tool then asks `buildSchemaContext` for summaries of those views (max columns capped) and tracks the shortlisted view names for the SQL planner.
- **Temporal context gating** – `decideTemporalContextNeeds` evaluates whether academic terms or academic years are essential. When required, `loadCuratedTermCatalog` retrieves term options; otherwise the agent logs that temporal context was intentionally skipped.
- **Cohort specification drafting** – `buildCohortQuerySpec` turns counselor language plus tag metadata into a `CohortQuerySpec` (tags, numeric conditions, metric intent, enrollment scope). Selected terms are reconciled against real catalog entries to correct abbreviations or inferred years.
- **Guidance assembly** – The agent synthesizes guidance text for SQL planning, combining spec notes, tag descriptors, term reconciliation notes, schema details, and planner instructions.
- **SQL plan creation** – `generateSqlPlan` produces a structured plan. When tag guidance is missing, the pipeline exits early with a prompt for the counselor to clarify.
- **SQL drafting** – `ensureSqlDraft` either reuses SQL from the plan or prompts the model (seeded with schema summary, tag filters, numeric constraints, enrollment rules, and term scope) to emit a deterministic SELECT statement without CTEs.
- **Evaluation & execution** – `evaluateSqlWithContext` validates the draft and leverages the runtime cache to avoid repeat evaluations. If approved, `executeSqlWithContext` runs the query via the safe RPC path.
- **Narrative synthesis** – `composeFinalMessage` produces the counselor-facing answer, highlighting metric values, row counts, tag filters, numeric constraints, temporal scope, enrollment assumptions, and a sample row. Plan and evaluation summaries are included for auditability.
- **State caching** – The final pipeline output (success or error) is cached in `state.pipelineOutput` so the agent can reuse diagnostics without re-running expensive work during the same turn.

When any stage fails (missing school selection, tag catalog errors, evaluation blocks, SQL execution issues) the agent records a descriptive message, surfaces it to the counselor, and halts. The UI will continue showing the agent response while logs capture supporting diagnostics (`console.info` payloads for view selection, temporal decisions, and term reconciliation).

## Shared Tools & Utilities
- **Filtering & navigation** – `filterStudentsTool`, `filterGradesTool`, and `navigateTool` map counselor intent to roster URLs with validated filter metadata.
- **Schema intelligence** – `selectRelevantViewsTool`, `listDatabaseViewsTool`, `getViewSchemaTool`, and `schemaSummary.ts` keep LLM prompts aligned with Supabase views instead of memorized columns.
- **Qualitative context** – `tagCatalog.ts`, `tagInsightsTool`, and `findTaggedStudentsTool` aggregate tags and student matches for grounded storytelling.
- **Temporal context** – `temporalContextGate.ts` and `termCatalog` helpers decide when to inflate prompts with academic term/year information and fetch curated catalog data.
- **Analytics workflow** – `cohortSpecTool`, `sqlPlanTool`, `evaluateSqlTool`, and `executeSqlTool` implement the canonical plan → evaluate → execute lifecycle used by both deep analysis and the SQL generator.
- **Utility tools** – `getCurrentDateTool` standardizes time-sensitive answers across agents.

## Persistence & Telemetry
- User and assistant turns are persisted in Supabase; assistant records include routing diagnostics under `metadata.v2`.
- The runtime reuses a per-request SQL evaluation cache to limit duplicate evaluations if an agent retries the same draft.
- Logging is intentionally verbose (view selection, temporal gating, term reconciliation) while the feature remains behind a flag. Keep that in mind when inspecting server logs.

## Extending the System
1. **Adding a tool** – Implement in `src/ai/tools/`, export it from `src/ai/index.ts`, and wire it into the relevant agent with clear instructions. Provide deterministic schemas and surface errors early.
2. **Adding or updating an agent** – Create `src/ai/agents/<NewAgent>Agent.ts`, register it in `createAgentRegistry`, update `agentRoutingProfiles`, and add guardrails or directives when necessary.
3. **Adjusting routing** – Modify `DEFAULT_ROUTING_DIRECTIVES` in `router.ts` or supply runtime directives via `runtime.decide` call sites if a specific request path needs custom behavior.
4. **Frontend alignment** – Ensure new tool outputs (navigation payloads, structured data) have renderers in `ChatAssistant`. Avoid breaking v1 responses when the flag is off.

## Known Gaps / Follow-ups
- Evaluation harness and automated regression testing for routing decisions remain TODO; rely on logs and manual transcripts for now.
- Mixpanel instrumentation for router confidence and agent selections is not yet implemented.
- Deep analysis SQL drafts currently disallow CTEs; revisit once we have stronger evaluation coverage.

Keep this guide handy when triaging agent behaviour, pairing on new analytics workflows, or documenting future enhancements.

