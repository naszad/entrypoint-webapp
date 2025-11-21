import { tool } from 'ai';
import { z } from 'zod';
import type { TagDescriptor, TagInsightsPayload, TagInsightsMetadata } from '../types/cohort';
import type { ToolContext } from './types';
import { fetchSchoolTagCatalog, type SchoolTagCatalogResult } from './tagCatalog';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MAX_CATALOG_WINDOW = 200;
const SEARCH_EXPANSION_FACTOR = 3;
const MS_PER_DAY = 86_400_000;

interface TagInsightsInput {
  search?: string;
  limit?: number;
  focus?: string;
}

export function createTagInsightsTool(context: ToolContext) {
  return tool({
    description:
      'Returns ranked qualitative tag descriptors (tag_id, tag_name, tag_values) and usage metadata for the selected school.',
    inputSchema: z
      .object({
        search: z
          .string()
          .trim()
          .min(1)
          .max(120)
          .optional()
          .describe('Optional search phrase to focus on specific tags or value samples (case-insensitive).'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(MAX_LIMIT)
          .optional()
          .describe('Maximum number of tag descriptors to return. Defaults to 50, capped at 100.'),
        focus: z
          .string()
          .trim()
          .max(200)
          .optional()
          .describe('Optional hint describing the qualitative theme the user mentioned.'),
      })
      .default({}),
    execute: async ({ search, limit }: TagInsightsInput = {}): Promise<TagInsightsPayload> => {
      const selectedSchoolId = context.selectedSchoolId;

      if (!selectedSchoolId) {
        return {
          tags: [],
          metadata: {},
          error: 'A school must be selected before requesting tag insights.',
        };
      }

      const clampedLimit = Math.max(1, Math.min(limit ?? DEFAULT_LIMIT, MAX_LIMIT));
      const normalizedSearch = search?.trim().toLowerCase() ?? '';
      const searchTokens = normalizedSearch ? normalizedSearch.split(/\s+/).filter(Boolean) : [];

      try {
        const fetchWindow = normalizedSearch
          ? Math.min(MAX_CATALOG_WINDOW, Math.max(clampedLimit * SEARCH_EXPANSION_FACTOR, clampedLimit))
          : clampedLimit;

        const { descriptors, metadataByTagId }: SchoolTagCatalogResult = await fetchSchoolTagCatalog({
          supabase: context.supabase,
          selectedSchoolId,
          limit: fetchWindow,
          includeValues: true,
          customerId: context.selectedCustomerId,
        });

        if (descriptors.length === 0) {
          return {
            tags: [],
            metadata: {},
            message: 'No qualitative tags were found for the selected school.',
          };
        }

        const rankedDescriptors = rankDescriptors({ descriptors, metadataByTagId, normalizedSearch, searchTokens });
        const limitedDescriptors = rankedDescriptors.slice(0, clampedLimit);

        if (limitedDescriptors.length === 0) {
          return {
            tags: [],
            metadata: {},
            message: 'No tags matched the provided search phrase.',
          };
        }

        const metadataEntries = limitedDescriptors
          .map((descriptor) => {
            const meta = metadataByTagId[descriptor.tagId];
            if (!meta) {
              return null;
            }
            return [descriptor.tagId, meta] as const;
          })
          .filter((entry): entry is readonly [string, TagInsightsMetadata] => Boolean(entry));

        const metadata = Object.fromEntries(metadataEntries) as Record<string, TagInsightsMetadata>;
        const descriptorsWithMetadata = limitedDescriptors.filter((descriptor) => metadata[descriptor.tagId]);

        if (!descriptorsWithMetadata.length) {
          return {
            tags: [],
            metadata: {},
            message: 'Tag metadata is currently unavailable; please try again later.',
          };
        }

        const summary = buildSummary({ descriptors: descriptorsWithMetadata, metadata, normalizedSearch, originalSearch: search });

        return {
          tags: descriptorsWithMetadata,
          metadata,
          summary,
        };
      } catch (error) {
        console.error('Failed to build tag insights payload', { error, selectedSchoolId });
        return {
          tags: [],
          metadata: {},
          error: 'Unable to retrieve tag insights at this time. Please try again later.',
        };
      }
    },
  });
}

interface RankDescriptorsArgs {
  descriptors: TagDescriptor[];
  metadataByTagId: Record<string, TagInsightsMetadata>;
  normalizedSearch: string;
  searchTokens: string[];
}

function rankDescriptors({ descriptors, metadataByTagId, normalizedSearch, searchTokens }: RankDescriptorsArgs): TagDescriptor[] {
  if (!normalizedSearch) {
    return descriptors;
  }

  const now = Date.now();

  return descriptors
    .map((descriptor) => {
      const metadata = metadataByTagId[descriptor.tagId];
      const score = computeSearchScore({ descriptor, metadata, normalizedSearch, searchTokens, now });
      return { descriptor, metadata, score };
    })
    .filter((entry) => entry.score > 0 && entry.metadata)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return compareByUsageAndRecency(a.metadata!, b.metadata!);
    })
    .map((entry) => entry.descriptor);
}

interface ComputeSearchScoreArgs {
  descriptor: TagDescriptor;
  metadata?: TagInsightsMetadata;
  normalizedSearch: string;
  searchTokens: string[];
  now: number;
}

function computeSearchScore({ descriptor, metadata, normalizedSearch, searchTokens, now }: ComputeSearchScoreArgs): number {
  if (!metadata) {
    return 0;
  }

  let score = 0;
  const lowerName = descriptor.tagName.toLowerCase();

  if (normalizedSearch && lowerName.includes(normalizedSearch)) {
    score += 12;
  }

  for (const token of searchTokens) {
    if (lowerName.includes(token)) {
      score += 6;
    }

    if (descriptor.tagValues?.some((value) => value.toLowerCase().includes(token))) {
      score += 4;
    }
  }

  const usageBoost = Math.log10(metadata.usageCount + 1) * 3;
  score += usageBoost;

  if (metadata.lastSeen) {
    const ageMs = Math.max(0, now - Date.parse(metadata.lastSeen));
    const ageDays = ageMs / MS_PER_DAY;
    const recencyBoost = Math.max(0, 3 - ageDays / 30);
    score += recencyBoost;
  }

  return score;
}

function compareByUsageAndRecency(a: TagInsightsMetadata, b: TagInsightsMetadata): number {
  if (b.usageCount !== a.usageCount) {
    return b.usageCount - a.usageCount;
  }

  const timeA = a.lastSeen ? Date.parse(a.lastSeen) : 0;
  const timeB = b.lastSeen ? Date.parse(b.lastSeen) : 0;
  if (timeB !== timeA) {
    return timeB - timeA;
  }

  return a.tagName.localeCompare(b.tagName);
}

interface BuildSummaryArgs {
  descriptors: TagDescriptor[];
  metadata: Record<string, TagInsightsMetadata>;
  normalizedSearch: string;
  originalSearch?: string;
}

function buildSummary({ descriptors, metadata, normalizedSearch, originalSearch }: BuildSummaryArgs): string {
  const summaryParts = [`Returned ${descriptors.length} tag descriptor${descriptors.length === 1 ? '' : 's'}`];

  if (normalizedSearch) {
    summaryParts.push(`filtered by search term "${originalSearch?.trim() ?? normalizedSearch}"`);
  }

  const topUsage = descriptors.reduce((max, descriptor) => {
    const usage = metadata[descriptor.tagId]?.usageCount ?? 0;
    return usage > max ? usage : max;
  }, 0);

  if (topUsage > 0) {
    summaryParts.push('ordered by usage count and recency');
  }

  const truncatedValues = descriptors.some((descriptor) => metadata[descriptor.tagId]?.valueSampleTruncated);
  if (truncatedValues) {
    summaryParts.push('one or more value lists truncated to 25 entries');
  }

  return summaryParts.join('; ');
}
