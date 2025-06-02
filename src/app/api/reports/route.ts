import { NextResponse } from 'next/server';
import { fetchReportsByCriteria } from '@/libs/reportsService';
import { FilterValue } from '@/components/DataTable/DataTable';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const filtersParam = url.searchParams.get('filters');
    const sortField = url.searchParams.get('sortField') || '';
    const sortDirection = (url.searchParams.get('sortDirection') || 'asc') as 'asc' | 'desc';
    const pageNumber = parseInt(url.searchParams.get('pageNumber') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
    const userId = url.searchParams.get('userId') || '';

    let filters: FilterValue[] = [];
    if (filtersParam) {
      filters = filtersParam.split(',').map(filter => {
        const [key, condition, value] = filter.split(':');
        return { key, condition, value };
      });
    }

    const reports = await fetchReportsByCriteria({
      userId,
      filters,
      sortInfo: { sortField, sortDirection },
      pagingInfo: { pageNumber, pageSize }
    });
    return NextResponse.json(reports);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred while fetching the reports';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 