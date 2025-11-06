import { tool } from 'ai';
import { z } from 'zod/v3';
import { ChatTool, ToolContext } from './types';
import { createClient } from '@/utils/supabase/supabaseServer';

interface BuildTagsPayloadOptions {
  search?: string;
  limit?: number;
}

interface RawTagRow {
  tag_id: string;
  name: string;
  is_multi_value?: boolean | null;
  tag_categories?: {
    tag_category_id?: string | null;
    name?: string | null;
  } | null;
  tag_canonical_values?: Array<{ value?: string | null }> | null;
  student_tags?: Array<{ value?: string | null }> | null;
}

async function resolveCustomerId(context: ToolContext): Promise<string | null> {
  const supabase = await createClient();

  if (context.selectedSchoolId) {
    const { data, error } = await supabase
      .from('schools')
      .select('customer_id')
      .eq('school_id', context.selectedSchoolId)
      .single();

    if (error) {
      console.warn('list_tags failed to resolve customer_id from school', error);
    } else if (data?.customer_id) {
      return data.customer_id;
    }
  }

  if (context.userId) {
    const { data, error } = await supabase
      .from('user_school_memberships')
      .select('schools!inner(customer_id)')
      .eq('user_id', context.userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('list_tags failed to resolve customer_id from membership', error);
    } else {
      const membership = data as { schools?: { customer_id?: string } } | null;
      if (membership?.schools?.customer_id) {
        return membership.schools.customer_id;
      }
    }
  }

  return null;
}

function buildTagPayload(tag: RawTagRow) {
  const canonicalValues = Array.isArray(tag.tag_canonical_values) ? tag.tag_canonical_values : [];
  const studentValues = Array.isArray(tag.student_tags) ? tag.student_tags : [];
  const values = [
    ...canonicalValues.map((row) => (row?.value ?? '').trim()),
    ...studentValues.map((row) => (row?.value ?? '').trim()),
  ]
    .filter(Boolean)
    .slice(0, 20);

  return {
    tagId: tag.tag_id,
    name: tag.name,
    categoryId: tag.tag_categories?.tag_category_id ?? '',
    categoryName: tag.tag_categories?.name ?? 'Uncategorized',
    isMultiValue: Boolean(tag.is_multi_value),
    sampleValues: Array.from(new Set(values)),
  };
}

async function fetchTagsPayload(context: ToolContext, options: BuildTagsPayloadOptions = {}) {
  const customerId = await resolveCustomerId(context);
  if (!customerId) {
    return { error: 'Unable to resolve customer context for tags.' };
  }

  const supabase = await createClient();

  let query = supabase
    .from('tags' as const)
    .select(
      `
      tag_id,
      name,
      is_multi_value,
      tag_categories ( tag_category_id, name ),
      tag_canonical_values ( value ),
      student_tags ( value )
    `,
    )
    .eq('customer_id', customerId)
    .order('name');

  if (options.search) {
    query = query.ilike('name', `%${options.search}%`);
  }

  if (options.limit && Number.isFinite(options.limit)) {
    query = query.limit(Math.max(1, Math.min(options.limit, 200)));
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch tags for tool', error);
    return { error: `Failed to fetch tags: ${error.message}` };
  }

  return {
    tags: (data ?? []).map((row) => buildTagPayload(row as RawTagRow)),
    total: data?.length ?? 0,
  };
}

export const listTagsTool = (context: ToolContext): ChatTool => ({
  metadata: {
    name: 'list_tags',
    category: 'data_query',
    description: 'Lists available student tags with category information and sample values.',
    systemMessageRules: [
      'Call list_tags before constructing qualitative data queries to avoid guessing tag names.',
      'Use the optional search input to narrow down tags when the list is large.',
    ],
  },
  definition: tool({
    description:
      'Lists available student tags (qualitative descriptors) along with their categories and sample values. Use this to understand which tags are available before writing tag-based SQL.',
    inputSchema: z
      .object({
        search: z.string().optional().describe('Optional search term to filter tags by name.'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(200)
          .optional()
          .describe('Maximum number of tags to return (default 100).'),
      })
      .default({}),
    execute: async (input = {}) => {
      const options: BuildTagsPayloadOptions = {
        search: input.search,
        limit: input.limit ?? 100,
      };

      return fetchTagsPayload(context, options);
    },
  }),
});

export const getTagValuesTool = (): ChatTool => ({
  metadata: {
    name: 'list_tag_values',
    category: 'data_query',
    description: 'Lists distinct values recorded for a specific tag.',
    systemMessageRules: [
      'Use list_tag_values to discover actual recorded values before filtering on tag value.',
      'Always combine tag value filters with the tag_id to keep SQL precise.',
    ],
  },
  definition: tool({
    description: 'Lists distinct values that currently exist for the provided tag identifier.',
    inputSchema: z.object({
      tagId: z.string().min(1).describe('The tag_id to inspect.'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(200)
        .optional()
        .describe('Maximum number of values to return.'),
    }),
    execute: async ({ tagId, limit }) => {
      const supabase = await createClient();

      const [studentValuesResult, canonicalValuesResult] = await Promise.all([
        supabase
          .from('student_tags')
          .select('value')
          .eq('tag_id', tagId)
          .not('value', 'is', null)
          .limit(limit ?? 200),
        supabase
          .from('tag_canonical_values')
          .select('value')
          .eq('tag_id', tagId)
          .not('value', 'is', null)
          .limit(limit ?? 200),
      ]);

      if (studentValuesResult.error) {
        console.warn('Error fetching student tag values', { tagId, error: studentValuesResult.error });
      }

      if (canonicalValuesResult.error) {
        console.warn('Error fetching canonical tag values', { tagId, error: canonicalValuesResult.error });
      }

      const rawValues = [
        ...(studentValuesResult.data ?? []).map((row) => (row?.value ?? '').trim()),
        ...(canonicalValuesResult.data ?? []).map((row) => (row?.value ?? '').trim()),
      ].filter(Boolean);

      const uniqueValues = Array.from(new Set(rawValues));
      return {
        tagId,
        values: uniqueValues.slice(0, limit ?? 200),
        total: uniqueValues.length,
      };
    },
  }),
});
