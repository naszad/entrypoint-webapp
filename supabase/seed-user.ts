import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv';

type Environment = 'local' | 'development' | 'production' | 'test';
const env = (process.env.NODE_ENV || 'local') as Environment;
let envFile = `.env.${env}`;

dotenv.config({ path: envFile })
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey
)

type SeedUser = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

let seedUsers: SeedUser[];
if(process.env.SEED_USER) {
  seedUsers = [{
    email: process.env.SEED_USER,
    password: process.env.SEED_PASSWORD || 'password',
    first_name: "Seed",
    last_name: "User",
  }]
} else {
  seedUsers = [
    {
      email: 'test@email.com',
      password: 'password',
      first_name: 'Dev',
      last_name: 'User',
    },
    {
      email: 'yasir@conversotech.com',
      password: 'password',
      first_name: 'Yasir',
      last_name: 'Ali',
    },
    {
      email: 'juniad@conversotech.com',
      password: 'password',
      first_name: 'Juniad',
      last_name: 'Khokhar',
    },
    {
      email: 'mrogers@entrypointsrm.com',
      password: 'password',
      first_name: 'Matt',
      last_name: 'Rogers',
    },
    {
      email: 'sjwilson11822@gmail.com',
      password: 'password',
      first_name: 'Seth',
      last_name: 'Wilson',
    },
    {
      email: 'nszadowski@gmail.com',
      password: 'password',
      first_name: 'Nathan',
      last_name: 'Szadowski',
    }
  ]
}

async function seed(seedUser: SeedUser, schoolName: string = 'Lincoln High School') {
  // 1) Create the Auth user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: seedUser.email,
    password: seedUser.password,
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
    first_name: seedUser.first_name,
    last_name: seedUser.last_name,
    email: authUser.email,
  }])
  .select()
  .single()
  if (userErr) throw userErr

  await associateUserWithSchool(appUser.email, schoolName)

  console.log('Seed complete:', { authUser, appUser })
}

async function seedAll(seedUsers: SeedUser[]) {
  for (const seedUser of seedUsers) {
    await seed(seedUser)
  }
}

async function associateUserWithSchool(user_email: string, schoolName: string) {
  //Select the school
  const { data: schoolData, error: schoolErr } = await supabase
    .from('schools')
    .select('school_id')
    .eq('name', schoolName)
    .single()
  if (schoolErr) throw schoolErr
  if (!schoolData) throw new Error(`School not found: ${schoolName}`)

  //Select the user
  const { data: userData, error: userErr } = await supabase
    .from('users')
    .select('user_id')
    .eq('email', user_email)
    .single()
  if (userErr) throw userErr
  if (!userData) throw new Error(`User not found: ${user_email}`)

  //Associate the user with the school
  const { error: membershipErr } = await supabase
    .from('user_school_memberships').insert([{
    user_id: userData.user_id,
    school_id: schoolData.school_id,
    role: 'admin',
    created_at: new Date(),
    updated_at: new Date(),
  }])
  if (membershipErr) throw membershipErr

}

async function main() {
  await seedAll(seedUsers).catch(console.error)
  await associateUserWithSchool(seedUsers[0].email, 'Washington High School').catch(console.error)
}

//Seed all users with the default school & associate test user
main()