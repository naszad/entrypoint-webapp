import { tool } from 'ai';
import { z } from 'zod';
import { evaluateSqlQuery } from '@/app/api/chat/workflows/sqlEvaluationWorkflow';
import type { SqlEvaluationFeedback, SqlExecutionResult } from '../types/sql';
import type { ToolContext } from './types';

const inputSchema = z.object({
  sql: z
    .string()
    .min(1)
    .describe('SQL SELECT statement to execute. Must omit trailing semicolon and remain read-only.'),
  routerContext: z
    .string()
    .min(1)
    .optional()
    .describe('Optional description of the counselor request for evaluation context.'),
  maxIterations: z
    .number()
    .int()
    .min(1)
    .max(3)
    .optional()
    .describe('Optional override for evaluation improvement iterations.'),
  skipEvaluation: z
    .boolean()
    .optional()
    .describe('When true, bypasses evaluation and executes the SQL directly. Use only if evaluation already ran.'),
});

export type ExecuteSqlToolInput = z.infer<typeof inputSchema>;

export interface ExecuteSqlToolResult extends SqlExecutionResult {
  cacheHit: boolean;
}

export async function executeSqlWithContext(
  context: ToolContext,
  { sql, routerContext, maxIterations, skipEvaluation }: ExecuteSqlToolInput,
): Promise<ExecuteSqlToolResult | { error: string; evaluation?: SqlEvaluationFeedback }> {
  const trimmedSql = (sql ?? '').trim();

  if (!trimmedSql) {
    return { error: 'SQL is required for execution.' };
  }

  if (!trimmedSql.toLowerCase().startsWith('select')) {
    return { error: 'Only SELECT queries are allowed for execution.' };
  }

  if (trimmedSql.includes(';')) {
    return { error: 'Remove any trailing semicolons before executing SQL.' };
  }

  const cache = context.sqlEvaluationCache;
  const cacheKey = normalizeSqlKey(trimmedSql);

  let evaluation: SqlEvaluationFeedback | undefined = cache?.get(cacheKey);
  let cacheHit = Boolean(evaluation);

  if (!skipEvaluation) {
    if (!evaluation) {
      try {
        const evaluationResult = await evaluateSqlQuery(trimmedSql, { maxIterations, routerContext });
        evaluation = {
          approved: evaluationResult.approved,
          feedback: evaluationResult.feedback,
          blockingIssues: evaluationResult.blockingIssues,
          recommendedFix: evaluationResult.recommendedFix,
          normalizedSql: evaluationResult.normalizedSql,
          reasoning: evaluationResult.reasoning,
          severity: evaluationResult.severity,
          iterations: evaluationResult.iterations,
          notes: evaluationResult.notes,
        };
        cache?.set(cacheKey, evaluation);
        cacheHit = false;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown evaluation failure';
        console.error('execute_sql tool evaluation failed', error);
        return { error: `Evaluation failed: ${message}` };
      }
    }
  } else if (!evaluation) {
    return {
      error: 'Evaluation must run at least once before skipEvaluation can be set.',
    };
  }

  if (!evaluation) {
    return { error: 'Unable to determine evaluation result.' };
  }

  if (!evaluation.approved) {
    return {
      error: `SQL evaluation failed: ${evaluation.feedback}`,
      evaluation,
    };
  }

  const vettedSql = evaluation.normalizedSql ?? trimmedSql;

  try {
    console.log('[execute_sql tool] Running query:', vettedSql);
    const { data, error } = await context.supabase.rpc('execute_safe_select', {
      p_query: vettedSql,
      p_selected_school_id: context.selectedSchoolId ?? null,
    });

    if (error) {
      console.error('execute_sql tool Supabase error', error);
      return {
        error: `Failed to execute SQL: ${error.message}`,
        evaluation,
      };
    }

    const rows = Array.isArray(data) ? data : [];
    const result: ExecuteSqlToolResult = {
      rows,
      rowCount: rows.length,
      evaluation,
      cacheHit,
    };

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Supabase error';
    console.error('execute_sql tool unexpected failure', error);
    return {
      error: `Failed to execute SQL: ${message}`,
      evaluation,
    };
  }
}

export function createExecuteSqlTool(context: ToolContext) {
  return tool({
    description:
      'Executes a vetted SQL SELECT query through the execute_safe_select RPC after passing evaluation guardrails.',
    inputSchema,
    execute: (input) => executeSqlWithContext(context, input as ExecuteSqlToolInput),
  });
}

function normalizeSqlKey(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}
