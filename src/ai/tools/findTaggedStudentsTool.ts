import { tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from './types';

const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 50;

type MatchType = 'exact' | 'contains';

export interface FindTaggedStudentsInput {
  tagId?: string;
  tagName?: string;
  tagValue?: string;
  matchType?: MatchType;
  limit?: number;
  allowPartialMatch?: boolean;
}

interface StudentTagRow {
  student_id: string | null;
  value: string | null;
}

interface StudentProfileRow {
  student_id: string;
  full_name: string | null;
  grade_level: number | null;
  is_student_active: boolean | null;
}

export function createFindTaggedStudentsTool(context: ToolContext) {
  return tool({
    description:
      'Retrieves students associated with a specific qualitative tag and optional value so counselors can see who matches the descriptor.',
    inputSchema: z
      .object({
        tagId: z
          .string()
          .trim()
          .min(1)
          .optional()
          .describe('Identifier of the qualitative tag to search. Accepts either a tag UUID or tag name.'),
        tagName: z
          .string()
          .trim()
          .min(1)
          .optional()
          .describe('Optional tag name. When provided, the tool will resolve it to the correct tag id.'),
        tagValue: z
          .string()
          .trim()
          .min(1, 'Provide a tag value when filtering multi-value tags.')
          .optional()
          .describe('Optional tag value to filter on. Supports partial matches when matchType is "contains".'),
        matchType: z
          .enum(['exact', 'contains'])
          .optional()
          .describe('Match strategy for tagValue. Defaults to "exact" when a value is provided.'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(MAX_LIMIT)
          .optional()
          .describe(`Maximum number of students to return. Defaults to ${DEFAULT_LIMIT}, capped at ${MAX_LIMIT}.`),
        allowPartialMatch: z
          .boolean()
          .optional()
          .describe('When true, falls back to partial matching if no exact value matches are found.'),
      })
      .refine((payload) => {
        const hasId = typeof payload.tagId === 'string' && payload.tagId.trim().length > 0;
        const hasName = typeof payload.tagName === 'string' && payload.tagName.trim().length > 0;
        return hasId || hasName;
      }, 'Provide a tagId or tagName to search.')
      .readonly(),
    execute: async ({ tagId, tagName, tagValue, matchType, limit, allowPartialMatch }: FindTaggedStudentsInput) => {
      if (!context.selectedSchoolId) {
        return {
          error: 'A school must be selected before listing students by tag.',
        };
      }

      const supabase = context.supabase;
      const normalizedLimit = Math.max(1, Math.min(limit ?? DEFAULT_LIMIT, MAX_LIMIT));
      const normalizedValue = tagValue?.trim();
      const effectiveMatchType: MatchType = normalizedValue ? matchType ?? 'exact' : 'contains';
      const resolvedTag = await resolveTagIdentifier({
        supabase,
        tagId: tagId?.trim(),
        tagName: tagName?.trim(),
        selectedSchoolId: context.selectedSchoolId,
        selectedCustomerId: context.selectedCustomerId,
      });

      if (!resolvedTag.ok) {
        return {
          error: resolvedTag.error ?? 'Unable to resolve the requested tag for this school.',
        };
      }

      const { tagId: effectiveTagId, tagName: effectiveTagName } = resolvedTag;

      const fetchTagRows = async (mode: MatchType): Promise<{ rows: StudentTagRow[]; error?: unknown }> => {
        let tagQuery = supabase
          .schema('views')
          .from('student_tags')
          .select('student_id, value')
          .eq('school_id', context.selectedSchoolId)
          .eq('tag_id', effectiveTagId)
          .not('student_id', 'is', null)
          .limit(normalizedLimit * 3);

        if (normalizedValue) {
          if (mode === 'exact') {
            tagQuery = tagQuery.ilike('value', normalizedValue);
          } else {
            tagQuery = tagQuery.ilike('value', `%${normalizedValue}%`);
          }
        }

        const { data: tagRowsRaw, error: tagError } = await tagQuery;
        const rows: StudentTagRow[] = Array.isArray(tagRowsRaw) ? (tagRowsRaw as StudentTagRow[]) : [];
        return { rows, error: tagError ?? undefined };
      };

      let tagRowsResult = await fetchTagRows(effectiveMatchType);

      if (!tagRowsResult.rows.length && normalizedValue && allowPartialMatch !== false) {
        tagRowsResult = await fetchTagRows('contains');
      }

      if (tagRowsResult.error) {
        console.error('find_tagged_students tool failed to fetch tag rows', tagRowsResult.error);
        return {
          error: 'Unable to look up students for the requested tag right now.',
        };
      }

      const tagRows = tagRowsResult.rows;

      if (!tagRows.length) {
        return {
          tagId: effectiveTagId,
          tagName: effectiveTagName,
          tagValue: normalizedValue,
          matchType: effectiveMatchType,
          totalMatches: 0,
          students: [],
          message: normalizedValue
            ? `No students currently match the tag value "${normalizedValue}" for ${effectiveTagName ?? 'the selected tag'}.`
            : `No students currently match the tag ${effectiveTagName ?? 'selected tag'}.`,
        };
      }

      const valueByStudent = new Map<string, string>();
      const orderedStudentIds: string[] = [];
      for (const row of tagRows) {
        const studentId = row.student_id ?? undefined;
        if (!studentId) {
          continue;
        }
        if (!valueByStudent.has(studentId) && typeof row.value === 'string') {
          valueByStudent.set(studentId, row.value);
        }
        if (!orderedStudentIds.includes(studentId)) {
          orderedStudentIds.push(studentId);
        }
      }

      if (!orderedStudentIds.length) {
        return {
          tagId: effectiveTagId,
          tagName: effectiveTagName,
          tagValue: normalizedValue,
          matchType: effectiveMatchType,
          totalMatches: 0,
          students: [],
          message: `No students currently match the tag ${effectiveTagName ?? 'selected tag'}.`,
        };
      }

      const limitedStudentIds = orderedStudentIds.slice(0, normalizedLimit);

      const { data: studentRowsRaw, error: studentError } = await supabase
        .schema('views')
        .from('student_profiles')
        .select('student_id, full_name, grade_level, is_student_active')
        .eq('school_id', context.selectedSchoolId)
        .in('student_id', limitedStudentIds);

      if (studentError) {
        console.error('find_tagged_students tool failed to fetch student profiles', studentError);
        return {
          error: 'Unable to retrieve student details for the requested tag.',
        };
      }

      const studentRows: StudentProfileRow[] = Array.isArray(studentRowsRaw)
        ? (studentRowsRaw as StudentProfileRow[])
        : [];

      const studentRecords = studentRows
        .map((row) => ({
          studentId: row.student_id,
          fullName: row.full_name ?? 'Unknown student',
          gradeLevel: row.grade_level,
          profilePath: `/students/${row.student_id}`,
          tagValue: valueByStudent.get(row.student_id),
          isStudentActive: row.is_student_active ?? undefined,
        }))
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

      return {
        tagId: effectiveTagId,
        tagName: effectiveTagName,
        tagValue: normalizedValue,
        matchType: effectiveMatchType,
        totalMatches: orderedStudentIds.length,
        students: studentRecords,
        limitApplied: normalizedLimit,
        hasMore: orderedStudentIds.length > normalizedLimit,
      };
    },
  });
}

interface ResolveTagIdentifierInput {
  supabase: ToolContext['supabase'];
  tagId?: string;
  tagName?: string;
  selectedSchoolId: string;
  selectedCustomerId?: string | null;
}

type ResolveTagIdentifierResult =
  | { ok: true; tagId: string; tagName?: string }
  | { ok: false; error?: string };

const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

async function resolveTagIdentifier({
  supabase,
  tagId,
  tagName,
  selectedSchoolId,
  selectedCustomerId,
}: ResolveTagIdentifierInput): Promise<ResolveTagIdentifierResult> {
  const trimmedId = tagId?.trim();
  const trimmedName = tagName?.trim();

  if (trimmedId && UUID_PATTERN.test(trimmedId)) {
    return { ok: true, tagId: trimmedId, tagName: trimmedName };
  }

  const candidateNames = Array.from(new Set([trimmedName, trimmedId].filter(Boolean))) as string[];

  if (!candidateNames.length) {
    return { ok: false, error: 'A tag id or tag name is required.' };
  }

  for (const candidate of candidateNames) {
    if (!candidate) {
      continue;
    }

    // Attempt direct lookup via tag catalog by customer id when available.
    if (selectedCustomerId) {
      try {
        const { data: tagRows, error: tagLookupError } = await supabase
          .from('tags')
          .select('tag_id, name')
          .eq('customer_id', selectedCustomerId)
          .ilike('name', candidate)
          .limit(1);

        if (tagLookupError) {
          console.warn('find_tagged_students failed customer tag lookup', { tagLookupError, candidate, selectedCustomerId });
        } else if (Array.isArray(tagRows) && tagRows.length > 0) {
          const resolved = tagRows[0] as { tag_id?: string | null; name?: string | null };
          const resolvedId = typeof resolved.tag_id === 'string' ? resolved.tag_id.trim() : '';
          if (resolvedId && UUID_PATTERN.test(resolvedId)) {
            return { ok: true, tagId: resolvedId, tagName: resolved.name ?? candidate };
          }
        }
      } catch (error) {
        console.warn('find_tagged_students unexpected error during customer tag lookup', { error, candidate, selectedCustomerId });
      }
    }

    // Fall back to tag usage view scoped to the selected school.
    try {
      const { data: usageRows, error: usageLookupError } = await supabase
        .schema('views')
        .from('student_tags')
        .select('tag_id, tag_name')
        .eq('school_id', selectedSchoolId)
        .ilike('tag_name', candidate)
        .not('tag_id', 'is', null)
        .limit(1);

      if (usageLookupError) {
        console.warn('find_tagged_students failed school tag lookup', { usageLookupError, candidate, selectedSchoolId });
      } else if (Array.isArray(usageRows) && usageRows.length > 0) {
        const resolved = usageRows[0] as { tag_id?: string | null; tag_name?: string | null };
        const resolvedId = typeof resolved.tag_id === 'string' ? resolved.tag_id.trim() : '';
        if (resolvedId && UUID_PATTERN.test(resolvedId)) {
          return { ok: true, tagId: resolvedId, tagName: resolved.tag_name ?? candidate };
        }
      }
    } catch (error) {
      console.warn('find_tagged_students unexpected error during school tag lookup', { error, candidate, selectedSchoolId });
    }
  }

  return {
    ok: false,
    error: candidateNames.length
      ? `No tag matching "${candidateNames[0]}" was found for the selected school.`
      : 'Unable to resolve the requested tag for this school.',
  };
}
