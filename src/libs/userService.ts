'use server';
import { createClient } from '@/utils/supabase/supabaseServer';
import { UserInfo } from '@/types/UserInfo';

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
      image_url
    `)
    .eq('auth_user_id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching user:', error.message);
    return null;
  }

 const userProfile: UserInfo = {
  userId: data.user_id,
  firstName: data.first_name,
  middleName: data.middle_name,
  lastName: data.last_name,
  email: data.email,
  imageUrl: data.image_url
};

  return userProfile;
}
