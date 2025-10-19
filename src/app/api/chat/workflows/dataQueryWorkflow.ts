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

const dataQueryPlanSchema = z.object({
  objective: z.string(),
  summary: z.string(),
  sql: z.string(),
  assumptions: z.array(z.string()).default([]),
  followUpQuestions: z.array(z.string()).default([]),
});

export async function runDataQueryWorkflow(params: WorkflowExecutionParams) {
  const plan = await buildDataQueryPlan({
    latestUserMessage: params.latestUserMessage,
    conversationSummary: params.conversationSummary,
  });

  const evaluation = plan?.sql ? await evaluateSqlQuery(plan.sql) : null;

  const contexts: StreamingWorkflowContext[] = [];
  const additionalInstructions: string[] = [];

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

    additionalInstructions.push(
      [
        'Use the following data query plan to guide your analysis:',
        `Objective: ${plan.objective}`,
        `Summary: ${plan.summary}`,
        plan.assumptions.length ? `Assumptions:\n- ${plan.assumptions.join('\n- ')}` : '',
        plan.followUpQuestions.length ? `Potential follow-up questions:\n- ${plan.followUpQuestions.join('\n- ')}` : '',
        'Validated SQL template:',
        '```sql',
        plan.sql,
        '```',
        'When you are ready to fetch data, call the execute_sql tool with the validated SQL. If you adjust the SQL, you must explain the changes and re-evaluate before execution.',
      ]
        .filter(Boolean)
        .join('\n'),
    );
  } else {
    additionalInstructions.push(
      'No SQL plan could be generated automatically. Ask clarifying questions to understand the needed data before attempting to query the database.',
    );
  }

  if (evaluation) {
    if (plan?.sql) {
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
      ? 'The SQL evaluation workflow approved the query. You may execute it with execute_sql. If you modify the SQL, justify the change and request reevaluation.'
      : `SQL evaluation reported blocking issues. Do not execute the query until you address the following:\n${evaluation.feedback}`;

    additionalInstructions.push(evaluationInstruction);
  }

  return runStreamingWorkflow(createStreamingOptions(params, additionalInstructions, contexts));
}

function createStreamingOptions(
  params: WorkflowExecutionParams,
  additionalSystemInstructions: string[],
  contexts: StreamingWorkflowContext[],
): StreamingWorkflowParams {
  return {
    model: params.model,
    messages: params.messages,
    toolRegistry: params.toolRegistry,
    decision: params.decision,
    chatId: params.chatId,
    preferredToolNames: params.decision.toolNames,
    additionalSystemInstructions,
    contexts,
  };
}

interface BuildDataQueryPlanParams {
  latestUserMessage?: string;
  conversationSummary?: string;
}

async function buildDataQueryPlan(params: BuildDataQueryPlanParams) {
  const { latestUserMessage, conversationSummary } = params;

  if (!latestUserMessage?.trim()) {
    return null;
  }

  try {
    console.log('Building data query plan for message:', latestUserMessage);
    const { summary: schemaSummary } = await buildSchemaSummary();
    console.log('Schema context built:', schemaSummary ? 'Available' : 'Unavailable');

    const promptSections = [
      'Create a precise data query plan for the school counseling assistant.',
      'Produce a single postgres compatible SQL SELECT statement that will retrieve the exact data the user needs.',
      'Use only tables and columns that exist in the database.',
      'Reference tags and meeting_notes when qualitative data is required.',
      'If tags, student_tags, tag_categories, or tag_canonical_values are relevant, know that values a user might reference can be stored in tag_canonical_values.value, student_tags.value, or tags.name.',
      'Prefer joins on explicit keys (student_id, school_id, etc.). Include filters that align with the request.',
      'Use ILIKE for string matches to allow for case insensitivity and partial matches.',
      'If the request is ambiguous, include assumptions to clarify intent and suggest follow-up questions to refine the query.',
      'Do not use complex SQL features like CTEs, window functions, or subqueries. Keep queries straightforward and efficient.',
      'Return well-formatted SQL ending without a semicolon.',
      `Latest user message:\n${latestUserMessage}`,
      schemaSummary
        ? `Database schema information:\n${schemaSummary}`
        : 'Database schema information unavailable. Use list_tables and get_table_schema before drafting SQL.',
    ];

    if (conversationSummary) {
      promptSections.push(`Recent conversation summary:\n${conversationSummary}`);
    }

    console.log('generating query plan')
    const { object: plan } = await generateObject({
      model: openai('gpt-4o'),
      schema: dataQueryPlanSchema,
      system:
        'You are a senior analytics engineer assisting a school counseling AI. Your job is to produce a concise query plan and a valid SQL SELECT statement that the assistant can execute.',
      prompt: promptSections.join('\n\n'),
    });

    if (!plan.sql?.toLowerCase().includes('select')) {
      return null;
    }

    console.log('Data query plan generated:', plan.sql);
    return plan;
  } catch (error) {
    console.error('Failed to build data query plan', error);
    return null;
  }
}
