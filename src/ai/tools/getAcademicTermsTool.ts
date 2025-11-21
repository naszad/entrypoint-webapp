import { tool } from 'ai';
import { z } from 'zod';
import { fetchTermsForDate } from '@/libs/termsService';
import type { ToolContext } from './types';

type GetAcademicTermsInput = {
  date?: string;
  schoolId?: string;
};

export function createGetAcademicTermsTool(context: ToolContext) {
  return tool({
    description:
      'Looks up academic terms for the selected school (or provided override) whose date range includes the supplied date.',
    inputSchema: z
      .object({
        date: z
          .string()
          .trim()
          .min(1)
          .max(50)
          .optional()
          .describe('Target date in YYYY-MM-DD format. If omitted, the current date is used.'),
        schoolId: z
          .string()
          .trim()
          .max(40)
          .optional()
          .describe('Optional school override. Defaults to the currently selected school context.'),
      })
      .default({}),
    execute: async ({ date, schoolId }: GetAcademicTermsInput = {}) => {
      const effectiveSchoolId = schoolId ?? context.selectedSchoolId ?? undefined;

      if (!effectiveSchoolId) {
        return {
          error: 'A school must be specified or selected before looking up academic terms.',
        };
      }

      try {
        const result = await fetchTermsForDate({
          date,
          schoolId: effectiveSchoolId,
        });

        return {
          date: result.date,
          schoolId: result.schoolId,
          matchingTerms: result.matchingTerms,
          terms: result.terms,
          totalTermsScanned: result.terms.length,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('get_academic_terms tool failed', error);
        return {
          error: `Failed to fetch academic terms: ${message}`,
        };
      }
    },
  });
}
