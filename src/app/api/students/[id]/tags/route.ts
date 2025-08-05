import { NextResponse } from 'next/server';
import { 
  getStudentTags, 
  addNewStudentTag, 
  updateStudentTag, 
  deleteStudentTag 
} from '@/libs/tagsService';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const studentTags = await getStudentTags(id);
    return NextResponse.json(studentTags);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred while fetching student tags';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    const { tagId, tagName, tagCategoryId, value } = body;
    
    if (!tagName || !tagCategoryId || !value) {
      return NextResponse.json(
        { error: 'Missing required fields: tagName, tagCategoryId, and value are required' },
        { status: 400 }
      );
    }

    const result = await addNewStudentTag({
      studentId: id,
      tagId,
      tagName,
      tagCategoryId,
      value,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred while adding student tag';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { studentTagId, value } = body;
    
    if (!studentTagId || !value) {
      return NextResponse.json(
        { error: 'Missing required fields: studentTagId and value are required' },
        { status: 400 }
      );
    }

    const result = await updateStudentTag(studentTagId, value);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred while updating student tag';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { studentTagId } = body;
    
    if (!studentTagId) {
      return NextResponse.json(
        { error: 'Missing required field: studentTagId is required' },
        { status: 400 }
      );
    }

    const result = await deleteStudentTag(studentTagId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred while deleting student tag';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
