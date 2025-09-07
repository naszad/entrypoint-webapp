import { tool } from 'ai'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/supabaseServer'
import type { GetTableSchemaInput, GetTableSchemaOutput } from '@/types/ChatToolTypes';

export const getTableSchemaTool = tool<GetTableSchemaInput, GetTableSchemaOutput>({
  description:
    'Gets the schema (column names and data types) for a specific table. After finding relevant tables with `list_tables`, use this to understand their structure before writing a query.',
  inputSchema: z.object({
    tableName: z.string().describe('The name of the table to get the schema for.'),
  }),
  execute: async ({ tableName }) => {
    console.log(`Executing get_table_schema for table: ${tableName}`)
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_public_table_schema', {
      p_table_name: tableName,
    })

    if (error) {
      console.error(`Error getting schema for table ${tableName}:`, error)
      return { error: `Failed to get schema for table ${tableName}: ${error.message}` }
    }

    // Check if table exists (empty array means table doesn't exist or isn't accessible)
    if (!data || data.length === 0) {
      console.error(`Table does not exist:`, tableName)
      return { error: `Table '${tableName}' does not exist or has no accessible columns` }
    }

    console.log(`Schema for ${tableName}:`, data)
    return data
  },
})


