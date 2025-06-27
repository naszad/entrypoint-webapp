'use server';

import { createClient } from '@/utils/supabase/supabaseServer'
import { FilterValue } from '@/components/DataTable/DataTable';
import { StudentInfo } from '@/types/StudentInfo';
import { cookies } from 'next/headers';

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
          homeroom_name
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

    const students: StudentInfo[] = studentSchoolLinks.map((studentSchoolLink): StudentInfo | null => {
      // It's possible for students to be null if the filter returns a link but no matching student
      if (!studentSchoolLink.students) {
        return null;
      }
      return {
        studentId: studentSchoolLink.student_id,  
        schoolId: studentSchoolLink.school_id,
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
        externalId: Number(studentSchoolLink.students.external_id) || 0,
        externalKeyHash: studentSchoolLink.students.external_key_hash,
        externalName: studentSchoolLink.students.external_name,
        graduationYear: studentSchoolLink.students.graduation_year,
        enrollmentStatus: studentSchoolLink.students.enrollment_status,
        homeroomName: studentSchoolLink.students.homeroom_name,
      }
    }).filter((student): student is StudentInfo => student !== null);

    // Execute count query if needed
    let totalCount: number | undefined;
    if (fetchWithCount) {
      let countQuery = supabase
        .from('school_student_link')
        .select(hasStudentFilters ? '*,students!inner(*)' : '*', { count: 'exact', head: true })
        .eq('school_id', selectedSchoolId);
      
      // Apply the same filters to count query
      countQuery = applyFilters(countQuery, filters);
      
      const { count, error: countError } = await countQuery;
      if (countError) {
        console.error('Count query error:', countError);
        throw new Error(countError.message);
      }
      totalCount = count || 0;
    }

    return {
      data: students,
      count: totalCount
    };

  } catch (err) {
    console.error('Error in fetchStudentsByFilterCriteria:', err);
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
      homeroom_name
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
      externalId: Number(student.external_id) || 0,
      externalKeyHash: student.external_key_hash,
      externalName: student.external_name,
      graduationYear: student.graduation_year,
      enrollmentStatus: student.enrollment_status,
      homeroomName: student.homeroom_name,
    }

    return parsedStudent;
  } catch (err) { 
    throw new Error(`Failed to fetch student ${err}`);
  }
} 