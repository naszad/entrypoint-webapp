import { tool } from 'ai';
import { z } from 'zod';
import { evaluateSqlQuery } from '@/app/api/chat/workflows/sqlEvaluationWorkflow';
import type { SqlEvaluationFeedback } from '../types/sql';
import type { ToolContext } from './types';

const MAX_SUPPORTED_ITERATIONS = 3;

const inputSchema = z.object({
  sql: z
    .string()
    .min(1)
    .describe('SQL SELECT statement to evaluate. Must omit trailing semicolon.'),
  routerContext: z
    .string()
    .min(1)
    .optional()
    .describe('Optional context string describing the counselor request or routing path.'),
  maxIterations: z
    .number()
    .int()
    .min(1)
    .max(MAX_SUPPORTED_ITERATIONS)
    .optional()
    .describe('Optional override for evaluation improvement iterations. Defaults to workflow setting.'),
});

export type EvaluateSqlToolInput = z.infer<typeof inputSchema>;

export interface EvaluateSqlToolResult {
  evaluation: SqlEvaluationFeedback;
  cacheHit: boolean;
}

export async function evaluateSqlWithContext(
  context: ToolContext,
  { sql, routerContext, maxIterations }: EvaluateSqlToolInput,
): Promise<EvaluateSqlToolResult | { error: string }> {
  const trimmedSql = (sql ?? '').trim();

  if (!trimmedSql) {
    return { error: 'SQL is required for evaluation.' };
  }

  if (!trimmedSql.toLowerCase().startsWith('select')) {
    return { error: 'Only SELECT queries can be evaluated.' };
  }

  if (trimmedSql.includes(';')) {
    return { error: 'Omit trailing semicolons from SQL before evaluation.' };
  }

  const cacheKey = normalizeSqlKey(trimmedSql);
  const cache = context.sqlEvaluationCache;
  const cached = cache?.get(cacheKey);

  if (cached) {
    return { evaluation: cached, cacheHit: true };
  }

  try {
    const evaluation = await evaluateSqlQuery(trimmedSql, {
      maxIterations,
      routerContext,
    });

    const feedback: SqlEvaluationFeedback = {
      approved: evaluation.approved,
      feedback: evaluation.feedback,
      blockingIssues: evaluation.blockingIssues,
      recommendedFix: evaluation.recommendedFix,
      normalizedSql: evaluation.normalizedSql,
      reasoning: evaluation.reasoning,
      severity: evaluation.severity,
      iterations: evaluation.iterations,
      notes: evaluation.notes,
    };

    cache?.set(cacheKey, feedback);

    return { evaluation: feedback, cacheHit: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown evaluation failure';
    console.error('evaluate_sql tool failed', error);
    return { error: `Evaluation failed: ${message}` };
  }
}

export function createEvaluateSqlTool(context: ToolContext) {
  return tool({
    description: 'Evaluates a SQL SELECT statement for syntax and safety using the curated schema context.',
    inputSchema,
    execute: (input) => evaluateSqlWithContext(context, input as EvaluateSqlToolInput),
  });
}

function normalizeSqlKey(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}
