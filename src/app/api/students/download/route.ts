import { NextRequest, NextResponse } from 'next/server';
import { fetchStudentsByFilterCriteria } from '@/libs/studentsService';
import { FilterValue } from '@/components/DataTable/DataTable';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filtersParam = searchParams.get('filters');
    const sort = searchParams.get('sort') || '';
    const columns = searchParams.get('columns') || '';
    const activeOnly = searchParams.get('activeOnly') !== 'false'; // Default to true

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
      filters,
      sort
    });

    // Format headers by splitting the comma-separated string and wrapping each in quotes
    const headers = columns.split(',')
      .map(header => `"${header.trim().split(/(?=[A-Z])/).join(' ').replace(/^\w/, c => c.toUpperCase())}"`)
      .join(',') + '\n';

    const rows = studentsResponse.data.map(student =>
      columns.split(',').map(key => student[key as keyof typeof student])
        .map(val => `"${(val ?? '').toString().replace(/"/g, '""')}"`) // Escape quotes
        .join(',')
    ).join('\n');
  
    const csvContent = headers + rows;
  
    // Create a ReadableStream from the CSV content
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(csvContent));
        controller.close();
      }
    });
  
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="students.csv"'
      }
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 