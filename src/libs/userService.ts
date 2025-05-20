import { supabase } from '@/libs/supabaseClient'
import { UserInfo } from '@/types/UserInfo';
import { School } from '@/models/Schools'; 

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

  const parsedSchool : School = {
      id: school.id,
      schoolId: school.school_id,
      name: school.name,
      schoolNumber: school.school_number,
      city: school.city,
      state: school.state,
      country:school.country,
      address: school.address,
      phone: school.phone,
      principalName: school.principal_name,
      principalEmail: school.principal_email,
      assistantPrincipalName: school.assistant_principal_name,
      assistantPrincipalEmail:school.assistant_principal_email,
      externalSource: school.external_source,
      externalKey: school.external_key,
      externalId: school.external_id,
      externalName: school.external_name,
  }

 const userProfile: UserInfo = {
  userId: data.user_id,
  firstName: data.first_name,
  middleName: data.middle_name,
  lastName: data.last_name,
  email: data.email,
  imageUrl: data.image_url,
  school: parsedSchool,
};

  
  return userProfile;
}
