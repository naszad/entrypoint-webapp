import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/supabaseServer';
import { fetchConfig } from '@/libs/configService';
import { FINALIZED_GRADE_CODES, CURRENT_YEAR_GRADE_CODES, ALL_GRADE_CODES } from '@/utils/gradeCodes';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: studentId } = await params;
  const searchParams = req.nextUrl.searchParams;
  const method = searchParams.get('method');
  const bulk = searchParams.get('bulk') === 'true';
  const finalOnly = searchParams.get('finalOnly') === 'true';
  const userId = searchParams.get('userId') || null;
  if (!studentId) {
    return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
  }

  const confg = await fetchConfig({userId: userId || undefined, configKeys: ['final_grade_codes', 'grade_code_sort']});

  // Get school-specific default method
  let resolvedMethod = method;
  if (!resolvedMethod) {
    try {
      const { data: linkData } = await supabase
        .from('school_student_link')
        .select('school_id')
        .eq('student_id', studentId)
        .order('start_date', { ascending: false })
        .limit(1)
        .single();

      if (linkData) {
        const { data: schoolData } = await supabase
          .from('schools')
          .select('gpa_config')
          .eq('school_id', linkData.school_id)
          .single();

        if (schoolData?.gpa_config) {
          const gpaConfig = schoolData.gpa_config as { default_method?: string };
          resolvedMethod = gpaConfig.default_method || 'simple';
        }
      }
    } catch (error) {
      console.error('Error resolving GPA method:', error);
    }
  }
  resolvedMethod = resolvedMethod || 'simple';

  try {
    if (bulk) {
      // Return comprehensive GPA data in one response
      return await getBulkGpaData(supabase, studentId, resolvedMethod, searchParams, confg);
    } else if (finalOnly) {
      // Return final terms GPA data
      return await getFinalTermsGpaData(supabase, studentId, userId, confg);
    } else {
      // Single GPA calculation (legacy support)
      return await getSingleGpa(supabase, studentId, resolvedMethod, searchParams);
    }
  } catch (error) {
    console.error('Error calculating GPA:', error);
    return NextResponse.json({ error: 'Failed to calculate GPA' }, { status: 500 });
  }
}

async function getBulkGpaData(
  supabase: SupabaseClient, 
  studentId: string, 
  method: string,
  searchParams: URLSearchParams,
  confg: { [key: string]: string[] }
) {
  // Allow customization via search params, default to all relevant codes

  const finalGradeCodes = confg['final_grade_codes'] ? confg['final_grade_codes'] : [...FINALIZED_GRADE_CODES];
  const allGradeCodes = confg['grade_code_sort'] ? confg['grade_code_sort'] : [...ALL_GRADE_CODES];
  const gradeCodesParam = searchParams.get('gradeCodes');
  const gradeCodes = gradeCodesParam?.split(',').map(s => s.trim()).filter(Boolean) || allGradeCodes;

  // Parse grade levels filter
  const gradeLevelsParam = searchParams.get('gradeLevels');
  const gradeLevels = gradeLevelsParam
    ? gradeLevelsParam.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
    : null;
  
  // Get current year label for default calculations
  const { data: schoolLinkData } = await supabase
    .from('school_student_link')
    .select('school_id')
    .eq('student_id', studentId)
    .order('start_date', { ascending: false })
    .limit(1)
    .single();

  let currentYearLabel: string | null = null;
  if (schoolLinkData) {
    const { data: currentYearData } = await supabase
      .from('years')
      .select('name')
      .eq('is_current', true)
      .limit(1)
      .single();
    if (currentYearData) {
      currentYearLabel = currentYearData.name;
    }
  }

  // Get all years for this student
  const { data: allYearsData } = await supabase
    .from('student_grades')
    .select('term:terms!inner(year:years!inner(name))')
    .eq('student_id', studentId)
    .not('term.year.name', 'is', null);
  
  type YearQueryResult = {
    term: {
      year: {
        name: string;
      };
    };
  };
  
  const allYearNames = [...new Set((allYearsData as unknown as YearQueryResult[] || []).map(g => g.term.year.name))];

  // Get all unique credit types for this student
  const { data: creditTypesData } = await supabase
    .from('student_grades')
    .select('credit_type')
    .eq('student_id', studentId)
    .in('grade_code', finalGradeCodes as string[])
    .not('credit_type', 'is', null);
  
  const creditTypes = [...new Set(creditTypesData?.map((ct: { credit_type: string }) => ct.credit_type) || [])];

  // Calculate multiple GPAs in parallel
  const gpaPromises = [
    // Cumulative GPA (Finalized grades only)
    supabase.rpc('calculate_gpa_dispatch', {
      p_student_id: studentId,
      p_method: method,
      p_grade_codes: finalGradeCodes,
      p_credit_types: null,
      p_year_labels: null, // All years
      p_grade_levels: gradeLevels,
    }),
    
    // Current year GPA (gradecodes only)
    supabase.rpc('calculate_gpa_dispatch', {
      p_student_id: studentId,
      p_method: method,
      p_grade_codes: CURRENT_YEAR_GRADE_CODES,
      p_credit_types: null,
      p_year_labels: currentYearLabel ? [currentYearLabel] : null,
      p_grade_levels: gradeLevels,
    }),
    
    // Credit type GPAs using finalized grades only
    ...creditTypes.map(creditType =>
      supabase.rpc('calculate_gpa_dispatch', {
        p_student_id: studentId,
        p_method: method,
        p_grade_codes: finalGradeCodes,
        p_credit_types: [creditType],
        p_year_labels: null, // All years
        p_grade_levels: gradeLevels,
      })
    ),
    
    // Individual gradecode GPAs for each year
    ...allYearNames.flatMap(yearName => 
      gradeCodes.map((code: string) => 
        supabase.rpc('calculate_gpa_dispatch', {
          p_student_id: studentId,
          p_method: method,
          p_grade_codes: [code],
          p_credit_types: null,
          p_year_labels: [yearName],
          p_grade_levels: gradeLevels,
        })
      )
    )
  ];

  const results = await Promise.all(gpaPromises);
  
  // Round cumulative and current year GPAs to 2 decimals
  const cumulativeRaw = results[0].data;
  const currentRaw = results[1].data;
  const cumulativeGpa = typeof cumulativeRaw === 'number' ? Number(cumulativeRaw.toFixed(2)) : cumulativeRaw;
  const currentYearGpa = typeof currentRaw === 'number' ? Number(currentRaw.toFixed(2)) : currentRaw;
  // Structure the response
  const response = {
    cumulative: { gpa: cumulativeGpa, method },
    currentYear: { gpa: currentYearGpa, method },
    byCreditType: {} as Record<string, number>,
    byYearAndGradeCode: {} as Record<string, Record<string, number>>
  };

  // Map credit type results
  creditTypes.forEach((creditType, index) => {
    const result = results[2 + index];
    if (!result.error && result.data !== null) {
      const raw = result.data as number;
      response.byCreditType[creditType] = typeof raw === 'number' ? Number(raw.toFixed(2)) : raw;
    }
  });

  // Map year/gradecode results
  let resultIndex = 2 + creditTypes.length;
  allYearNames.forEach(yearName => {
    response.byYearAndGradeCode[yearName] = {};
    gradeCodes.forEach((code: string) => {
      const result = results[resultIndex++];
      if (!result.error && result.data !== null) {
        const raw = result.data as number;
        response.byYearAndGradeCode[yearName][code] = typeof raw === 'number' ? Number(raw.toFixed(2)) : raw;
      }
    });
  });

  return NextResponse.json(response);
}

async function getSingleGpa(
  supabase: SupabaseClient, 
  studentId: string, 
  method: string, 
  searchParams: URLSearchParams
) {
  // Parse filters from query parameters
  const gradeCodesParam = searchParams.get('gradeCodes');
  const creditTypesParam = searchParams.get('creditTypes');
  const yearLabelsParam = searchParams.get('yearLabels');
  const yearLabelParam = searchParams.get('yearLabel'); // legacy support
  const gradeLevelsParam = searchParams.get('gradeLevels');
  const gradeCodes = gradeCodesParam?.split(',').map(s => s.trim()).filter(Boolean) || null;
  const creditTypes = creditTypesParam?.split(',').map(s => s.trim()).filter(Boolean) || null;
  const gradeLevels = gradeLevelsParam
    ? gradeLevelsParam.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
    : null;
  // Support both yearLabels array and single yearLabel (legacy)
  let yearLabels: string[] | null = null;
  if (yearLabelsParam) {
    yearLabels = yearLabelsParam.split(',').map(s => s.trim()).filter(Boolean);
  } else if (yearLabelParam) {
    yearLabels = [yearLabelParam];
  }

  const { data, error } = await supabase.rpc('calculate_gpa_dispatch', {
    p_student_id: studentId,
    p_method: method,
    p_grade_codes: gradeCodes,
    p_credit_types: creditTypes,
    p_year_labels: yearLabels,
    p_grade_levels: gradeLevels,
  });

  if (error) {
    throw error;
  }

  // Round single GPA to 2 decimals
  const rawGpa = data as number;
  const roundedGpa = typeof rawGpa === 'number' ? Number(rawGpa.toFixed(2)) : rawGpa;
  return NextResponse.json({ gpa: roundedGpa, method });
} 

async function getFinalTermsGpaData(
  supabase: SupabaseClient, 
  studentId: string, 
  userId: string | null,
  confg: { [key: string]: string[] }
) {

  const gradeCodes: string[] = confg['final_grade_codes'] ? confg['final_grade_codes'] : [...FINALIZED_GRADE_CODES];

  const { data, error } = await supabase.rpc('get_last_n_years_final_terms_gpa', {
    p_student_id: studentId,
    p_n: 3,
    p_grade_codes: gradeCodes,
  });
  
  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to calculate final terms GPAs' }, { status: 500 });
  }

  const finalTermsGpas = data.map((row: { year_name: string; grade_code: string; gpa: number }) => ({
    term: `${row.year_name} ${row.grade_code}`,
    gpa: row.gpa,
  }));

  return NextResponse.json({ finalTermsGpas });
}