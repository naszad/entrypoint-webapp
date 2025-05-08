import { supabase } from '@/libs/supabaseClient'
import { UserInfo } from '@/types/UserInfo';

export async function getUserByAuthId(id: string): Promise<UserInfo | null> {
  const { data, error } = await supabase
    .from('users')
    .select(
      `
        user_id,
        first_name,
        middle_name,
        last_name,
        email,
        image_url,
        school:school_id (
          name
        )
      `
    )
    .eq('auth_user_id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching user:', error.message);
    return null;
  }
  const school = Array.isArray(data.school) ? data.school[0] : data.school

  const userProfile: UserInfo = {
    userId: data.user_id,
    firstName: data.first_name,
    middleName: data.user_id.middle_name,
    lastName: data.last_name,
    email: data.email,
    imageUrl: data.image_url,
    school: {
      name: school.name,
    },
  };
  
  return userProfile;
}
