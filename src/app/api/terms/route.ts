import { NextResponse } from 'next/server';
import { fetchTermsForDate } from '@/libs/termsService';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get('date') ?? undefined;
    const schoolId = url.searchParams.get('schoolId') ?? undefined;

    const result = await fetchTermsForDate({
      date,
      schoolId,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const statusCode = err instanceof Error && /schoolId is required/.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
