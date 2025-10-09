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
    const { sentiment, comment, tags } = await request.json()

    if (!sentiment) {
      return NextResponse.json({ error: 'Sentiment is required' }, { status: 400 })
    }

    if (!['positive', 'neutral', 'negative'].includes(sentiment)) {
      return NextResponse.json({ error: 'Invalid sentiment value' }, { status: 400 })
    }
    
    // Validate comment length if provided
    if (comment && comment.length > 500) {
      return NextResponse.json({ error: 'Comment must be 500 characters or less' }, { status: 400 })
    }
    
    // Validate tags if provided
    if (tags && (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string'))) {
      return NextResponse.json({ error: 'Tags must be an array of strings' }, { status: 400 })
    }
    
    // First, verify that the message exists and get the chat_id
    const { data: messageData, error: messageError } = await supabase
      .from('chat_messages')
      .select('chat_id')
      .eq('message_id', messageId)
      .single()
    
    if (messageError || !messageData) {
      console.error('Message validation error:', messageError)
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }
    
    // Verify the chat belongs to the current user
    const { data: chatData, error: chatError } = await supabase
      .from('chats')
      .select('user_id')
      .eq('chat_id', messageData.chat_id)
      .eq('user_id', userData.user.id)
      .single()
    
    if (chatError || !chatData) {
      console.error('Chat validation error:', chatError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if feedback already exists for this message and user
    // Use maybeSingle() instead of single() to handle "no rows" gracefully
    const { data: existingFeedback, error: feedbackCheckError } = await supabase
      .from('chat_message_feedback')
      .select('feedback_id')
      .eq('message_id', messageId)
      .eq('user_id', userData.user.id)
      .maybeSingle()

    if (feedbackCheckError) {
      console.error('Error checking existing feedback:', feedbackCheckError)
      return NextResponse.json({ error: 'Failed to check existing feedback' }, { status: 500 })
    }

    interface FeedbackData {
      sentiment: string;
      updated_at: string;
      comment?: string | null;
      tags?: string[] | null;
    }
    
    const feedbackData: FeedbackData = {
      sentiment,
      updated_at: new Date().toISOString(),
      ...(comment !== undefined ? { comment: comment || null } : {}),
      ...(tags !== undefined ? { tags: tags && tags.length > 0 ? tags : null } : {})
    }
    
    if (existingFeedback) {
      // Update existing feedback
      const { data: updatedFeedback, error: updateError } = await supabase
        .from('chat_message_feedback')
        .update(feedbackData)
        .eq('message_id', messageId)
        .eq('user_id', userData.user.id)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 })
      }
      
      return NextResponse.json({ 
        success: true,
        feedback: updatedFeedback
      })
    } else {
      // Create new feedback
      const insertData = {
        message_id: messageId,
        user_id: userData.user.id,
        ...feedbackData,
        created_at: new Date().toISOString()
      }
      
      const { data: newFeedback, error: insertError } = await supabase
        .from('chat_message_feedback')
        .insert(insertData)
        .select()
        .single()

      if (insertError) {
        return NextResponse.json({ error: 'Failed to create feedback' }, { status: 500 })
      }
      
      return NextResponse.json({ 
        success: true,
        feedback: newFeedback
      })
    }
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
      .select('sentiment, comment, tags, created_at, updated_at')
      .eq('message_id', messageId)
      .eq('user_id', userData.user.id)
      .maybeSingle()

    if (feedbackError) {
      console.error('Error loading feedback:', feedbackError)
      return NextResponse.json({ error: 'Failed to load feedback' }, { status: 500 })
    }

    return NextResponse.json({ 
      feedback: feedback || null 
    })
  } catch (err: unknown) {
    console.error('Error loading feedback:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
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

    // Delete feedback for this specific message by this user
    const { error: deleteError } = await supabase
      .from('chat_message_feedback')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', userData.user.id)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Error deleting feedback:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
