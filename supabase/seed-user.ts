import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' })
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!
const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey
)

const seedUser = process.env.SEED_USER || 'test@email.com'
const seedPassword = process.env.SEED_PASSWORD || 'password'

async function seed() {
  // 1) Create the Auth user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: seedUser,
    password: seedPassword,
    email_confirm: true,
  })
  if (authErr) throw authErr
  const authUser = authData.user!

  // 2) Insert into your app's users table
  const { data: appUser, error: userErr } = await supabase
  .from('users')
  .insert([{
    user_id: authUser.id,
    auth_user_id: authUser.id,
    first_name: 'Dev',
    last_name: 'User',
    email: authUser.email,
  }])
  .select()
  .single()
  if (userErr) throw userErr

  // 3) Select a school, assumes the seed SQL scripts ran
  const { data: schoolData, error: schoolErr } = await supabase
    .from('schools')
    .select('school_id')
    .eq('name', 'Lincoln High School')
    .single()
  if (schoolErr) throw schoolErr

  // 4) (Optional) insert the membership so your RLS policy will let you see that school
  const { data: membershipData, error: membershipErr } = await supabase
    .from('user_school_memberships').insert([{
    user_id: authUser.id,
    school_id: schoolData.school_id,
    role: 'admin',
    created_at: new Date(),
    updated_at: new Date(),
  }])
  if (membershipErr) throw membershipErr

  console.log('Seed complete:', { authUser, schoolData, appUser, membershipData })

  // 5) Create second auth user for Roosevelt High School
  const { data: authData2, error: authErr2 } = await supabase.auth.admin.createUser({
    email: 'roosevelt@school.edu',
    password: seedPassword,
    email_confirm: true,
  });
  if (authErr2) throw authErr2;
  const authUser2 = authData2.user!;

  // Insert into app users table
  const { data: appUser2, error: userErr2 } = await supabase
    .from('users')
    .insert([{ user_id: authUser2.id, auth_user_id: authUser2.id, first_name: 'Roosevelt', last_name: 'User', email: authUser2.email }])
    .select()
    .single();
  if (userErr2) throw userErr2;

  // Associate second user with Roosevelt High School
  const { data: schoolData2, error: schoolErr2 } = await supabase
    .from('schools')
    .select('school_id')
    .eq('name', 'Roosevelt High School')
    .single();
  if (schoolErr2) throw schoolErr2;

  const { data: membershipData2, error: membershipErr2 } = await supabase
    .from('user_school_memberships')
    .insert([{ user_id: authUser2.id, school_id: schoolData2.school_id, role: 'admin', created_at: new Date(), updated_at: new Date() }]);
  if (membershipErr2) throw membershipErr2;

  console.log('Second user seeded:', { authUser2, appUser2, membershipData2 });
}

seed().catch(console.error)
