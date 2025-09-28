import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/supabaseServer'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { chatId } = await params
    const { message } = await req.json()

    if (!chatId || !message) {
      return NextResponse.json({ error: 'Chat ID and message are required' }, { status: 400 })
    }

    // Save the message
    const messageToInsert = {
      chat_id: chatId,
      role: message.role,
      parts: Array.isArray(message.content) ? 
        message.content : 
        [{ type: 'text', text: message.content }],
      created_at: new Date(),
      metadata: message.metadata || null
    }

    const { data: savedMessage, error: messageError } = await supabase
      .from('chat_messages')
      .insert(messageToInsert)
      .select()
      .single()

    if (messageError) {
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
    }

    // Update chat timestamp
    await supabase
      .from('chats')
      .update({ updated_at: new Date() })
      .eq('chat_id', chatId)

    return NextResponse.json({ 
      message: savedMessage,
      success: true 
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
