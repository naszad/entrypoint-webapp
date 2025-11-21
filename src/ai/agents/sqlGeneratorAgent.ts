/**
 * SQL Generator agent
 * -------------------
 * Dedicated to the classic plan → evaluate → execute SQL loop. This agent is the high-ceremony
 * fallback when deep analysis routing is unavailable (for example, during manual delegations from
 * other agents) or when counselors explicitly request SQL. The instructions tightly script each
 * tool call order so we never skip evaluation or schema checks.
 *
 * Implementation cues:
 * - Tools mirror the lifecycle: `planSql` (LLM object output), schema discovery, evaluation, and
 *   final execution. Tag insights are available for cases where qualitative filters must be
 *   verified before building the query.
 * - Instruction copy stresses summarizing plan/eval/exec highlights—those strings are later used by
 *   orchestrators to craft counselor-facing responses.
 * - Higher `stopWhen` (18) leaves room for clarifying questions or re-planning without risking
 *   infinite loops, but the workflow nudges toward a single clean pass.
 */
import { ToolLoopAgent, stepCountIs } from 'ai';
import { BASE_AGENT_RULES } from './baseInstructions';
import type { AgentFactoryParams } from './studentLookupAgent';
import { createListDatabaseViewsTool } from '../tools/listDatabaseViewsTool';
import { createGetViewSchemaTool } from '../tools/getViewSchemaTool';
import { createSqlPlanTool } from '../tools/sqlPlanTool';
import { createEvaluateSqlTool } from '../tools/evaluateSqlTool';
import { createExecuteSqlTool } from '../tools/executeSqlTool';
import { createTagInsightsTool } from '../tools/tagInsightsTool';
import { createGetCurrentDateTool } from '../tools/getCurrentDateTool';

export function createSqlGeneratorAgent({ model, context }: AgentFactoryParams) {
  return new ToolLoopAgent({
    id: 'sql_generator',
    model,
    instructions: [
      BASE_AGENT_RULES,
      'Primary objective: translate counselor analytics questions into safe, vetted SQL using the curated views catalog.',
      [
        'Workflow:',
        '1. Draft a structured plan with planSql before running any schema tools or SQL.',
        '2. Inspect relevant views with listDatabaseViews and getViewSchema to confirm column availability.',
        '3. Evaluate candidate SQL with evaluateSql prior to execution; reuse cached evaluations when available.',
        '4. Execute only after evaluation passes, using executeSql. Summarize the plan, evaluation findings, and execution results for the counselor.',
      ].join('\n'),
      'Default to active students unless the counselor explicitly requests another status. When qualitative filters arise, call tagInsights to ground tag usage in actual descriptors.',
      'Maintain an internal running log of the latest plan, evaluation, and execution outputs so the final response cites them explicitly.',
      'Describe actions and results in counselor-friendly language—refer to “student roster” or “profiles data” instead of internal view/column names unless the user explicitly asks for SQL details.',
      'When sharing outcomes, focus on the number or insight plus a plain-language explanation of how it was derived (e.g., “counted active students in grade 12 from the student roster data”).',
      'Do not narrate intermediate steps or seek permission when the counselor request is clear—run the workflow and respond with a single concise answer unless additional filters are truly ambiguous.',
      'Only ask a follow-up question when the requested metric cannot be computed safely without extra information; otherwise, deliver the result directly.',
    ].join('\n\n'),
    stopWhen: stepCountIs(18),
    tools: {
      planSql: createSqlPlanTool(),
      listDatabaseViews: createListDatabaseViewsTool(context),
      getViewSchema: createGetViewSchemaTool(context),
      evaluateSql: createEvaluateSqlTool(context),
      executeSql: createExecuteSqlTool(context),
      tagInsights: createTagInsightsTool(context),
      get_current_date: createGetCurrentDateTool(),
    },
  });
}
