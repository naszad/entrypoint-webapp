'use server';
import { createClient } from '@/utils/supabase/supabaseServer';
import { UserInfo } from '@/types/UserInfo';
import { cookies } from 'next/headers';
import { FilterValue } from '@/components/DataTable/DataTable';
import { User } from '@/types/Models';
import bcrypt from 'bcrypt';

type UsersRequest = {
  fetchWithCount?: boolean;
  filters: FilterValue[];
  sort?: string | null;
  pagingInfo?: {
    pageNumber: number;
    pageSize: number;
  };
};

type UserSchoolMembership = {
  role: string;
  updated_at: Date;
  schools: {
    school_id: string;
    name: string;
  };
};

const getUserColumnName = (key: string) => {
  switch (key) {
    case 'firstName':
      return 'first_name';
    case 'middleName':
      return 'middle_name';
    case 'lastName':
      return 'last_name';
    case 'fullName':
      return 'full_name';
    case 'email':
      return 'email';
    case 'imageUrl':
      return 'image_url';
    case 'eulaAgreeTimestamp':
      return 'eula_agree_timestamp';
    case 'eulaAgreeTimestampFrom':
      return 'eula_agree_timestamp';
    case 'eulaAgreeTimestampTo':
      return 'eula_agree_timestamp';
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
};

const usersFilterApplied = (filters: FilterValue[]) => {
  return filters.some(f => {
    const columnName = getUserColumnName(f.key);
    return !['user_id', 'school_id', 'role', 'created_at', 'updated_at'].includes(columnName);
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const applyUserFilters = (q: any, filters: FilterValue[]) => {
  filters.forEach((filter) => {
    let baseColumnKey = filter.key;
    if (filter.key.endsWith('RecentOnly') && parseInt(filter.value) > 0) {
      baseColumnKey = filter.key.replace('RecentOnly', '');
    }

    const columnName = getUserColumnName(baseColumnKey);
    const filterOnUserTable = ![
      'user_id',
      'school_id',
      'role',
      'created_at',
      'updated_at',
    ].includes(columnName);
    
    const targetColumn = filterOnUserTable ? `users.${columnName}` : columnName;

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
  });
  return q;
};

export async function getUserByAuthId(id: string): Promise<UserInfo | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select(`
      user_id,
      first_name,
      middle_name,
      last_name,
      full_name,
      email,
      image_url,
      eula_agree_timestamp,
      user_school_memberships(
        role,
        schools(
          school_id,
          name
        )
      )
    `)
    .eq('auth_user_id', id)
    .single();

  if (error || !data) {
    return null;
  }

  const userSchoolMemberships = data.user_school_memberships as unknown as UserSchoolMembership[];

  const userProfile: UserInfo = {
    user_id: data.user_id,
    first_name: data.first_name,
    middle_name: data.middle_name,
    last_name: data.last_name,
    full_name: data.full_name,
    email: data.email,
    image_url: data.image_url,
    eula_agree_timestamp: data.eula_agree_timestamp,
    isMultiSchoolUser: userSchoolMemberships.length > 1,
    role: userSchoolMemberships[0].role as 'user' | 'admin',
    schools: userSchoolMemberships
      .filter((membership) => membership.schools !== null)
      .map((membership) => ({
        schoolId: membership.schools.school_id,
        name: membership.schools.name,
      })),
  };

  return userProfile;
}

export async function fetchUsersByFilterCriteria(request: UsersRequest): Promise<UserInfo[]> {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Get current user's role to check if they're admin
    const currentUser = await getUserByAuthId(user.id);
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('User is not authorized to perform this action');
    }

    const cookieStore = await cookies();
    const selectedSchoolId = cookieStore.get('selectedSchoolId')?.value;
    const { filters, sort, pagingInfo } = request;
    const hasUserFilters = usersFilterApplied(filters);

    let query = supabase
      .from('user_school_memberships')
      .select(`
        role,
        school_id,
        created_at,
        updated_at,
        users!inner(
          user_id,
          first_name,
          middle_name,
          last_name,
          full_name,
          email,
          image_url,
          eula_agree_timestamp
        ),
        schools(
          school_id,
          name
        )
      `)
      .eq('role', 'user')
      .eq('school_id', selectedSchoolId);

    // Apply filters to main query
    query = applyUserFilters(query, filters);
    if (hasUserFilters) {
      query = query.not('users', 'is', 'null');
    }

    // Apply sorting
    if (sort) {
      const [sortField, sortDirection] = sort.split(':');
      const sortColumn = getUserColumnName(sortField);
      const onUserTable = !['user_id', 'school_id', 'role', 'created_at', 'updated_at'].includes(sortColumn);

      if (onUserTable) {
        query = query.order(sortColumn, { ascending: sortDirection === 'asc', foreignTable: 'users' });
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
      throw new Error(error.message);
    }

    const users = data.map((membership) => {
      const user = membership.users as unknown as User;
      
      return {
        user_id: user.user_id,
        first_name: user.first_name,
        middle_name: user.middle_name,
        last_name: user.last_name,
        full_name: user.full_name,
        email: user.email,
        image_url: user.image_url,
        eula_agree_timestamp: user.eula_agree_timestamp,
        isMultiSchoolUser: false, // Since we're filtering by specific school
        role: membership.role as 'user' | 'admin',
        updatedAt: membership.updated_at,
      } as UserInfo;
    });

    return users;

  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    throw new Error(`Failed to fetch users. Error: ${message}`);
  }
}

export async function addUser(userData: {
  firstName: string;
  lastName: string;
  email: string;
}): Promise<string> {
  try {
    const supabase = await createClient();
    const supabaseAdmin = await createClient(true);
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Get current user's role to check if they're admin
    const currentUser = await getUserByAuthId(user.id);
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('User is not authorized to perform this action');
    }

    const cookieStore = await cookies();
    const selectedSchoolId = cookieStore.get('selectedSchoolId')?.value;

    if (!selectedSchoolId) {
      throw new Error('No school selected');
    }

    const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'TempPassword123!';
    const encryptedPassword = await bcrypt.hash(defaultPassword, 10);
    
    const { data: userId, error: rpcError } = await supabaseAdmin.rpc('create_user_with_membership', {
      p_email: userData.email.trim(),
      p_encrypted_password: encryptedPassword,
      p_first_name: userData.firstName.trim(),
      p_last_name: userData.lastName.trim(),
      p_school_id: selectedSchoolId,
      p_membership_role: 'user'
    });

    if (rpcError) {
      throw new Error(`Failed to create user: ${rpcError.message}`);
    }

    return userId;

  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    throw new Error(`${message}`);
  }
}

export async function fetchUserByEmail(email: string): Promise<{ firstName: string; lastName: string } | null> {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Get current user's role to check if they're admin
    const currentUser = await getUserByAuthId(user.id);
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('User is not authorized to perform this action');
    }

    const { data, error } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - user doesn't exist
        return null;
      }
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return {
      firstName: data.first_name,
      lastName: data.last_name
    };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    throw new Error(`Failed to fetch user by email. Error: ${message}`);
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Get current user's role to check if they're admin
    const currentUser = await getUserByAuthId(user.id);
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('User is not authorized to perform this action');
    }

    const { error: userError } = await supabase
      .from('user_school_memberships')
      .delete()
      .eq('user_id', userId);

    if (userError) {
      throw new Error(`Failed to delete user: ${userError.message}`);
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    throw new Error(`Failed to delete user. Error: ${message}`);
  }
}
