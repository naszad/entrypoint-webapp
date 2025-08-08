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
};

type StudentsResponse = {
  data: StudentInfo[];
  count?: number;
};

type StudentGradesResponse = {
  data: StudentGradeInfo[];
  count?: number;
};

type StudentSchoolLink = {
  student_id: string;
  school_id: string;
  students: {
    first_name: string;
    middle_name: string;
    last_name: string;
    full_name: string;
    email: string;
    phone: string;
    grade_level: number;
    gender: string;
    date_of_birth: Date;
    created_at: Date;
    updated_at: Date;
    external_source: string;
    external_key: string;
    external_id: string;
    external_key_hash: string;
    external_name: string;
    graduation_year: number;
    enrollment_status: string;
    homeroom_name: string;
    customer_id: string;
  }
};

const getColumnName = (key: string) => {
  switch (key) {
    case 'fullName':
      return 'full_name';
    case 'homeroomName':
      return 'homeroom_name';
    case 'enrollmentStatus':
      return 'enrollment_status';
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

const getGradeColumnName = (key: string) => {
  switch (key) {
    case 'fullName':
      return 'full_name';
    case 'course_localCourseCode':
      return 'local_course_code';
    case 'course_name':
      return 'name';
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

const studentsFilterApplied = (filters: FilterValue[]) => {
  return filters.some(f => {
    const columnName = getColumnName(f.key);
    return !['student_id', 'school_id'].includes(columnName);
  });
};

const gradesFilterApplied = (filters: FilterValue[]) => {
  return filters.some(f => {
    const columnName = getGradeColumnName(f.key);
    return !['student_id', 'school_id', 'grade_id', 'course_id', 'term_id'].includes(columnName);
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const applyFilters = (q: any, filters: FilterValue[]) => {

  filters.forEach((filter) => {
    
    let baseColumnKey = filter.key;
    if (filter.key.endsWith('RecentOnly') && parseInt(filter.value) > 0) {
      baseColumnKey = filter.key.replace('RecentOnly', '');
    }

    const columnName = getColumnName(baseColumnKey);
    const filterOnStudentTable = ![
      'student_id',
      'school_id',
    ].includes(columnName);
    
    const targetColumn = filterOnStudentTable ? `students.${columnName}` : columnName;

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
      default:
        q = q.eq(targetColumn, filter.value);
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
    
    let targetColumn = columnName;
    // Handle different table columns
    if (['full_name'].includes(columnName)) {
      // Student table columns
      targetColumn = `student.${columnName}`;
    } else if (['local_course_code', 'name'].includes(columnName)) {
      targetColumn = `course.${columnName}`;
    } 

    if (filter.key.endsWith('RecentOnly')) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const daysAgo = new Date();
      daysAgo.setDate(today.getDate() - parseInt(filter.value));
      
      const todayStr = today.toISOString().split('T')[0];
      const daysAgoStr = daysAgo.toISOString().split('T')[0];
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

export async function fetchStudentsByFilterCriteria(request: StudentsRequest): Promise<StudentsResponse> {
  try {
    const supabase = await createClient()
    const { filters, sort, pagingInfo, fetchWithCount } = request;
    const cookieStore = await cookies();
    const selectedSchoolId = cookieStore.get('selectedSchoolId')?.value;
    
    const hasStudentFilters = studentsFilterApplied(filters);

    let query = supabase
      .from('school_student_link')
      .select(`
        student_id,
        school_id,
        students(
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
          customer_id
        )
      `)
      .eq('school_id', selectedSchoolId);
    

    // Apply filters to main query
    query = applyFilters(query, filters);
    if (hasStudentFilters) {
      query = query.not('students', 'is', 'null');
    }

    // Apply sorting
    if (sort) {
      const [sortField, sortDirection] = sort.split(':');
      const sortColumn = getColumnName(sortField);
      const onStudentTable = !['student_id', 'school_id'].includes(sortColumn);

      if (onStudentTable) {
        query = query.order(sortColumn, { ascending: sortDirection === 'asc', foreignTable: 'students' });
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

    const studentSchoolLinks: StudentSchoolLink[] = data as unknown as StudentSchoolLink[];
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


    const students: StudentInfo[] = studentSchoolLinks.map((studentSchoolLink): StudentInfo | null => {
      // It's possible for students to be null if the filter returns a link but no matching student
      if (!studentSchoolLink.students) {
        return null;
      }

      return {
        studentId: studentSchoolLink.student_id,  
        schoolId: studentSchoolLink.school_id,
        gpa: gpaMap[studentSchoolLink.student_id] ?? null,
        firstName: studentSchoolLink.students.first_name,
        middleName: studentSchoolLink.students.middle_name,
        lastName: studentSchoolLink.students.last_name,
        fullName: studentSchoolLink.students.full_name,
        email: studentSchoolLink.students.email,
        phone: studentSchoolLink.students.phone,
        gradeLevel: studentSchoolLink.students.grade_level,
        gender: studentSchoolLink.students.gender,
        dateOfBirth: studentSchoolLink.students.date_of_birth ? new Date(studentSchoolLink.students.date_of_birth) : null,
        createdAt: new Date(studentSchoolLink.students.created_at),
        updatedAt: new Date(studentSchoolLink.students.updated_at),
        externalSource: studentSchoolLink.students.external_source,
        externalKey: studentSchoolLink.students.external_key,
        externalId: studentSchoolLink.students.external_id,
        externalKeyHash: studentSchoolLink.students.external_key_hash,
        externalName: studentSchoolLink.students.external_name,
        graduationYear: studentSchoolLink.students.graduation_year,
        enrollmentStatus: studentSchoolLink.students.enrollment_status,
        homeroomName: studentSchoolLink.students.homeroom_name,
        customerId: studentSchoolLink.students.customer_id
      };
    }).filter((student): student is StudentInfo => student !== null);

    let countResult: number | undefined = undefined;
    if (fetchWithCount) {
      let countQuery = supabase
        .from('school_student_link')
        .select(hasStudentFilters ? '*,students!inner(*)' : '*', { count: 'exact', head: true })
        .eq('school_id', selectedSchoolId);
      
      // Apply the same filters to count query
      countQuery = applyFilters(countQuery, filters);
      
      const { count, error: countError } = await countQuery;
      if (countError) {
        throw new Error(countError.message);
      }
      countResult = count || 0;
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
    const hasStudentFilters = studentsFilterApplied(filters);

    let countQuery = supabase
        .from('school_student_link')
        .select(hasStudentFilters ? '*,students!inner(*)' : '*', { count: 'exact', head: true })
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
      customer_id
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
      .from('student_grades')
      .select(`
        grade_id,
        credit_type,
        grade_letter,
        grade_code,
        grade_percent,
        gpa_points,
        grade_status,
        updated_at,
        course:courses (
          course_id,
          name,
          local_course_code
        ),
        term:terms (
          term_id,
          abbreviation,
          year:years (
            year_id,
            name,
            start_year,
            end_year
          )
        )
      `)
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
      grade.term && grade.term.year && grade.course
    );

    if (validGrades.length === 0) {
      return [];
    }

    const allSchoolYears = validGrades.map(grade => grade.term.year);
    const uniqueSchoolYears = allSchoolYears.filter((schoolYear, index, self) => 
      index === self.findIndex(y => y.year_id === schoolYear.year_id)
    );
    const currentSchoolYear = uniqueSchoolYears.reduce((latest, current) => 
      current.start_year > latest.start_year ? current : latest
    );

    const yearMap = new Map<string, YearGradeInfo>();
    const finalGradeCodesByYear = new Map<string, Set<string>>();

    validGrades.forEach((grade) => {
      const schoolYearId = grade.term.year.year_id;
      const schoolYearName = grade.term.year.name;
      const isCurrentYear = schoolYearId === currentSchoolYear.year_id;
      
      if (!yearMap.has(schoolYearId)) {
        yearMap.set(schoolYearId, {
          yearId: schoolYearId,
          label: schoolYearName,
          isCurrent: isCurrentYear,
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

      if (!isCurrentYear && grade.grade_status === 'Final') {
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

      const courseId = grade.course.course_id;
      let courseData = creditTypeData.courses.find(c => c.courseId === courseId);
      if (!courseData) {
        courseData = {
          courseId,
          courseName: grade.course.name,
          courseNumber: grade.course.local_course_code || '',
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
    const { filters, sort, pagingInfo, fetchWithCount } = request;
    const cookieStore = await cookies();
    const selectedSchoolId = cookieStore.get('selectedSchoolId')?.value;

    const hasGradeFilters = gradesFilterApplied(filters);

    // First, get the student IDs for the selected school
    const { data: schoolStudentLinks, error: schoolError } = await supabase
      .from('school_student_link')
      .select('student_id')
      .eq('school_id', selectedSchoolId);

    if (schoolError) {
      throw new Error(schoolError.message);
    }

    if (!schoolStudentLinks || schoolStudentLinks.length === 0) {
      return {
        data: [],
        count: 0
      };
    }

    const studentIds = schoolStudentLinks.map(link => link.student_id);

    let query = supabase
      .from('student_grades')
      .select(`
        grade_id,
        student_id,
        section_id,
        term_id,
        course_id,
        grade_letter,
        grade_code,
        grade_percent,
        gpa_points,
        credit_hours_earned,
        potential_credit_hours,
        gpa_added_value,
        exclude_from_gpa,
        credit_type,
        grade_status,
        comment,
        grade_level,
        source_api,
        source_updated_date,
        external_source,
        external_name,
        external_id,
        external_key,
        external_key_hash,
        created_at,
        updated_at,
        customer_id,
        course:courses (
          course_id,
          name,
          local_course_code,
          state_course_code,
          external_source,
          external_name,
          external_id,
          external_key,
          external_key_hash,
          school_id,
          created_at,
          updated_at,
          customer_id
        ),
        student:students (
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
          customer_id
        )
      `)
      .in('student_id', studentIds);

    // Apply filters to main query
    query = applyGradeFilters(query, filters);
    if (hasGradeFilters) {
      query = query.not('student', 'is', 'null').not('course', 'is', 'null');
    }

    // Apply sorting
    if (sort) {
      const [sortField, sortDirection] = sort.split(':');
      const sortColumn = getGradeColumnName(sortField);
      
      // Determine which table the column belongs to for sorting
      let foreignTable = null;
      if (['full_name'].includes(sortColumn)) {
        foreignTable = 'student';
      } else if (['local_course_code', 'name'].includes(sortColumn)) {
        foreignTable = 'course';
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

    // Execute main query
    const { data, error } = await query;

    if (error) {
      console.error('Student grades query error:', error);
      throw new Error(error.message);
    }

    if (!data) {
      return {
        data: [],
        count: 0
      };
    }

    // Transform data to StudentGradeInfo format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const studentGrades: StudentGradeInfo[] = (data as any[])
      .filter((gradeRecord) => gradeRecord.student && gradeRecord.course)
      .map((gradeRecord): StudentGradeInfo => ({
        gradeId: gradeRecord.grade_id,
        studentId: gradeRecord.student_id,
        sectionId: gradeRecord.section_id,
        termId: gradeRecord.term_id,
        courseId: gradeRecord.course_id,
        gradeLetter: gradeRecord.grade_letter,
        gradeCode: gradeRecord.grade_code,
        gradePercentage: gradeRecord.grade_percent,
        gpaPoints: gradeRecord.gpa_points,
        creditHoursEarned: gradeRecord.credit_hours_earned,
        potentialCreditHours: gradeRecord.potential_credit_hours,
        gpaAddedValue: gradeRecord.gpa_added_value,
        excludeFromGPA: gradeRecord.exclude_from_gpa,
        creditType: gradeRecord.credit_type,
        gradeStatus: gradeRecord.grade_status,
        comment: gradeRecord.comment,
        gradeLevel: gradeRecord.grade_level,
        sourceApi: gradeRecord.source_api,
        sourceUpdatedDate: new Date(gradeRecord.source_updated_date),
        externalSource: gradeRecord.external_source,
        externalName: gradeRecord.external_name,
        externalId: gradeRecord.external_id,
        externalKey: gradeRecord.external_key,
        externalKeyHash: gradeRecord.external_key_hash,
        createdAt: new Date(gradeRecord.created_at),
        updatedAt: new Date(gradeRecord.updated_at),
        customerId: gradeRecord.customer_id,
        course: {
          courseId: gradeRecord.course.course_id,
          name: gradeRecord.course.name,
          localCourseCode: gradeRecord.course.local_course_code,
          stateCourseCode: gradeRecord.course.state_course_code,
          externalSource: gradeRecord.course.external_source,
          externalName: gradeRecord.course.external_name,
          externalId: gradeRecord.course.external_id,
          externalKey: gradeRecord.course.external_key,
          externalKeyHash: gradeRecord.course.external_key_hash,
          schoolId: gradeRecord.course.school_id,
          createdAt: new Date(gradeRecord.course.created_at),
          updatedAt: new Date(gradeRecord.course.updated_at),
          customerId: gradeRecord.course.customer_id
        },
        student: {
          studentId: gradeRecord.student.student_id,
          schoolId: selectedSchoolId || '', // Add schoolId from the selected school
          firstName: gradeRecord.student.first_name,
          middleName: gradeRecord.student.middle_name,
          lastName: gradeRecord.student.last_name,
          fullName: gradeRecord.student.full_name,
          email: gradeRecord.student.email,
          phone: gradeRecord.student.phone,
          gradeLevel: gradeRecord.student.grade_level,
          gender: gradeRecord.student.gender,
          dateOfBirth: gradeRecord.student.date_of_birth ? new Date(gradeRecord.student.date_of_birth) : null,
          createdAt: new Date(gradeRecord.student.created_at),
          updatedAt: new Date(gradeRecord.student.updated_at),
          externalSource: gradeRecord.student.external_source,
          externalKey: gradeRecord.student.external_key,
          externalId: gradeRecord.student.external_id,
          externalKeyHash: gradeRecord.student.external_key_hash,
          externalName: gradeRecord.student.external_name,
          graduationYear: gradeRecord.student.graduation_year,
          enrollmentStatus: gradeRecord.student.enrollment_status,
          homeroomName: gradeRecord.student.homeroom_name,
          customerId: gradeRecord.student.customer_id
        }
      }));

    // Execute count query if needed
    let totalCount: number | undefined;
    if (fetchWithCount) {
      let countQuery = supabase
        .from('student_grades')
        .select(hasGradeFilters ? `
          *,
          student:students!inner(
            student_id,
            full_name,
            grade_level,
            homeroom_name,
            enrollment_status,
            date_of_birth,
            created_at,
            updated_at
          ),
          course:courses!inner(
            course_id,
            name,
            local_course_code,
            created_at,
            updated_at
          )
        ` : '*', { count: 'exact', head: true })
        .in('student_id', studentIds);
      
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
      data: studentGrades,
      count: totalCount
    };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    throw new Error(`Failed to fetch student grades by filter criteria. Error: ${message}`);
  }
}
