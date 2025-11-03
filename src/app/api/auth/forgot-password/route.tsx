import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/supabaseServer'

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = await createClient(true)
    const { email } = await req.json()
    
    if (!email || email.trim().toLowerCase().includes('@') === false) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }

    // Get user by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      return NextResponse.json({ error: 'Something went wrong, please try again later.' }, { status: 500 })
    }

    const user = users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
    
    if (!user) {
      return NextResponse.json({ error: 'Something went wrong, please try again later.' }, { status: 500 })
    }

    // Set reset_password_required flag in user_metadata
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        reset_password_required: true,
      },
    })

    if (updateError) {
      return NextResponse.json({ error: 'Something went wrong, please try again later.' }, { status: 500 })
    }

    // Send password reset email
    const redirectUrl = `${process.env.APP_URL}/auth/callback`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

