import { tool } from "ai"
import { z } from "zod"

export const navigateTool = tool({
    description: 'Navigate the user to the provided url. This should be called after filterStudents or filterGrades returns a url to automatically navigate the user.',
    inputSchema: z.object({
      url: z.string().describe('The url to navigate to.'),
    }),
    // No execute function - this makes it a client-side tool
  })