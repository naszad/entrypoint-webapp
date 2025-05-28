import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' })
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!
const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey
)

async function seed() {
  // 1) Create the Auth user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: 'yasir@conversotech.com',
    password: '123456',
    email_confirm: true,
  })
  if (authErr) throw authErr
  const authUser = authData.user!

  // 2) Insert a School (you'll need at least a school to point at)
  const { data: schoolData, error: schoolErr } = await supabase
    .from('schools')
    .insert([{
      name: 'Seed School',
      external_key_hash: 'seed-hash',
      school_number: 1,
    }])
    .select()
    .single()
  if (schoolErr) throw schoolErr

  // 3) Insert into your app's users table
  const { data: appUser, error: userErr } = await supabase
    .from('users')
    .insert([{
      user_id: authUser.id,
      auth_user_id: authUser.id,
      school_id: schoolData.school_id,
      first_name: 'Yasir',
      last_name: 'Conversotech',
      email: authUser.email,
    }])
    .select()
    .single()
  if (userErr) throw userErr

  // 4) (Optional) insert the membership so your RLS policy will let you see that school
  await supabase.from('user_school_memberships').insert([{
    user_id: authUser.id,
    school_id: schoolData.school_id,
    name: 'Yasir',
  }])

  console.log('Seed complete:', { authUser, schoolData, appUser })
}

seed().catch(console.error)
