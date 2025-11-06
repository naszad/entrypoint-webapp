
## AI Workflow Architecture

Our chat assistant runs on a layered workflow engine built specifically for EntryPoint SRM. The stack prioritizes predictable routing, workflow-specific guidance, and tightly scoped tool usage.

```
User Request
    |
    v
Router (routingWorkflow.ts)
    |
    v
Selected Workflow (general | navigation | data_query | student_specific)
    |
    v
Workflow Runner (runStreamingWorkflow)
    |
    +--> System instructions + contexts
    |
    +--> Tool Registry (tools/index.ts)
                |
                v
             Tool Calls
```

Each layer has a clear responsibility:

- **Router** – Classifies the latest user message, selects the best workflow, and recommends an allowed tool list.
- **Workflow** – Prepares tailored system instructions, adds contextual blocks (plans, tag guidance, tool evaluation), and invokes the shared runner.
- **Tool Registry** – Exposes scoped capabilities and embeds tool-specific rules into the system message.

## Routing Layer

- Implemented in `routingWorkflow.ts` using the `generateObject` helper.
- Considers recent conversation summary plus the latest user message.
- Chooses one of four categories:
  - `general`: conversational or policy questions.
  - `navigation`: filter builders and UI guidance.
  - `data_query`: database-backed analysis.
  - `student_specific`: questions about a known student or small group.
- Returns workflow metadata: system instruction, preferred tool list, and confidence.
- Falls back to the general workflow if routing fails.

## Workflow Layer

Workflows live under `src/app/api/chat/workflows`. Each workflow composes:

- **Base rules** from `systemMessageService`.
- **Workflow-specific instruction** (e.g., emphasize navigation steps or analytical reasoning).
- **Optional contexts** injected into the streaming run (query plans, tag analysis, SQL evaluation).
- **Preferred tool hints** to steer the model toward the right actions.

Key workflows:

- `general_assistant`: minimal instructions; avoids unnecessary tool usage.
- `navigation_assistant`: highlights filter tools and instructs the agent to describe resulting UI views.
- `student_insights_assistant`: enforces student identification via the `identify_student` tool, then allows focused queries.
- `data_query_assistant`: builds a structured plan before any SQL runs, gathers schema/tag context, evaluates SQL, and only then allows execution.

## Streaming Runner

- `runStreamingWorkflow` (in `common.ts`) orchestrates the call to `streamText`.
- Applies a step limit by default (15) to cap tool loops.
- Logs tool calls/results for observability.
- Persists the final response, including routing metadata and context summaries, to `chat_messages`.
- Appends formatting reminders so the final reply matches UI requirements.

### Context Blocks

Workflows attach lightweight context objects that the model can reference:

- `data_query_plan`: outlines objective, draft SQL, assumptions, follow-ups.
- `tag_analysis` and `tag_value_map`: capture relevant tags and candidate values.
- `sql_evaluation`: records automatic linting/approval feedback.

These contexts keep the prompt narrow while preserving the reasoning trail.

## Tool Layer

- Managed by `ToolRegistry` (`tools/index.ts`). Tools are registered once and surfaced to the AI SDK in a stable shape.
- Registry maintains user/session context (selected school, authenticated user ID, SQL evaluation cache).
- Tool categories:
  - **Navigation**: `filter_students`, `filter_grades`.
  - **Schema & Query**: `list_tables`, `get_table_schema`, `execute_sql`.
  - **Tags**: `list_tags`, `list_tag_values`.
  - **Student Insights**: `identify_student`, `get_student_gpa`.
  - **Utilities**: `get_current_date`, `get_academic_terms`.
- When context changes (e.g., school switch) the registry rebuilds dependent tools to inject updated credentials.
- Tool-specific rules are forwarded to `systemMessageService` so workflows can emphasize guardrails when those tools are favored.

## Execution Flow

1. **Message arrives.** Router inspects the request and selects a workflow.
2. **Workflow prepares instructions.** Adds system guidance, contexts, and preferred tools.
3. **Streaming run begins.** `streamText` receives the assembled prompt plus available tools.
4. **Tools execute as needed.** Tool calls log inputs/outputs and may add new context (e.g., SQL evaluation cache entries).
5. **Response persists.** The assistant’s final text, metadata, and routing decision are stored for future turns.

## Design Principles

- **Concept-first prompts.** We describe desired behaviors (e.g., “review tag analysis before querying”) instead of dictating exact SQL or UI strings.
- **Fail-safe defaults.** If planning or evaluation fails, the assistant asks clarifying questions rather than guessing.
- **Visibility-aware analytics.** SQL evaluation caches keep the assistant from rerunning unsafe queries; workflows remind it to honor RLS constraints and active-student filters.
- **Extensible tooling.** New tools only require registration plus optional rule snippets—the router and workflows automatically gain access.

Use this document as the conceptual map; implementation details live alongside the source files noted above.
