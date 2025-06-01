'use server';
import { createClient } from '@/utils/supabase/supabaseServer';
import { UserInfo } from '@/types/UserInfo';

type UserSchoolMembership = {
  role: string;
  school: {
    school_id: string;
    name: string;
  };
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
      email,
      image_url,
      user_school_membership:user_school_memberships!user_school_memberships_user_id_users_user_id_fk(
        role,
        school:schools!school_id(
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

  const userSchoolMembership = data.user_school_membership as unknown as UserSchoolMembership;

  const userProfile: UserInfo = {
    userId: data.user_id,
    firstName: data.first_name,
    middleName: data.middle_name,
    lastName: data.last_name,
    email: data.email,
    imageUrl: data.image_url,
    school: {
      schoolId: userSchoolMembership?.school.school_id ?? '',
      name: userSchoolMembership?.school.name ?? ''
    }
  };

  return userProfile;
}
