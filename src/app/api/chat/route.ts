import { CoreMessage, streamText, tool } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@/utils/supabase/supabaseServer'
import { z } from 'zod'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  const { messages }: { messages: CoreMessage[] } = await req.json()

  const systemMessage = `You are a helpful AI assistant for school counselors. Your goal is to answer questions by querying the school's database.

You have access to the following tools to interact with the database:
- \`list_tables()\`: Returns a list of all table names in the database.
- \`get_table_schema(tableName: string)\`: Returns the schema for a specific table, including column names and data types.
- \`execute_sql(sql: string)\`: Executes a read-only \`SELECT\` SQL query and returns the result as JSON.

Here's how you should approach answering questions:
1.  **Understand the User's Goal:** Analyze the user's question to determine what information is needed.
2.  **Explore the Database:** If you don't know the database schema, start by using \`list_tables()\` to see what's available. Then, use \`get_table_schema()\` on tables that seem relevant to get more details about their columns. You may need to call this multiple times for different tables.
3.  **Formulate a Query:** Once you understand the tables and their columns, write a PostgreSQL \`SELECT\` query to retrieve the necessary information. Make sure your query is specific and efficient (e.g., use \`LIMIT\` when appropriate).
4.  **Execute and Analyze:** Run your query using \`execute_sql()\`. Examine the results to ensure they answer the user's question.
5.  **Self-Correction:** If your query fails or returns unexpected results, analyze the error or output, revise your query or your plan, and try again. For example, you might need to re-examine the schema or join tables differently.
6.  **Provide the Final Answer:** Once you have the correct information from the database, present it to the user in a clear, friendly, and easy-to-understand natural language format. Do not just output the raw JSON from the database.

**Important Rules:**
- You **must** use the provided tools to answer questions about the database. Do not make up information.
- Always use the tool-calling process. Do not stop after just one tool call if you don't have the final answer.
- You can only perform read operations (\`SELECT\` queries).
- Maintain student confidentiality at all times.
- If you have explored the database and cannot find the information, inform the user about what you checked and why you cannot answer the question.`

  const result = await streamText({
    model: openai('gpt-4o'),
    system: systemMessage,
    messages,
    maxSteps: 10,
    tools: {
      list_tables: tool({
        description: 'Lists all tables in the public schema of the database.',
        parameters: z.object({}),
        execute: async () => {
          console.log('Executing list_tables tool');
          const supabase = await createClient()
          const { data, error } = await supabase.rpc('list_public_tables');

          if (error) {
            console.error('Error listing tables:', error);
            return { error: `Failed to list tables: ${error.message}` };
          }
          
          console.log('Tables found:', data);
          return data.map((t: { name: string }) => t.name);
        },
      }),
      get_table_schema: tool({
        description: 'Gets the schema (column names and data types) for a specific table in the public schema.',
        parameters: z.object({
          tableName: z.string().describe('The name of the table to get the schema for.'),
        }),
        execute: async ({ tableName }) => {
          console.log(`Executing get_table_schema for table: ${tableName}`);
          const supabase = await createClient()
          const { data, error } = await supabase.rpc('get_public_table_schema', { p_table_name: tableName });

          if (error) {
            console.error(`Error getting schema for table ${tableName}:`, error);
            return { error: `Failed to get schema for table ${tableName}: ${error.message}` };
          }
          
          console.log(`Schema for ${tableName}:`, data);
          return data;
        },
      }),
      execute_sql: tool({
        description: `Executes a read-only SQL query. IMPORTANT: This function requires a PostgreSQL stored procedure named 'execute_safe_select' to be created in your database with the following definition:
          CREATE OR REPLACE FUNCTION execute_safe_select(query_text TEXT)
          RETURNS JSON AS $$
          DECLARE
            result JSON;
          BEGIN
            IF lower(query_text) NOT LIKE 'select%' THEN
              RAISE EXCEPTION 'Only SELECT queries are allowed.';
            END IF;
            EXECUTE 'SELECT json_agg(t) FROM (' || query_text || ') t' INTO result;
            RETURN result;
          END;
          $$ LANGUAGE plpgsql;
          `,
        parameters: z.object({
          sql: z.string().describe('The SQL SELECT query to execute.'),
        }),
        execute: async ({ sql }) => {
          console.log(`Executing SQL: ${sql}`);
          if (!sql.trim().toLowerCase().startsWith('select')) {
            const err_msg = 'Only SELECT queries are allowed.';
            console.error(err_msg);
            return { error: err_msg };
          }

          const supabase = await createClient()
          const { data, error } = await supabase.rpc('execute_safe_select', { query_text: sql });

          if (error) {
            console.error('Error executing SQL:', error);
            return { error: `Failed to execute query: ${error.message}` };
          }

          console.log('Query result:', data);
          return data;
        },
      }),
    }
  })

  return result.toDataStreamResponse()
}
