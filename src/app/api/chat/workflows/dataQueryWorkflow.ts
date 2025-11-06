import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod/v3';
import { evaluateSqlQuery } from './sqlEvaluationWorkflow';
import {
  runStreamingWorkflow,
  type StreamingWorkflowParams,
  type StreamingWorkflowContext,
  buildSchemaSummary,
} from './common';
import type { WorkflowExecutionParams } from './workflowRegistry';
import { buildPrefixContext } from './prefixContextPlanner';
import type { TagAnalysisResult } from './tagAnalysis';

const AI_MODEL_QUERY_PLAN = process.env.AI_MODEL_QUERY_PLAN || process.env.AI_MODEL_DEFAULT || 'gpt-4o';

const dataQueryPlanSchema = z.object({
  objective: z.string(),
  summary: z.string(),
  sql: z.string().default(''),
  assumptions: z.array(z.string()).default([]),
  followUpQuestions: z.array(z.string()).default([]),
});

// Orchestrates the data-query workflow: gathers prefix context, builds the query plan, and streams the model response.
export async function runDataQueryWorkflow(params: WorkflowExecutionParams) {
  const toolContext = params.toolRegistry.getContext();
  // Gather precomputed insights (terms, tags, guidance) that frame the model run.
  const prefixContext = await buildPrefixContext({
    latestUserMessage: params.latestUserMessage,
    conversationSummary: params.conversationSummary,
    toolContext,
  });

  const tagAnalysisCandidate = prefixContext.metadata['tagAnalysis'];
  const tagAnalysis = isTagAnalysisResult(tagAnalysisCandidate) ? tagAnalysisCandidate : null;

  // Ask the planner model to draft intent, SQL, and follow-ups using gathered context.
  const plan = await buildDataQueryPlan({
    latestUserMessage: params.latestUserMessage,
    conversationSummary: params.conversationSummary,
    tagAnalysis,
    prefixGuidance: prefixContext.planGuidance,
    prefixAssumptions: prefixContext.assumptions,
  });

  if (plan) {
    console.log('Generated data query plan', JSON.stringify(plan, null, 2));
  }

  // Validate the draft SQL early so downstream agents can see errors before execution.
  const evaluation = plan?.sql && plan.sql.trim() ? await evaluateSqlQuery(plan.sql) : null;

  const contexts: StreamingWorkflowContext[] = [...prefixContext.contexts];
  const additionalInstructions: string[] = [...prefixContext.streamingInstructions];

  if (plan) {
    // Give the assistant a structured plan context plus tailored marching orders.
    contexts.push({
      name: 'data_query_plan',
      summary: plan.summary,
      data: {
        objective: plan.objective,
        sql: plan.sql,
        assumptions: plan.assumptions,
        followUpQuestions: plan.followUpQuestions,
      },
    });

    const trimmedSql = plan.sql.trim();
    const hasSqlDraft = trimmedSql.length > 0;
    const sqlSnippet = hasSqlDraft && trimmedSql.length > 1500 ? `${trimmedSql.slice(0, 1500)}\n-- SQL truncated; refer to plan for full query` : trimmedSql;

    const instructionLines = [
      'Review the data_query_plan context for the objective, assumptions, and draft SQL before querying.',
      hasSqlDraft
        ? 'Treat the SQL in that context as a starting point. If you modify it, explain the changes and run sql evaluation again before execute_sql.'
        : 'Draft SQL has not been generated yet. Use the plan guidance (and tag analysis if present) to decide what should be queried before drafting SQL.',
      "Ensure the final SQL limits results to students with status = 'Active' unless the user explicitly requested inactive records.",
      plan.objective ? `Objective: ${plan.objective}` : '',
      plan.summary ? `Plan summary: ${plan.summary}` : '',
      plan.assumptions.length ? `Assumptions:\n- ${plan.assumptions.join('\n- ')}` : '',
      plan.followUpQuestions.length ? `Follow-up questions:\n- ${plan.followUpQuestions.join('\n- ')}` : '',
    ];

    if (prefixContext.assumptions.length) {
      instructionLines.push(`Prefix assumptions to restate:\n- ${prefixContext.assumptions.join('\n- ')}`);
    }

    if (hasSqlDraft) {
      instructionLines.push('Validated SQL template:', '```sql', sqlSnippet, '```');
    }

    additionalInstructions.push(instructionLines.filter(Boolean).join('\n'));
  } else {
    // Without a plan, force the agent into a clarifying-conversation path.
    additionalInstructions.push(
      'No SQL plan could be generated automatically. Ask clarifying questions to understand the needed data before attempting to query the database.',
    );

    if (prefixContext.assumptions.length) {
      additionalInstructions.push(`Prefix assumptions to restate before drafting SQL:\n- ${prefixContext.assumptions.join('\n- ')}`);
    }
  }

  if (evaluation) {
    if (plan?.sql && plan.sql.trim()) {
      params.toolRegistry.registerSqlEvaluation(plan.sql, evaluation);
    }
    // Surface evaluator feedback so the assistant can gate or iterate on SQL.
    contexts.push({
      name: 'sql_evaluation',
      summary: evaluation.approved
        ? 'SQL evaluation passed. Query is syntactically sound.'
        : 'SQL evaluation failed. Issues must be addressed before execution.',
      data: evaluation,
    });

    const evaluationInstruction = evaluation.approved
      ? 'SQL evaluation passed. See the sql_evaluation context for details. Execute the query with execute_sql only if the SQL remains unchanged; otherwise re-run evaluation.'
      : 'SQL evaluation reported blocking issues. Review the sql_evaluation context and address the feedback before executing any SQL.';

    additionalInstructions.push(evaluationInstruction);
  }

  // Hand everything to the streaming runtime with prioritized tools and guidance.
  return runStreamingWorkflow(
    createStreamingOptions(
      params,
      additionalInstructions,
      contexts,
      tagAnalysis,
      prefixContext.preferredToolNames,
    ),
  );
}

// Packages the streaming invocation parameters, wiring preferred tools and rich contexts for the model run.
function createStreamingOptions(
  params: WorkflowExecutionParams,
  additionalSystemInstructions: string[],
  contexts: StreamingWorkflowContext[],
  tagAnalysis: TagAnalysisResult | null,
  prefixPreferredToolNames: string[],
): StreamingWorkflowParams {
  const basePreferred = params.decision.toolNames;
  const tagPriority = tagAnalysis?.requiresTags ? ['list_tags', 'list_tag_values'] : [];

  const combined = Array.from(
    new Set([
      ...prefixPreferredToolNames,
      ...tagPriority,
      ...basePreferred,
    ]),
  );

  return {
    model: params.model,
    messages: params.messages,
    toolRegistry: params.toolRegistry,
    decision: params.decision,
    chatId: params.chatId,
    preferredToolNames: combined,
    additionalSystemInstructions,
    contexts,
  };
}

interface BuildDataQueryPlanParams {
  latestUserMessage?: string;
  conversationSummary?: string;
  tagAnalysis?: TagAnalysisResult | null;
  prefixGuidance?: string[];
  prefixAssumptions?: string[];
}

// Calls the planning model to turn the user prompt (and tag guidance) into a SQL-oriented execution plan.
async function buildDataQueryPlan(params: BuildDataQueryPlanParams) {
  const { latestUserMessage, conversationSummary } = params;

  if (!latestUserMessage?.trim()) {
    return null;
  }

  try {
    console.log('Building data query plan for message:', latestUserMessage);
    const { summary: schemaSummary } = await buildSchemaSummary();
    console.log('Schema context built:', schemaSummary ? 'Available' : 'Unavailable');

    const tagGuidance = formatTagGuidance(params.tagAnalysis);

    const promptSections = [
      'Create a precise data query plan for the school counseling assistant.',
      'Produce a single postgres compatible SQL SELECT statement that will retrieve the exact data the user needs.',
      'Use only tables, views, and columns that exist in the database.',
      tagGuidance
        ? 'When tag analysis is provided, explicitly state in the plan that you will reuse the supplied tag IDs (and values when given) instead of guessing tag names. Call list_tags or list_tag_values only if you need additional detail beyond what is provided.'
        : '',
      tagGuidance
        ? 'Never filter by tag category or tag name. Join on student_tags and restrict by stg.tag_id (and stg.value only when the value list is provided or after fetching it explicitly).'
        : '',
      params.prefixGuidance?.length
        ? `Pre-fetched context you must apply before drafting SQL:
- ${params.prefixGuidance.join('\n- ')}`
        : '',
      'Prefer joins on explicit keys (student_id, school_id, etc.). Include filters that align with the request.',
      'Only use ILIKE on strings for student and course names; for columns that are more about status (e.g. grade status or enrollment status), prefer boolean columns if available or string equals. E.g. enrollment_status should be = or <>, and use is_final_grade instead of the string grade_status column',
      'If the request is ambiguous, include assumptions to clarify intent and suggest follow-up questions to refine the query, but do not ask about school selection—the user context already defines it.',
      'Unless the user explicitly requests otherwise, assume only active students (status = \'Active\') should be included.',
      'Do not use complex SQL features like CTEs, window functions, or subqueries. Keep queries straightforward and efficient.',
      'Return well-formatted SQL ending without a semicolon.',
      `Latest user message:\n${latestUserMessage}`,
      schemaSummary
        ? `Database schema information:\n${schemaSummary}`
        : 'Database schema information unavailable. Use list_tables and get_table_schema before drafting SQL.',
      tagGuidance ? `Tag analysis:
${tagGuidance}` : '',
      params.prefixAssumptions?.length
        ? `Assumptions that must be acknowledged:
- ${params.prefixAssumptions.join('\n- ')}`
        : '',
      'Provide the final SQL in the sql field.',
    ];

    if (conversationSummary) {
      promptSections.push(`Recent conversation summary:\n${conversationSummary}`);
    }

    console.log('generating query plan')
    const { object: plan } = await generateObject({
      model: openai(AI_MODEL_QUERY_PLAN),
      schema: dataQueryPlanSchema,
      system:
        'You are a senior analytics engineer assisting a school counseling AI. Produce a query plan that the assistant can follow. When tag metadata must be reviewed first, leave the sql field empty.',
      prompt: promptSections.filter(Boolean).join('\n\n'),
    });

    const trimmedSql = plan.sql?.trim() ?? '';
    if (trimmedSql && !trimmedSql.toLowerCase().startsWith('select')) {
      return null;
    }

    console.log('Data query plan generated:', trimmedSql ? trimmedSql : '[no SQL draft provided]');
    return plan;
  } catch (error) {
    console.error('Failed to build data query plan', error);
    return null;
  }
}

function isTagAnalysisResult(value: unknown): value is TagAnalysisResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<TagAnalysisResult>;
  return (
    typeof candidate.requiresTags === 'boolean' &&
    typeof candidate.reasoning === 'string' &&
    Array.isArray(candidate.tags) &&
    Array.isArray(candidate.followUpQuestions)
  );
}

function formatTagGuidance(tagAnalysis: TagAnalysisResult | null | undefined): string | null {
  if (!tagAnalysis?.requiresTags || tagAnalysis.tags.length === 0) {
    return null;
  }

  const lines = tagAnalysis.tags.map((tag) => {
    const tagId = tag.tagId;
    const tagName = tag.tagName;
    const base = `- Use tag_id ${tagId} (${tagName})`;

    if (tag.requiresValue && tag.values.length > 0) {
      const sample = tag.values.slice(0, 15).join(', ');
      return `${base} and restrict stg.value to (${sample}).`;
    }

    if (tag.requiresValue) {
      return `${base}. Retrieve allowable stg.value entries with list_tag_values before filtering by value.`;
    }

    return `${base}. Presence of this tag is sufficient—do not add an stg.value filter.`;
  });

  lines.push('Do not guess at tag names or categories. Rely on tag_id keys and the provided values.');

  return lines.join('\n');
}
