import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/supabaseServer'

export async function POST(req: Request) {
  try {
    const supabaseAdmin = await createClient(true)
    const { email } = await req.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Get user by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    const user = users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
    
    if (!user) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    // Set reset_password_required flag in user_metadata
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        reset_password_required: true,
      },
    })

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

