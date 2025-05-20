import { supabase } from '@/libs/supabaseClient'
import { UserInfo } from '@/types/UserInfo';

export async function getUserByAuthId(id: string): Promise<UserInfo | null> {
  const { data, error } = await supabase
    .from('users')
   .select(`
      user_id,
      first_name,
      middle_name,
      last_name,
      email,
      image_url,
      school:school_id (
        id,
        name,
        address,
        state,
        city,
        country,
        phone,
        principal_name,
        principal_email,
        assistant_principal_name,
        assistant_principal_email,
        external_source,
        external_key,
        external_id,
        external_name,
        school_number,
        school_id
      )
    `)
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
  middleName: data.middle_name,
  lastName: data.last_name,
  email: data.email,
  imageUrl: data.image_url,
  school: {...school}
};

  
  return userProfile;
}
