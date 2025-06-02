import { NextResponse } from 'next/server';
import { fetchStudentById } from '@/libs/studentsService';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const student = await fetchStudentById(id);
    return NextResponse.json(student);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred while fetching the student';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 