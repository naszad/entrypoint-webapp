import { NextResponse } from 'next/server';
import { fetchRecentMeetingNotes } from '@/libs/meetingNotes';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string}> }
) {
  try {
    const { id } = await params;
    const meetingNotes = await fetchRecentMeetingNotes(id);
    return NextResponse.json(meetingNotes);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred while fetching the meeting notes';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}