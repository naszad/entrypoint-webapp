import { tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from './types';

type RpcListViewRow = {
  name: string | null;
  comment: string | null;
};

export function createListDatabaseViewsTool(context: ToolContext) {
  return tool({
    description:
      'Lists the database views that are safe for analytics-style queries. Use this before drafting SQL so you know the underlying view name.',
    inputSchema: z
      .object({
      search: z
        .string()
        .trim()
        .min(1)
        .max(50)
        .optional()
        .describe('Optional case-insensitive search filter applied to the view name or description.')
      })
      .default({}),
    execute: async (input) => {
      const normalizedSearch = input?.search?.trim().toLowerCase();

      const { data, error } = await context.supabase.rpc('list_views');

      if (error) {
        console.error('listDatabaseViewsTool: failed to load views from RPC', error);
        throw new Error('Unable to fetch view catalog. Try again later.');
      }

      const rows = Array.isArray(data) ? (data as RpcListViewRow[]) : [];
      const canonicalViews = rows
        .map((row) => ({
          name: row.name?.trim() ?? '',
          description: row.comment?.trim() || undefined
        }))
        .filter((view) => view.name.length > 0);

      const filteredViews = filterViews(canonicalViews, normalizedSearch);

      return {
        views: filteredViews,
        total: filteredViews.length
      };
    }
  });
}

function filterViews<T extends { name: string; description?: string }>(
  views: readonly T[],
  normalizedSearch?: string
): T[] {
  if (!normalizedSearch) {
    return [...views].sort((a, b) => a.name.localeCompare(b.name));
  }

  return views
    .filter((view) => {
      const haystack = `${view.name} ${view.description ?? ''}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
