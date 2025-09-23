import { useCallback } from 'react';
import { trackEvent } from '@/libs/mixpanelClient';
import { FilterValue } from '@/components/DataTable/DataTable';

// Build a minimal summary: just distinct column keys and count.
function buildFilterSummary(filters: FilterValue[]): { count: number; keys: string[] } {
  const keys = Array.from(new Set(filters.map(f => f.key))).sort();
  return { count: keys.length, keys };
}

export function useStudentsAnalytics() {
  const trackExport = useCallback((opts: { filterValues: FilterValue[]; columnCount: number }) => {
    const summary = buildFilterSummary(opts.filterValues);
    trackEvent('Students Export', {
      page: '/students',
      filter_count: summary.count,
      filter_keys: summary.keys,
      column_count: opts.columnCount,
    });
  }, []);

  const trackFiltersChanged = useCallback((opts: { filterValues: FilterValue[] }) => {
    const summary = buildFilterSummary(opts.filterValues);
    trackEvent('Students Filters Applied', {
      page: '/students',
      filter_count: summary.count,
      filter_keys: summary.keys,
    });
  }, []);

  return { trackExport, trackFiltersChanged };
}
