import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/supabaseServer'

export async function POST(
  request: Request, 
  { params }: { params: Promise<{ chatId: string; messageId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { messageId } = await params
    const { sentiment } = await request.json()

    if (!sentiment) {
      return NextResponse.json({ error: 'Sentiment is required' }, { status: 400 })
    }

    if (!['positive', 'neutral', 'negative'].includes(sentiment)) {
      return NextResponse.json({ error: 'Invalid sentiment value' }, { status: 400 })
    }

    // Check if feedback already exists for this message and user
    const { data: existingFeedback, error: feedbackCheckError } = await supabase
      .from('chat_message_feedback')
      .select('feedback_id')
      .eq('message_id', messageId)
      .eq('user_id', userData.user.id)
      .single()

    if (feedbackCheckError && feedbackCheckError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected if no feedback exists yet
      return NextResponse.json({ error: 'Failed to check existing feedback' }, { status: 500 })
    }

    if (existingFeedback) {
      // Update existing feedback
      const { error: updateError } = await supabase
        .from('chat_message_feedback')
        .update({ 
          sentiment,
          updated_at: new Date().toISOString()
        })
        .eq('message_id', messageId)
        .eq('user_id', userData.user.id)

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 })
      }
    } else {
      // Create new feedback
      const { error: insertError } = await supabase
        .from('chat_message_feedback')
        .insert({
          message_id: messageId,
          user_id: userData.user.id,
          sentiment,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        return NextResponse.json({ error: 'Failed to create feedback' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Error handling feedback:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(
  request: Request, 
  { params }: { params: Promise<{ chatId: string; messageId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { messageId } = await params

    // Get feedback for this specific message by this user
    const { data: feedback, error: feedbackError } = await supabase
      .from('chat_message_feedback')
      .select('sentiment')
      .eq('message_id', messageId)
      .eq('user_id', userData.user.id)
      .single()

    if (feedbackError && feedbackError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to load feedback' }, { status: 500 })
    }

    return NextResponse.json({ 
      feedback: feedback ? { sentiment: feedback.sentiment } : null 
    })
  } catch (err: unknown) {
    console.error('Error loading feedback:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
