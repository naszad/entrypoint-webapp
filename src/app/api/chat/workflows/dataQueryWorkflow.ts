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
import { buildTagAnalysis, summarizeTagAnalysis, type TagAnalysisResult } from './tagAnalysis';

const AI_MODEL_QUERY_PLAN = process.env.AI_MODEL_QUERY_PLAN || process.env.AI_MODEL_DEFAULT || 'gpt-4o';

const dataQueryPlanSchema = z.object({
  objective: z.string(),
  summary: z.string(),
  sql: z.string().default(''),
  assumptions: z.array(z.string()).default([]),
  followUpQuestions: z.array(z.string()).default([]),
});

// Orchestrates the data-query workflow: builds plan, runs tag analysis, primes contexts, and streams the model response.
export async function runDataQueryWorkflow(params: WorkflowExecutionParams) {
  const toolContext = params.toolRegistry.getContext();
  let tagAnalysis: TagAnalysisResult | null = null;

  try {
    tagAnalysis = await buildTagAnalysis({
      latestUserMessage: params.latestUserMessage,
      conversationSummary: params.conversationSummary,
      selectedSchoolId: toolContext.selectedSchoolId,
      userId: toolContext.userId,
    });
    if (tagAnalysis) {
      console.log('Tag analysis result', JSON.stringify(tagAnalysis, null, 2));
    }
  } catch (error) {
    console.warn('Tag analysis failed; continuing without tag guidance.', error);
  }

  const plan = await buildDataQueryPlan({
    latestUserMessage: params.latestUserMessage,
    conversationSummary: params.conversationSummary,
    tagAnalysis,
  });

  if (plan) {
    console.log('Generated data query plan', JSON.stringify(plan, null, 2));
  }

  const evaluation = plan?.sql && plan.sql.trim() ? await evaluateSqlQuery(plan.sql) : null;

  const contexts: StreamingWorkflowContext[] = [];
  const additionalInstructions: string[] = [];

  if (tagAnalysis?.requiresTags && tagAnalysis.selections.length > 0) {
    const tagSummary = summarizeTagAnalysis(tagAnalysis);
    contexts.push({
      name: 'tag_analysis',
      summary: tagSummary,
      data: {
        requiresTags: tagAnalysis.requiresTags,
        reasoning: tagAnalysis.reasoning,
        selections: tagAnalysis.selections.map((selection) => ({
          tagId: selection.metadata.tagId,
          tagName: selection.metadata.name,
          categoryName: selection.metadata.categoryName,
          requiresValueDiscovery: selection.requiresValueDiscovery,
          selectedValues: selection.selectedValues,
          candidateValues: selection.candidateValues,
        })),
        followUpQuestions: tagAnalysis.followUpQuestions,
        valueMap: tagAnalysis.valueMap,
      },
    });

    if (tagAnalysis.valueMap.length > 0) {
      contexts.push({
        name: 'tag_value_map',
        summary: `Aggregated tag values fetched for ${tagAnalysis.valueMap.length} tag(s).`,
        data: tagAnalysis.valueMap,
      });
    }

    const tagInstructionLines = tagAnalysis.selections.map((selection) => {
      const core = `${selection.metadata.name} (tag_id ${selection.metadata.tagId})`;
      if (selection.selectedValues.length > 0) {
        const values = selection.selectedValues.slice(0, 10).join(', ');
        return `${core} → include stg.value IN (${values})`;
      }
      if (selection.requiresValueDiscovery && tagAnalysis.valueMap.length > 0) {
        const lookup = tagAnalysis.valueMap.find((entry) => entry.tagId === selection.metadata.tagId);
        const values = lookup?.values.slice(0, 15) ?? selection.candidateValues.slice(0, 15);
        return values.length
          ? `${core} → review candidate values (${values.join(', ')}) before filtering`
          : `${core} → call list_tag_values if more values are required`;
      }
      return `${core} → filter by stg.tag_id only`;
    });

    additionalInstructions.push(
      [
        'Tag guidance: consult the tag_analysis context for tag_ids, reasoning, and recommended values. Do not guess tag names.',
        tagAnalysis.valueMap.length
          ? 'Use the tag_value_map context for candidate values before considering list_tag_values. Only call list_tag_values if additional values are needed.'
          : 'Call list_tag_values only if you need specific values that are not already outlined in tag_analysis.',
        'When writing SQL, join student_tags (alias stg) on student_id and filter using stg.tag_id. Apply stg.value filters when values are supplied.',
        tagInstructionLines.length ? `Relevant tag actions:
- ${tagInstructionLines.join('\n- ')}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }

  if (plan) {
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

    if (hasSqlDraft) {
      instructionLines.push('Validated SQL template:', '```sql', sqlSnippet, '```');
    }

    additionalInstructions.push(instructionLines.filter(Boolean).join('\n'));
  } else {
    additionalInstructions.push(
      'No SQL plan could be generated automatically. Ask clarifying questions to understand the needed data before attempting to query the database.',
    );
  }

  if (evaluation) {
    if (plan?.sql && plan.sql.trim()) {
      params.toolRegistry.registerSqlEvaluation(plan.sql, evaluation);
    }
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

  return runStreamingWorkflow(createStreamingOptions(params, additionalInstructions, contexts, tagAnalysis));
}

// Packages the streaming invocation parameters, wiring preferred tools and rich contexts for the model run.
function createStreamingOptions(
  params: WorkflowExecutionParams,
  additionalSystemInstructions: string[],
  contexts: StreamingWorkflowContext[],
  tagAnalysis: TagAnalysisResult | null,
): StreamingWorkflowParams {
  const basePreferred = params.decision.toolNames;
  const prioritizedPreferred = tagAnalysis?.requiresTags
    ? Array.from(
        new Set([
          'list_tags',
          'list_tag_values',
          ...basePreferred,
        ]),
      )
    : basePreferred;

  return {
    model: params.model,
    messages: params.messages,
    toolRegistry: params.toolRegistry,
    decision: params.decision,
    chatId: params.chatId,
    preferredToolNames: prioritizedPreferred,
    additionalSystemInstructions,
    contexts,
  };
}

interface BuildDataQueryPlanParams {
  latestUserMessage?: string;
  conversationSummary?: string;
  tagAnalysis?: TagAnalysisResult | null;
}

// Summarizes tag-analysis selections into prose so the query planner knows which tag metadata to honor.
function formatTagGuidance(tagAnalysis: TagAnalysisResult | null | undefined): string | null {
  if (!tagAnalysis?.requiresTags || tagAnalysis.selections.length === 0) {
    return null;
  }

  const lines = tagAnalysis.selections.map((selection) => {
    const values = selection.selectedValues.length
      ? `values: ${selection.selectedValues.join(', ')}`
      : selection.requiresValueDiscovery
        ? `candidate values: ${selection.candidateValues.slice(0, 15).join(', ')}`
        : 'no specific values identified';

    return `- ${selection.metadata.name} (tag_id ${selection.metadata.tagId}, category ${selection.metadata.categoryName}) → ${values}`;
  });

  if (tagAnalysis.valueMap.length > 0) {
    const valueMapSummary = tagAnalysis.valueMap
      .map((entry) => `  - ${entry.tagId}: ${entry.values.slice(0, 20).join(', ')}`)
      .join('\n');
    lines.push('Aggregated tag value map:\n' + valueMapSummary);
  }

  return lines.join('\n');
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
      'Reference tags and meeting_notes when qualitative data is required.',
      'When qualitative data is requested, like questions about where the student wants to go to college, their hobbies, or similar info outside the realm of grades, attendance, or demographics, first look at all the available tag names and decide which ones might be relevant to search.',
      'If tags, student_tags, tag_categories, or tag_canonical_values are relevant, know that values a user might reference can be stored in tag_canonical_values.value, student_tags.value, or tags.name. When tags appear relevant, plan to query them directly before considering meeting_notes. Only fall back to meeting_notes if the tag inspection shows no matching qualitative data.',
      params.tagAnalysis?.valueMap?.length
        ? 'You already have an aggregated tag value map covering the relevant tags. Incorporate every pertinent value into the filter logic instead of stopping after the first matching tag.'
        : '',
      tagGuidance
        ? 'When tag analysis is provided, your query plan must state that you review the supplied tag metadata and aggregated value map before finalizing SQL. Call list_tags or list_tag_values only if you need additional detail beyond what is provided.'
        : '',
      tagGuidance ? 'Use the supplied tag analysis details. Only reference the provided tag_ids and value hints.' : '',
      'Prefer joins on explicit keys (student_id, school_id, etc.). Include filters that align with the request.',
      'Use ILIKE for string matches to allow for case insensitivity and partial matches.',
      'If the request is ambiguous, include assumptions to clarify intent and suggest follow-up questions to refine the query, but do not ask about school selection—the user context already defines it.',
      'Unless the user explicitly requests otherwise, assume only active students (status = \'Active\') should be included.',
  'Do not use complex SQL features like CTEs, window functions, or subqueries. Keep queries straightforward and efficient.',
  'Return well-formatted SQL ending without a semicolon.',
      `Latest user message:\n${latestUserMessage}`,
      schemaSummary
        ? `Database schema information:\n${schemaSummary}`
        : 'Database schema information unavailable. Use list_tables and get_table_schema before drafting SQL.',
      tagGuidance ? `Tag analysis:\n${tagGuidance}` : '',
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
