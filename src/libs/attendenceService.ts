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
      return 'year_name'; // This will be handled with foreign table
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

    if (filter.key.endsWith('RecentOnly')) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const daysAgo = new Date();
      daysAgo.setDate(today.getDate() - parseInt(filter.value));
      
      const todayStr = today.toISOString().split('T')[0];
      const daysAgoStr = daysAgo.toISOString().split('T')[0];
      
      // Apply date range filter
      q = q.gte(columnName, daysAgoStr);
      q = q.lte(columnName, todayStr);
      return;
    }

    try {
      switch (filter.condition) {
        case 'contains':
          q = q.ilike(columnName, `%${filter.value}%`);
          break;
        case 'starts':
          q = q.ilike(columnName, `${filter.value}%`);
          break;
        case 'ends':
          q = q.ilike(columnName, `%${filter.value}`);
          break;
        case 'not':
          q = q.neq(columnName, filter.value);
          break;
        case 'not_contains':
          q = q.not(columnName, 'ilike', `%${filter.value}%`);
          break;
          case 'is_empty': {
            q = q.or(`${columnName}.is.null,${columnName}.eq.`);
            break;
          }
        case 'is_not_empty': {
          q = q.not(columnName, 'is', null);
          q = q.neq(columnName, '');
          break;
        }
        case 'gt':
          q = q.gt(columnName, filter.value);
          break;
        case 'lt':
          q = q.lt(columnName, filter.value);
          break;
        case 'gte':
          q = q.gte(columnName, filter.value);
          break;
        case 'lte':
          q = q.lte(columnName, filter.value);
          break;
        case 'in':
          // Handle multi-select values (pipe-separated) or single values
          if (filter.value.includes('|')) {
            const values = filter.value.split('|').filter(v => v.trim() !== '');
            q = q.in(columnName, values);
          } else {
            q = q.eq(columnName, filter.value);
          }
          break;
        default:
          q = q.eq(columnName, filter.value);
      }
    } catch (error) {
      console.error(`Error applying filter for column ${columnName}:`, error);
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
      .from('student_daily_absences_years_view')
      .select(`*`)
      .eq('student_id', studentId);

    // Apply filters
    query = applyAbsenceFilters(query, filters);

    // Apply sorting
    if (sort) {
      const [sortField, sortDirection] = sort.split(':');
      const sortColumn = getAbsenceColumnName(sortField);
      query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
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
        .from('student_daily_absences_years_view')
        .select('*', { count: 'exact', head: true })
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
      yearName: absence.year_name || '',
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
      return 'course_name'; // This will be handled with foreign table courses
    case 'termName':
      return 'abbreviation'; // This will be handled with foreign table terms
    case 'yearName':
      return 'year_name'; // This will be handled with foreign table years (through terms)
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

    try {
      switch (filter.condition) {
        case 'contains':
          q = q.ilike(columnName, `%${filter.value}%`);
          break;
        case 'starts':
          q = q.ilike(columnName, `${filter.value}%`);
          break;
        case 'ends':
          q = q.ilike(columnName, `%${filter.value}`);
          break;
        case 'not':
          q = q.neq(columnName, filter.value);
          break;
        case 'not_contains':
          q = q.not(columnName, 'ilike', `%${filter.value}%`);
          break;
        case 'is_empty': {
          q = q.or(`${columnName}.is.null,${columnName}.eq.`);
          break;
        }
        case 'is_not_empty': {
          q = q.not(columnName, 'is', null);
          q = q.neq(columnName, '');
          break;
        }
        case 'gt':
          q = q.gt(columnName, filter.value);
          break;
        case 'lt':
          q = q.lt(columnName, filter.value);
          break;
        case 'gte':
          q = q.gte(columnName, filter.value);
          break;
        case 'lte':
          q = q.lte(columnName, filter.value);
          break;
        case 'in':
          // Handle multi-select values (pipe-separated) or single values
          if (filter.value.includes('|')) {
            const values = filter.value.split('|').filter(v => v.trim() !== '');
            q = q.in(columnName, values);
          } else {
            q = q.eq(columnName, filter.value);
          }
          break;
        default:
          q = q.eq(columnName, filter.value);
      }
    } catch (error) {
      console.error(`Error applying filter for column ${columnName}:`, error);
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
      .from('section_enrollments_terms_years_sections_courses_view')
      .select(`*`)
      .eq('student_id', studentId);

    // Apply filters
    query = applyTardyFilters(query, filters);

    // Apply sorting
    if (sort) {
      const [sortField, sortDirection] = sort.split(':');
      const sortColumn = getTardyColumnName(sortField);
      query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
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
        .from('section_enrollments_terms_years_sections_courses_view')
        .select(`*`, { count: 'exact', head: true })
        .eq('student_id', studentId);
      
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
      
      return {
        sectionEnrollmentId: tardy.section_enrollment_id as string,
        studentId: tardy.student_id as string,
        sectionId: tardy.section_id as string,
        termId: tardy.term_id as string,
        tardies: tardy.tardies as number,
        yearId: tardy.year_id || '',
        yearName: tardy.year_name || '',
        courseName: tardy.course_name || '',  
        courseNumber: tardy.local_course_code || '',
        termName: tardy.abbreviation || '',
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

