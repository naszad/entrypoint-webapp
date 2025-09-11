'use server';
import { createClient } from '@/utils/supabase/supabaseServer';
import { UserInfo } from '@/types/UserInfo';

type UserSchoolMembership = {
  role: string;
  schools: {
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
    email: data.email,
    image_url: data.image_url,
    eula_agree_timestamp: data.eula_agree_timestamp,
    isMultiSchoolUser: userSchoolMemberships.length > 1,
    schools: userSchoolMemberships
      .filter((membership) => membership.schools !== null)
      .map((membership) => ({
        schoolId: membership.schools.school_id,
        name: membership.schools.name,
      })),
  };

  return userProfile;
}
