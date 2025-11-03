import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/supabaseServer'

export async function POST() {
  try {
    const supabase = await createClient()
    const supabaseAdmin = await createClient(true)
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const authUser = userData.user
    const timestamp = new Date().toISOString()

    // Update user metadata to mark EULA as signed and clear password reset flag
    const { error: updatedUserError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      user_metadata: {
        ...authUser.user_metadata,
        eula_agree_signed: true,
      },
    });

    if (updatedUserError) {
      return NextResponse.json({ error: updatedUserError.message }, { status: 500 })
    }

    // Update database to record EULA timestamp
    const { error } = await supabase
      .from('users')
      .update({ 
        eula_agree_timestamp: timestamp
      })
      .eq('auth_user_id', authUser.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
