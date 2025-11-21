import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { tool } from 'ai';
import type {
  CohortMetricRequest,
  CohortNumericCondition,
  CohortQuerySpec,
  CohortQueryTagFilter,
  CohortQueryTerm,
  NumericComparisonOperator,
  TagDescriptor,
  TagInsightsMetadata,
} from '../types/cohort';

const MODEL_ID = process.env.AI_MODEL_COHORT_SPEC || process.env.AI_MODEL_DEFAULT || 'gpt-4o-mini';

const comparisonSchema = z.enum(['>', '>=', '<', '<=', '=', '!=']) as z.ZodType<NumericComparisonOperator>;

const tagFilterSchema = z.object({
  tagId: z.string().min(1),
  tagName: z.string().min(1),
  values: z.array(z.string().min(1)).optional(),
  categoryName: z.string().optional(),
});

const termSchema = z.object({
  termId: z.string().min(1),
  termName: z.string().optional(),
  abbreviation: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  yearId: z.string().optional(),
  yearName: z.string().optional(),
  isCurrentYear: z.boolean().optional(),
  isCurrentTerm: z.boolean().optional(),
});

const numericConditionSchema = z.object({
  column: z.string().min(1),
  operator: comparisonSchema,
  value: z.number(),
  label: z.string().optional(),
});

const metricSchema = z.object({
  type: z.enum(['count', 'average', 'sum', 'percentage']).default('count'),
  column: z.string().optional(),
  description: z.string().optional(),
});

const cohortSpecSchema = z.object({
  question: z.string().min(1),
  tags: z.array(tagFilterSchema).default([]),
  terms: z.array(termSchema).optional(),
  numericConditions: z.array(numericConditionSchema).optional(),
  requiresCurrentEnrollment: z.boolean().optional(),
  metric: metricSchema.optional(),
  additionalNotes: z.array(z.string().min(1)).optional(),
});

export interface BuildCohortSpecInput {
  question: string;
  conversationSummary?: string;
  tagDescriptors: TagDescriptor[];
  tagMetadata?: Record<string, TagInsightsMetadata>;
  termOptions?: CohortQueryTerm[];
}

export interface BuildCohortSpecResult extends CohortQuerySpec {
  rationale?: string[];
}

function formatTagCatalog(
  descriptors: TagDescriptor[],
  metadata?: Record<string, Partial<TagInsightsMetadata>>,
): string {
  if (!descriptors.length) {
    return 'No tag descriptors were supplied.';
  }

  return descriptors
    .map((descriptor) => {
      const meta = metadata?.[descriptor.tagId];
      const parts: string[] = [`- ${descriptor.tagName} (tag_id: ${descriptor.tagId})`];

      if (descriptor.tagValues?.length) {
        parts.push(`  · sample values: ${descriptor.tagValues.slice(0, 10).join(', ')}`);
      }

      if (meta) {
        const usageBits: string[] = [];
        if (typeof meta.studentCount === 'number') {
          usageBits.push(`${meta.studentCount} students`);
        }
        if (typeof meta.usageCount === 'number') {
          usageBits.push(`${meta.usageCount} total tag assignments`);
        }
        if (usageBits.length) {
          parts.push(`  · usage: ${usageBits.join(', ')}`);
        }
        if (meta.categoryName) {
          parts.push(`  · category: ${meta.categoryName}`);
        }
        if (meta.valueSample?.length && !descriptor.tagValues?.length) {
          parts.push(`  · observed values: ${meta.valueSample.slice(0, 10).join(', ')}`);
        }
      }

      return parts.join('\n');
    })
    .join('\n');
}

function formatTermCatalog(terms?: CohortQueryTerm[]): string {
  if (!terms?.length) {
    return 'No academic term options were provided.';
  }

  const header = 'Term abbreviations repeat each academic year; entries flagged as "current year" align with the active school year.';

  const body = terms
    .map((term) => {
      const labelParts: string[] = [term.termName ?? term.abbreviation ?? 'Unnamed term'];
      if (term.abbreviation && term.abbreviation !== labelParts[0]) {
        labelParts.push(`abbr ${term.abbreviation}`);
      }

      const annotations: string[] = [];
      if (term.yearName) {
        const yearText = term.isCurrentYear ? `${term.yearName} (current year)` : term.yearName;
        annotations.push(yearText);
      } else if (term.isCurrentYear) {
        annotations.push('current year');
      }

      if (term.isCurrentTerm) {
        annotations.push('current term');
      }

      if (term.startDate && term.endDate) {
        annotations.push(`${term.startDate} → ${term.endDate}`);
      }

      const descriptor = annotations.length ? ` (${annotations.join('; ')})` : '';
      return `- ${labelParts.join(' — ')} [term_id: ${term.termId}]${descriptor}`;
    })
    .join('\n');

  return `${header}\n${body}`;
}

export async function buildCohortQuerySpec({
  question,
  conversationSummary,
  tagDescriptors,
  tagMetadata,
  termOptions,
}: BuildCohortSpecInput): Promise<BuildCohortSpecResult> {
  const trimmedQuestion = question.trim();
  if (!trimmedQuestion) {
    throw new Error('question is required to build a cohort query specification.');
  }

  const tagCatalogBlock = formatTagCatalog(tagDescriptors, tagMetadata);
  const termCatalogBlock = formatTermCatalog(termOptions);

  const promptSections = [
    'You are the cohort analysis planner for EntryPoint SRM. Convert the counselor question into a structured specification that downstream SQL tooling can apply without guesswork.',
    'Use only tag_id values supplied in the catalog; never invent tag identifiers or values. If a requested qualitative concept is missing, leave the tags array empty and record a note explaining the gap.',
    'Term abbreviations such as "S1" repeat every academic year. Prefer term_ids that match the requested timeframe and include year metadata when the counselor references terms, semesters, or dates. If unsure, omit the term and add a note explaining the ambiguity.',
    'When the counselor names a term without specifying a year, default to the term entry marked isCurrentYear: true (the current school year) and capture its yearId/yearName in the JSON.',
    'Never rely on term abbreviations alone; downstream tooling filters by term_id or by yearId + abbreviation pairs.',
    'Represent numeric conditions (e.g., GPA thresholds) explicitly in the numericConditions array. Set requiresCurrentEnrollment to true unless the counselor asks for historical/withdrawn students.',
    'Default the metric type to "count" unless the counselor explicitly asks for an average, sum, or percentage.',
    `Counselor question:\n${trimmedQuestion}`,
  ];

  if (conversationSummary?.trim()) {
    promptSections.push(`Conversation context:\n${conversationSummary.trim()}`);
  }

  promptSections.push('Available tag catalog:', tagCatalogBlock);
  promptSections.push('Available academic term options:', termCatalogBlock);

  promptSections.push('Respond in JSON only, matching the provided schema. Include an optional rationale array when helpful to explain your choices.');

  const { object } = await generateObject({
    model: openai(MODEL_ID),
    schema: cohortSpecSchema.extend({
      rationale: z.array(z.string().min(1)).optional(),
    }),
    system: 'You are a meticulous cohort planner. Produce precise, machine-usable specifications without inventing identifiers.',
    prompt: promptSections.join('\n\n'),
  });

  const spec: CohortQuerySpec = {
    question: trimmedQuestion,
    tags: (object.tags ?? []) as CohortQueryTagFilter[],
    terms: object.terms as CohortQueryTerm[] | undefined,
    numericConditions: object.numericConditions as CohortNumericCondition[] | undefined,
    requiresCurrentEnrollment: object.requiresCurrentEnrollment,
    metric: object.metric as CohortMetricRequest | undefined,
    additionalNotes: object.additionalNotes,
  };

  return {
    ...spec,
    rationale: object.rationale ?? undefined,
  };
}

export function createCohortSpecTool() {
  return tool({
    description: 'Transforms counselor requests plus tag/term metadata into a structured cohort query specification.',
    inputSchema: z
      .object({
        question: z.string().min(1),
        conversationSummary: z.string().optional(),
        tagDescriptors: z.array(z.object({
          tagId: z.string().min(1),
          tagName: z.string().min(1),
          tagValues: z.array(z.string()).optional(),
          tagCategoryId: z.string().optional(),
          tagCategoryName: z.string().optional(),
        })).default([]),
        tagMetadata: z
          .record(
            z.object({
              tagId: z.string().min(1),
              tagName: z.string().min(1),
              isMultiValue: z.boolean(),
              usageCount: z.number(),
              studentCount: z.number(),
              lastSeen: z.string().nullable(),
              valueSample: z.array(z.string()),
              valueSampleTruncated: z.boolean(),
              canonicalValueCount: z.number(),
              observedValueCount: z.number(),
              categoryId: z.string().optional(),
              categoryName: z.string().optional(),
            })
          )
          .optional(),
        termOptions: z.array(termSchema).optional(),
      })
      .strip(),
    execute: (input): Promise<BuildCohortSpecResult> => buildCohortQuerySpec(input),
  });
}
