import { createClient } from '@/utils/supabase/supabaseServer';

interface ResolveCustomerIdParams {
  selectedSchoolId?: string;
  userId?: string;
}

export interface TagMetadata {
  tagId: string;
  name: string;
  categoryId: string;
  categoryName: string;
  isMultiValue: boolean;
  values: string[];
}

export interface TagValueMapEntry {
  tagId: string;
  values: string[];
}

async function resolveCustomerIdFromSchool(
  supabase: Awaited<ReturnType<typeof createClient>>,
  schoolId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('schools')
    .select('customer_id')
    .eq('school_id', schoolId)
    .single();

  if (error) {
    console.warn('Failed to resolve customer_id from school_id', { schoolId, error });
    return null;
  }

  return data?.customer_id ?? null;
}

async function resolveCustomerIdFromMembership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_school_memberships')
    .select('schools!inner(customer_id)')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('Failed to resolve customer_id from user membership', { userId, error });
    return null;
  }

  const membership = data as { schools?: { customer_id?: string } } | null;
  return membership?.schools?.customer_id ?? null;
}

export async function resolveCustomerId(params: ResolveCustomerIdParams): Promise<string | null> {
  try {
    const supabase = await createClient();

    if (params.selectedSchoolId) {
      const fromSchool = await resolveCustomerIdFromSchool(supabase, params.selectedSchoolId);
      if (fromSchool) {
        return fromSchool;
      }
    }

    if (params.userId) {
      const fromMembership = await resolveCustomerIdFromMembership(supabase, params.userId);
      if (fromMembership) {
        return fromMembership;
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to resolve customer_id context', error);
    return null;
  }
}

export async function fetchTagMetadata(customerId: string): Promise<TagMetadata[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('tags')
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

    if (error) {
      console.error('Failed to fetch tag metadata', error);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((entry: any) => {
      const canonicalValues = Array.isArray(entry.tag_canonical_values)
        ? entry.tag_canonical_values
        : [];
      const studentValues = Array.isArray(entry.student_tags) ? entry.student_tags : [];
      const rawValues = [
        ...canonicalValues.map((row: { value?: string | null }) => row?.value ?? ''),
        ...studentValues.map((row: { value?: string | null }) => row?.value ?? ''),
      ].filter(Boolean) as string[];

      const uniqueValues = Array.from(new Set(rawValues.map((value) => value.trim()))).filter(Boolean);

      return {
        tagId: entry.tag_id as string,
        name: entry.name as string,
        categoryId: entry.tag_categories?.tag_category_id ?? '',
        categoryName: entry.tag_categories?.name ?? 'Uncategorized',
        isMultiValue: Boolean(entry.is_multi_value),
        values: uniqueValues.slice(0, 200),
      } satisfies TagMetadata;
    });
  } catch (error) {
    console.error('Unexpected error fetching tag metadata', error);
    return [];
  }
}

export async function fetchTagValues(tagId: string): Promise<string[]> {
  try {
    const supabase = await createClient();
    const [studentValueResult, canonicalValueResult] = await Promise.all([
      supabase
        .from('student_tags')
        .select('value')
        .eq('tag_id', tagId)
        .not('value', 'is', null),
      supabase
        .from('tag_canonical_values')
        .select('value')
        .eq('tag_id', tagId)
        .not('value', 'is', null),
    ]);

    if (studentValueResult.error) {
      console.warn('Failed to fetch student tag values for tag', { tagId, error: studentValueResult.error });
    }

    if (canonicalValueResult.error) {
      console.warn('Failed to fetch canonical tag values for tag', { tagId, error: canonicalValueResult.error });
    }

    const rawValues = [
      ...(studentValueResult.data ?? []).map((row) => row.value ?? ''),
      ...(canonicalValueResult.data ?? []).map((row) => row.value ?? ''),
    ].filter(Boolean) as string[];

    return Array.from(new Set(rawValues.map((value) => value.trim()))).filter(Boolean).slice(0, 200);
  } catch (error) {
    console.error('Unexpected error fetching tag values', error);
    return [];
  }
}

export async function fetchTagValueMap(tagIds: string[], limitPerTag = 200): Promise<TagValueMapEntry[]> {
  if (!Array.isArray(tagIds) || tagIds.length === 0) {
    return [];
  }

  try {
    const supabase = await createClient();
    const normalizedIds = Array.from(new Set(tagIds.filter(Boolean))).slice(0, 50);

    const [studentValuesResult, canonicalValuesResult] = await Promise.all([
      supabase
        .from('student_tags')
        .select('tag_id, value')
        .in('tag_id', normalizedIds)
        .not('value', 'is', null),
      supabase
        .from('tag_canonical_values')
        .select('tag_id, value')
        .in('tag_id', normalizedIds)
        .not('value', 'is', null),
    ]);

    if (studentValuesResult.error) {
      console.warn('Failed to fetch student tag value map', studentValuesResult.error);
    }
    if (canonicalValuesResult.error) {
      console.warn('Failed to fetch canonical tag value map', canonicalValuesResult.error);
    }

    const map = new Map<string, Set<string>>();

    const accumulate = (rows: Array<{ tag_id?: string | null; value?: string | null }> | null | undefined) => {
      if (!Array.isArray(rows)) {
        return;
      }
      for (const row of rows) {
        const tagId = row?.tag_id;
        const value = row?.value;
        if (!tagId || !value) {
          continue;
        }
        const trimmed = value.trim();
        if (!trimmed) {
          continue;
        }
        const bucket = map.get(tagId) ?? new Set<string>();
        if (bucket.size < limitPerTag) {
          bucket.add(trimmed);
        }
        map.set(tagId, bucket);
      }
    };

    accumulate(studentValuesResult.data);
    accumulate(canonicalValuesResult.data);

    return normalizedIds.map((tagId) => ({
      tagId,
      values: Array.from((map.get(tagId) ?? new Set<string>()).values()).filter(Boolean),
    }));
  } catch (error) {
    console.error('Unexpected error fetching tag value map', error);
    return [];
  }
}
