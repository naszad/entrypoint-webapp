'use server';

import { createClient } from '@/utils/supabase/supabaseServer';
import { StudentAbsencesResponse } from '@/types/StudentAbsences';
import { StudentTardiesResponse } from '@/types/StudentTardies';
import { FilterValue } from '@/components/DataTable/DataTable';

type AttendenceRequest = {
  studentId?: string;
};

type AttendenceResponse = {
 totalAbsences: number;
 totalTardies: number;
};

type AttendanceFilterRequest = {
  studentId: string;
  fetchWithCount?: boolean;
  filters: FilterValue[];
  sort?: string | null;
  pagingInfo?: {
    pageNumber: number;
    pageSize: number;
  };
};

export async function fetchAttendence(request: AttendenceRequest): Promise<AttendenceResponse> {
  try {
    const supabase = await createClient();
    const { studentId } = request;
    
    if (!studentId) {
      throw new Error('Student ID is required');
    }

    const { data } = await supabase
      .rpc('get_student_daily_absences_and_tardies', {
        p_student_id: studentId
      });

    if (!data || data.length === 0) {
      return {
        totalAbsences: 0,
        totalTardies: 0,
      };
    }

    const attendanceData = data[0];
    
    const response: AttendenceResponse = {
      totalAbsences: Number(attendanceData.total_absences) || 0,
      totalTardies: Number(attendanceData.total_tardies) || 0,
    };

    return response;
  } catch (err) {
    console.error(`Failed to fetch attendance data: ${err}`);
    return {
      totalAbsences: 0,
      totalTardies: 0,
    };
  }
}

// Column name mapping for absences
const getAbsenceColumnName = (key: string) => {
  switch (key) {
    case 'absenceDate':
      return 'absence_date';
    case 'absenceDateFrom':
      return 'absence_date';
    case 'absenceDateTo':
      return 'absence_date';
    case 'absenceDateRecentOnly':
      return 'absence_date';
    case 'yearName':
      return 'name'; // This will be handled with foreign table
    case 'sisCode':
      return 'sis_code';
    case 'normalizedAbsenceCode':
      return 'normalized_absence_code';
    case 'createdAt':
      return 'created_at';
    case 'createdAtFrom':
      return 'created_at';
    case 'createdAtTo':
      return 'created_at';
    default:
      return key;
  }
};

// Apply filters for absences
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const applyAbsenceFilters = (q: any, filters: FilterValue[]) => {
  filters.forEach((filter) => {
    if (!filter.value) {
      return; // Skip empty filters
    }
   
    let baseColumnKey = filter.key;
    if (filter.key.endsWith('RecentOnly') && parseInt(filter.value) > 0) {
      baseColumnKey = filter.key.replace('RecentOnly', '');
    }

    const columnName = getAbsenceColumnName(baseColumnKey);

    const filterOnYears = ['name'].includes(columnName);
    
    let targetColumn = columnName;
    // Handle foreign table columns
    if (filterOnYears) {
      targetColumn = `years.${columnName}`;
    }

    if (filter.key.endsWith('RecentOnly')) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const daysAgo = new Date();
      daysAgo.setDate(today.getDate() - parseInt(filter.value));
      
      const todayStr = today.toISOString().split('T')[0];
      const daysAgoStr = daysAgo.toISOString().split('T')[0];
      
      // Apply date range filter
      q = q.gte(targetColumn, daysAgoStr);
      q = q.lte(targetColumn, todayStr);
      return;
    }

    try {
      switch (filter.condition) {
        case 'contains':
          q = q.ilike(targetColumn, `%${filter.value}%`);
          break;
        case 'starts':
          q = q.ilike(targetColumn, `${filter.value}%`);
          break;
        case 'ends':
          q = q.ilike(targetColumn, `%${filter.value}`);
          break;
        case 'not':
          q = q.neq(targetColumn, filter.value);
          break;
        case 'not_contains':
          q = q.not(targetColumn, 'ilike', `%${filter.value}%`);
          break;
          case 'is_empty': {
            const expr = `${columnName}.is.null,${columnName}.eq.`;
            q = filterOnYears ? q.or(expr, { referencedTable: 'years' }) : q.or(expr);
            break;
          }
        case 'is_not_empty': {
          q = q.not(targetColumn, 'is', null);
          q = q.neq(targetColumn, '');
          break;
        }
        case 'gt':
          q = q.gt(targetColumn, filter.value);
          break;
        case 'lt':
          q = q.lt(targetColumn, filter.value);
          break;
        case 'gte':
          q = q.gte(targetColumn, filter.value);
          break;
        case 'lte':
          q = q.lte(targetColumn, filter.value);
          break;
        case 'in':
          // Handle multi-select values (pipe-separated) or single values
          if (filter.value.includes('|')) {
            const values = filter.value.split('|').filter(v => v.trim() !== '');
            q = q.in(targetColumn, values);
          } else {
            q = q.eq(targetColumn, filter.value);
          }
          break;
        default:
          q = q.eq(targetColumn, filter.value);
      }
    } catch (error) {
      console.error(`Error applying filter for column ${targetColumn}:`, error);
      // Continue with other filters instead of failing entirely
    }
  });
  return q;
};

export async function fetchAbsencesByFilterCriteria(request: AttendanceFilterRequest): Promise<StudentAbsencesResponse> {
  try {
    const supabase = await createClient();
    const { studentId, filters, sort, pagingInfo, fetchWithCount } = request;

    if (!studentId) {
      throw new Error('Student ID is required');
    }

    // Build the query
    let query = supabase
      .from('student_daily_absences')
      .select(`
        student_daily_absence_id,
        student_id,
        absence_date,
        year_id,
        sis_code,
        normalized_absence_code,
        external_source,
        external_name,
        created_at,
        updated_at,
        years!inner(
          year_id,
          name
        )
      `)
      .eq('student_id', studentId);

    // Apply filters
    query = applyAbsenceFilters(query, filters);

    // Apply sorting
    if (sort) {
      const [sortField, sortDirection] = sort.split(':');
      const sortColumn = getAbsenceColumnName(sortField);
      
      // Determine which table the column belongs to for sorting
      let foreignTable = null;
      if (['name'].includes(sortColumn)) {
        foreignTable = 'years';
      }

      if (foreignTable) {
        query = query.order(sortColumn, { ascending: sortDirection === 'asc', foreignTable });
      } else {
        query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
      }
    }

    // Apply pagination
    if (pagingInfo) {
      const from = (pagingInfo.pageNumber - 1) * pagingInfo.pageSize;
      const to = from + pagingInfo.pageSize - 1;
      query = query.range(from, to);
    }

    // Execute query
    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch absences: ${error.message}`);
    }

    // Get total count if requested
    let totalCount: number | undefined;
    if (fetchWithCount) {
      let countQuery = supabase
        .from('student_daily_absences')
        .select('*, years!inner(*)', { count: 'exact', head: true })
        .eq('student_id', studentId);
      
      // Apply the same filters to count query
      countQuery = applyAbsenceFilters(countQuery, filters);
      
      const { count, error: countError } = await countQuery;
      if (countError) {
        console.error('Count query error:', countError);
        throw new Error(countError.message);
      }
      totalCount = count || 0;
    }

    // Transform the data
    const absences = data?.map((absence) => ({
      studentDailyAbsenceId: absence.student_daily_absence_id as string,
      studentId: absence.student_id as string,
      absenceDate: absence.absence_date as string,
      yearId: absence.year_id as string,
      yearName: (absence.years as { name?: string })?.name || '',
      sisCode: absence.sis_code as string | undefined,
      normalizedAbsenceCode: absence.normalized_absence_code as string | undefined,
      externalSource: absence.external_source as string,
      externalName: absence.external_name as string | undefined,
      createdAt: absence.created_at as string,
      updatedAt: absence.updated_at as string,
    })) || [];

    return {
      absences,
      count: totalCount || 0,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`Failed to fetch absences by filter criteria. Error: ${message}`);
  }
}

// Column name mapping for tardies
const getTardyColumnName = (key: string) => {
  switch (key) {
    case 'courseName':
      return 'name'; // This will be handled with foreign table courses
    case 'termName':
      return 'abbreviation'; // This will be handled with foreign table terms
    case 'yearName':
      return 'name'; // This will be handled with foreign table years (through terms)
    case 'tardies':
      return 'tardies';
    default:
      return key;
  }
};

// Apply filters for tardies
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const applyTardyFilters = (q: any, filters: FilterValue[]) => {

  filters.forEach((filter) => {
    if (!filter.value) {
      return; // Skip empty filters
    }

    const columnName = getTardyColumnName(filter.key);

    const forighnTable = ['name', 'local_course_code'].includes(columnName) ? 'sections.courses' : ['abbreviation'].includes(columnName) ? 'terms' : columnName === 'name' && filter.key === 'yearName' ? 'terms.years' : null;
    
    let targetColumn = columnName;
    // Handle foreign table columns
    if (forighnTable) {
      targetColumn = `${forighnTable}.${columnName}`;
    }


    try {
      switch (filter.condition) {
        case 'contains':
          q = q.ilike(targetColumn, `%${filter.value}%`);
          break;
        case 'starts':
          q = q.ilike(targetColumn, `${filter.value}%`);
          break;
        case 'ends':
          q = q.ilike(targetColumn, `%${filter.value}`);
          break;
        case 'not':
          q = q.neq(targetColumn, filter.value);
          break;
        case 'not_contains':
          q = q.not(targetColumn, 'ilike', `%${filter.value}%`);
          break;
        case 'is_empty': {
          const expr = `${columnName}.is.null,${columnName}.eq.`;
          q = forighnTable ? q.or(expr, { referencedTable: forighnTable }) : q.or(expr);
          break;
        }
        case 'is_not_empty': {
          q = q.not(targetColumn, 'is', null);
          q = q.neq(targetColumn, '');
          break;
        }
        case 'gt':
          q = q.gt(targetColumn, filter.value);
          break;
        case 'lt':
          q = q.lt(targetColumn, filter.value);
          break;
        case 'gte':
          q = q.gte(targetColumn, filter.value);
          break;
        case 'lte':
          q = q.lte(targetColumn, filter.value);
          break;
        case 'in':
          // Handle multi-select values (pipe-separated) or single values
          if (filter.value.includes('|')) {
            const values = filter.value.split('|').filter(v => v.trim() !== '');
            q = q.in(targetColumn, values);
          } else {
            q = q.eq(targetColumn, filter.value);
          }
          break;
        default:
          q = q.eq(targetColumn, filter.value);
      }
    } catch (error) {
      console.error(`Error applying filter for column ${targetColumn}:`, error);
      // Continue with other filters instead of failing entirely
    }
  });
  return q;
};

export async function fetchPeriodTardiesByFilterCriteria(request: AttendanceFilterRequest): Promise<StudentTardiesResponse> {
  try {
    const supabase = await createClient();
    const { studentId, filters, sort, pagingInfo, fetchWithCount } = request;

    if (!studentId) {
      throw new Error('Student ID is required');
    }

    // Build the query
    let query = supabase
      .from('section_enrollments')
      .select(`
        section_enrollment_id,
        student_id,
        section_id,
        term_id,
        tardies,
        external_source,
        created_at,
        updated_at,
        terms!inner(
          term_id,
          abbreviation,
          years!inner(
            year_id,
            name
          )
        ),
        sections!inner(
          section_id,
          courses!inner(
            course_id,
            name,
            local_course_code
          )
        )
      `)
      .eq('student_id', studentId)
      .gt('tardies', 0);

    // Apply filters
    query = applyTardyFilters(query, filters);

    // Apply sorting
    if (sort) {
      const [sortField, sortDirection] = sort.split(':');
      const sortColumn = getTardyColumnName(sortField);
      
      // Determine which table the column belongs to for sorting
      let foreignTable = null;
      if (['name'].includes(sortColumn) && sortField === 'courseName') {
        foreignTable = 'sections.courses';
      }  else if (sortColumn === 'name' && sortField === 'yearName') {
        foreignTable = 'terms.years';
      }

      if (foreignTable) {
        query = query.order(sortColumn, { ascending: sortDirection === 'asc', foreignTable });
      } else {
        query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
      }
    }

    // Apply pagination
    if (pagingInfo) {
      const from = (pagingInfo.pageNumber - 1) * pagingInfo.pageSize;
      const to = from + pagingInfo.pageSize - 1;
      query = query.range(from, to);
    }

    // Execute query
    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch tardies: ${error.message}`);
    }

    // Get total count if requested
    let totalCount: number | undefined;
    if (fetchWithCount) {
      let countQuery = supabase
        .from('section_enrollments')
        .select(`
          *,
          terms!inner(*),
          sections!inner(
            *,
            courses!inner(*)
          )
        `, { count: 'exact', head: true })
        .eq('student_id', studentId)
        .gt('tardies', 0);
      
      // Apply the same filters to count query
      countQuery = applyTardyFilters(countQuery, filters);
      
      const { count, error: countError } = await countQuery;
      if (countError) {
        console.error('Count query error:', countError);
        throw new Error(countError.message);
      }
      totalCount = count || 0;
    }

    // Transform the data
    const tardies = data?.map((tardy) => {
      const terms = tardy.terms as { years?: { year_id?: string; name?: string }; abbreviation?: string };
      const sections = tardy.sections as { courses?: { name?: string; local_course_code?: string; teachers?: Array<{ first_name?: string; last_name?: string }> }};
      const teacher = sections?.courses?.teachers?.[0];
      
      return {
        sectionEnrollmentId: tardy.section_enrollment_id as string,
        studentId: tardy.student_id as string,
        sectionId: tardy.section_id as string,
        termId: tardy.term_id as string,
        tardies: tardy.tardies as number,
        yearId: terms?.years?.year_id || '',
        yearName: terms?.years?.name || '',
        courseName: sections?.courses?.name || '',
        courseNumber: sections?.courses?.local_course_code || '',
        teacherName: teacher 
          ? `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim()
          : undefined,
        termName: terms?.abbreviation || '',
        externalSource: tardy.external_source as string,
        createdAt: tardy.created_at as string,
        updatedAt: tardy.updated_at as string,
      };
    }) || [];

    return {
      tardies,
      count: totalCount || 0,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`Failed to fetch tardies by filter criteria. Error: ${message}`);
  }
}

