import { tool } from 'ai'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/supabaseServer'

export const listTablesTool = tool({
  description:
    'Lists all available tables in the database. This is the first step for answering a question that requires specific information. Use this if you do not know the database schema.',
  parameters: z.object({}),
  execute: async () => {
    console.log('Executing list_tables tool')
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('list_public_tables')

    if (error) {
      console.error('Error listing tables:', error)
      return { error: `Failed to list tables: ${error.message}` }
    }

    console.log('Tables found:', data)
    return data.map((t: { name: string }) => t.name)
  },
})


