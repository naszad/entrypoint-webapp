import { NextResponse } from 'next/server';
import { fetchStudentGrades, fetchStudentCurrentGrades } from '@/libs/studentsService';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const url = new URL(req.url);
    const isCurrent = url.searchParams.get('current') === 'true';

    if (isCurrent) {
      const currentGrades = await fetchStudentCurrentGrades(id);
      return NextResponse.json({ currentGrades });
    }

    const studentGrades = await fetchStudentGrades(id);
    return NextResponse.json(studentGrades);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred while fetching the student grades';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}