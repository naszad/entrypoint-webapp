'use server';

import { createClient } from '@/utils/supabase/supabaseServer'
import { FilterValue } from '@/components/DataTable/DataTable';
import { StudentInfo } from '@/types/StudentInfo';
import { cookies } from 'next/headers';
import { YearGradeInfo } from '@/types/YearGradeInfo';
import { StudentGradeInfo } from '@/types/StudentGradeInfo';
import { FINALIZED_GRADE_CODES, ALL_GRADE_CODES } from '@/utils/gradeCodes';
import { StudentCurrentGrades } from '@/types/StudentCurrentGrades';

type StudentsRequest = {
  fetchWithCount?: boolean;
  filters: FilterValue[];
  sort?: string | null;
  pagingInfo?: {
    pageNumber: number;
    pageSize: number;
  };
  mostRecentOnly?: boolean;
};

type StudentsResponse = {
  data: StudentInfo[];
  count?: number;
};

type StudentGradesResponse = {
  gradeCodes: string[];
  data: StudentGradeInfo[];
  count?: number;
};

type StudentSchoolLinkStudentsView = {
  student_id: string;
  school_id: string;
  created_at: Date;
  updated_at: Date;
  first_name: string;
  middle_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  grade_level: number;
  gender: string;
  date_of_birth: Date;
  external_source: string;
  external_key: string;
  external_id: string;
  external_key_hash: string;
  external_name: string;
  graduation_year: number;
  enrollment_status: string;
  homeroom_name: string;
  student_number: string;
  lunch_id: string;
  state_student_number: string;
  race: string;
  customer_id: string;
};

const getColumnName = (key: string) => {
  switch (key) {
    case 'fullName':
      return 'full_name';
    case 'homeroomName':
      return 'homeroom_name';
    case 'enrollmentStatus':
      return 'enrollment_status';
    case 'studentNumber':
      return 'student_number';
    case 'lunchId':
      return 'lunch_id';
    case 'stateStudentNumber':
      return 'state_student_number';
    case 'race':
      return 'race';
    case 'gradeLevel':
      return 'grade_level';
    case 'dateOfBirth':
      return 'date_of_birth';
    case 'dateOfBirthFrom':
      return 'date_of_birth';
    case 'dateOfBirthTo':
      return 'date_of_birth';
    case 'createdAt':
      return 'created_at';
    case 'createdAtFrom':
      return 'created_at';
    case 'createdAtTo':
      return 'created_at';
    case 'createdAtRecentOnly':
      return 'created_at';
    case 'updatedAt':
      return 'updated_at';
    case 'updatedAtFrom':
      return 'updated_at';
    case 'updatedAtTo':
      return 'updated_at';
    case 'updatedAtRecentOnly':
      return 'updated_at';
    default:
      return key;
  }
}

// Helper function to determine if a column is an integer type
const isIntegerColumn = (columnName: string): boolean => {
  const integerColumns = [
    'grade_level'
  ];
  return integerColumns.includes(columnName);
}

const getGradeColumnName = (key: string) => {
  switch (key) {
    case 'fullName':
      return 'full_name';
    case 'local_course_code':
      return 'local_course_code';
    case 'course_name':
      return 'course_name';
    case 'gradeLetter':
      return 'grade_letter';
    case 'gradePercentage':
      return 'grade_percent';
    case 'gradeCode':
      return 'grade_code';
    case 'updatedAt':
      return 'updated_at';
    case 'updatedAtFrom':
      return 'updated_at';
    case 'updatedAtTo':
      return 'updated_at';
    default:
      return key;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const applyFilters = (q: any, filters: FilterValue[]) => {

  filters.forEach((filter) => {
    // Skip GPA filter as it needs to be applied after data fetching
    if (filter.key === 'gpa') {
      return;
    }
    
    let baseColumnKey = filter.key;
    if (filter.key.endsWith('RecentOnly') && parseInt(filter.value) > 0) {
      baseColumnKey = filter.key.replace('RecentOnly', '');
    }

    const columnName = getColumnName(baseColumnKey);

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
        if (isIntegerColumn(columnName)) {
          q = q.eq(columnName, filter.value);
        } else {
          q = q.ilike(columnName, filter.value);
        }
    }
  });
  return q;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const applyGradeFilters = (q: any, filters: FilterValue[]) => {
  if (!filters || filters.length === 0) {
    return q;
  }

  filters.forEach((filter) => {
    // Handle RecentOnly filters
    let baseColumnKey = filter.key;
    if (filter.key.endsWith('RecentOnly') && parseInt(filter.value) > 0) {
      baseColumnKey = filter.key.replace('RecentOnly', '');
    }
      
    if (!filter.value) {
      return; // Skip empty filters
    }

    const columnName = getGradeColumnName(baseColumnKey);

    if (filter.key.endsWith('RecentOnly')) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const daysAgo = new Date();
      daysAgo.setDate(today.getDate() - parseInt(filter.value));
      
      const todayStr = today.toISOString().split('T')[0];
      const daysAgoStr = daysAgo.toISOString().split('T')[0];
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

export async function fetchStudentsByFilterCriteria(request: StudentsRequest): Promise<StudentsResponse> {
  try {
    const supabase = await createClient()
    const { filters, sort, pagingInfo, fetchWithCount } = request;
    const cookieStore = await cookies();
    const selectedSchoolId = cookieStore.get('selectedSchoolId')?.value;
    
    // Extract GPA filter if present
    const gpaFilter = filters.find(f => f.key === 'gpa');

    let query = supabase
      .from('school_student_link_students_view')
      .select(`*`)
      .eq('school_id', selectedSchoolId);
    
    // Apply filters to main query
    query = applyFilters(query, filters);

    // Apply sorting
    if (sort) {
      const [sortField, sortDirection] = sort.split(':');
      if (sortField !== 'gpa') {
        const sortColumn = getColumnName(sortField);
        query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
      }
    }

    // If GPA filter exists, we need to fetch all students first (without pagination)
    // to calculate GPAs before filtering
    if (gpaFilter && pagingInfo) {
      // Don't apply pagination yet if we need to filter by GPA
    } else if (pagingInfo) {
      const from = (pagingInfo.pageNumber - 1) * pagingInfo.pageSize;
      const to = from + pagingInfo.pageSize - 1;
      query = query.range(from, to);
    }

    // Execute main query
    const { data, error } = await query;

    if (error) {
      console.error('Data query error:', error);
      throw new Error(error.message);
    }

    if (!data) {
      return {
        data: [],
        count: 0
      };
    }

    const studentSchoolLinks: StudentSchoolLinkStudentsView[] = data as unknown as StudentSchoolLinkStudentsView[];
    const studentIds = studentSchoolLinks.map(link => link.student_id);

    let gpaMap: Record<string, number> = {};
    if (studentIds.length > 0) {
      try {
        const { data: gpaData, error: gpaError } = await supabase.rpc('calculate_gpa_for_students', {
          p_student_ids: studentIds,
          p_method: null,
          p_grade_codes: FINALIZED_GRADE_CODES,
          p_credit_types: null,
          p_year_labels: null,
        });

        if (gpaError) {
          console.error(`Error fetching GPAs for students:`, gpaError);
        } else {
          gpaMap = (gpaData as { student_id: string; gpa: number }[]).reduce((acc, item) => {
            acc[item.student_id] = item.gpa;
            return acc;
          }, {} as Record<string, number>);
        }
      } catch (error) {
        console.error(`Exception fetching GPAs for students:`, error);
      }
    }


    let students: StudentInfo[] = studentSchoolLinks.map((studentSchoolLink): StudentInfo | null => {
      // It's possible for students to be null if the filter returns a link but no matching student
      if (!studentSchoolLink) {
        return null;
      }

      return {
        studentId: studentSchoolLink.student_id,  
        schoolId: studentSchoolLink.school_id,
        gpa: gpaMap[studentSchoolLink.student_id] ?? null,
        firstName: studentSchoolLink.first_name,
        middleName: studentSchoolLink.middle_name,
        lastName: studentSchoolLink.last_name,
        fullName: studentSchoolLink.full_name,
        email: studentSchoolLink.email,
        phone: studentSchoolLink.phone,
        gradeLevel: studentSchoolLink.grade_level,
        gender: studentSchoolLink.gender,
        dateOfBirth: studentSchoolLink.date_of_birth ? new Date(studentSchoolLink.date_of_birth) : null,
        createdAt: new Date(studentSchoolLink.created_at),
        updatedAt: new Date(studentSchoolLink.updated_at),
        externalSource: studentSchoolLink.external_source,
        externalKey: studentSchoolLink.external_key,
        externalId: studentSchoolLink.external_id,
        externalKeyHash: studentSchoolLink.external_key_hash,
        externalName: studentSchoolLink.external_name,
        graduationYear: studentSchoolLink.graduation_year,
        enrollmentStatus: studentSchoolLink.enrollment_status,
        studentNumber: studentSchoolLink.student_number,
        lunchId: studentSchoolLink.lunch_id,
        stateStudentNumber: studentSchoolLink.state_student_number,
        race: studentSchoolLink.race,
        homeroomName: studentSchoolLink.homeroom_name,
        customerId: studentSchoolLink.customer_id
      };
    }).filter((student): student is StudentInfo => student !== null);

    // Apply GPA sorting if requested (must be done in-memory since GPA is calculated)
    if (sort) {
      const [sortField, sortDirection] = sort.split(':');
      if (sortField === 'gpa') {
        students.sort((a, b) => {
          const gpaA = a.gpa ?? 0;
          const gpaB = b.gpa ?? 0;
          return sortDirection === 'asc' ? gpaA - gpaB : gpaB - gpaA;
        });
      }
    }

    // Apply GPA filter if present
    if (gpaFilter) {
      const gpaValue = parseFloat(gpaFilter.value);
      if (!isNaN(gpaValue)) {
        students = students.filter(student => {
          const studentGpa = student.gpa ?? 0;
          switch (gpaFilter.condition) {
            case 'eq':
              return Math.abs(studentGpa - gpaValue) < 0.01; // Allow small floating point differences
            case 'not':
              return Math.abs(studentGpa - gpaValue) >= 0.01;
            case 'gt':
              return studentGpa > gpaValue;
            case 'lt':
              return studentGpa < gpaValue;
            case 'gte':
              return studentGpa >= gpaValue;
            case 'lte':
              return studentGpa <= gpaValue;
            default:
              return Math.abs(studentGpa - gpaValue) < 0.01;
          }
        });
      }
    }

    // Apply pagination after GPA filtering if needed
    const totalBeforePagination = students.length;
    if (gpaFilter && pagingInfo) {
      const from = (pagingInfo.pageNumber - 1) * pagingInfo.pageSize;
      const to = from + pagingInfo.pageSize;
      students = students.slice(from, to);
    }

    let countResult: number | undefined = undefined;
    if (fetchWithCount) {
      if (gpaFilter) {
        // If GPA filter is present, use the count from before pagination
        countResult = totalBeforePagination;
      } else {
        let countQuery = supabase
          .from('school_student_link_students_view')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', selectedSchoolId);
        
        // Apply the same filters to count query
        countQuery = applyFilters(countQuery, filters);
        
        const { count, error: countError } = await countQuery;
        if (countError) {
          throw new Error(countError.message);
        }
        countResult = count || 0;
      }
    }

    return {
      data: students,
      count: countResult
    };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    throw new Error(`Failed to fetch students. Error: ${message}`);
  }
} 

export async function countStudentsByFilterCriteria(request: StudentsRequest): Promise<number> {
  try {
    const supabase = await createClient()
    const { filters } = request;
    const cookieStore = await cookies();
    const selectedSchoolId = cookieStore.get('selectedSchoolId')?.value;

    let countQuery = supabase
        .from('school_student_link_students_view')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', selectedSchoolId);
      
      // Apply the same filters to count query
      countQuery = applyFilters(countQuery, filters);
      
      const { count, error: countError } = await countQuery;
      if (countError) {
        throw new Error(countError.message);
      }
      return count || 0;
  } catch (err) {
    throw new Error(`Failed to count students ${err}`);
  }
}

export async function fetchStudentById(studentId: string): Promise<StudentInfo> {
  try {
    const supabase = await createClient()
    const cookieStore = await cookies();
    const selectedSchoolId = cookieStore.get('selectedSchoolId')?.value;
    
    const query = supabase
    .from('students')
    .select(`
      student_id,
      first_name,
      middle_name,
      last_name,
      full_name,
      email,
      phone,
      grade_level,
      gender,
      date_of_birth,
      created_at,
      updated_at,
      external_source,
      external_key,
      external_id,
      external_key_hash,
      external_name,
      graduation_year,
      enrollment_status,
      homeroom_name,
      customer_id,
      student_number
    `)
    .eq('student_id', studentId)
    .single();

    const { data: student, error } = await query;

    if (error) {
      throw new Error(error.message);
    }    

    const parsedStudent: StudentInfo = {
      studentId: student.student_id,
      schoolId: selectedSchoolId || '',
      firstName: student.first_name,
      middleName: student.middle_name,
      lastName: student.last_name,
      fullName: student.full_name,
      email: student.email,
      phone: student.phone,
      gradeLevel: student.grade_level,
      gender: student.gender,
      dateOfBirth: student.date_of_birth ? new Date(student.date_of_birth) : null,
      createdAt: new Date(student.created_at),
      updatedAt: new Date(student.updated_at),
      externalSource: student.external_source,
      externalKey: student.external_key,
      externalId: student.external_id,
      externalKeyHash: student.external_key_hash,
      externalName: student.external_name,
      graduationYear: student.graduation_year,
      enrollmentStatus: student.enrollment_status,
      homeroomName: student.homeroom_name,
      customerId: student.customer_id,
      studentNumber: student.student_number,
    }

    return parsedStudent;
  } catch (err) { 
    throw new Error(`Failed to fetch student ${err}`);
  }
}

export async function fetchStudentCurrentGrades(studentId: string): Promise<StudentCurrentGrades> {
  try {
    const supabase = await createClient();

    // Call the new Postgres function to retrieve current grades
    const { data, error } = await supabase.rpc('get_current_student_grades', {
      p_student_id: studentId,
    });

    if (error) {
      throw new Error(`Failed to fetch current grades: ${error.message}`);
    }

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return { currentTerm: null, courses: [] };
    }

    type RpcRow = {
      course_id: string;
      course_name: string;
      course_number: string;
      grade_letter: string | null;
      grade_percent: number | null;
      updated_at: string | null;
      term_abbreviation: string | null;
    };

    const rows = data as RpcRow[];

    // Assuming all rows belong to the same current term
    const currentTerm = rows.length > 0 ? rows[0].term_abbreviation : null;

    const courses = rows.map((row) => ({
      courseId: row.course_id,
      courseName: row.course_name,
      courseNumber: row.course_number,
      gradeLetter: row.grade_letter,
      gradePercentage: row.grade_percent,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    }));

    return {
      currentTerm,
      courses,
    };
  } catch (err) {
    throw new Error(`Failed to fetch student current grades: ${err}`);
  }
}

const sortGradeCodes = (codes: string[]): string[] => {
  return [...codes].sort((a, b) => {
    const idxA = ALL_GRADE_CODES.findIndex(code => code === a);
    const idxB = ALL_GRADE_CODES.findIndex(code => code === b);
    const posA = idxA === -1 ? ALL_GRADE_CODES.length : idxA;
    const posB = idxB === -1 ? ALL_GRADE_CODES.length : idxB;
    return posA - posB;
  });
};

export async function fetchStudentGrades(studentId: string): Promise<YearGradeInfo[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('student_grades_with_current_year_view')
      .select('*')
      .eq('student_id', studentId);

    if (error) {
      throw new Error(`Failed to fetch student grades: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedData = data as any[];

    const validGrades = typedData.filter(grade => 
      (grade.year_id && grade.term_id && grade.course_id) || grade.is_current === true
    );

    if (validGrades.length === 0) {
      return [];
    }

    // Extract unique school years for sorting
    const allSchoolYears = validGrades.map(grade => ({
      year_id: grade.year_id,
      name: grade.year_name,
      start_year: grade.start_year,
      end_year: grade.end_year,
      is_current: grade.is_current
    }));
    const uniqueSchoolYears = allSchoolYears.filter((schoolYear, index, self) => 
      index === self.findIndex(y => y.year_id === schoolYear.year_id)
    );

    const yearMap = new Map<string, YearGradeInfo>();
    const finalGradeCodesByYear = new Map<string, Set<string>>();

    validGrades.forEach((grade) => {
      const schoolYearId = grade.year_id;
      
      if (!yearMap.has(schoolYearId)) {
        yearMap.set(schoolYearId, {
          yearId: schoolYearId,
          label: grade.year_name,
          isCurrent: grade.is_current,
          gradeCodes: [],
          creditTypes: []
        });
      }

      if (!finalGradeCodesByYear.has(schoolYearId)) {
        finalGradeCodesByYear.set(schoolYearId, new Set<string>());
      }

      const yearData = yearMap.get(schoolYearId)!;
      const gradeCode = grade.grade_code;
      const creditType = grade.credit_type || 'Other';

      if (!yearData.gradeCodes.includes(gradeCode)) {
        yearData.gradeCodes.push(gradeCode);
      }

      if (!grade.is_current && grade.grade_status === 'Final') {
        finalGradeCodesByYear.get(schoolYearId)!.add(gradeCode);
      }

      let creditTypeData = yearData.creditTypes.find(ct => ct.creditType === creditType);
      if (!creditTypeData) {
        creditTypeData = {
          creditType,
          gpa: 3.2, // TODO: Will be calculated later
          courses: []
        };
        yearData.creditTypes.push(creditTypeData);
      }

      const courseId = grade.course_id;
      let courseData = creditTypeData.courses.find(c => c.courseId === courseId);
      if (!courseData) {
        courseData = {
          courseId,
          courseName: grade.course_name,
          courseNumber: grade.local_course_code || '',
          grades: {}
        };
        creditTypeData.courses.push(courseData);
      }

      courseData.grades[gradeCode] = {
        gradeLetter: grade.grade_letter || '',
        gradePercentage: Number(grade.grade_percent) || 0,
        gradePoints: Number(grade.gpa_points) || 0,
        updatedAt: grade.updated_at ? new Date(grade.updated_at).toISOString() : ''
      };
    });

    const yearGradeInfoArray: YearGradeInfo[] = Array.from(yearMap.values()).map(yearData => {
      const sortedGradeCodes = sortGradeCodes(yearData.gradeCodes);
      
      const filteredGradeCodes = yearData.isCurrent 
        ? sortedGradeCodes
        : sortedGradeCodes.filter(code => finalGradeCodesByYear.get(yearData.yearId)?.has(code) ?? false);

      const processedCreditTypes = yearData.creditTypes.sort((a, b) => a.creditType.localeCompare(b.creditType));

      return {
        yearId: yearData.yearId,
        label: yearData.label,
        isCurrent: yearData.isCurrent,
        gradeCodes: filteredGradeCodes,
        creditTypes: processedCreditTypes
      };
    });

    yearGradeInfoArray.sort((a, b) => {
      const yearA = uniqueSchoolYears.find(y => y.year_id === a.yearId);
      const yearB = uniqueSchoolYears.find(y => y.year_id === b.yearId);
      return (yearA?.start_year || 0) - (yearB?.start_year || 0);
    });

    return yearGradeInfoArray;
    
  } catch (err) {
    throw new Error(`Failed to fetch student grades: ${err}`);
  }
}

export async function fetchStudentGradesByFilterCriteria(request: StudentsRequest): Promise<StudentGradesResponse> {
  try {
    const supabase = await createClient()
    const { filters, sort, pagingInfo, fetchWithCount, mostRecentOnly } = request;
    const cookieStore = await cookies();
    const selectedSchoolId = cookieStore.get('selectedSchoolId')?.value;


    const { data: gradeCodeRows } = await supabase
      .from('student_grades')
      .select('grade_code')
      .order('grade_code', { ascending: true });

    const rows = (gradeCodeRows as Array<{ grade_code: string | null }> | null) ?? [];
    const gradeCodes: string[] = Array.from(
      new Set(
        rows
          .map((r) => r.grade_code)
          .filter((v): v is string => !!v)
      )
    );

    let query = supabase
      .from(mostRecentOnly ? 'latest_student_grades_courses_students_view' : 'student_grades_courses_students_view')
      .select(`*`)
      .eq('school_id', selectedSchoolId);

      // Apply filters to main query
      query = applyGradeFilters(query, filters);

    // Apply sorting
    if (sort) {
      const [sortField, sortDirection] = sort.split(':');
      const sortColumn = getGradeColumnName(sortField);
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
      console.error('Student grades query error:', error);
      throw new Error(error.message);
    }

    if (!data) {
      return {
        gradeCodes,
        data: [],
        count: 0
      };
    }

    // Transform data to StudentGradeInfo format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const studentGrades: StudentGradeInfo[] = (data as any[])
      .filter((gradeRecord) => gradeRecord.student_id && gradeRecord.course_id)
      .map((gradeRecord): StudentGradeInfo => ({
        grade_id: gradeRecord.grade_id,
        student_id: gradeRecord.student_id,
        section_id: gradeRecord.section_id,
        term_id: gradeRecord.term_id,
        course_id: gradeRecord.course_id,
        grade_letter: gradeRecord.grade_letter,
        grade_code: gradeRecord.grade_code,
        grade_percent: gradeRecord.grade_percent,
        gpa_points: gradeRecord.gpa_points,
        credit_hours_earned: gradeRecord.credit_hours_earned,
        potential_credit_hours: gradeRecord.potential_credit_hours,
        gpa_added_value: gradeRecord.gpa_added_value,
        credit_type: gradeRecord.credit_type,
        grade_status: gradeRecord.grade_status,
        comment: gradeRecord.comment,
        grade_level: gradeRecord.grade_level,
        created_at: new Date(gradeRecord.created_at),
        updated_at: new Date(gradeRecord.updated_at),
        customer_id: gradeRecord.customer_id,
        local_course_code: gradeRecord.local_course_code,
        course_name: gradeRecord.course_name,
        first_name: gradeRecord.first_name,
        middle_name: gradeRecord.middle_name,
        last_name: gradeRecord.last_name,
        full_name: gradeRecord.full_name,
        email: gradeRecord.email,
        graduation_year: gradeRecord.graduation_year
      }));

    // Execute count query if needed
    let totalCount: number | undefined;
    if (fetchWithCount) {
      let countQuery = supabase
        .from(mostRecentOnly ? 'latest_student_grades_courses_students_view' : 'student_grades_courses_students_view')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', selectedSchoolId);
      
      // Apply the same filters to count query
      countQuery = applyGradeFilters(countQuery, filters);
      
      const { count, error: countError } = await countQuery;
      if (countError) {
        console.error('Count query error:', countError);
        throw new Error(countError.message);
      }
      totalCount = count || 0;
    }

    return {
      gradeCodes,
      data: studentGrades,
      count: totalCount
    };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    throw new Error(`Failed to fetch student grades by filter criteria. Error: ${message}`);
  }
}
