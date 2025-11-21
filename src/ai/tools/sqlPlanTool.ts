import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { tool } from 'ai';
import { z } from 'zod';
import type { TagDescriptor, TagInsightsMetadata } from '../types/cohort';
import type { SqlPlan } from '../types/sql';

const AI_MODEL_SQL_PLAN =
  process.env.AI_MODEL_QUERY_PLAN || process.env.AI_MODEL_DEFAULT || 'gpt-4o-mini';

const tagDescriptorSchema = z.object({
  tagId: z.string().min(1),
  tagName: z.string().min(1),
  tagValues: z.array(z.string().min(1)).optional(),
});

const tagMetadataEntrySchema = z.object({
  tagId: z.string().min(1),
  tagName: z.string().min(1),
  isMultiValue: z.boolean().optional(),
  usageCount: z.number().optional(),
  studentCount: z.number().optional(),
  lastSeen: z.string().optional(),
  valueSample: z.array(z.string()).optional(),
  valueSampleTruncated: z.boolean().optional(),
  canonicalValueCount: z.number().optional(),
  observedValueCount: z.number().optional(),
});

const sqlPlanSchema = z.object({
  objective: z.string().min(1),
  summary: z.string().min(1),
  sql: z.string().optional(),
  assumptions: z.array(z.string()).default([]),
  followUpQuestions: z.array(z.string()).default([]),
  requiresTagGuidance: z.boolean().optional(),
  tagGuidanceNotes: z.array(z.string()).optional(),
});

export interface SqlPlanToolInput {
  latestUserMessage: string;
  conversationSummary?: string;
  tagDescriptors?: TagDescriptor[];
  tagMetadata?: Record<string, TagInsightsMetadata>;
  guidance?: string[];
  assumptions?: string[];
  schemaSummary?: string | null;
  availableViews?: string[];
}

export interface SqlPlanToolResult {
  plan: SqlPlan;
  hasSqlDraft: boolean;
}

export async function generateSqlPlan(input: SqlPlanToolInput): Promise<SqlPlanToolResult> {
  const message = input.latestUserMessage?.trim();
  if (!message) {
    throw new Error('latestUserMessage is required to build a SQL plan.');
  }

  const normalizedTagDescriptors = input.tagDescriptors ?? [];
  const tagGuidanceLines: string[] = [];

  if (normalizedTagDescriptors.length) {
    tagGuidanceLines.push('Tag descriptors supplied:');
    for (const descriptor of normalizedTagDescriptors) {
      const values = Array.isArray(descriptor.tagValues) && descriptor.tagValues.length
        ? ` | values: ${descriptor.tagValues.slice(0, 20).join(', ')}`
        : '';
      tagGuidanceLines.push(`- tag_id ${descriptor.tagId} (${descriptor.tagName})${values}`);
    }
  }

  if (input.tagMetadata) {
    tagGuidanceLines.push('Tag metadata highlights:');
    const entries = Object.values(input.tagMetadata);
    for (const meta of entries) {
      const usageInfo = [
        typeof meta.usageCount === 'number' ? `usage=${meta.usageCount}` : undefined,
        typeof meta.studentCount === 'number' ? `students=${meta.studentCount}` : undefined,
        meta.lastSeen ? `last_seen=${meta.lastSeen}` : undefined,
      ]
        .filter(Boolean)
        .join(', ');

      const values = meta.valueSample?.length
        ? `values: ${meta.valueSample.slice(0, 15).join(', ')}${meta.valueSampleTruncated ? ' (truncated)' : ''}`
        : undefined;

      tagGuidanceLines.push(
        `- ${meta.tagId} (${meta.tagName})${usageInfo ? ` | ${usageInfo}` : ''}${values ? ` | ${values}` : ''}`,
      );
    }
  }

  const promptSegments: string[] = [
    'Create a precise data query plan for the school counseling assistant.',
    'Use only the curated analytics views (views.*) surfaced by list_views and their documented columns.',
    'Respect the provided guidance when deciding on enrollment status, academic term limits, or tag joins.',
    'Do not guess at tag names or categories—only filter with provided tag_id values (and tag values when supplied).',
    'Avoid CTEs, subqueries, or window functions. Produce a single, efficient SELECT statement without a trailing semicolon.',
    'When the request is about a count of students, make sure to use DISTINCT properly on unique student identifiers.',
    'Include assumptions and follow-up questions only when the request is ambiguous or missing critical details; otherwise leave those arrays empty.',
    `Latest user message:\n${message}`,
  ];

  if (input.conversationSummary?.trim()) {
    promptSegments.push(`Conversation summary:\n${input.conversationSummary.trim()}`);
  }

  if (input.availableViews?.length) {
    const viewList = input.availableViews.map((view) => `- ${view}`).join('\n');
    promptSegments.push(`Available views from list_views:\n${viewList}`);
  }

  const schemaSummary = input.schemaSummary?.trim() ?? '';
  if (schemaSummary) {
    promptSegments.push(`Schema summary:\n${schemaSummary}`);
  }

  if (input.guidance?.length) {
    promptSegments.push(`Guidance to apply before drafting SQL:\n- ${input.guidance.join('\n- ')}`);
  }

  if (input.assumptions?.length) {
    promptSegments.push(`Known assumptions to acknowledge:\n- ${input.assumptions.join('\n- ')}`);
  }

  if (tagGuidanceLines.length) {
    promptSegments.push(tagGuidanceLines.join('\n'));
  }

  promptSegments.push(
    'Return JSON only. Provide the SQL draft in the sql field if—and only if—you are confident the schema inspection is sufficient. Leave it empty when additional research is required.',
  );

  const { object: rawPlan } = await generateObject({
    model: openai(AI_MODEL_SQL_PLAN),
    schema: sqlPlanSchema,
    system:
      'You are a senior analytics engineer supporting a school counseling AI. Produce a query plan that the assistant can follow safely. Use only the curated views that the RPCs expose.',
    prompt: promptSegments.filter(Boolean).join('\n\n'),
  });

  const trimmedSql = rawPlan.sql?.trim() ?? '';
  const normalizedSql = trimmedSql && trimmedSql.toLowerCase().startsWith('select') ? trimmedSql : undefined;

  const plan: SqlPlan = {
    objective: rawPlan.objective,
    summary: rawPlan.summary,
    sql: normalizedSql,
    assumptions: rawPlan.assumptions ?? [],
    followUpQuestions: rawPlan.followUpQuestions ?? [],
    requiresTagGuidance: rawPlan.requiresTagGuidance,
    tagGuidanceNotes: rawPlan.tagGuidanceNotes,
  };

  return {
    plan,
    hasSqlDraft: Boolean(normalizedSql),
  };
}

export function createSqlPlanTool() {
  return tool({
    description:
      'Produces a structured SQL execution plan using the curated views schema. Always review the plan before drafting or executing SQL.',
    inputSchema: z
      .object({
        latestUserMessage: z
          .string()
          .min(1)
          .describe('Most recent counselor request that should be translated into SQL.'),
        conversationSummary: z
          .string()
          .optional()
          .describe('Optional condensed conversation history.'),
        tagDescriptors: z.array(tagDescriptorSchema).optional(),
        tagMetadata: z
          .record(tagMetadataEntrySchema)
          .optional()
          .describe('Optional tag metadata keyed by tag_id for downstream guidance.'),
        guidance: z
          .array(z.string().min(1))
          .optional()
          .describe('Pre-computed guidance the planner must apply (e.g., school filters, view hints).'),
        schemaSummary: z
          .string()
          .nullable()
          .optional()
          .describe('Optional schema summary compiled from list_views/get_view_schema.'),
        availableViews: z
          .array(z.string().min(1))
          .optional()
          .describe('Optional list of available views returned by list_views.'),
        assumptions: z
          .array(z.string().min(1))
          .optional()
          .describe('Known assumptions that should be restated or challenged in the plan.'),
      })
      .strip(),
    execute: (input) => generateSqlPlan(input as SqlPlanToolInput),
  });
}
