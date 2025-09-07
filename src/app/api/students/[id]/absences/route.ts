import { NextRequest, NextResponse } from 'next/server';
import { fetchAttendence } from '@/libs/attendenceService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    const attendence = await fetchAttendence({
      studentId: studentId,
    });
    return NextResponse.json(attendence);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 