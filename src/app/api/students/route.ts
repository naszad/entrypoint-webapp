import { NextResponse } from 'next/server';
import { fetchStudentsByFilterCriteria } from '@/libs/studentsService';
import { FilterValue } from '@/components/DataTable/DataTable';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const filtersParam = url.searchParams.get('filters');
    const sort = url.searchParams.get('sort');
    const pageNumber = parseInt(url.searchParams.get('pageNumber') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
    const fetchWithCount = url.searchParams.get('fetchWithCount') === 'true';
    const activeOnly = url.searchParams.get('activeOnly') !== 'false'; // Default to true

    let filters: FilterValue[] = [];
    if (filtersParam) {
      filters = filtersParam.split(',').map(filter => {
        const [key, condition, value] = filter.split(':');
        return { key, condition, value };
      });
    }

    if (activeOnly && !filters.some(f => f.key === 'enrollmentStatus')) {
      filters.push({ key: 'enrollmentStatus', condition: 'eq', value: 'Active' });
    }

    const studentsResponse = await fetchStudentsByFilterCriteria({
      fetchWithCount,
      filters,
      sort,
      pagingInfo: { pageNumber, pageSize }
    });
    return NextResponse.json(studentsResponse);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 