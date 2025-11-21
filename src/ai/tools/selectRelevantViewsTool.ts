import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ToolContext } from './types';

export type ViewSelectionConfidence = 'low' | 'medium' | 'high';

export interface SelectedView {
  name: string;
  comment?: string | null;
  reason?: string;
  heuristicScore?: number;
}

export interface ViewSelectionResult {
  primaryViews: SelectedView[];
  fallbackViews: SelectedView[];
  rationale: string;
  confidence: ViewSelectionConfidence;
  inspectedSchemas?: Record<string, string>;
}

export interface SelectRelevantViewsParams {
  question: string;
  conversationSummary?: string;
  maxPrimaryViews?: number;
  allowSchemaInspection?: boolean;
  context: ToolContext;
}

const MODEL_ID =
  process.env.AI_MODEL_VIEW_SELECTOR ||
  process.env.AI_MODEL_ROUTER ||
  process.env.AI_MODEL_DEFAULT ||
  'gpt-4o-mini';

const selectionSchema = z.object({
  primaryViews: z
    .array(
      z.object({
        name: z.string().min(1),
        reason: z.string().optional(),
      })
    )
    .max(6)
    .default([]),
  fallbackViews: z.array(z.string().min(1)).max(12).default([]),
  rationale: z.string().default('No rationale provided.'),
  confidence: z.enum(['low', 'medium', 'high']).default('medium'),
  requestSchemaInspection: z.boolean().default(false),
});

type RawSelection = z.infer<typeof selectionSchema>;

interface ViewMetadata {
  name: string;
  comment?: string | null;
  heuristicScore: number;
}

interface SelectionRunOptions {
  question: string;
  conversationSummary?: string;
  views: ViewMetadata[];
  maxPrimaryViews: number;
  schemaDetails?: Record<string, string>;
}

const MAX_SCHEMA_INSPECTIONS = 3;

// Coordinates heuristics, LLM classification, and optional schema inspection so downstream SQL
// planning starts with the most relevant view shortlist.
export async function selectRelevantViews({
  context,
  question,
  conversationSummary,
  maxPrimaryViews = 4,
  allowSchemaInspection = true,
}: SelectRelevantViewsParams): Promise<ViewSelectionResult> {
  const trimmedQuestion = question.trim();
  if (!trimmedQuestion) {
    throw new Error('selectRelevantViews requires a non-empty question.');
  }

  const views = await loadViewCatalog(context.supabase, trimmedQuestion);
  if (!views.length) {
    return {
      primaryViews: [],
      fallbackViews: [],
      rationale: 'No views available from list_views RPC.',
      confidence: 'low',
    };
  }

  const runSelection = async (
    options: SelectionRunOptions,
    allowRetryWithSchemas: boolean,
  ): Promise<{ raw: RawSelection; schemaDetails?: Record<string, string> } | null> => {
    const basePrompt = buildSelectionPrompt({
      question: options.question,
      conversationSummary: options.conversationSummary,
      views: options.views,
      maxPrimaryViews: options.maxPrimaryViews,
      schemaDetails: options.schemaDetails,
    });

    try {
      const { object } = await generateObject({
        model: openai(MODEL_ID),
        schema: selectionSchema,
        system:
          'You are a cautious analytics planner. Select only the most relevant views for the question. Respond in JSON only.',
        prompt: basePrompt,
      });

      if (object.requestSchemaInspection && allowRetryWithSchemas) {
        const candidates = object.primaryViews
          .map((entry) => entry.name)
          .filter((name) => options.views.some((view) => view.name === name))
          .slice(0, MAX_SCHEMA_INSPECTIONS);

        const schemaDetails = await loadSchemaDetails(context.supabase, candidates);
        if (Object.keys(schemaDetails).length) {
          const retry = await runSelection(
            {
              ...options,
              schemaDetails,
            },
            false,
          );
          if (retry) {
            return retry;
          }
        }
      }

      return { raw: object };
    } catch (error) {
      console.warn('selectRelevantViews: LLM classification failed, falling back to heuristics.', error);
      return null;
    }
  };

  const result = await runSelection(
    {
      question: trimmedQuestion,
      conversationSummary,
      views,
      maxPrimaryViews,
    },
    allowSchemaInspection,
  );

  if (!result) {
    const heuristicsOnly = views
      .sort((a, b) => b.heuristicScore - a.heuristicScore)
      .slice(0, maxPrimaryViews);
    return {
      primaryViews: heuristicsOnly,
      fallbackViews: views.filter((view) => !heuristicsOnly.includes(view)).slice(0, maxPrimaryViews),
      rationale: 'LLM selection failed; returning heuristic shortlist.',
      confidence: 'low',
    };
  }

  const { raw, schemaDetails } = result;

  const byName = new Map(views.map((view) => [view.name, view]));

  const primaryViews: SelectedView[] = [];
  for (const entry of raw.primaryViews.slice(0, maxPrimaryViews)) {
    const meta = byName.get(entry.name);
    if (meta) {
      primaryViews.push({
        name: meta.name,
        comment: meta.comment,
        heuristicScore: meta.heuristicScore,
        reason: entry.reason,
      });
    }
  }

  const fallbackViews: SelectedView[] = [];
  for (const name of raw.fallbackViews) {
    const meta = byName.get(name);
    if (meta) {
      fallbackViews.push({
        name: meta.name,
        comment: meta.comment,
        heuristicScore: meta.heuristicScore,
      });
    }
  }

  return {
    primaryViews,
    fallbackViews,
    rationale: raw.rationale,
    confidence: raw.confidence,
    inspectedSchemas: schemaDetails,
  };
}

export function createSelectRelevantViewsTool(context: ToolContext) {
  return tool({
    description:
      'Selects the most relevant analytics views (from list_views) for a counselor question so downstream SQL planning can stay focused.',
    inputSchema: z.object({
      question: z.string().min(1),
      conversationSummary: z.string().optional(),
      maxPrimaryViews: z.number().int().min(1).max(6).optional(),
      allowSchemaInspection: z.boolean().optional(),
    }),
    execute: async (input) =>
      selectRelevantViews({
        context,
        question: input.question,
        conversationSummary: input.conversationSummary,
        maxPrimaryViews: input.maxPrimaryViews,
        allowSchemaInspection: input.allowSchemaInspection,
      }),
  });
}

async function loadViewCatalog(supabase: SupabaseClient, question: string): Promise<ViewMetadata[]> {
  const { data, error } = await supabase.rpc('list_views');

  if (error) {
    console.error('selectRelevantViews: failed to load views', error);
    return [];
  }

  if (!Array.isArray(data)) {
    return [];
  }

  const heuristicsTokens = extractTokens(question);

  const catalog: ViewMetadata[] = [];

  for (const entry of data as Array<{ name?: unknown; comment?: unknown }>) {
    if (typeof entry.name !== 'string') {
      continue;
    }

    const comment =
      typeof entry.comment === 'string'
        ? entry.comment
        : entry.comment === null
          ? null
          : undefined;

    catalog.push({
      name: entry.name,
      comment,
      heuristicScore: scoreView(entry.name, comment ?? undefined, heuristicsTokens),
    });
  }

  return catalog;
}

function extractTokens(question: string): string[] {
  const words = question.toLowerCase().match(/[a-z0-9_]{3,}/g);
  if (!words) {
    return [];
  }
  const expansions: Record<string, string[]> = {
    absences: ['absence', 'absent', 'attendance', 'tardy', 'tardies'],
    attendance: ['absence', 'absences', 'tardy', 'present'],
    grades: ['grade', 'gpa', 'score', 'credit'],
    gpa: ['grade', 'grades', 'average'],
    tag: ['tags', 'tagged'],
    student: ['students', 'learner', 'pupil'],
    year: ['term', 'semester', 'annual'],
  };

  const tokens = new Set<string>();
  for (const word of words) {
    tokens.add(word);
    const extras = expansions[word];
    if (extras) {
      for (const extra of extras) {
        tokens.add(extra);
      }
    }
  }

  return Array.from(tokens);
}

function scoreView(name: string, comment: string | undefined, tokens: string[]): number {
  if (!tokens.length) {
    return 0;
  }

  const loweredName = name.toLowerCase();
  const loweredComment = comment?.toLowerCase() ?? '';

  let score = 0;
  for (const token of tokens) {
    if (!token) {
      continue;
    }

    if (loweredName.includes(token)) {
      score += 4;
    }

    if (loweredComment.includes(token)) {
      score += 6;
    }
  }

  if (loweredName.includes('current')) {
    score += 1;
  }

  return score;
}

function buildSelectionPrompt({
  question,
  conversationSummary,
  views,
  maxPrimaryViews,
  schemaDetails,
}: SelectionRunOptions): string {
  const promptSections: string[] = [
    'Task: Choose the most relevant analytics views (views.*) for the counselor question. Return JSON and only include the views that should be handed to downstream SQL planning.',
    'Guidelines:\n- Rely on view comments to infer intent.\n- Prefer direct matches to the counselor question or synonyms.\n- If no view clearly matches, return a low-confidence result instead of over-selecting.\n- Use at most the requested number of primary views.\n- When schema details are provided, use them to disambiguate similar views.',
    `Counselor question: ${question}`,
  ];

  if (conversationSummary?.trim()) {
    promptSections.push(`Recent conversation context: ${conversationSummary.trim()}`);
  }

  const sortedViews = [...views].sort((a, b) => b.heuristicScore - a.heuristicScore);
  const viewLines = sortedViews
    .map((view) => {
      const parts = [`- ${view.name}`];
      if (view.comment) {
        parts.push(`comment: ${view.comment}`);
      }
      parts.push(`heuristic_score: ${view.heuristicScore}`);
      return parts.join(' | ');
    })
    .join('\n');

  promptSections.push(`Available views (sorted by heuristic score):\n${viewLines}`);
  promptSections.push(`Select at most ${maxPrimaryViews} primary views. Include fallback views only when they might become relevant later.`);

  if (schemaDetails && Object.keys(schemaDetails).length) {
    const schemaBlocks = Object.entries(schemaDetails)
      .map(([viewName, summary]) => `Schema detail for ${viewName}: ${summary}`)
      .join('\n');
    promptSections.push('Additional schema evidence (requested by prior classification):');
    promptSections.push(schemaBlocks);
  }

  promptSections.push(
    'Respond in JSON with the schema { primaryViews: Array<{ name, reason? }>, fallbackViews: string[], rationale: string, confidence: "low" | "medium" | "high", requestSchemaInspection: boolean }.',
  );

  return promptSections.join('\n\n');
}

async function loadSchemaDetails(
  supabase: SupabaseClient,
  viewNames: string[],
): Promise<Record<string, string>> {
  const summaries: Record<string, string> = {};

  for (const viewName of viewNames) {
    const { data, error } = await supabase.rpc('get_view_schema', {
      p_view_name: viewName,
    });

    if (error) {
      console.warn('selectRelevantViews: failed to fetch schema for view', { viewName, error });
      continue;
    }

    if (!Array.isArray(data) || !data.length) {
      continue;
    }

    const formatted = (data as Array<Record<string, unknown>>)
      .slice(0, 25)
      .map((column) => formatColumn(column))
      .filter(Boolean)
      .join('; ');

    const truncated = data.length > 25 ? ' (truncated at 25 columns)' : '';

    summaries[viewName] = `${formatted}${truncated}`;
  }

  return summaries;
}

function formatColumn(column: Record<string, unknown>): string {
  const name = String(column.column_name ?? column.columnName ?? 'unknown_column');
  const type = String(column.data_type ?? column.dataType ?? 'unknown_type');
  const commentValue = column.column_comment ?? column.comment;
  const note = typeof commentValue === 'string' && commentValue.trim().length ? ` - ${commentValue.trim()}` : '';
  return `${name} (${type})${note}`;
}
