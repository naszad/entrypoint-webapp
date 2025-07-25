import { NextResponse } from 'next/server';
import { fetchMeetingNotesByFilterCriteria } from '@/libs/meetingNotes';
import { FilterValue } from '@/components/DataTable/DataTable';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const filtersParam = url.searchParams.get('filters');
    const sort = url.searchParams.get('sort');
    const pageNumber = parseInt(url.searchParams.get('pageNumber') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
    const fetchWithCount = url.searchParams.get('fetchWithCount') === 'true';
    const userId = url.searchParams.get('userId') ?? '';

    let filters: FilterValue[] = [];
    if (filtersParam) {
      filters = filtersParam.split(',').map(filter => {
        const [key, condition, value] = filter.split(':');
        return { key, condition, value };
      });
    }

    const meetingNotesResponse = await fetchMeetingNotesByFilterCriteria({
      fetchWithCount,
      userId,
      filters,
      sort,
      pagingInfo: { pageNumber, pageSize }
    });
    return NextResponse.json(meetingNotesResponse);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 