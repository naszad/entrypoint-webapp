'use server';
import { createClient } from '@/utils/supabase/supabaseServer';
import { UserInfo } from '@/types/UserInfo';
import { cookies } from 'next/headers';
import { FilterValue } from '@/components/DataTable/DataTable';
import { User } from '@/types/Models';
import { SupabaseClient } from '@supabase/supabase-js';

type UsersRequest = {
  fetchWithCount?: boolean;
  filters: FilterValue[];
  sort?: string | null;
  pagingInfo?: {
    pageNumber: number;
    pageSize: number;
  };
};

type UpdateUserProfileRequest = {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  currentPassword?: string;
  password?: string;
  role: string;
};

type UserSchoolMembership = {
  role: string;
  updated_at: Date;
  schools: {
    school_id: string;
    name: string;
    customer_id?: string | null;
    customers?: {
      name?: string | null;
    } | null;
  } | null;
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


// eslint-disable-next-line @typescript-eslint/no-explicit-any
const applyUserFilters = (q: any, filters: FilterValue[]) => {
  filters.forEach((filter) => {
    let baseColumnKey = filter.key;
    if (filter.key.endsWith('RecentOnly') && parseInt(filter.value) > 0) {
      baseColumnKey = filter.key.replace('RecentOnly', '');
    }

    const columnName = getUserColumnName(baseColumnKey);

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
        q = q.eq(columnName, filter.value);
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
          name,
          customer_id,
          customers(name)
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
      .map((membership) => {
        const school = membership.schools!;
        return {
          schoolId: school.school_id,
          name: school.name,
          customerId: school.customer_id ?? undefined,
          customerName: school.customers?.name ?? undefined,
        };
      }),
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

    let query = supabase
      .from('user_school_memberships_users_schools_view')
      .select(`*`)
      .eq('school_id', selectedSchoolId)
      .neq("user_id", currentUser.user_id); 

    // Apply filters to main query
    query = applyUserFilters(query, filters);

    // Apply sorting
    if (sort) {
      const [sortField, sortDirection] = sort.split(':');
      const sortColumn = getUserColumnName(sortField);
      query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
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
      const user = membership as unknown as User;
      
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
  role: string;
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

    const { data: isWhitelisted, error: whitelistError } = await supabase.rpc('is_email_domain_whitelisted', {
      p_email_domain: userData.email.trim().toLowerCase().split('@')[1],
      p_school_id: selectedSchoolId
    });

    if (whitelistError || !isWhitelisted) {
      throw new Error('Email domain is not whitelisted');
    }

    const {userId: auth_user_id, existingUser} = await getOrCreateAuthUser({
      supabase: supabaseAdmin,
      email: userData.email.trim().toLowerCase(),
      password: process.env.DEFAULT_USER_PASSWORD || 'TempPassword123!',
      firstName: userData.firstName.trim(),
      lastName: userData.lastName.trim(),
    });
     
    const { error: insertError } = await supabase.from('user_school_memberships').upsert({
      user_id: auth_user_id,
      school_id: selectedSchoolId,
      role: userData.role,
      created_at: new Date(),
      updated_at: new Date(),
    });

    if (insertError) {
      throw new Error('An error occurred while creating the user school membership. Please try again.');
    }

    if (!existingUser) {
      
      // Send invite email to user - redirect to auth callback to handle token setup
      const redirectUrl = `${process.env.APP_URL}/auth/callback`;
      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        userData.email.trim().toLowerCase(),
        {
          redirectTo: redirectUrl,
        }
      );
      
      if (inviteError) {
        console.error('Failed to send invite email:', inviteError);
        throw inviteError;
      }
      
    }


    return auth_user_id;

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

export async function updateUserProfile(profile: UpdateUserProfileRequest): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Update password if provided
    if (profile.password && profile.currentPassword) {
      // First, reauthenticate with current password
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: profile.currentPassword
      });
      
      if (reauthError) {
        throw new Error(`Current password is incorrect.`);
      }

      // Now update the password
      const { error: passwordError } = await supabase.auth.updateUser({ 
        password: profile.password 
      });
      
      if (passwordError) {
        throw new Error(`Failed to update user password: ${passwordError.message}`);
      }
    }

    const fullName = [profile.firstName, profile.middleName, profile.lastName]
      .filter(name => name && name.trim())
      .join(' ');

    const { error: profileError } = await supabase
      .from('users')
      .update({
        first_name: profile.firstName,
        middle_name: profile.middleName,
        last_name: profile.lastName,
        full_name: fullName,
      })
      .eq('user_id', user.id);

    if (profileError) {
      throw new Error(`Error: ${profileError.message}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    throw new Error(`Error: ${message}`);
  }
}

export async function getOrCreateAuthUser({supabase, email, password, firstName, lastName }: { supabase: SupabaseClient, email: string, password: string, firstName: string, lastName: string }) {

  const { data: existingUser } = await supabase
    .from('users')
    .select('user_id, first_name, last_name')
    .eq('email', email.trim().toLowerCase())
    .single();

  if (existingUser) {
    return {userId: existingUser.user_id, existingUser: true};
  }

  // Step 1: Try to create a new user with reset_password_required flag
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: {
      reset_password_required: true,
      eula_agree_signed: false,
    },
    email_confirm: false
  });

  
  if (createError) {
    throw new Error('An error occurred while creating the auth user. Please try again.');
  }
  
  if (newUser?.user?.id) {
    const { error: insertError } = await supabase.from('users').insert({
      user_id: newUser.user.id,
      auth_user_id: newUser.user.id,
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`,
      email: email.toLowerCase(),
    });
    if (insertError) {
      throw new Error('An error occurred while creating the user profile. Please try again.');
    }
    return {userId: newUser.user.id, existingUser: false};
  }
  throw new Error('An unexpected error occurred while creating the user profile. Please try again.');
}

