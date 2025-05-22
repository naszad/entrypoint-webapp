import { NextResponse } from 'next/server';
import { supabase } from '@/libs/supabaseClient'

export async function GET(
  request: Request,
  { params }: { params: { reportName: string } }
) {
  try {
    const { reportName } = await params;

    const query = supabase
      .from('reports')
      .select(`report_id,
        name
      `).eq('name', reportName);

    const { data } = await query;
    
    return NextResponse.json({ exists: data && data.length > 0 });
  } catch (error) {
    console.error('Error checking report:', error);
    return NextResponse.json(
      { error: 'Failed to check report' },
      { status: 500 }
    );
  }
} 