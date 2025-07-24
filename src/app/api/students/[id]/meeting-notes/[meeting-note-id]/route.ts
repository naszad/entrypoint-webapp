import { NextResponse } from 'next/server';
import { deleteMeetingNote, fetchMeetingNotesByStudentIdAndMeetingNoteId, updateMeetingNote } from '@/libs/meetingNotes';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string, 'meeting-note-id': string }> }
) {
  try {
    const { id, 'meeting-note-id': meetingNoteId } = await params;
    const meetingNote = await fetchMeetingNotesByStudentIdAndMeetingNoteId(id, meetingNoteId);
    return NextResponse.json(meetingNote);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred while fetching the meeting note';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string, 'meeting-note-id': string }> }
) {
  try {
    const { 'meeting-note-id': meetingNoteId } = await params;
    const { notes, summary, userId, private: isPrivate } = await req.json();

    if (!notes || typeof notes !== 'string') {
      return NextResponse.json({ error: 'Notes are required' }, { status: 400 });
    }

    if (!summary || typeof summary !== 'string') {
      return NextResponse.json({ error: 'Summary is required' }, { status: 400 });
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const data = await updateMeetingNote(meetingNoteId, notes, summary, userId, isPrivate);

    console.log('Update meeting note response: ', data);

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred while updating the meeting note';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string, 'meeting-note-id': string }> }
) {
  try {
    const { 'meeting-note-id': meetingNoteId } = await params;
    const { userId } = await req.json();


    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const data = await deleteMeetingNote(meetingNoteId, userId);

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred while deleting the meeting note';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
