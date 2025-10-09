/**
 * Database Query Tools
 * Tools for exploring and querying the database schema
 */

import { tool } from 'ai';
import { z } from 'zod/v3';
import { ChatTool, ToolContext } from './types';
import { createClient } from '@/utils/supabase/supabaseServer';

export const listTablesTool: ChatTool = {
  metadata: {
    name: 'list_tables',
    category: 'data_query',
    description: 'Lists all available tables in the database.',
    systemMessageRules: [
      'Use list_tables as the first step when answering questions that require specific database information',
      'Always check table comments to understand their purpose'
    ]
  },
  definition: tool({
    description: `Lists all available tables in the database. Use the comments to understand the table better. This is the first step for answering a question that requires specific information. Use this if you do not know the database schema.`,
    inputSchema: z.object({}),
    execute: async () => {
      const supabase = await createClient();
      const { data, error } = await supabase.rpc('list_public_tables');

      if (error) {
        console.error('Error listing tables:', error);
        return { error: `Failed to list tables: ${error.message}` };
      }
      
      return data.map((t: { name: string }) => t.name);
    },
  })
};

export const getTableSchemaTool: ChatTool = {
  metadata: {
    name: 'get_table_schema',
    category: 'data_query',
    description: 'Gets the schema for a specific table.',
    systemMessageRules: [
      'After finding relevant tables with list_tables, use get_table_schema to understand their structure',
      'Read column comments to understand the data stored in each column'
    ]
  },
  definition: tool({
    description: 'Gets the schema (column names, data types, and comments) for a specific table. After finding relevant tables with `list_tables`, use this to understand their structure and purpose before writing a query.',
    inputSchema: z.object({
      tableName: z.string().describe('The name of the table to get the schema for.'),
    }),
    execute: async ({ tableName }) => {
      const supabase = await createClient();
      const { data, error } = await supabase.rpc('get_public_table_schema', { p_table_name: tableName });

      if (error) {
        console.error(`Error getting schema for table ${tableName}:`, error);
        return { error: `Failed to get schema for table ${tableName}: ${error.message}` };
      }
      
      return data;
    },
  })
};

export const executeSqlTool = (context: ToolContext): ChatTool => ({
  metadata: {
    name: 'execute_sql',
    category: 'data_query',
    description: 'Executes a read-only SQL SELECT query.',
    systemMessageRules: [
      'Only SELECT queries are allowed - never attempt UPDATE, DELETE, or INSERT operations',
      'Use execute_sql after exploring the schema with list_tables and get_table_schema',
      'Queries are automatically scoped to the user\'s selected school context'
    ]
  },
  definition: tool({
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

      const supabase = await createClient();
      const { data, error } = await supabase.rpc('execute_safe_select', { 
        query_text: sql,
        p_selected_school_id: context.selectedSchoolId
      });

      if (error) {
        console.error('Error executing SQL:', error);
        return { error: `Failed to execute query: ${error.message}` };
      }

      return data;
    },
  })
});
