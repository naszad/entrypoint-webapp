import { tool } from 'ai'
import { z } from 'zod'

export const navigate = tool({
  description: 'Instructs the UI to navigate to a specified route in the application, including path and query parameters. Returns both the URL and a user-friendly description of the destination view for display to the user.',
  parameters: z.object({
    url: z.string().describe('The full URL including path and query parameters, e.g., "/students?filters=gradeLevel%3Aeq%3A11"'),
    description: z.string().describe('A concise, user-friendly description of the destination view (e.g., "Students in grade 11").')
  }),
  execute: async ({ url, description }: { url: string; description: string }) => ({ url, description })
}); 