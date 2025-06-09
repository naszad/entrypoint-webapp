'use server';

import { createClient } from '@/utils/supabase/supabaseServer'
import { FilterValue } from '@/components/DataTable/DataTable';
import { StudentInfo } from '@/types/StudentInfo';

type StudentsRequest = {
  fetchWithCount: boolean;
  filters: FilterValue[];
  sortInfo: {
    sortField: string;
    sortDirection: 'asc' | 'desc';
  };
  pagingInfo: {
    pageNumber: number;
    pageSize: number;
  };
};

type StudentsResponse = {
  data: StudentInfo[];
  count?: number;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const applyFilters = (q: any, filters: FilterValue[]) => {
  filters.forEach((filter) => {
    const columnName = getColumnName(filter.key);
    
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
      default:
        q = q.eq(columnName, filter.value);
    }
  });
  return q;
};

export async function fetchStudentsByFilterCriteria(request: StudentsRequest): Promise<StudentsResponse> {
  try {
    const supabase = await createClient()
    const { filters, sortInfo, pagingInfo, fetchWithCount } = request;
    
    let query = supabase
      .from('students')
      .select(`student_id,
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
      `);
    

    // Apply filters to main query
    query = applyFilters(query, filters);

    // Apply sorting
    if (sortInfo.sortField) {
      query = query.order(getColumnName(sortInfo.sortField), { ascending: sortInfo.sortDirection === 'asc' });
    }

    // Apply pagination
    const from = (pagingInfo.pageNumber - 1) * pagingInfo.pageSize;
    const to = from + pagingInfo.pageSize - 1;
    query = query.range(from, to);

    // Execute main query
    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    // Execute count query if needed
    let totalCount: number | undefined;
    if (fetchWithCount) {
      let countQuery = supabase
        .from('students')
        .select('*', { count: 'exact', head: true });
      
      // Apply the same filters to count query
      countQuery = applyFilters(countQuery, filters);
      
      const { count, error: countError } = await countQuery;
      if (countError) {
        throw new Error(countError.message);
      }
      totalCount = count || 0;
    }

    const students: StudentInfo[] = data.map((student) => ({
      studentId: student.student_id,
      firstName: student.first_name,
      middleName: student.middle_name,
      lastName: student.last_name,
      fullName: student.full_name,
      email: student.email,
      phone: student.phone,
      gradeLevel: student.grade_level,
      gender: student.gender,
      dateOfBirth: student.date_of_birth,
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
    }));

    return {
      data: students,
      count: totalCount
    };
  } catch (err) {
    throw new Error(`Failed to fetch students ${err}`);
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
      dateOfBirth: student.date_of_birth,
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
    }

    return parsedStudent;
  } catch (err) { 
    throw new Error(`Failed to fetch student ${err}`);
  }
} 