import { generateObject, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod/v3';
import { buildSchemaSummary, type SchemaSummaryResult } from './common';

interface EvaluationSchemaResult {
  syntaxLikelyValid: boolean;
  severity: 'none' | 'low' | 'medium' | 'high';
  blockingIssues: string[];
  reasoning: string;
  recommendedFix?: string;
  normalizedQuery?: string;
  notes?: string;
}

const evaluationSchema = z.object({
  syntaxLikelyValid: z.boolean(),
  severity: z.enum(['none', 'low', 'medium', 'high']),
  blockingIssues: z.array(z.string()),
  reasoning: z.string(),
  recommendedFix: z.string().nullable().optional().transform((val) => val ?? undefined),
  normalizedQuery: z.string().optional(),
  notes: z.string().optional(),
});

export interface SqlEvaluationResult {
  approved: boolean;
  feedback: string;
  blockingIssues: string[];
  recommendedFix?: string;
  normalizedSql?: string;
  reasoning: string;
  iterations: number;
  severity: EvaluationSchemaResult['severity'];
  notes?: string;
}

interface EvaluateSqlQueryOptions {
  maxIterations?: number;
  routerContext?: string;
}

const DEFAULT_MAX_ITERATIONS = 2;

export async function evaluateSqlQuery(
  sql: string,
  options: EvaluateSqlQueryOptions = {},
): Promise<SqlEvaluationResult> {
  const maxIterations = Math.max(1, options.maxIterations ?? DEFAULT_MAX_ITERATIONS);
  let currentSql = sql;
  let iterations = 0;
  let lastEvaluation: z.infer<typeof evaluationSchema> | null = null;
  let lastSchemaContextDescription = '';

  while (iterations < maxIterations) {
    const schemaSummary = await buildSchemaSummary({ sql: currentSql });
    const schemaContextDescription = buildSchemaDescription(schemaSummary);
    lastSchemaContextDescription = schemaContextDescription;
    const evaluation = await runEvaluation(currentSql, schemaContextDescription, options.routerContext);
    lastEvaluation = evaluation;

    const hasBlockingIssues = evaluation.blockingIssues.length > 0 || evaluation.severity === 'high' || !evaluation.syntaxLikelyValid;
    if (!hasBlockingIssues) {
      return {
        approved: true,
        feedback: 'SQL passed evaluation.',
        blockingIssues: [],
        recommendedFix: evaluation.recommendedFix,
        normalizedSql: evaluation.normalizedQuery ?? currentSql,
        reasoning: evaluation.reasoning,
        iterations,
        severity: evaluation.severity,
        notes: evaluation.notes,
      };
    }

    if (!evaluation.recommendedFix) {
      break;
    }

    const improved = await attemptImprovement(currentSql, evaluation.recommendedFix, schemaContextDescription);
    if (!improved?.trim() || improved.trim() === currentSql.trim()) {
      break;
    }

    currentSql = improved;
    iterations += 1;
  }

  const fallbackEvaluation: EvaluationSchemaResult = lastEvaluation ?? {
    syntaxLikelyValid: false,
    severity: 'high',
    blockingIssues: ['Evaluation did not complete.'],
    reasoning: 'Unable to evaluate SQL query.',
  };

  return {
    approved: false,
    feedback: summarizeFeedback(fallbackEvaluation, currentSql),
    blockingIssues: fallbackEvaluation.blockingIssues,
    recommendedFix: fallbackEvaluation.recommendedFix,
    normalizedSql: fallbackEvaluation.normalizedQuery ?? currentSql,
    reasoning: fallbackEvaluation.reasoning,
    iterations,
    severity: fallbackEvaluation.severity,
    notes: [fallbackEvaluation.notes, lastSchemaContextDescription ? `Schema context used:\n${lastSchemaContextDescription}` : '']
      .filter(Boolean)
      .join('\n\n') || undefined,
  };
}

async function runEvaluation(sql: string, schemaContext: string, routerContext?: string): Promise<z.infer<typeof evaluationSchema>> {
  const promptSegments = [
    'Evaluate the following postgres SQL query for syntax correctness and safety.',
    'Only SELECT statements are permitted.',
    'Semicolons at the end of the query are not permitted.',
    'Identify any syntax errors, missing clauses, or table/column mismatches that would cause the query to fail.',
    'If the query is syntactically valid, provide a concise confirmation.',
    schemaContext ? `Schema information:\n${schemaContext}` : 'Schema information unavailable.',
    routerContext ? `Context: ${routerContext}` : '',
    `SQL:\n${sql}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  try {
    console.log('Running SQL evaluation')
    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: evaluationSchema,
      system:
        'You are a precise SQL syntax evaluator. Focus on identifying issues that would prevent successful execution on PostgreSQL. Respond with a JSON object that matches the provided schema.',
      prompt: promptSegments,
    });

    return object;
  } catch (error) {
    const salvaged = extractEvaluationFromError(error);
    if (salvaged) {
      return salvaged;
    }

    console.warn('SQL evaluation failed to generate an object. Retrying with clarified instructions.', error);

    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: evaluationSchema,
      system:
        'You are a precise SQL syntax evaluator. Return ONLY a JSON object that conforms exactly to the schema fields: syntaxLikelyValid (boolean), severity (none|low|medium|high), blockingIssues (string array), reasoning (string), recommendedFix (string, optional), normalizedQuery (string, optional), notes (string, optional). Do not wrap the object in any other structure.',
      prompt: `${promptSegments}\n\nEnsure the response is a single JSON object with the exact keys described.`,
    });

    return object;
  }
}

async function attemptImprovement(sql: string, guidance: string, schemaContext: string): Promise<string | null> {
  try {
    const { text } = await generateText({
      model: openai('gpt-4o'),
      system: 'You fix SQL SELECT queries so they execute successfully on PostgreSQL without changing intent.',
      prompt: `Improve this SQL query so it resolves the following issues while keeping intent intact:

Issues:
${guidance}

Schema information:
${schemaContext || 'Unavailable'}

Original SQL:
${sql}

Return only the corrected SQL.`,
    });

    return text.trim();
  } catch (error) {
    console.error('SQL improvement attempt failed', error);
    return null;
  }
}

function summarizeFeedback(evaluation: EvaluationSchemaResult, sql: string): string {
  const blockingSummary = evaluation.blockingIssues.length
    ? `Blocking issues:\n- ${evaluation.blockingIssues.join('\n- ')}`
    : 'No blocking issues reported.';

  const recommendation = evaluation.recommendedFix ? `Recommended fix:\n${evaluation.recommendedFix}` : 'No automatic fix available.';

  return [`SQL failed evaluation.`, blockingSummary, recommendation, `Original SQL:\n${sql}`].join('\n\n');
}

function buildSchemaDescription(context: SchemaSummaryResult): string {
  const sections: string[] = [];

  if (context.summary) {
    sections.push(context.summary);
  } else {
    sections.push('Schema information unavailable. Use list_tables and get_table_schema to inspect the database structure before drafting SQL.');
  }

  if (context.referencedTables.length) {
    sections.push(`Referenced tables: ${context.referencedTables.join(', ')}`);
  }

  if (context.warnings.length) {
    sections.push(`Warnings:\n- ${context.warnings.join('\n- ')}`);
  }

  return sections.join('\n\n');
}

function extractEvaluationFromError(error: unknown): z.infer<typeof evaluationSchema> | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const candidateSources: unknown[] = [];

  if ('value' in error) {
    candidateSources.push((error as { value?: unknown }).value);
  }

  if ('cause' in error && error.cause && typeof error.cause === 'object' && 'value' in error.cause) {
    candidateSources.push((error.cause as { value?: unknown }).value);
  }

  for (const source of candidateSources) {
    if (!source || typeof source !== 'object') {
      continue;
    }

    const maybeProperties = (source as Record<string, unknown>).properties;
    if (maybeProperties && typeof maybeProperties === 'object') {
      const parsed = evaluationSchema.safeParse(maybeProperties);
      if (parsed.success) {
        return parsed.data;
      }
    } else {
      const parsed = evaluationSchema.safeParse(source);
      if (parsed.success) {
        return parsed.data;
      }
    }
  }

  return null;
}
