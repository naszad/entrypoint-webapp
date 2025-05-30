'use server';

import { createClient } from '@/utils/supabase/supabaseServer'
import { FilterValue } from '@/components/DataTable/DataTable';
import { Student } from '@/models/Students';

type StudentsRequest = {
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

export async function fetchStudentsByFilterCriteria(request: StudentsRequest): Promise<Student[]> {
  try {
    const supabase = await createClient()
    const { filters, sortInfo, pagingInfo } = request;
    
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

    filters.forEach((filter) => {
      const columnName = getColumnName(filter.key);
      
      switch (filter.condition) {
        case 'contains':
          query = query.ilike(columnName, `%${filter.value}%`);
          break;
        case 'starts':
          query = query.ilike(columnName, `${filter.value}%`);
          break;
        case 'ends':
          query = query.ilike(columnName, `%${filter.value}`);
          break;
        case 'not':
          query = query.neq(columnName, filter.value);
          break;
        case 'gt':
          query = query.gt(columnName, filter.value);
          break;
        case 'lt':
          query = query.lt(columnName, filter.value);
          break;
        case 'gte':
          query = query.gte(columnName, filter.value);
          break;
        case 'lte':
          query = query.lte(columnName, filter.value);
          break;
        default:
          query = query.eq(columnName, filter.value);
      }
    });    

    // Apply sorting
    if (sortInfo.sortField) {
      query = query.order(getColumnName(sortInfo.sortField), { ascending: sortInfo.sortDirection === 'asc' });
    }

    // Apply pagination
    const from = (pagingInfo.pageNumber - 1) * pagingInfo.pageSize;
    const to = from + pagingInfo.pageSize - 1;
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }    

    const students: Student[] = data.map((student) => ({
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

    return students;
  } catch (err) {
    console.error('Failed to fetch students', err);
    throw new Error('Failed to fetch students');
  }
} 