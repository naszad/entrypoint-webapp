import { tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from './types';

type RpcViewSchemaRow = {
  column_name: string | null;
  data_type: string | null;
  comment: string | null;
};

export function createGetViewSchemaTool(context: ToolContext) {
  return tool({
    description:
      'Describes the columns in a supported analytics view. Use this after selecting a view so your SQL references valid columns.',
    inputSchema: z.object({
      viewName: z.string().min(1).max(64).describe('Exact view name (case sensitive) to inspect.')
    }),
    execute: async ({ viewName }) => {
      const normalized = viewName.trim();

      if (!normalized) {
        throw new Error('Provide a view name to inspect.');
      }

      const { data, error } = await context.supabase.rpc('get_view_schema', { p_view_name: normalized });

      if (error) {
        console.error('getViewSchemaTool: failed to fetch schema', { viewName: normalized, error });
        throw new Error(`Unable to load schema for "${normalized}". Try listDatabaseViews first to verify the name.`);
      }

      const rows = Array.isArray(data) ? (data as RpcViewSchemaRow[]) : [];

      if (rows.length === 0) {
        throw new Error(`View "${normalized}" is not exposed in the curated views schema.`);
      }

      const columns = rows
        .map((row) => ({
          name: row.column_name?.trim() ?? '',
          dataType: row.data_type?.trim() ?? '',
          description: row.comment?.trim() || undefined
        }))
        .filter((column) => column.name.length > 0);

      return {
        viewName: normalized,
        columns
      };
    }
  });
}
