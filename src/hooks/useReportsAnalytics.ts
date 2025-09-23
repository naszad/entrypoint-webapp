import { useCallback } from 'react';
import { trackEvent } from '@/libs/mixpanelClient';

export function useReportsAnalytics() {
  const trackReportOpened = useCallback((opts: { pageName: string; hasFilters: boolean; filterKeys: string[] }) => {
    trackEvent('Report Opened', {
      page: '/reports',
      target_page: opts.pageName,
      has_filters: opts.hasFilters,
      filter_keys: opts.filterKeys,
    });
  }, []);

  return { trackReportOpened };
}
