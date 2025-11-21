import type { SupabaseClient } from '@supabase/supabase-js';
import type { TagDescriptor, TagInsightsMetadata } from '../types/cohort';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;
const VALUE_SAMPLE_LIMIT = 25;

export interface FetchSchoolTagCatalogOptions {
  supabase: SupabaseClient;
  selectedSchoolId: string;
  limit?: number;
  includeValues?: boolean;
  customerId?: string | null;
}

export interface SchoolTagCatalogResult {
  descriptors: TagDescriptor[];
  metadataByTagId: Record<string, TagInsightsMetadata>;
}

type RawCatalogRow = {
  tag_id: string | null;
  tag_name: string | null;
  is_multi_value: boolean | null;
  tag_category_id: string | null;
  tag_category_name: string | null;
  usage_count: number | null;
  student_count: number | null;
  last_seen: string | null;
  observed_value_count: number | null;
  canonical_value_count: number | null;
  all_values: unknown;
};

export async function fetchSchoolTagCatalog({
  supabase,
  selectedSchoolId,
  limit = DEFAULT_LIMIT,
  includeValues = true,
}: FetchSchoolTagCatalogOptions): Promise<SchoolTagCatalogResult> {
  if (!selectedSchoolId) {
    throw new Error('selectedSchoolId is required to build the school tag catalog.');
  }

  const clampedLimit = Math.max(1, Math.min(limit, MAX_LIMIT));

  const { data, error: catalogError } = await supabase
    .schema('views')
    .from('school_tag_catalog')
    .select(
      [
        'tag_id',
        'tag_name',
        'is_multi_value',
        'tag_category_id',
        'tag_category_name',
        'usage_count',
        'student_count',
        'last_seen',
        'observed_value_count',
        'canonical_value_count',
        'all_values',
      ].join(', ')
    )
    .eq('school_id', selectedSchoolId)
    .order('usage_count', { ascending: false })
    .order('last_seen', { ascending: false, nullsFirst: false })
    .order('tag_name', { ascending: true })
    .limit(clampedLimit);

  if (catalogError) {
    console.error('Failed to fetch school tag catalog', { catalogError, selectedSchoolId });
    throw new Error(`Unable to load tag catalog for school ${selectedSchoolId}.`);
  }

  const rows: RawCatalogRow[] = Array.isArray(data) ? (data as unknown as RawCatalogRow[]) : [];

  if (!rows.length) {
    return { descriptors: [], metadataByTagId: {} };
  }

  const descriptors: TagDescriptor[] = [];
  const metadataByTagId: Record<string, TagInsightsMetadata> = {};

  for (const row of rows) {
    const tagId = row.tag_id ?? undefined;
    const tagName = row.tag_name ?? undefined;

    if (!tagId || !tagName) {
      continue;
    }

    const isMultiValue = Boolean(row.is_multi_value);
    const usageCount = Number(row.usage_count ?? 0);
    const studentCount = Number(row.student_count ?? 0);
    const lastSeen = row.last_seen;
    const observedValueCount = Number(row.observed_value_count ?? 0);
    const canonicalValueCount = Number(row.canonical_value_count ?? 0);
    const categoryId = row.tag_category_id ?? undefined;
    const categoryName = row.tag_category_name ?? undefined;

    const combinedValues = parseStringArray(row.all_values);
    const valueSample = combinedValues.slice(0, VALUE_SAMPLE_LIMIT);
    const valueSampleTruncated = combinedValues.length > VALUE_SAMPLE_LIMIT;

    metadataByTagId[tagId] = {
      tagId,
      tagName,
      isMultiValue,
      usageCount,
      studentCount,
      lastSeen,
      valueSample,
      valueSampleTruncated,
      canonicalValueCount,
      observedValueCount,
      categoryId,
      categoryName,
    } satisfies TagInsightsMetadata;

    descriptors.push({
      tagId,
      tagName,
      tagValues: includeValues && valueSample.length ? valueSample : undefined,
      tagCategoryId: categoryId,
      tagCategoryName: categoryName,
    });
  }

  return { descriptors, metadataByTagId };
}

function parseStringArray(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : typeof entry === 'number' ? entry.toString() : ''))
      .filter((entry) => entry.length > 0);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed
            .map((entry) => (typeof entry === 'string' ? entry.trim() : typeof entry === 'number' ? entry.toString() : ''))
            .filter((entry) => entry.length > 0)
        : [];
    } catch (error) {
      console.warn('Unexpected JSON shape in tag catalog values; returning empty array.', { error });
      return [];
    }
  }

  return [];
}
