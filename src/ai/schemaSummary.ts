/**
 * Schema context helper
 * ---------------------
 * Aggregates curated-view metadata (via Supabase `list_views` and `get_view_schema` RPCs) so agents
 * can ground prompts in real columns instead of hard-coded guesses. The twin in-flight caches keep
 * repeated pipeline runs inexpensive while still allowing updates within a few minutes.
 *
 * We keep this module at the `src/ai` root because both agents and tools rely on the shared
 * formatting/caching logic. Housing it beside the agent registry avoids circular imports that would
 * arise if each agent owned a separate implementation under `agents/` or `tools/`, and lets
 * orchestrators like `deepAnalysisAgent` embed schema awareness without duplicating Supabase calls.
 */
import type { AgentFactoryParams } from './agents/studentLookupAgent';

interface ViewListCacheEntry {
  views: string[];
  fetchedAt: number;
}

interface ViewSchemaCacheEntry {
  summary: string;
  fetchedAt: number;
}

export interface BuildSchemaContextOptions {
  supabase: AgentFactoryParams['context']['supabase'];
  preferredViews?: string[];
  includeAllViews?: boolean;
  maxColumnsPerView?: number;
}

export interface SchemaContextResult {
  availableViews: string[];
  summarizedViews: string[];
  summaryText: string | null;
}

const VIEW_LIST_TTL_MS = 5 * 60 * 1000;
const VIEW_SCHEMA_TTL_MS = 10 * 60 * 1000;

const viewListCache = new Map<string, ViewListCacheEntry>();
const viewSchemaCache = new Map<string, ViewSchemaCacheEntry>();

export async function buildSchemaContext({
  supabase,
  preferredViews,
  includeAllViews = false,
  maxColumnsPerView = 40,
}: BuildSchemaContextOptions): Promise<SchemaContextResult> {
  const availableViews = await fetchAvailableViews(supabase);

  const prioritized = new Set<string>();
  for (const view of preferredViews ?? []) {
    if (availableViews.includes(view)) {
      prioritized.add(view);
    }
  }

  if (prioritized.size === 0) {
    for (const defaultView of getDefaultPriorityViews()) {
      if (availableViews.includes(defaultView)) {
        prioritized.add(defaultView);
      }
    }
  }

  const remainingViews = includeAllViews
    ? availableViews.filter((view) => !prioritized.has(view))
    : [];

  const viewsToDescribe = includeAllViews
    ? [...prioritized, ...remainingViews]
    : [...prioritized];

  const summaries: string[] = [];
  for (const viewName of viewsToDescribe) {
    const summary = await fetchViewSchemaSummary({ supabase, viewName, maxColumnsPerView });
    if (summary) {
      summaries.push(summary);
    }
  }

  return {
    availableViews,
    summarizedViews: viewsToDescribe,
    summaryText: summaries.length ? summaries.join('\n') : null,
  };
}

function getDefaultPriorityViews(): string[] {
  return [
    'views.student_profiles',
    'views.student_tags',
    'views.student_academics',
    'views.student_attendance',
  ];
}

async function fetchAvailableViews(
  supabase: AgentFactoryParams['context']['supabase'],
): Promise<string[]> {
  const cacheKey = 'view-list';
  const cached = viewListCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < VIEW_LIST_TTL_MS) {
    return cached.views;
  }

  const { data, error } = await supabase.rpc('list_views');

  if (error) {
    console.error('schemaSummary: failed to list views', error);
    return cached?.views ?? [];
  }

  const views = Array.isArray(data)
    ? (data as Array<{ name?: string }>).map((entry) => entry?.name).filter((name): name is string => Boolean(name))
    : [];

  viewListCache.set(cacheKey, { views, fetchedAt: now });
  return views;
}

async function fetchViewSchemaSummary({
  supabase,
  viewName,
  maxColumnsPerView,
}: {
  supabase: AgentFactoryParams['context']['supabase'];
  viewName: string;
  maxColumnsPerView: number;
}): Promise<string | null> {
  const cached = viewSchemaCache.get(viewName);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < VIEW_SCHEMA_TTL_MS) {
    return cached.summary;
  }

  const { data, error } = await supabase.rpc('get_view_schema', {
    p_view_name: viewName,
  });

  if (error) {
    console.error(`schemaSummary: failed to fetch schema for ${viewName}`, error);
    return cached?.summary ?? null;
  }

  if (!Array.isArray(data) || data.length === 0) {
    return cached?.summary ?? null;
  }

  const formattedColumns = (data as Array<Record<string, unknown>>)
    .slice(0, maxColumnsPerView)
    .map((column) => formatColumn(column))
    .filter(Boolean)
    .join('; ');

  const truncated = data.length > maxColumnsPerView ? ` (showing first ${maxColumnsPerView} columns)` : '';
  const summary = `View ${viewName}${truncated}: ${formattedColumns}`;

  viewSchemaCache.set(viewName, { summary, fetchedAt: now });
  return summary;
}

function formatColumn(column: Record<string, unknown>): string {
  const name = String(column.column_name ?? column.columnName ?? 'unknown_column');
  const type = String(column.data_type ?? column.dataType ?? 'unknown_type');
  const comment = column.column_comment ?? column.comment;
  const note = typeof comment === 'string' && comment.trim().length > 0 ? ` - ${comment.trim()}` : '';
  return `${name} (${type})${note}`;
}
