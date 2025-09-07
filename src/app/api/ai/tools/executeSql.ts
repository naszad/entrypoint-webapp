import { tool } from 'ai'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/supabaseServer'
import { cookies } from 'next/headers'
import type { ExecuteSqlInput, ExecuteSqlOutput } from '@/types/ChatToolTypes';

export const executeSqlTool = tool<ExecuteSqlInput, ExecuteSqlOutput>({
  description:
    `Executes a final, read-only SQL 'SELECT' query to get specific information from the database. Use this after you have explored the schema with 'list_tables' and 'get_table_schema' to construct a precise query. If you already have the information necessary to construct the query, skip the schema exploration and use this tool to execute it.`,
  inputSchema: z.object({
    sql: z.string().describe('The SQL SELECT query to execute.'),
  }),
  execute: async ({ sql }) => {
    console.log(`Executing SQL: ${sql}`)
    if (!sql.trim().toLowerCase().startsWith('select')) {
      const err_msg = 'Only SELECT queries are allowed.'
      console.error(err_msg)
      return { error: err_msg }
    }

    const cookieStore = cookies()
    const selectedSchoolId = (await cookieStore).get('selectedSchoolId')?.value

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('execute_safe_select', {
      query_text: sql,
      p_selected_school_id: selectedSchoolId,
    })

    if (error) {
      console.error('Error executing SQL:', error)
      return { error: `Failed to execute query: ${error.message}` }
    }

    console.log('Query result:', data)
    return data
  },
})


