import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/supabaseServer'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { title } = await req.json()

    // Create a new empty chat
    const { data: newChat, error: chatError } = await supabase
      .from('chats')
      .insert({
        title: title, // Allow null titles
        user_id: userData.user.id,
        created_at: new Date(),
        updated_at: new Date()
      })
      .select()
      .single()

    if (chatError || !newChat) {
      return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 })
    }

    return NextResponse.json({ 
      chat: newChat,
      chatId: newChat.chat_id
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
