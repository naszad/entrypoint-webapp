import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod/v3';
import type { TagMetadata } from '../utils/tagMetadata';
import { fetchTagMetadata, fetchTagValueMap, resolveCustomerId } from '../utils/tagMetadata';

const TAG_ANALYSIS_MODEL = process.env.AI_MODEL_TAG_ANALYSIS || process.env.AI_MODEL_DEFAULT || 'gpt-4o';
const TAG_VALUE_LIMIT = 50;
const DEBUG_TAG_ANALYSIS = process.env.DEBUG === 'true';
const MAX_TAG_CANDIDATES = 60;

function logDebug(...args: unknown[]) {
  if (!DEBUG_TAG_ANALYSIS) {
    return;
  }

  console.debug('[TagAnalysis]', ...args);
}

interface BuildTagAnalysisParams {
  latestUserMessage?: string;
  conversationSummary?: string;
  selectedSchoolId?: string;
  userId?: string;
}

interface TagFilter {
  tagId: string;
  tagName: string;
  requiresValue: boolean;
  values: string[];
  explanation: string;
  valueHints: string[];
}

export interface TagAnalysisResult {
  requiresTags: boolean;
  reasoning: string;
  tags: TagFilter[];
  followUpQuestions: string[];
}

const tagRelevanceSchema = z.object({
  requiresTags: z.boolean(),
  reasoning: z.string(),
  tags: z
    .array(
      z.object({
        tagId: z.string(),
        explanation: z.string(),
        needsValues: z.boolean().default(false),
        valueHints: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  followUpQuestions: z.array(z.string()).default([]),
});

type TagRelevance = z.infer<typeof tagRelevanceSchema>;
type RelevantTag = TagRelevance['tags'][number];

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function normalizeForSearch(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenize(text: string): string[] {
  return normalizeForSearch(text)
    .split(' ')
    .filter(Boolean)
    .map((token) => (token.length > 3 && token.endsWith('s') ? token.slice(0, -1) : token));
}

function computeTagScore(tag: TagMetadata, params: { messageTokens: Set<string>; normalizedMessage: string }): number {
  const { messageTokens, normalizedMessage } = params;
  const nameTokens = tokenize(tag.name);
  let score = 0;

  const normalizedName = normalizeForSearch(tag.name);
  if (normalizedName && normalizedMessage.includes(normalizedName)) {
    score += 5;
  }

  for (const token of nameTokens) {
    if (messageTokens.has(token)) {
      score += 2;
    }
  }

  for (const value of tag.values.slice(0, 20)) {
    const valueTokens = tokenize(value);
    for (const token of valueTokens) {
      if (messageTokens.has(token)) {
        score += 1;
      }
    }
  }

  for (const token of messageTokens) {
    if (token.length > 3 && normalizedName.includes(token)) {
      score += 1;
    }
  }

  if (tag.categoryName) {
    const categoryTokens = tokenize(tag.categoryName);
    for (const token of categoryTokens) {
      if (messageTokens.has(token)) {
        score += 1;
      }
    }
  }

  return score;
}

function buildCandidateTags(tags: TagMetadata[], latestUserMessage: string): TagMetadata[] {
  if (!latestUserMessage.trim()) {
    return [];
  }

  const normalizedMessage = normalizeForSearch(latestUserMessage);
  const messageTokens = new Set(tokenize(latestUserMessage));
  logDebug('Message tokens for scoring:', Array.from(messageTokens));

  const scored = [...tags].map((tag) => ({
    tag,
    score: computeTagScore(tag, { messageTokens, normalizedMessage }),
  }));
  scored.sort((a, b) => b.score - a.score);

  logDebug(
    'Top tag candidates by score:',
    scored.slice(0, 20).map((entry) => ({ tagId: entry.tag.tagId, name: entry.tag.name, score: entry.score })),
  );

  const positive = scored.filter((entry) => entry.score > 0);
  const nonPositive = scored.filter((entry) => entry.score <= 0);

  if (!positive.length) {
    logDebug('No positively scored tags; falling back to top candidates by heuristic order.');
    return scored.slice(0, MAX_TAG_CANDIDATES).map((entry) => entry.tag);
  }

  logDebug(
    'Positively scored tag candidates:',
    positive.slice(0, 20).map((entry) => ({ tagId: entry.tag.tagId, name: entry.tag.name, score: entry.score })),
  );

  const combined = [...positive, ...nonPositive].slice(0, MAX_TAG_CANDIDATES);

  logDebug(
    'Final candidate list for LLM relevance check:',
    combined.slice(0, 20).map((entry) => ({ tagId: entry.tag.tagId, name: entry.tag.name, score: entry.score })),
  );

  return combined.map((entry) => entry.tag);
}

async function analyzeTagRelevance(params: {
  latestUserMessage: string;
  conversationSummary?: string;
  candidateTags: TagMetadata[];
}): Promise<TagRelevance> {
  const { latestUserMessage, conversationSummary, candidateTags } = params;

  const tagCatalog = candidateTags.map((tag) => ({
    tagId: tag.tagId,
    name: tag.name,
    categoryName: tag.categoryName,
    isMultiValue: tag.isMultiValue,
    valuesSample: tag.values.slice(0, 10),
  }));

  logDebug('Calling tag relevance model with catalog size:', tagCatalog.length);
  logDebug(
    'Sample tag catalog entries:',
    tagCatalog.slice(0, 20).map((entry) => ({ tagId: entry.tagId, name: entry.name, categoryName: entry.categoryName })),
  );

  const promptSections = [
    'You are assisting a school counseling analytics system. Identify which student tags are relevant to the user request.',
    'For each relevant tag, explain why it matters. Set needsValues to true only when the tag\'s value should constrain the SQL (e.g., the question asks for specific colleges).',
    'You may see similar tags; include all possibly relevant tags even if they named similarly.',
    'If the user names potential values, include them in valueHints. Otherwise, leave valueHints empty.',
    'Return only tag_ids that appear in the provided tag catalog. If no tags are relevant, set requiresTags to false.',
    `User message: ${latestUserMessage}`,
    conversationSummary ? `Recent conversation summary: ${conversationSummary}` : '',
    `Tag catalog (${tagCatalog.length} entries): ${JSON.stringify(tagCatalog)}`,
  ].filter(Boolean);

  const { object } = await generateObject({
    model: openai(TAG_ANALYSIS_MODEL),
    schema: tagRelevanceSchema,
    system:
      'You evaluate tag names for relevance. Be precise and avoid inventing tags that are not listed.',
    prompt: promptSections.join('\n\n'),
  });

  logDebug('Tag relevance result:', object);

  return object;
}

function selectTagValues(tag: RelevantTag, availableValues: string[]): string[] {
  if (!tag.needsValues) {
    return [];
  }

  if (!availableValues.length) {
    return [];
  }

  const sortedValues = [...availableValues].sort((a, b) => a.localeCompare(b));

  if (tag.valueHints.length === 0) {
    return sortedValues.slice(0, TAG_VALUE_LIMIT);
  }

  const catalog = sortedValues.map((value) => ({
    value,
    normalized: normalize(value),
  }));

  const matches = new Set<string>();
  for (const hint of tag.valueHints) {
    const normalizedHint = normalize(hint);
    if (!normalizedHint) {
      continue;
    }
    for (const entry of catalog) {
      if (entry.normalized.includes(normalizedHint) || normalizedHint.includes(entry.normalized)) {
        matches.add(entry.value);
      }
    }
  }

  if (matches.size === 0) {
    return sortedValues.slice(0, TAG_VALUE_LIMIT);
  }

  return Array.from(matches)
    .sort((a, b) => a.localeCompare(b))
    .slice(0, TAG_VALUE_LIMIT);
}

export async function buildTagAnalysis(params: BuildTagAnalysisParams): Promise<TagAnalysisResult | null> {
  const { latestUserMessage } = params;

  if (!latestUserMessage?.trim()) {
    return null;
  }

  logDebug('Starting tag analysis for message:', latestUserMessage);

  if (params.conversationSummary) {
    logDebug('Conversation summary:', params.conversationSummary);
  }

  const customerId = await resolveCustomerId({
    selectedSchoolId: params.selectedSchoolId,
    userId: params.userId,
  });

  if (!customerId) {
    logDebug('No customerId resolved; aborting tag analysis.');
    return null;
  }

  logDebug('Resolved customerId:', customerId);

  const tags = await fetchTagMetadata(customerId);
  if (!tags.length) {
    logDebug('No tag metadata available for customer.');
    return null;
  }

  logDebug('Fetched tag metadata count:', tags.length);

  const tagNamesSample = tags
    .slice(0, 20)
    .map((tag) => ({ tagId: tag.tagId, name: tag.name, category: tag.categoryName, isMultiValue: tag.isMultiValue }));
  logDebug('Sample of fetched tags:', tagNamesSample);

  const candidates = buildCandidateTags(tags, latestUserMessage);
  if (!candidates.length) {
    logDebug('No candidate tags after scoring.');
    return {
      requiresTags: false,
      reasoning: 'No relevant tags identified for this request.',
      tags: [],
      followUpQuestions: [],
    };
  }

  logDebug('Candidate tags considered for relevance:', candidates.length);

  const missingTargetCollege = !candidates.some((tag) => normalize(tag.name) === 'target college');
  if (missingTargetCollege) {
    logDebug('Warning: Target College tag not found in candidates.');
  }

  const relevance = await analyzeTagRelevance({
    latestUserMessage,
    conversationSummary: params.conversationSummary,
    candidateTags: candidates,
  });

  if (!relevance.requiresTags || relevance.tags.length === 0) {
    logDebug('Relevance model indicated no tags required.', relevance);
    return {
      requiresTags: false,
      reasoning: relevance.reasoning,
      tags: [],
      followUpQuestions: relevance.followUpQuestions,
    };
  }

  logDebug('Relevance model selected tags:', relevance.tags);

  const metadataLookup = new Map(tags.map((tag) => [tag.tagId, tag] as const));
  const needsValues = relevance.tags.filter((tag) => tag.needsValues);
  logDebug('Tags requiring values:', needsValues.map((tag) => tag.tagId));

  const valueMapEntries = needsValues.length
    ? await fetchTagValueMap(needsValues.map((tag) => tag.tagId))
    : [];
  logDebug('Value map entries fetched:', valueMapEntries);
  const valueMap = new Map(valueMapEntries.map((entry) => [entry.tagId, entry.values] as const));

  const analysisTags: TagFilter[] = [];

  for (const tag of relevance.tags) {
    const metadata = metadataLookup.get(tag.tagId);
    if (!metadata) {
      logDebug('Skipping tag with missing metadata:', tag.tagId);
      continue;
    }

    const availableValues = valueMap.get(tag.tagId) ?? [];
    const values = selectTagValues(tag, availableValues);

    logDebug('Resolved tag filter:', {
      tagId: metadata.tagId,
      name: metadata.name,
      requiresValue: tag.needsValues,
      availableValues: availableValues.length,
      selectedValues: values,
    });

    analysisTags.push({
      tagId: metadata.tagId,
      tagName: metadata.name,
      requiresValue: tag.needsValues,
      values,
      explanation: tag.explanation,
      valueHints: tag.valueHints,
    });
  }

  if (!analysisTags.length) {
    logDebug('No analysis tags constructed after processing relevance results.');
    return {
      requiresTags: false,
      reasoning: relevance.reasoning,
      tags: [],
      followUpQuestions: relevance.followUpQuestions,
    };
  }

  logDebug('Final tag analysis result:', {
    requiresTags: true,
    reasoning: relevance.reasoning,
    tags: analysisTags,
    followUpQuestions: relevance.followUpQuestions,
  });

  return {
    requiresTags: true,
    reasoning: relevance.reasoning,
    tags: analysisTags,
    followUpQuestions: relevance.followUpQuestions,
  };
}

export function summarizeTagAnalysis(result: TagAnalysisResult): string {
  if (!result.requiresTags || result.tags.length === 0) {
    return result.reasoning;
  }

  const lines = result.tags.map((tag) => {
    const valueNote = tag.requiresValue
      ? tag.values.length
        ? `Use values: ${tag.values.join(', ')}`
        : 'Values required but not yet available; call list_tag_values before filtering.'
      : 'Presence of this tag is sufficient.';
    return `- ${tag.tagName} (tag_id ${tag.tagId}) → ${tag.explanation}. ${valueNote}`;
  });

  return [result.reasoning, ...lines].join('\n');
}
