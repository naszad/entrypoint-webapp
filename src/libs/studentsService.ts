'use server';

import { createClient } from '@/utils/supabase/supabaseServer'
import { FilterValue } from '@/components/DataTable/DataTable';
import { StudentInfo } from '@/types/StudentInfo';
import { StudentTermGradeInfo } from '@/types/StudentTermGradeInfo';
import { cookies } from 'next/headers';
import { YearGradeInfo } from '@/types/YearGradeInfo';

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

type GradeData = {
  course: {
    name: string;
    course_id: string;
    local_course_code: string;
  };
  grade_letter: string;
  grade_percent: number;
  gpa_points: number;
  updated_at: Date;
};
type TermGradeData = {
  term: {
    term_id: string;
    abbreviation: string;
    term_grades: GradeData[];
  };
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const applyFilters = (q: any, filters: FilterValue[]) => {
  filters.forEach((filter) => {
    const columnName = getColumnName(filter.key);
    const filterOnStudentTable = ![
      'student_id',
      'school_id',
    ].includes(columnName);
    
    const targetColumn = filterOnStudentTable ? `students.${columnName}` : columnName;

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
        dateOfBirth: studentSchoolLink.students.date_of_birth ? new Date(studentSchoolLink.students.date_of_birth).toISOString() : '',
        createdAt: studentSchoolLink.students.created_at,
        updatedAt: studentSchoolLink.students.updated_at,
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
      firstName: student.first_name,
      middleName: student.middle_name,
      lastName: student.last_name,
      fullName: student.full_name,
      email: student.email,
      phone: student.phone,
      gradeLevel: student.grade_level,
      gender: student.gender,
      dateOfBirth: student.date_of_birth ? new Date(student.date_of_birth).toISOString() : '',
      createdAt: student.created_at,
      updatedAt: student.updated_at,
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

export async function fetchStudentCurrentGrades(studentId: string): Promise<StudentTermGradeInfo> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('section_enrollments')
      .select(`
        term_id,
        term:terms (
          term_id,
          abbreviation,
          term_grades:student_grades (
            grade_id,
            grade_letter,
            grade_percent,
            gpa_points,
            updated_at,
            course:courses (
              course_id,
              name,
              local_course_code
            )
          )
        )
      `)
      .eq('student_id', studentId)
      .eq('term.term_grades.student_id', studentId)
      .or('start_date.is.null,start_date.lt.now()')
      .or('end_date.is.null,end_date.gt.now()');

    if (error) {
      throw new Error(`Failed to fetch section enrollments: ${error.message}`);
    }

    const refinedData = data as unknown as TermGradeData[];

    const termsData = refinedData
      .map((d: TermGradeData) => ({
        termId: d.term.term_id,
        abbreviation: d.term.abbreviation
      }))
      .filter((term, index, self) => 
        index === self.findIndex(t => t.termId === term.termId)
      );

    const courseMap = new Map();
    const courseGradesMap = new Map<string, { [termId: string]: { gradeLetter: string; gradePercentage: number; gradePoints: number; updatedAt: string } }>();
    
    refinedData.forEach((termData: TermGradeData) => {
      const termId = termData.term.term_id;
      
      termData.term.term_grades.forEach((grade: GradeData) => {
        const courseId = grade.course.course_id;
        
        if (!courseMap.has(courseId)) {
          courseMap.set(courseId, {
            courseId: courseId,
            courseName: grade.course.name,
            courseNumber: grade.course.local_course_code
          });
        }
        
        if (!courseGradesMap.has(courseId)) {
          courseGradesMap.set(courseId, {});
        }
        
        courseGradesMap.get(courseId)![termId] = {
          gradeLetter: grade.grade_letter || '',
          gradePercentage: grade.grade_percent || 0,
          gradePoints: grade.gpa_points || 0,
          updatedAt: grade.updated_at ? new Date(grade.updated_at).toISOString() : ''
        };
      });
    });

    const coursesData = Array.from(courseMap.values()).map((gradeData: { courseId: string; courseName: string; courseNumber: string }) => ({
      courseId: gradeData.courseId,
      courseName: gradeData.courseName,
      courseNumber: gradeData.courseNumber || '',
      grades: courseGradesMap.get(gradeData.courseId) || {}
    }));

    return {
      terms: termsData,
      courses: coursesData
    };
  } catch (err) {
    throw new Error(`Failed to fetch student current grades: ${err}`);
  }
}

const sortGradeCodes = (codes: string[]): string[] => {
  const order: { [key: string]: number } = {
    'S1': 1, 'S2': 2, 'S3': 3, 'S4': 4,
    'Q1': 5, 'Q2': 6, 'Q3': 7, 'Q4': 8,
    'T1': 9, 'T2': 10, 'T3': 11, 'T4': 12,
    'Y1': 13, 'F': 14
  };
  
  return codes.sort((a, b) => {
    const orderA = order[a] || 999;
    const orderB = order[b] || 999;
    return orderA - orderB;
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
            year_start,
            year_end
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

    const allYears = validGrades.map(grade => grade.term.year);
    const uniqueYears = allYears.filter((year, index, self) => 
      index === self.findIndex(y => y.year_id === year.year_id)
    );
    const currentYear = uniqueYears.reduce((latest, current) => 
      current.year_start > latest.year_start ? current : latest
    );

    const yearMap = new Map<string, YearGradeInfo>();
    const finalGradeCodesByYear = new Map<string, Set<string>>();

    validGrades.forEach((grade) => {
      const yearId = grade.term.year.year_id;
      const yearName = grade.term.year.name;
      const isCurrentYear = yearId === currentYear.year_id;
      
      if (!yearMap.has(yearId)) {
        yearMap.set(yearId, {
          yearId,
          label: yearName,
          isCurrent: isCurrentYear,
          gradeCodes: [],
          creditTypes: []
        });
      }

      if (!finalGradeCodesByYear.has(yearId)) {
        finalGradeCodesByYear.set(yearId, new Set<string>());
      }

      const yearData = yearMap.get(yearId)!;
      const gradeCode = grade.grade_code;
      const creditType = grade.credit_type || 'Other';

      if (!yearData.gradeCodes.includes(gradeCode)) {
        yearData.gradeCodes.push(gradeCode);
      }

      if (!isCurrentYear && grade.grade_status === 'Final') {
        finalGradeCodesByYear.get(yearId)!.add(gradeCode);
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
      const yearA = uniqueYears.find(y => y.year_id === a.yearId);
      const yearB = uniqueYears.find(y => y.year_id === b.yearId);
      return (yearA?.year_start || 0) - (yearB?.year_start || 0);
    });

    return yearGradeInfoArray;
    
  } catch (err) {
    throw new Error(`Failed to fetch student grades: ${err}`);
  }
}