import { supabase } from '@/libs/supabaseClient'
import { User } from '@/types/User';

export async function getUserByAuthId(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select(
      `
        user_id,
        first_name,
        last_name,
        email,
        image_url,
        school:school_id (
          school_id,
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

  const user = {
    ...data,
    school: Array.isArray(data.school) ? data.school[0] : data.school,
  };

  return user as User;
}
