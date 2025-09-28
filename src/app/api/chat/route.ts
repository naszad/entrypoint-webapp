import { streamText, tool, stepCountIs, convertToModelMessages } from 'ai';
import { openai } from '@ai-sdk/openai'
import { createClient } from '@/utils/supabase/supabaseServer'
import { z } from 'zod/v3';
import { cookies } from 'next/headers'
import { FINALIZED_GRADE_CODES, CURRENT_YEAR_GRADE_CODES, ALL_GRADE_CODES } from '@/utils/gradeCodes'
import { fetchConfig } from '@/libs/configService'
import { NextResponse } from 'next/server'
import { ChatMessage } from '@/types/Models'
import { UIMessage } from 'ai'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

// GET endpoint to list all saved chats for the user
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get all non-deleted chats for the user (without messages)
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('chat_id, title, created_at, updated_at')
      .eq('user_id', userData.user.id)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })

    if (chatsError) {
      return NextResponse.json({ error: 'Failed to load chats' }, { status: 500 })
    }

    return NextResponse.json({ chats })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { messages: uiMessages, chatId, selectedModel } = await req.json()
  
  // Require chatId to be present
  if (!chatId) {
    return NextResponse.json({ error: 'Chat ID is required. Create a chat first using /api/chat/new' }, { status: 400 })
  }

  // Only allow selectedModel if dev options are enabled via environment variable
  const isDevOptionsEnabled = process.env.ENABLE_DEV_OPTIONS === 'true'
  const modelToUse = (isDevOptionsEnabled && selectedModel) ? selectedModel : 'gpt-4o'
  console.log('modelToUse', modelToUse)
  
  
  let messages = convertToModelMessages(uiMessages)

  // Always load the full conversation from the database since only latest message is sent
  try {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Load existing messages from the database
    const { data: existingMessages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      return NextResponse.json({ error: 'Failed to load chat messages' }, { status: 500 })
    }

    // Convert database messages to AI SDK format (text only, no tool calls)
    const dbMessages = existingMessages.map((msg:ChatMessage) => {
      let textContent = '';
      
      if (Array.isArray(msg.parts)) {
        // Extract only text parts, ignore tool calls and tool results
        const parts = msg.parts as { type: string; text: string }[]
        const textParts = parts.filter((part) => part.type === 'text');
        textContent = textParts.map((part) => part.text || '').join('');
      } else if (typeof msg.parts === 'string') {
        textContent = msg.parts;
      }
      
      return {
        id: msg.message_id,
        role: msg.role,
        content: textContent,
        parts: [{ type: 'text' as const, text: textContent }]
      };
    })
    
    // Combine existing messages with the new message
    if (uiMessages.length > 0) {
      const newMessage = convertToModelMessages([uiMessages[uiMessages.length - 1]])
      messages = [...convertToModelMessages(dbMessages as UIMessage[]), ...newMessage]
    } else {
      messages = convertToModelMessages(dbMessages as UIMessage[])
    }
  } catch (error) {
    console.error('Error loading existing messages:', error)
    return NextResponse.json({ error: 'Failed to load conversation' }, { status: 500 })
  }

  // Fetch selectedSchoolId from cookies at the beginning so it's available to all tools
  const cookieStore = await cookies()
  const selectedSchoolId = cookieStore.get('selectedSchoolId')?.value

  // Save the new user message and update chat timestamp
  if (uiMessages && uiMessages.length > 0) {
    try {
      const supabase = await createClient()
      
      // Update existing chat timestamp
      await supabase
        .from('chats')
        .update({ updated_at: new Date() })
        .eq('chat_id', chatId)

      // Save the new user message (only the latest one sent from frontend)
      const latestMessage = uiMessages[uiMessages.length - 1]
      
      
      // Extract text content from the message
      let textContent = '';
      if (latestMessage.parts && Array.isArray(latestMessage.parts)) {
        // AI SDK format: message has parts array
        const messageParts = latestMessage.parts as { type: string; text: string }[]
        textContent = messageParts
          .filter((part) => part.type === 'text')
          .map((part) => part.text)
          .join('');
      } else if (typeof latestMessage.content === 'string') {
        // Fallback: direct string content
        textContent = latestMessage.content;
      } else if (Array.isArray(latestMessage.content)) {
        // Fallback: array of content parts
        const messageContent = latestMessage.content as { type: string; text: string }[]
        textContent = messageContent
          .filter((part) => part.type === 'text')
          .map((part) => part.text)
          .join('');
      } else if (latestMessage.content && typeof latestMessage.content === 'object' && latestMessage.content.text) {
        // Fallback: object with text property
        textContent = latestMessage.content.text;
      }
      
      
      const messageToInsert = {
        chat_id: chatId,
        role: latestMessage.role,
        parts: [{ type: 'text', text: textContent }],
        created_at: new Date(),
        metadata: latestMessage.metadata || null
      }

      // Insert only the new user message (don't delete existing messages)
      await supabase
        .from('chat_messages')
        .insert(messageToInsert)
    } catch (error) {
      console.error('Error saving user message:', error)
      // Don't fail the request if message saving fails
    }
  }

  const systemMessage = `You are a helpful AI assistant for school counselors and administrators. Your goal is to answer questions by querying the database or helping the user navigate the application. Select the best tool for the user's request based on the tool's description.

Key Guidelines:
- "Current year" refers to the school year where 'is_current' is true in the database.
- For any task involving a specific student, if you don't already know the student_id, you must first use the 'identify_student' tool to get their unique ID. If the name is ambiguous, present the potential matches to the user for clarification.
- When referencing a student, use their full name and format it as a markdown link to their profile, like this: [Student's Full Name](/students/<studentId>).
- If the user asks a question that you can't answer with one of the other tools, you should inspect the database schema and see if there is a table that might be relevant (make sure to read the comments in the schema). If you find a table, use the \`get_table_schema\` tool to get the schema and understand the table better. Then use the \`execute_sql\` tool to execute a query on the table.
- Questions about students' goals, interests, and other non-academic information should be answered by looking for relevant tags in the tags table or meeting_notes. Search the tags table for potentially relevant tag names (if you don't find any relevant ones by assuming a name, then select all tag names and look for possibly relevant ones), then look in the student_tags table for the values to help answer the question. Questions about students' academic track should be contained by tags in the Academics tag_category.
- You may search the meeting_notes table for potentially relevant information about a single student. You may not search the meeting_notes table for information about multiple students at once.
- Provide only the final, user-facing answer. Do not include intermediate steps, tool outputs, or error messages in your response.
- Never generate external links or urls. Only generate links or urls that lead to internal pages within the application.
`;

  const result = streamText({
    model: openai(modelToUse),
    system: systemMessage,
    messages,
    stopWhen: stepCountIs(15), // Limit steps (tool calls + responses)

    // Save AI response when complete
    onFinish: async (finishData) => {
      if (chatId) {
        try {
          
          const supabase = await createClient()
          
          // Build complete parts array from steps data
          const parts = [];
          
          // Process each step to extract tool calls, tool results, and text
          if (finishData.steps && finishData.steps.length > 0) {
            for (const step of finishData.steps) {
              if (step.content && Array.isArray(step.content)) {
                for (const contentItem of step.content) {
                  if (contentItem.type === 'tool-call') {
                    // Add tool call (this represents the AI's intent to call a tool)
                    parts.push({
                      type: 'tool-call',
                      toolCallId: contentItem.toolCallId,
                      toolName: contentItem.toolName,
                      input: contentItem.input
                    });
                  } else if (contentItem.type === 'tool-result') {
                    // Format tool results to match frontend expectations
                    if (contentItem.toolName === 'filter_students') {
                      parts.push({
                        type: 'tool-filter_students',
                        toolCallId: contentItem.toolCallId,
                        toolName: contentItem.toolName,
                        output: contentItem.output
                      });
                    } else if (contentItem.toolName === 'filter_grades') {
                      parts.push({
                        type: 'tool-filter_grades',
                        toolCallId: contentItem.toolCallId,
                        toolName: contentItem.toolName,
                        output: contentItem.output
                      });
                    } else {
                      // Generic tool result format
                      parts.push({
                        type: 'dynamic-tool',
                        toolCallId: contentItem.toolCallId,
                        toolName: contentItem.toolName,
                        output: contentItem.output
                      });
                    }
                  } else if (contentItem.type === 'text') {
                    // Add text content
                    parts.push({
                      type: 'text',
                      text: contentItem.text
                    });
                  }
                }
              }
            }
          }
          
          // Fallback: Add text content if not already captured from steps
          if (finishData.text && !parts.some(part => part.type === 'text')) {
            parts.push({ type: 'text', text: finishData.text });
          }
          
          // Save with complete message structure
          await supabase
            .from('chat_messages')
            .insert({
              chat_id: chatId,
              role: 'assistant',
              parts: parts,
              created_at: new Date(),
              metadata: {
                finishReason: finishData.finishReason,
                usage: finishData.usage,
                toolCalls: finishData.toolCalls || [],
                toolResults: finishData.toolResults || []
              }
            })
            
        } catch (error) {
          console.error('Error saving AI response:', error)
        }
      }
    },

    // Log tool calls and results for debugging
    onStepFinish: (step) => {
      if (step.toolCalls && step.toolCalls.length > 0) {
        for (const toolCall of step.toolCalls) {
          console.log(`Tool called: ${toolCall.toolName}`, {
            input: 'args' in toolCall ? toolCall.args : toolCall.input,
            toolCallId: toolCall.toolCallId
          });
        }
      }
      
      if (step.toolResults && step.toolResults.length > 0) {
        for (const toolResult of step.toolResults) {
          console.log(`Tool result: ${toolResult.toolName}`, {
            output: 'result' in toolResult ? toolResult.result : toolResult.output,
            toolCallId: toolResult.toolCallId
          });
        }
      }
    },

    tools: {
      filter_students: tool({
        description: `Applies filters to the student data table and navigates the user to the filtered view.

Use this tool **only** when the user's request is to **view, show, find, or display a list/table of students**. This tool is for navigation, not for answering questions. Do not include the URL in your response, as a button will be displayed below the message in the UI.

- **Correct Usage Examples**: "Show me 11th graders", "Find students with 'Smith' in their name.", "Show me students updated in the last 30 days", "Find students created in the last 7 days", "Show students with GPA below 2.0", "Find students with GPA above 3.5"
- **Incorrect Usage**: Do not use this for questions asking for a specific fact, like "What grade is Jane Doe in?" or "How many students are graduating this year?". For those, you must query the database directly.

**Date Filter Instructions:**
- When user asks for students "updated/modified/changed in the last X days", use updatedAtRecentOnly with the number of days
- When user asks for students "created/added/registered in the last X days", use createdAtRecentOnly with the number of days
- Examples: "last 30 days" = 30, "last week" = 7, "last month" = 30, "yesterday" = 1, "last 2 weeks" = 14`,
        inputSchema: z.object({
          gradeLevel: z.number().optional().describe('Grade level (e.g., 9, 10, 11, 12)'),
          fullName: z.string().optional().describe('Name or part of name to search for'),
          enrollmentStatus: z.enum(['active', 'inactive']).optional().describe('Student enrollment status'),
          gender: z.enum(['male', 'female']).optional().describe('Student gender'),
          homeroomName: z.string().optional().describe('Homeroom name or teacher'),
          graduationYear: z.number().optional().describe('Expected graduation year'),
          email: z.string().optional().describe('Email domain or part of email to search for'),
          gpaFilter: z.object({
            value: z.number().describe('The GPA value to filter by'),
            operator: z.enum(['eq', 'gt', 'lt', 'gte', 'lte']).default('eq').describe('The comparison operator for the GPA filter: "eq" (equal to), "gt" (greater than), "lt" (less than), "gte" (greater than or equal to), "lte" (less than or equal to)')
          }).optional().describe('Filter students by cumulative GPA. For example, "students with GPA above 3.5" or "students with GPA below 2.0".'),
          ageFilter: z.object({
            age: z.number().describe('The age to filter by'),
            operator: z.enum(['eq', 'gte', 'lte']).default('eq').describe('The comparison operator for the age filter: "eq" (equal to), "gte" (greater than or equal to), "lte" (less than or equal to)')
          }).optional().describe('Filter students by age. For example, "students older than 15" or "10-year-old students".'),
          createdAtRecentOnly: z.number().positive().optional().describe('Filter students created in the last N days. Use when user asks for students "created", "added", or "registered" in recent time period.'),
          updatedAtRecentOnly: z.number().positive().optional().describe('Filter students updated in the last N days. Use when user asks for students "updated", "modified", or "changed" in recent time period.')
        }),
        execute: async (parsedFilters) => {
          const filters: string[] = [];
          const baseUrl = '/students';
    
          for (const [key, value] of Object.entries(parsedFilters)) {
            if (!value || key === 'ageFilter' || key === 'gpaFilter') continue;
            
            switch (key) {
              case 'gradeLevel':
              case 'enrollmentStatus':
              case 'gender':
              case 'graduationYear':
                filters.push(`${key}:eq:${value}`);
                break;
              case 'fullName':
              case 'homeroomName':
              case 'email':
                filters.push(`${key}:contains:${encodeURIComponent(value as string)}`);
                break;
              case 'createdAtRecentOnly':
                filters.push(`createdAtRecentOnly:in:${value}`);
                break;
              case 'updatedAtRecentOnly':
                filters.push(`updatedAtRecentOnly:in:${value}`);
                break;
            }
          }
    
          if (parsedFilters.gpaFilter) {
            const { value, operator } = parsedFilters.gpaFilter;
            filters.push(`gpa:${operator}:${value}`);
          }
    
          if (parsedFilters.ageFilter) {
            const { age, operator } = parsedFilters.ageFilter;
            const currentYear = new Date().getFullYear();
            const birthYear = currentYear - age;
            
            switch (operator) {
              case 'eq':
                // Assumes backend can handle year part for date contains
                filters.push(`dateOfBirth:contains:${birthYear}`);
                break;
              case 'gte': 
                // age >= X  means birth year <= Y
                filters.push(`dateOfBirth:lte:${birthYear}-12-31`);
                break;
              case 'lte':
                // age <= X means birth year >= Y
                filters.push(`dateOfBirth:gte:${birthYear}-01-01`);
                break;
            }
          }

          // Construct the URL
          let url = baseUrl;
          if (filters.length > 0) {
            const filterString = filters.join(',');
            url += `?filters=${encodeURIComponent(filterString)}`;
          }
    
          // The LLM will use the `url` and `filtersApplied` to generate a friendly response for the user.

          return {
            url,
            filtersApplied: parsedFilters,
          };
        }
      }),
      filter_grades: tool({
        description: `Applies filters to the grades data table and navigates the user to the filtered view.

Use this tool **only** when the user's request is to **view, show, find, or display a list/table of grades**. This tool is for navigation, not for answering questions. Do not include the URL in your response, as a button will be displayed below the message in the UI.

- **Correct Usage Examples**: "Show me grades below 90%", "Show me all A grades", "Find grades for Math courses", "Display grades for John Smith"
- **Incorrect Usage**: Do not use this for questions asking for a specific fact, like "What grade did Jane Doe get in Math?" or "How many students got A's?". For those, you must query the database directly.`,
        inputSchema: z.object({
          fullName: z.string().optional().describe('Student name or part of name to search for'),
          course_localCourseCode: z.string().optional().describe('Course code or part of course code to search for'),
          credit_type: z.string().optional().describe('Credit type (e.g., Math, Science, English, History, Arts, etc.)'),
          course_name: z.string().optional().describe('Course name or part of course name to search for'),
          gradeLetter: z.string().optional().describe('Grade letter (e.g., A, B, C, D, F)'),
          gradePercentage: z.object({
            percentage: z.number().describe('The grade percentage to filter by'),
            operator: z.enum(['eq', 'gte', 'lte']).default('eq').describe('The comparison operator for the grade percentage filter: "eq" (equal to), "gte" (greater than or equal to), "lte" (less than or equal to)')
          }).optional().describe('Filter grades by percentage. For example, "grades above 85%" or "90% grades".'),
          gradeCode: z.string().optional().describe('Grade code (e.g., A, B, C, D, F, P, I)'),
          updatedAfter: z.string().optional().describe('Show grades updated after this date (YYYY-MM-DD format)'),
          updatedBefore: z.string().optional().describe('Show grades updated before this date (YYYY-MM-DD format)'),
        }),
        execute: async (parsedFilters) => {
          const filters: string[] = [];
          const baseUrl = '/grades';
    
          // Consolidate filter parameters to start supporting generic filter logic
          const filterConfig: Record<string, { operator: string; field?: string }> = {
            fullName: { operator: 'contains' },
            course_localCourseCode: { operator: 'contains' },
            course_name: { operator: 'contains' },
            gradeLetter: { operator: 'contains' },
            gradeCode: { operator: 'eq' },
            credit_type: { operator: 'contains' },
            updatedAfter: { operator: 'gte', field: 'updatedAt' },
            updatedBefore: { operator: 'lte', field: 'updatedAt' }
          };

          for (const [key, value] of Object.entries(parsedFilters)) {
            if (!Object.keys(filterConfig).includes(key)) continue;
            const config = filterConfig[key];
            const fieldName = config.field || key;
            const filterValue = config.operator === 'contains' || config.operator === 'eq' 
              ? value as string
              : value;
            filters.push(`${fieldName}:${config.operator}:${filterValue}`);
          }

          // TODO: This kind of numeric filter (gte, lte, eq) will be added to the generic filter soon TM
          if (parsedFilters.gradePercentage) {
            const { percentage, operator } = parsedFilters.gradePercentage;
            
            switch (operator) {
              case 'eq':
                filters.push(`gradePercentage:eq:${percentage}`);
                break;
              case 'gte':
                filters.push(`gradePercentage:gte:${percentage}`);
                break;
              case 'lte':
                filters.push(`gradePercentage:lte:${percentage}`);
                break;
            }
          }
    
          // Construct the URL
          let url = baseUrl;
          if (filters.length > 0) {
            const filterString = filters.join(',');
            url += `?filters=${encodeURIComponent(filterString)}`;
          }
    
          // The LLM will use the `url` and `filtersApplied` to generate a friendly response for the user.
          return {
            url,
            filtersApplied: parsedFilters,
          };
        }
      }),
      list_tables: tool({
        description: `Lists all available tables in the database. Use the comments to understand the table better. This is the first step for answering a question that requires specific information. Use this if you do not know the database schema.`,
        inputSchema: z.object({}),
        execute: async () => {
          const supabase = await createClient()
          const { data, error } = await supabase.rpc('list_public_tables');

          if (error) {
            console.error('Error listing tables:', error);
            return { error: `Failed to list tables: ${error.message}` };
          }
          
          return data.map((t: { name: string }) => t.name);
        },
      }),
      get_table_schema: tool({
        description: 'Gets the schema (column names, data types, and comments) for a specific table. After finding relevant tables with `list_tables`, use this to understand their structure and purpose before writing a query.',
        inputSchema: z.object({
          tableName: z.string().describe('The name of the table to get the schema for.'),
        }),
        execute: async ({ tableName }) => {
          const supabase = await createClient()
          const { data, error } = await supabase.rpc('get_public_table_schema', { p_table_name: tableName });

          if (error) {
            console.error(`Error getting schema for table ${tableName}:`, error);
            return { error: `Failed to get schema for table ${tableName}: ${error.message}` };
          }
          
          return data;
        },
      }),
      execute_sql: tool({
        description: `Executes a final, read-only SQL 'SELECT' query to get specific information from the database. Use this after you have explored the schema with 'list_tables' and 'get_table_schema' to construct a precise query.`,
        inputSchema: z.object({
          sql: z.string().describe('The SQL SELECT query to execute.'),
        }),
        execute: async ({ sql }) => {
          if (!sql.trim().toLowerCase().startsWith('select')) {
            const err_msg = 'Only SELECT queries are allowed.';
            console.error(err_msg);
            return { error: err_msg };
          }

          const supabase = await createClient()
          const { data, error } = await supabase.rpc('execute_safe_select', { 
            query_text: sql,
            p_selected_school_id: selectedSchoolId
          });

          if (error) {
            console.error('Error executing SQL:', error);
            return { error: `Failed to execute query: ${error.message}` };
          }

          return data;
        },
      }),
      // identify_student tool
      identify_student: tool({
        description: `Identifies a student by name to get their unique studentId. This is the first step for any query about a specific student. The search is automatically filtered to students the user has access to. It handles three cases:
1. Exact match: Returns the student's ID and full name.
2. Multiple matches: Returns a list of potential students for the user to choose from.
3. No matches: Returns a message indicating the student was not found.`,
        inputSchema: z.object({
          studentName: z.string().describe("The student's full name or partial name to search for."),
        }),
        execute: async ({ studentName }) => {
          const supabase = await createClient();

          //query for students
          const { data: students, error } = await supabase
            .from('students')
            .select('student_id, full_name, grade_level')
            .ilike('full_name', `%${studentName}%`);

          if (error) {
            console.error('Error identifying student:', error);
            return { noMatchFound: `An error occurred: ${error.message}` };
          }

          if (!students || students.length === 0) {
            return { noMatchFound: `Could not find a student named "${studentName}". Please check the spelling or provide a more complete name.` };
          }

          if (students.length === 1) {
            const student = students[0];
            return {
              studentId: student.student_id,
              fullName: student.full_name,
            };
          }

          // Multiple matches found
          return {
            potentialMatches: students.map(s => ({
              studentId: s.student_id,
              fullName: s.full_name,
              gradeLevel: s.grade_level,
            })),
          };
        },
      }),
      get_student_gpa: tool({
        description: `Retrieves a student's GPA after they have been unambiguously identified.
This tool requires a 'studentId'. You MUST call 'identify_student' first to get the studentId.
It can be filtered by various parameters like credit types (subjects) or school years.`,
        inputSchema: z.object({
          studentId: z.string().describe("The student's unique ID, obtained from the 'identify_student' tool."),
          method: z.string().optional().describe('GPA calculation method: simple, added_value, credit_hour_weighted'),
          gradeCodes: z.array(z.string()).optional().describe(`Filter by grade codes (${ALL_GRADE_CODES.join(', ')});`),
          creditTypes: z.array(z.string()).optional().describe('Filter by course subject(s), matching the credit_type in grade records (e.g., ["English", "Math"])'),
          yearLabels: z.array(z.string()).optional().describe('Filter by school year labels (e.g., ["2022-2023", "2023-2024"])'),
          gradeLevels: z.array(z.number()).optional().describe('Filter by grade levels (e.g., ["9", "10", "11", "12"])'),
        }),
        execute: async (parsed) => {
          const supabase = await createClient();

          const studentId = parsed.studentId;
          
          // ---------------------------------------------------------------------------------
          // Step 1: Fetch the label of the current school year (e.g. "2024-2025")
          // ---------------------------------------------------------------------------------

          const { data: currentYearData } = await supabase
            .from('years')
            .select('name')
            .eq('is_current', true)
            .single();

          const currentSchoolYearLabel: string | null = currentYearData?.name ?? null;

          // ---------------------------------------------------------------------------------
          // Step 2: Determine which grade codes to use
          //   • Default to FINALIZED_GRADE_CODES for past years
          //   • Switch to CURRENT_YEAR_GRADE_CODES when
          //     the filter explicitly references the current school year OR the
          //     special placeholder "current" / "current_year" is supplied.
          // ---------------------------------------------------------------------------------

          const configResponse = await fetchConfig({schoolId: selectedSchoolId, configKeys: ['final_grade_codes']});
          
          let yearLabelsFilter: string[] | null = parsed.yearLabels ? [...parsed.yearLabels] : null;
          const gradeLevelsFilter: number[] | null = parsed.gradeLevels ?? null;
          let defaultGradeCodes: readonly string[] = configResponse['final_grade_codes'] ? configResponse['final_grade_codes'] : FINALIZED_GRADE_CODES;

          if (yearLabelsFilter && yearLabelsFilter.length > 0) {
            // Replace placeholder tokens with the actual current year label
            const PLACEHOLDER_REGEX = /^(current|current_year)$/i;
            yearLabelsFilter = yearLabelsFilter.map((label) =>
              PLACEHOLDER_REGEX.test(label) && currentSchoolYearLabel ? currentSchoolYearLabel : label
            );

            // If, after replacement, the current school year label is in the filter -> use current year grade codes
            if (currentSchoolYearLabel && yearLabelsFilter.includes(currentSchoolYearLabel)) {  
              defaultGradeCodes = CURRENT_YEAR_GRADE_CODES;
            }
          }

          const gradeCodesFilter = parsed.gradeCodes ?? [...defaultGradeCodes];
          const creditTypesFilter = parsed.creditTypes ?? null;
          const { data: gpa, error } = await supabase.rpc('calculate_gpa_dispatch', {
            p_student_id: studentId,
            p_method: parsed.method ?? null,
            p_grade_codes: gradeCodesFilter,
            p_credit_types: creditTypesFilter,
            p_year_labels: yearLabelsFilter,
            p_grade_levels: gradeLevelsFilter,
          });
          if (error) {
            throw new Error(error.message);
          }
          // Round GPA to two decimals for consistency with bulk endpoint
          const rawGpa = gpa as number;
          const roundedGpa = typeof rawGpa === 'number' ? Number(rawGpa.toFixed(2)) : rawGpa;
          return { gpa: roundedGpa, method: parsed.method ?? 'simple' };
        },
      }),
    }
  })

  return result.toUIMessageStreamResponse();
}

// DELETE endpoint to soft delete a chat
export async function DELETE(req: Request) {
  try {
    const { chatId } = await req.json()
    
    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 })
    }
    
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Soft delete the chat by setting deleted_at timestamp
    const { error: deleteError } = await supabase
      .from('chats')
      .update({ deleted_at: new Date().toISOString() })
      .eq('chat_id', chatId)
      .eq('user_id', userData.user.id) // Ensure user owns the chat

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { chatId, title } = await request.json()

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 })
    }

    // Update chat title and updated_at timestamp
    const { data, error } = await supabase
      .from('chats')
      .update({ 
        title,
        updated_at: new Date().toISOString()
      })
      .eq('chat_id', chatId)
      .eq('user_id', userData.user.id) // Ensure user owns the chat
      .select()

    if (error) {
      return NextResponse.json({ error: 'Failed to update chat title' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Chat not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ success: true, chat: data[0] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}