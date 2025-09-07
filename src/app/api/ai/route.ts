import { streamText, stepCountIs, UIMessage, convertToModelMessages } from 'ai'
import { filterStudentsTool } from './tools/filterStudents'
import { listTablesTool } from './tools/listTables'
import { getTableSchemaTool } from './tools/getTableSchema'
import { executeSqlTool } from './tools/executeSql'
import { getStudentGpaTool } from './tools/getStudentGpa'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@/utils/supabase/supabaseServer'

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
You are a helpful AI assistant for school counselors. Your goal is to answer questions by querying the school's database or by helping the user navigate the application.
When the user asks about their "current year" (e.g., "current year GPA"), you must interpret this as the school year with is_current = true in the database and pass that year label to the get_student_gpa tool via the yearLabels parameter.

If at any point it seems like the user hasn't provided enough information to answer their question, make use of the database query tools (\`list_tables\`, \`get_table_schema\`, \`execute_sql\`) to find the information you need. For example, if the user asks about a student's GPA, but only provides their first name (or a nickname or shortened name), you can use the database tools to narrow down what student they are referring to, retrieve their full name, and call the \`get_student_gpa\` tool.

If the user asks about a student and provides a name which does not appear in the database, use the execute_sql tool to review the names of all students to check if the user provided a nickname or shortened name of a student that is in the database. All students referenced in your response should be referred to by their full name in order to avoid confusion. Additionally, when you respond with the student's full name, you should use the execute_sql tool to get the student's id and then make their name a markdown link to the student's page in the application using the format: [student's full name](/students/<studentId from database>)

When a user asks a question, first determine their intent:
1.  Are they asking to **view, find, or display a list of students**? If so, use the \`filter_students\` tool **if** their query can be answered using the filters available in the filter_students tool (including GPA filtering). If it can't, use the database query tools (\`list_tables\`, \`get_table_schema\`, \`execute_sql\`) to find the information you need.
2.  Are they asking for a **specific piece of information, a fact, or a calculation** (e.g., "What grade is Jane Doe in?" or "How many students are there?")? If so, your goal is to find the answer in the database. Use the database query tools (\`list_tables\`, \`get_table_schema\`, \`execute_sql\`) depending on how much information you already have (i.e. if you have the necessary table names or column names, DON'T reuse those tools for this step).
3.  Are they asking for a **student's individual GPA or a filtered slice of their GPA** (e.g., cumulative or by subject)? If so, use the \`get_student_gpa\` tool with parameters \`studentName\`, \`method\`, \`gradeCodes\`, \`gradeLevels\`, \`creditTypes\`, and \`termIds\`.
4.  Are they asking to **filter students by GPA** (e.g., "show me students with GPA below 2.0", "students with GPA above 3.5")? Use the \`filter_students\` tool with the \`gpaFilter\` parameter.

Once you have the answer or have performed the navigation, present the information to the user in a clear and friendly format.

Do NOT include any intermediate attempts, error messages, or debugging commentary in your response. Only present the final answer message to the user.
`

  const result = streamText({
    model: openai(model),
    system: systemMessage,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(10),
    tools: {
      filter_students: filterStudentsTool,
      list_tables: listTablesTool,
      get_table_schema: getTableSchemaTool,
      execute_sql: executeSqlTool,
      get_student_gpa: getStudentGpaTool,
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