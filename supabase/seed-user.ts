import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' })
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!
const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey
)

async function createUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'yasir@conversotech.com',
    password: '123456',
    email_confirm: true,
    role: 'Counselor',
  })
  console.log({ data, error })
}

createUser()
