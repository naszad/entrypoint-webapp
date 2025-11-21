import { tool } from 'ai';
import { z } from 'zod';

// Lightweight tool that returns an SRM-relative URL so the UI can trigger a router navigation.
export function createNavigateTool() {
  return tool({
    description:
      'Navigates the EntryPoint SRM to a specific page. Use after composing a URL (for example, from filterStudentsTool) when the counselor is ready to see the results. Include a short label so the chat transcript can display a button for quick access later.',
    inputSchema: z.object({
      url: z
        .string()
        .min(1)
        .max(2048)
        .refine((value) => value.startsWith('/'), {
          message: 'Navigation URLs must be relative to the SRM (e.g. /students?filters=...).'
        }),
      label: z
        .string()
        .min(1)
        .max(120)
        .optional()
        .describe('Short human-readable description of the target view (e.g., "Grade 9 & 10 students with GPA > 3.5").'),
      filtersApplied: z.unknown().optional().describe('Optional structured filters metadata to echo back to the UI.')
    }),
    execute: async ({ url, label, filtersApplied }) => {
      return { url, label, filtersApplied };
    }
  });
}
