/**
 * Prefix Context Planner
 * Determines prerequisite context the assistant should gather before drafting SQL or running workflows.
 */

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod/v3';
import { fetchTermsForDate } from '@/libs/termsService';
import type { StreamingWorkflowContext } from './common';
import type { ToolContext } from '../tools/types';
import { buildTagAnalysis, summarizeTagAnalysis } from './tagAnalysis';

const AI_MODEL_PREFIX_PLANNER =
  process.env.AI_MODEL_PREFIX_PLANNER || process.env.AI_MODEL_DEFAULT || 'gpt-4o';

const prefixAnalysisSchema = z.object({
  attributes: z
    .array(
      z.object({
        attribute: z.enum(['term_sensitive_data', 'requires_tag_metadata']),
        value: z.boolean(),
        confidence: z.number().min(0).max(1),
        reasoning: z.string(),
      }),
    )
    .default([]),
});

type PrefixAnalysisSchema = z.infer<typeof prefixAnalysisSchema>;

export type PrefixAnalysisResult = PrefixAnalysisSchema;

export interface PrefixContextPlanningParams {
  latestUserMessage?: string;
  conversationSummary?: string;
  toolContext: ToolContext;
  analysis?: PrefixAnalysisResult | null;
}

export interface PrefixContextResult {
  contexts: StreamingWorkflowContext[];
  streamingInstructions: string[];
  planGuidance: string[];
  assumptions: string[];
  preferredToolNames: string[];
  metadata: Record<string, unknown>;
}

interface PrefixContextContribution {
  contexts?: StreamingWorkflowContext[];
  streamingInstructions?: string[];
  planGuidance?: string[];
  assumptions?: string[];
  preferredToolNames?: string[];
  metadata?: Record<string, unknown>;
}

type ContributionBuilder = (
  params: PrefixContextPlanningParams,
) => Promise<PrefixContextContribution | null>;

const contributionBuilders: ContributionBuilder[] = [buildTermContribution, buildTagContribution];

export async function buildPrefixContext(
  params: PrefixContextPlanningParams,
): Promise<PrefixContextResult> {
  const analysis = await analyzePrefixNeeds({
    latestUserMessage: params.latestUserMessage,
    conversationSummary: params.conversationSummary,
  });

  const aggregate: PrefixContextContribution = {
    contexts: [],
    streamingInstructions: [],
    planGuidance: [],
    assumptions: [],
    preferredToolNames: [],
    metadata: analysis ? { analysis } : {},
  };

  for (const builder of contributionBuilders) {
    try {
      const contribution = await builder({ ...params, analysis });
      if (!contribution) {
        continue;
      }

      if (contribution.contexts?.length) {
        aggregate.contexts?.push(...contribution.contexts);
      }
      if (contribution.streamingInstructions?.length) {
        aggregate.streamingInstructions?.push(...contribution.streamingInstructions);
      }
      if (contribution.planGuidance?.length) {
        aggregate.planGuidance?.push(...contribution.planGuidance);
      }
      if (contribution.assumptions?.length) {
        aggregate.assumptions?.push(...contribution.assumptions);
      }
      if (contribution.preferredToolNames?.length) {
        const existing = new Set(aggregate.preferredToolNames);
        for (const name of contribution.preferredToolNames) {
          if (!existing.has(name)) {
            aggregate.preferredToolNames?.push(name);
            existing.add(name);
          }
        }
      }
      if (contribution.metadata) {
        aggregate.metadata = { ...aggregate.metadata, ...contribution.metadata };
      }
    } catch (error) {
      console.warn('Prefix context builder failed', error);
    }
  }

  return {
    contexts: aggregate.contexts ?? [],
    streamingInstructions: aggregate.streamingInstructions ?? [],
    planGuidance: aggregate.planGuidance ?? [],
    assumptions: aggregate.assumptions ?? [],
    preferredToolNames: aggregate.preferredToolNames ?? [],
    metadata: aggregate.metadata ?? {},
  };
}

async function buildTermContribution(
  params: PrefixContextPlanningParams,
): Promise<PrefixContextContribution | null> {
  const { toolContext, analysis } = params;
  const termScore = analysis?.attributes.find(
    (entry: PrefixAnalysisResult['attributes'][number]) => entry.attribute === 'term_sensitive_data',
  );

  if (!termScore?.value) {
    return null;
  }

  const reasoningSnippet = termScore.reasoning;
  const selectedSchoolId = toolContext.selectedSchoolId;

  if (!selectedSchoolId) {
    return {
      streamingInstructions: [
        'The user request appears to depend on term-specific data, but no school is currently selected. Ask the user to select a school before drafting SQL.',
      ],
      planGuidance: [
        'Term-dependent request detected, but selectedSchoolId is unavailable. Plan should gather school context before querying terms.',
      ],
      assumptions: ['Await school selection before resolving term context.'],
      preferredToolNames: [],
      metadata: {
        termContext: { status: 'missing_school' },
        termAnalysis: termScore,
      },
    };
  }

  try {
    const result = await fetchTermsForDate({ schoolId: selectedSchoolId });
    const { matchingTerms } = result;

    if (!matchingTerms.length) {
      const guidanceLines = [
        'No academic term covers today’s date. Ask the user which term or date range they want before writing SQL.',
        reasoningSnippet ? `Detection reasoning: ${reasoningSnippet}` : '',
      ].filter(Boolean);

      const guidance = guidanceLines.join('\n') || guidanceLines.join('');

      return {
        contexts: [
          {
            name: 'term_context',
            summary: 'No matching terms for the current date.',
            data: result,
          },
        ],
        streamingInstructions: guidance ? [guidance] : [],
        planGuidance: guidance ? [guidance] : [],
        assumptions: ['Term context undecided—clarify the timeframe with the user.'],
        preferredToolNames: ['get_academic_terms'],
        metadata: {
          termContext: { status: 'no_match', result },
          termAnalysis: termScore,
        },
      };
    }

    const termList = matchingTerms
      .map((term) => `${term.termId}${term.name ? ` (${term.name})` : ''}`)
      .join(', ');

    const instructionLines = [
      'Term-dependent request detected. Always use the provided term IDs when querying term-bound data.',
      `Term IDs covering ${result.date}: ${termList || 'None found'}.`,
      'Filter SQL by term_id IN the list above (or equivalent joins) instead of deriving date ranges manually.',
      'State that you assumed the current academic term(s) when explaining results, unless the user specifies a different timeframe.',
      reasoningSnippet ? `Detection reasoning: ${reasoningSnippet}` : '',
    ].filter(Boolean);

    const planLines = [
      'You already have the current academic term IDs. Incorporate them directly into the SQL filters.',
      `Term IDs: ${matchingTerms.map((term) => term.termId).join(', ')}.`,
      'Do not reinvent logic to determine the current term—reuse these IDs.',
      reasoningSnippet ? `Detection reasoning: ${reasoningSnippet}` : '',
    ].filter(Boolean);

    const instruction = instructionLines.join('\n');
    const planGuidance = planLines.join('\n');

    return {
      contexts: [
        {
          name: 'term_context',
          summary: `Current academic term(s) for ${result.date}`,
          data: result,
        },
      ],
      streamingInstructions: instruction ? [instruction] : [],
      planGuidance: planGuidance ? [planGuidance] : [],
      assumptions: [
        'Assume the user’s request targets the current academic term(s) identified in the term_context data.',
      ],
      preferredToolNames: ['get_academic_terms', 'get_current_date'],
      metadata: {
        termContext: { status: 'resolved', result },
        termAnalysis: termScore,
      },
    };
  } catch (error) {
    console.warn('Failed to prefetch academic terms', error);
    const fallbackLines = [
      'Attempt to call get_academic_terms to resolve the applicable term IDs before drafting SQL. Do not guess term ranges.',
      reasoningSnippet ? `Detection reasoning: ${reasoningSnippet}` : '',
    ].filter(Boolean);

    const fallback = fallbackLines.join('\n');

    return {
      streamingInstructions: fallback ? [fallback] : [],
      planGuidance: fallback ? [fallback] : [],
      assumptions: ['Term context unresolved; ensure term IDs are retrieved via get_academic_terms.'],
      preferredToolNames: ['get_academic_terms'],
      metadata: {
        termContext: {
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        },
        termAnalysis: termScore,
      },
    };
  }
}

async function buildTagContribution(
  params: PrefixContextPlanningParams,
): Promise<PrefixContextContribution | null> {
  const { analysis, latestUserMessage, conversationSummary, toolContext } = params;
  if (!latestUserMessage?.trim()) {
    return null;
  }

  const tagSignal = analysis?.attributes.find(
    (entry: PrefixAnalysisResult['attributes'][number]) => entry.attribute === 'requires_tag_metadata',
  );

  const shouldRunTagAnalysis = tagSignal?.value || !analysis;

  if (!shouldRunTagAnalysis) {
    return null;
  }

  try {
    const tagAnalysis = await buildTagAnalysis({
      latestUserMessage,
      conversationSummary,
      selectedSchoolId: toolContext.selectedSchoolId,
      userId: toolContext.userId,
    });

    if (!tagAnalysis) {
      return {
        streamingInstructions: [
          'Tag metadata may be required, but no tag guidance is available. Ask clarifying questions or inspect tags before drafting SQL.',
        ],
        assumptions: ['Qualitative tag context unresolved; confirm relevant tags with the user.'],
        preferredToolNames: ['list_tags', 'list_tag_values'],
        metadata: {
          tagAnalysis: null,
          tagAnalysisReasoning:
            tagSignal?.reasoning ?? 'Prefix analysis unavailable; tag workflow executed by default.',
          tagAnalysisConfidence: tagSignal?.confidence ?? 0,
        },
      };
    }

    if (!tagAnalysis.requiresTags || tagAnalysis.tags.length === 0) {
      return {
        streamingInstructions: [
          'Tag analysis did not identify specific tags to filter on. Proceed without tag filters unless the user clarifies otherwise.',
        ],
        metadata: {
          tagAnalysis,
          tagAnalysisReasoning:
            tagSignal?.reasoning ?? 'Prefix analysis unavailable; tag workflow executed by default.',
          tagAnalysisConfidence: tagSignal?.confidence ?? 0,
        },
      };
    }

    const tagSummary = summarizeTagAnalysis(tagAnalysis);

    const contexts: StreamingWorkflowContext[] = [
      {
        name: 'tag_analysis',
        summary: tagSummary,
        data: {
          requiresTags: tagAnalysis.requiresTags,
          reasoning: tagAnalysis.reasoning,
          tags: tagAnalysis.tags,
          followUpQuestions: tagAnalysis.followUpQuestions,
        },
      },
    ];

    const tagInstructionLines = tagAnalysis.tags.map((tag) => {
      const core = `${tag.tagName} (tag_id ${tag.tagId})`;
      if (!tag.requiresValue) {
        return `${core} → filter by stg.tag_id only`;
      }

      if (tag.values.length > 0) {
        const values = tag.values.slice(0, 15).join(', ');
        return `${core} → include stg.value IN (${values})`;
      }

      return `${core} → call list_tag_values to retrieve specific values before filtering`;
    });

    const streamingInstruction = [
      'Tag guidance: consult the tag_analysis context for tag_ids, reasoning, and recommended values. Do not guess tag names.',
      tagAnalysis.tags.some((tag) => tag.requiresValue && tag.values.length === 0)
        ? 'Call list_tag_values for any tag that requires values but does not already provide them.'
        : 'Use the provided values directly; only call list_tag_values if you need additional values beyond those supplied.',
      'When writing SQL, join student_tags (alias stg) on student_id and filter using stg.tag_id. Apply stg.value filters when values are supplied.',
      'Never constrain SQL by tag category or name unless the user says to; rely solely on tag_id (and stg.value where applicable).',
      tagInstructionLines.length ? `Relevant tag actions:
- ${tagInstructionLines.join('\n- ')}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const planGuidance = [
      'Review the tag_analysis context before drafting SQL to ensure qualitative filters are accurate.',
      `Tag analysis summary:
${tagSummary}`,
      'Do not introduce tag category filters; select rows by tag_id only (and stg.value if provided).',
      tagAnalysis.tags.some((tag) => tag.requiresValue && tag.values.length === 0)
        ? 'Some tags require values but none have been retrieved yet—plan to call list_tag_values before executing SQL.'
        : '',
    ].filter(Boolean);

    const assumptions: string[] = [];
    if (tagAnalysis.followUpQuestions.length > 0) {
      assumptions.push('Clarify outstanding tag-related follow-up questions before executing SQL.');
    }

    return {
      contexts,
      streamingInstructions: streamingInstruction ? [streamingInstruction] : [],
      planGuidance,
      assumptions,
      preferredToolNames: ['list_tags', 'list_tag_values'],
      metadata: {
        tagAnalysis,
        tagAnalysisReasoning:
          tagSignal?.reasoning ?? 'Prefix analysis unavailable; tag workflow executed by default.',
        tagAnalysisConfidence: tagSignal?.confidence ?? 0,
      },
    };
  } catch (error) {
    console.warn('Failed to build tag contribution', error);
    return {
      streamingInstructions: [
        'Tag metadata may be required, but tag analysis failed. Gather the necessary tag details manually before drafting SQL.',
      ],
      assumptions: ['Qualitative tag requirements unresolved; confirm relevant tags with the user.'],
      preferredToolNames: ['list_tags', 'list_tag_values'],
      metadata: {
        tagAnalysisError: error instanceof Error ? error.message : String(error),
        tagAnalysisReasoning:
          tagSignal?.reasoning ?? 'Prefix analysis unavailable; tag workflow executed by default.',
        tagAnalysisConfidence: tagSignal?.confidence ?? 0,
      },
    };
  }
}

async function analyzePrefixNeeds(params: {
  latestUserMessage?: string;
  conversationSummary?: string;
}): Promise<PrefixAnalysisResult | null> {
  const { latestUserMessage, conversationSummary } = params;
  const message = latestUserMessage?.trim();

  if (!message) {
    return null;
  }

  const promptSections = [
    'Evaluate whether the most recent user request requires fetching supporting data before drafting SQL queries.',
    'Return boolean assessments for each attribute. Treat the attribute as true only if the user clearly implies the data depends on it.',
    'Attribute definitions:',
    '- term_sensitive_data: The request concerns grades, courses, attendance, or other metrics that vary by academic term. Flag true when the query must target specific term IDs (typically the current term) before executing.',
    '- requires_tag_metadata: The request requires qualitative or behavioral tag information (tag IDs, values, or reasoning). Flag true only when tag filters are needed to satisfy the request, not merely mentioned in passing.',
    `Latest user message:
${message}`,
    conversationSummary
      ? `Recent conversation summary:
${conversationSummary}`
      : '',
    'Provide reasoning for each attribute and set confidence between 0 and 1.',
  ]
    .filter(Boolean)
    .join('\n\n');

  try {
    const { object } = await generateObject({
      model: openai(AI_MODEL_PREFIX_PLANNER),
      schema: prefixAnalysisSchema,
      system:
        'You classify school counseling data requests. Respond with structured JSON only. Use boolean judgements for each attribute and explain your reasoning briefly.',
      prompt: promptSections,
    });

    return object;
  } catch (error) {
    console.warn('Prefix context analysis failed', error);
    return null;
  }
}
