/**
 * Academic Term Tools
 * Helps the AI assistant look up term metadata for a given date
 */

import { tool } from 'ai';
import { z } from 'zod/v3';
import { ChatTool, ToolContext } from './types';
import { fetchTermsForDate } from '@/libs/termsService';

export const getAcademicTermsTool = (context: ToolContext): ChatTool => ({
  metadata: {
    name: 'get_academic_terms',
    category: 'utility',
    description: 'Finds academic terms that include a given date for the current school context.',
    systemMessageRules: [
      'Use get_academic_terms when you need to know which term a specific date falls in.',
      'Combine this tool with get_current_date if the user references “today” or an implicit timeframe.',
      'Provide the date in YYYY-MM-DD format when possible; otherwise specify a parseable format.',
      'If no term is found, explain that the date falls outside known term ranges.',
    ],
  },
  definition: tool({
    description:
      'Returns the academic terms whose date range includes the provided date. Defaults to the selected school and today’s date when not specified.',
    inputSchema: z.object({
      date: z
        .string()
        .optional()
        .describe('Target date in YYYY-MM-DD format. If omitted, the current date is used.'),
      schoolId: z
        .string()
        .optional()
        .describe('Override schoolId. Defaults to the currently selected school.'),
    }),
    execute: async ({ date, schoolId }) => {
      const effectiveSchoolId = schoolId ?? context.selectedSchoolId;

      if (!effectiveSchoolId) {
        return {
          error: 'A schoolId is required to look up academic terms, but none was provided.',
        };
      }

      try {
        const termsResult = await fetchTermsForDate({
          date,
          schoolId: effectiveSchoolId,
        });

        return {
          date: termsResult.date,
          schoolId: termsResult.schoolId,
          matchingTerms: termsResult.matchingTerms,
          totalTermsScanned: termsResult.terms.length,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          error: `Failed to fetch academic terms: ${message}`,
        };
      }
    },
  }),
});
