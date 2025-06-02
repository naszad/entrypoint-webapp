import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { tools } from './tools';
import type { Message } from '@ai-sdk/ui-utils';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json() as { messages: Message[] };

  // Map UI messages to OpenAI Chat messages
  const chatMessages = messages.map(({ role, content }) => ({ role, content }));
  
  // Add system message for counselor context
  const systemMessage = {
    role: 'system' as const,
    content: `You are an AI assistant for school counselors. You can help with:
- Searching for student information
- Creating counselor notes for students
- Generating academic and behavioral reports
- Checking schedule availability
- Filtering and navigating to student table views based on natural language requests

When users ask to "show me", "find", "filter", or "get" students with specific criteria:
1. First use the filterStudentTable tool to analyze the request and get the URL and description
2. Then use the navigate tool with the URL and description from step 1 to navigate the user

Always be professional, maintain student confidentiality, and use the available tools when appropriate. 
When creating notes or reports, be thorough and include relevant details.
When searching for students, be helpful in guiding the counselor to the right information.`
  };

  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages: [systemMessage, ...chatMessages],
    tools,
    toolChoice: 'auto',
    maxSteps: 5, // Allow multi-step tool usage
  });

  return result.toDataStreamResponse();
}