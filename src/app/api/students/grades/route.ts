import { NextResponse } from 'next/server';
import { fetchStudentCurrentGrades } from '@/libs/studentsService';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const studentId = url.searchParams.get('studentId') || '';

    const studentTermGradeInfo = await fetchStudentCurrentGrades(studentId);

    return NextResponse.json({ studentTermGradeInfo });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 