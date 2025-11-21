# SQL Query Agent – Implementation Plan

> Living plan for the SQL-focused specialist agent. Capture the initial roadmap here and evolve this document into a reference guide as milestones complete.

## Objectives
- Deliver a dedicated SQL generator agent that answers cohort analytics questions using curated `views.*` surfaces.
- Keep database inspection and execution safe by routing all schema discovery and SELECT execution through approved RPCs.
- Integrate optional tag and term context so the agent can apply qualitative filters without guesswork.
- Provide a maintainable, auditable workflow that surfaces plans, evaluations, and executed SQL back to counselors.

## Existing Building Blocks
- **RPCs** (must remain the only DB access path):
  - `list_views` – curated analytics views catalog.
  - `get_view_schema` – column metadata for a specific view.
  - `execute_safe_select` – scoped, read-only SQL execution.
- **Safety utilities**: `evaluateSqlQuery` (syntax/safety evaluator, reuses `list_views`/`get_view_schema` context).
- **AI framework**: ToolLoop-based agents with per-request `ToolContext` and shared Supabase client.
- **Tag insights tooling**: `tag_insights` helper now returns ranked tag descriptors, metadata, and (eventually) sample values.
- **Academic terms tool**: `get_academic_terms` available for supplementary context.

## Phase Breakdown

### Phase 0 – Foundations
- Add shared types under `src/ai/types/sql.ts`:
  - `SqlPlan` (objective, summary, draft SQL, assumptions, follow-up questions, tag guidance).
  - `SqlEvaluationFeedback`, `SqlExecutionResult` for tool outputs.
- Confirm `ToolContext` exposes `sqlEvaluationCache` (align with legacy registry behavior) or extend it if needed.
- Document how tag metadata will enter planning (via `tag_insights` or future specialist agent).

### Phase 1 – Planning Tooling
- Build `createSqlPlanTool` in `src/ai/tools/`:
  - Input: latest user message, optional conversation summary, optional tag descriptors/metadata.
  - Output: typed `SqlPlan` object (no freeform blobs).
  - Internal: reuse refined prompt + schema from `dataQueryWorkflow`, stripping legacy prefix-context coupling.
  - Guardrails: default to active students, no CTEs/subqueries, rely on provided tag IDs, require ENDS WITHOUT semicolon.
- Return structured metadata (e.g., whether SQL draft provided) for agent orchestration.

### Phase 2 – Safety & Execution Tools
- Implement `createEvaluateSqlTool`:
  - Wraps `evaluateSqlQuery`; cache results via `ToolContext.sqlEvaluationCache`.
  - Returns evaluation payload (approved flag, feedback, normalized SQL, blocking issues) without executing anything.
- Implement `createExecuteSqlTool`:
  - Validates SELECT-only.
  - Reuses cached evaluation or runs evaluation before calling `execute_safe_select`.
  - Returns rows + evaluation summary; includes guardrail messaging when evaluation fails.
- Ensure errors bubble up with actionable guidance (e.g., missing school context, evaluation blocks).

### Phase 3 – SQL Generator Agent
- Add `src/ai/agents/sqlGeneratorAgent.ts`:
  - Instructions emphasize plan → inspect schema → evaluate → execute sequence.
  - Tools: `listDatabaseViews`, `getViewSchema`, `createSqlPlanTool`, `createEvaluateSqlTool`, `createExecuteSqlTool`, optional `tag_insights`.
  - Maintain agent state for the latest plan/evaluation so final responses can cite them.
  - Set `stopWhen` to ~16–18 steps allowing exploration without runaway loops.
- Decide how the agent shares results (e.g., include SQL snippet, evaluation summary, row count) in the assistant reply.

### Phase 4 – Routing, Docs, Telemetry
- Register agent in `createAgentRegistry` and add routing metadata (`agentRoutingProfiles`).
- Update `docs/chat-v2-agent-plan.md` with:
  - New tools and agent summary.
  - Decision guidance for when routing should prefer this agent over `data_insights` or the general assistant.
- Update logging/telemetry (if needed) so executed SQL, plan summaries, and evaluation feedback surface in `chat_messages.metadata.v2`.
- Add user-facing prompts for when the general assistant should escalate to the SQL agent.

### Phase 5 – Integrations & Future Enhancements
- Feed tag insights directly into plan tool input (reuse `TagInsightsPayload`).
- Plan a dedicated “terms” agent that can pre-resolve academic term IDs; ensure outputs align with SQL plan tool inputs.
- Introduce targeted tests:
  - Tool unit tests (mock Supabase RPC responses).
  - Agent loop smoke tests verifying plan → evaluate → execute flow under happy path and failure scenarios.
- Consider auto-evaluation retries or improvement loops if evaluation suggests minor fixes.

## Status Tracker
| Phase | Focus | Status | Notes |
| --- | --- | --- | --- |
| 0 | Shared types & context scaffolding | Complete | SQL plan/evaluation types added under `src/ai/types/sql.ts`; ToolContext extended with optional evaluation cache. |
| 1 | Planning tool | Complete | `createSqlPlanTool` handles counselor prompts and structured plan output. |
| 2 | Evaluation & execution tools | Complete | `createEvaluateSqlTool` and `createExecuteSqlTool` wrap evaluation workflows with caching + Supabase execution. |
| 3 | SQL generator agent | Complete | `createSqlGeneratorAgent` orchestrates plan → evaluate → execute and instructs the model to track plan/evaluation/execution context. |
| 4 | Routing & docs | In Progress | Routing heuristics now prioritize `sqlGenerator` for quantitative asks; documentation updates still pending. |
| 5 | Integrations/tests | Not Started | Tag/term integrations, automated tests, quality checks. |

## Open Questions
- Should the SQL agent always consult `tag_insights`, or only when routing signals tag relevance? (Pending design decision.)
- How do we present large SQL results? (Consider limiting row counts or formatting guidance.)
- Do we need a separate tool for counting rows vs. returning raw results? (Evaluate during implementation.)

---

_Update this document as phases complete. Once the agent ships, evolve sections into operational guidance (usage patterns, response examples, troubleshooting tips)._