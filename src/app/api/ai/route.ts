import { streamText, stepCountIs, UIMessage, convertToModelMessages } from 'ai'
import { filterStudentsTool } from './tools/filterStudents'
import { listTablesTool } from './tools/listTables'
import { getTableSchemaTool } from './tools/getTableSchema'
import { executeSqlTool } from './tools/executeSql'
import { getStudentGpaTool } from './tools/getStudentGpa'
import { navigateTool } from './tools/navigate'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@/utils/supabase/supabaseServer'
import { filterGradesTool } from './tools/filterGrades'
import { identifyStudentTool } from './tools/identifyStudent'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, model, chatId }: { 
    messages: UIMessage[]; 
    model: string; 
    chatId?: string; 
  } = await req.json()


  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let currentChatId = chatId

  // Create chat if none provided (fallback) - direct DB operation
  if (!currentChatId) {
    const userMessage = messages[messages.length - 1]
    const firstTextPart = userMessage?.parts?.find(part => part.type === 'text')
    const messageText = firstTextPart && 'text' in firstTextPart ? firstTextPart.text : 'New Chat'
    
    // Simple title generation without AI call
    const title = messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText

    const { data: chat, error } = await supabase
      .from('chats')
      .insert([{
        title: title.trim(),
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating chat:', error)
      return Response.json({ error: 'Failed to create chat' }, { status: 500 })
    }
    currentChatId = chat.chat_id
  }

  // Save user message - direct DB operation
  const userMessage = messages[messages.length - 1]
  if (userMessage && userMessage.role === 'user') {
    await supabase.from('messages').insert([{
      chat_id: currentChatId,
      role: 'user',
      parts: userMessage.parts,
      created_at: new Date().toISOString()
    }])
  }

  const systemMessage = `
You are a helpful AI assistant for school counselors and administrators. Your goal is to answer questions by querying the database or helping the user navigate the application. Select the best tool for the user's request based on the tool's description.

Key Guidelines:
- "Current year" refers to the school year where 'is_current' is true in the database.
- For any task involving a specific student, you must first use the 'identify_student' tool to get their unique ID. If the name is ambiguous, present the potential matches to the user for clarification.
- When referencing a student, use their full name and format it as a markdown link to their profile, like this: [Student's Full Name](/students/<studentId>).
- If the user asks a question that you can't answer with one of the other tools, you should inspect the database schema and see if there is a table that might be relevant (make sure to read the comments in the schema). If you find a table, use the \`get_table_schema\` tool to get the schema and understand the table better. Then use the \`execute_sql\` tool to execute a query on the table.
- Questions about students' goals, interests, and other non-academic information should be answered by looking for relevant tags in the tags table or meeting_notes. Search the tags table for potentially relevant tag names (if you don't find any relevant ones by assuming a name, then select all tag names and look for possibly relevant ones), then look in the student_tags table for the values to help answer the question. Questions about students' academic track should be contained by tags in the Academics tag_category.
- You may search the meeting_notes table for potentially relevant information about a single student. You may not search the meeting_notes table for information about multiple students at once.
- Provide only the final, user-facing answer. Do not include intermediate steps, tool outputs, or error messages in your response.
`

  const result = streamText({
    model: openai(model),
    system: systemMessage,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(10),
    tools: {
      filter_students: filterStudentsTool,
      filter_grades: filterGradesTool,
      list_tables: listTablesTool,
      get_table_schema: getTableSchemaTool,
      execute_sql: executeSqlTool,
      get_student_gpa: getStudentGpaTool,
      identify_student: identifyStudentTool,
      navigate: navigateTool,
    },
  })

  // Send sources and reasoning back to the client
  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
    onFinish: async ({ responseMessage }) => {
      // Save the complete assistant response message with all parts
      if (responseMessage && responseMessage.role === 'assistant') {
        console.log(`Saving assistant message with ${responseMessage.parts?.length || 0} parts:`, 
          responseMessage.parts?.map(part => part.type))
        
        await supabase.from('messages').insert([{
          chat_id: currentChatId,
          role: 'assistant',
          parts: responseMessage.parts, // This includes tool calls, tool results, and text
          created_at: new Date().toISOString(),
          metadata: {
            model
          }
        }])

        // Update chat timestamp
        await supabase
          .from('chats')
          .update({ updated_at: new Date().toISOString() })
          .eq('chat_id', currentChatId)
          .eq('user_id', user.id)
      }
    }
  });
}