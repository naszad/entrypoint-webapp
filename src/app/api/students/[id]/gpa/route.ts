import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/supabaseServer';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: studentId } = await params;
  const searchParams = req.nextUrl.searchParams;
  const method = searchParams.get('method');
  let resolvedMethod = method;

  if (!studentId) {
    return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
  }

  if (!resolvedMethod) {
    try {
      const { data: linkData, error: linkError } = await supabase
        .from('school_student_link')
        .select('school_id')
        .eq('student_id', studentId)
        .order('start_date', { ascending: false })
        .limit(1)
        .single();
      
      if (linkError) {
        console.error('Error fetching school link:', linkError);
      }

      if (linkData) {
        const { data: schoolData, error: schoolError } = await supabase
          .from('schools')
          .select('gpa_config')
          .eq('school_id', linkData.school_id)
          .single();

        if (schoolError) {
          console.error('Error fetching school config:', schoolError);
        }

        if (schoolData && schoolData.gpa_config) {
          const gpaConfig = schoolData.gpa_config as { default_method?: string };
          resolvedMethod = gpaConfig.default_method || 'simple';
        } else {
          resolvedMethod = 'simple';
        }
      } else {
        resolvedMethod = 'simple';
      }
    } catch (error) {
      console.error('Error resolving GPA method:', error);
      resolvedMethod = 'simple';
    }
  }

  try {
    const { data, error } = await supabase.rpc('calculate_gpa_dispatch', {
      p_student_id: studentId,
      p_method: resolvedMethod,
    });

    if (error) {
      console.error('Error calling calculate_gpa_dispatch', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ gpa: data, method: resolvedMethod }, { status: 200 });
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 