import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod/v3';
import type { TagMetadata, TagValueMapEntry } from '../utils/tagMetadata';
import { fetchTagMetadata, resolveCustomerId, fetchTagValues, fetchTagValueMap } from '../utils/tagMetadata';

const TAG_ANALYSIS_MODEL = process.env.AI_MODEL_TAG_ANALYSIS || process.env.AI_MODEL_DEFAULT || 'gpt-4o';

interface BuildTagAnalysisParams {
  latestUserMessage?: string;
  conversationSummary?: string;
  selectedSchoolId?: string;
  userId?: string;
}

interface CandidateTag {
  tagId: string;
  name: string;
  categoryName: string;
  isMultiValue: boolean;
  sampleValues: string[];
  score: number;
}

const tagSelectionSchema = z.object({
  requiresTags: z.boolean(),
  reasoning: z.string(),
  relevantTags: z
    .array(
      z.object({
        tagId: z.string(),
        matchReason: z.string(),
        requiresValueDiscovery: z.boolean().default(false),
        selectedValues: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  followUpQuestions: z.array(z.string()).default([]),
});

export interface TagSelection {
  metadata: TagMetadata;
  matchReason: string;
  requiresValueDiscovery: boolean;
  selectedValues: string[];
  candidateValues: string[];
}

export interface TagAnalysisResult {
  requiresTags: boolean;
  reasoning: string;
  selections: TagSelection[];
  followUpQuestions: string[];
  valueMap: TagValueMapEntry[];
}

// Normalizes free-form text so downstream comparisons treat case and whitespace consistently.
// Used by scoring helpers before calling the tag-selection model.
function normalize(text: string): string {
  return text.toLowerCase().trim();
}

// Tokenizes text into stemmed identifiers the heuristic scoring can compare against the user request.
// Feeds computeTagScore so only promising tags are shown to the model.
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => (token.endsWith('s') ? token.slice(0, -1) : token));
}

// Gives each tag a relevance score based on overlap with the user prompt before we invoke the LLM.
// Higher scores surface first when drafting the candidate list for the model.
function computeTagScore(tag: TagMetadata, messageTokens: Set<string>): number {
  const nameTokens = tokenize(tag.name);
  let score = 0;

  for (const token of nameTokens) {
    if (messageTokens.has(token)) {
      score += 2;
    }
  }

  for (const value of tag.values.slice(0, 30)) {
    const valueTokens = tokenize(value);
    for (const token of valueTokens) {
      if (messageTokens.has(token)) {
        score += 1;
      }
    }
  }

  const strippedName = normalize(tag.name);
  for (const token of messageTokens) {
    if (token.length > 3 && strippedName.includes(token)) {
      score += 1;
    }
  }

  return score;
}

// Builds enriched tag descriptors (with heuristic scores) that seed the model prompt.
// Called by buildTagAnalysis to reduce model token usage while keeping likely matches early.
function buildCandidateTags(tags: TagMetadata[], latestUserMessage: string): CandidateTag[] {
  const messageTokens = new Set(tokenize(latestUserMessage));

  return tags
    .map((tag) => ({
      tagId: tag.tagId,
      name: tag.name,
      categoryName: tag.categoryName,
      isMultiValue: tag.isMultiValue,
      sampleValues: tag.values.slice(0, 10),
      score: computeTagScore(tag, messageTokens),
    }))
    .sort((a, b) => b.score - a.score);
}

// Trims the candidate set to the size we want to show the model, favoring high-confidence matches.
// Helps buildTagAnalysis keep prompts compact without losing relevant tags.
function preparePromptTagList(candidates: CandidateTag[], limit: number): CandidateTag[] {
  if (candidates.length <= limit) {
    return candidates;
  }

  const withScore = candidates.filter((candidate) => candidate.score > 0).slice(0, limit);
  if (withScore.length >= Math.ceil(limit * 0.6)) {
    return withScore;
  }

  const remainingSlots = limit - withScore.length;
  const filler = candidates
    .filter((candidate) => candidate.score === 0)
    .slice(0, remainingSlots);

  return [...withScore, ...filler];
}

// Invokes LLM to decide which tag_ids and values matter for this request.
// The result drives downstream SQL planning in the data query workflow.
async function callTagSelectionModel(params: {
  latestUserMessage: string;
  conversationSummary?: string;
  candidateTags: CandidateTag[];
}) {
  const { latestUserMessage, conversationSummary, candidateTags } = params;

  const tagCatalog = candidateTags.map((candidate) => ({
    tagId: candidate.tagId,
    name: candidate.name,
    categoryName: candidate.categoryName,
    isMultiValue: candidate.isMultiValue,
    sampleValues: candidate.sampleValues,
  }));

  const promptSegments = [
    'Determine whether the user request depends on qualitative student tags.',
    'Select relevant tag_ids from the provided list and decide if specific values need to be considered.',
    'Only return tag_ids that exist in the list. If none apply, set requiresTags to false.',
    `User message: ${latestUserMessage}`,
    conversationSummary ? `Recent conversation: ${conversationSummary}` : '',
    `Available tags (${tagCatalog.length}): ${JSON.stringify(tagCatalog)}`,
  ].filter(Boolean);

  const { object: selection } = await generateObject({
    model: openai(TAG_ANALYSIS_MODEL),
    schema: tagSelectionSchema,
    system:
      'You evaluate which student tags are relevant to the request. Prefer precise matches. Only select tag_ids that you are confident apply.',
    prompt: promptSegments.join('\n\n'),
  });

  return selection;
}

// Main entry invoked by dataQueryWorkflow: resolves tenant context, gathers metadata, runs the model,
// and returns structured guidance about which tags/values the SQL plan should consider.
export async function buildTagAnalysis(params: BuildTagAnalysisParams): Promise<TagAnalysisResult | null> {
  const { latestUserMessage } = params;

  if (!latestUserMessage?.trim()) {
    return null;
  }

  const customerId = await resolveCustomerId({
    selectedSchoolId: params.selectedSchoolId,
    userId: params.userId,
  });

  if (!customerId) {
    return null;
  }

  const tags = await fetchTagMetadata(customerId);
  if (!tags.length) {
    return null;
  }

  const candidateTags = buildCandidateTags(tags, latestUserMessage);
  const promptTags = preparePromptTagList(candidateTags, 40);

  if (promptTags.length === 0) {
    return {
      requiresTags: false,
      reasoning: 'No relevant tags identified for this request.',
      selections: [],
      followUpQuestions: [],
      valueMap: [],
    };
  }

  const selection = await callTagSelectionModel({
    latestUserMessage,
    conversationSummary: params.conversationSummary,
    candidateTags: promptTags,
  });

  if (!selection.requiresTags || selection.relevantTags.length === 0) {
    return {
      requiresTags: false,
      reasoning: selection.reasoning,
      selections: [],
      followUpQuestions: selection.followUpQuestions,
      valueMap: [],
    };
  }

  const selectionMap = new Map(tags.map((tag) => [tag.tagId, tag] as const));
  const relevantTagIds = selection.relevantTags.map((tag) => tag.tagId);
  const valueMap = await fetchTagValueMap(relevantTagIds);
  const valueLookup = new Map(valueMap.map((entry) => [entry.tagId, entry.values] as const));

  const resolvedSelections: TagSelection[] = [];

  for (const relevant of selection.relevantTags) {
    const metadata = selectionMap.get(relevant.tagId);
    if (!metadata) {
      continue;
    }

    const normalizedValues = metadata.values.map((value) => normalize(value));
    const matchedValues = relevant.selectedValues.filter((value) => {
      const normalized = normalize(value);
      return normalizedValues.includes(normalized);
    });

    let candidateValues: string[] = (valueLookup.get(metadata.tagId) ?? metadata.values).slice(0, 200);

    if (relevant.requiresValueDiscovery && candidateValues.length === 0) {
      const enrichedValues = await fetchTagValues(metadata.tagId);
      if (enrichedValues.length) {
        candidateValues = enrichedValues.slice(0, 200);
      }
    }

    resolvedSelections.push({
      metadata,
      matchReason: relevant.matchReason,
      requiresValueDiscovery: relevant.requiresValueDiscovery,
      selectedValues: matchedValues.length ? matchedValues : relevant.selectedValues,
      candidateValues,
    });
  }

  if (!resolvedSelections.length) {
    return {
      requiresTags: false,
      reasoning: selection.reasoning,
      selections: [],
      followUpQuestions: selection.followUpQuestions,
      valueMap: [],
    };
  }

  return {
    requiresTags: true,
    reasoning: selection.reasoning,
    selections: resolvedSelections,
    followUpQuestions: selection.followUpQuestions,
    valueMap,
  };
}

// Creates a concise, human-readable summary of tag guidance for logging and AI context blocks.
// Used when injecting tag analysis into the streaming workflow.
export function summarizeTagAnalysis(result: TagAnalysisResult): string {
  if (!result.requiresTags || result.selections.length === 0) {
    return result.reasoning;
  }

  const lines = result.selections.map((selection) => {
    const valuesSummary = selection.selectedValues.length
      ? `Matched values: ${selection.selectedValues.join(', ')}`
      : selection.requiresValueDiscovery
        ? `Candidate values (sample): ${selection.candidateValues.slice(0, 10).join(', ')}`
        : 'No specific values identified.';

    return `- ${selection.metadata.name} (Tag ID: ${selection.metadata.tagId}, Category: ${selection.metadata.categoryName}) → ${selection.matchReason}. ${valuesSummary}`;
  });

  return [result.reasoning, ...lines].join('\n');
}
