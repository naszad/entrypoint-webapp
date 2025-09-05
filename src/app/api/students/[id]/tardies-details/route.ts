import { NextRequest, NextResponse } from 'next/server';
import { fetchPeriodTardiesByFilterCriteria } from '@/libs/attendenceService';
import { FilterValue } from '@/components/DataTable/DataTable';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;
    const url = new URL(req.url);
    
    const filtersParam = url.searchParams.get('filters');
    const sort = url.searchParams.get('sort');
    const pageNumber = parseInt(url.searchParams.get('pageNumber') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
    const fetchWithCount = url.searchParams.get('fetchWithCount') === 'true';

    let filters: FilterValue[] = [];
    if (filtersParam && filtersParam.trim() !== '') {
      filters = filtersParam.split(',').map(filter => {
        const [key, condition, value] = filter.split(':');
        return { key, condition, value };
      });
    }

    const result = await fetchPeriodTardiesByFilterCriteria({
      studentId,
      fetchWithCount,
      filters,
      sort,
      pagingInfo: { pageNumber, pageSize }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching student tardies details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student tardies details' },
      { status: 500 }
    );
  }
}
