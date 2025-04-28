import { createClient } from '@supabase/supabase-js'
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
  })
  console.log({ data, error })
}

createUser()
