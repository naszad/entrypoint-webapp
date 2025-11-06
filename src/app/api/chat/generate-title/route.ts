import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/supabaseServer'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

const AI_MODEL_DEFAULT = process.env.AI_MODEL_DEFAULT || 'gpt-4.1-mini';

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { chatId } = await request.json()

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 })
    }

    // Get messages for this chat, excluding tool calls
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('role, parts')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages found in chat' }, { status: 400 })
    }

    // Extract only text content from message parts, filtering out tool calls
    const textMessages = messages
      .map(msg => {
        try {
          const parts = typeof msg.parts === 'string' ? JSON.parse(msg.parts) : msg.parts
          if (Array.isArray(parts)) {
            // Extract text from message parts, excluding tool calls
            const textParts = parts
              .filter(part => part.type === 'text')
              .map(part => part.text)
              .join(' ')
            return textParts.trim()
          }
          return ''
        } catch {
          // If not JSON, treat as plain text
          return typeof msg.parts === 'string' ? msg.parts : ''
        }
      })
      .filter(text => text.length > 0)

    if (textMessages.length === 0) {
      return NextResponse.json({ error: 'No text content found in messages' }, { status: 400 })
    }

    // Create conversation context (limit to reasonable size)
    const conversationText = textMessages.join('\n').slice(0, 2000) // Limit to 2000 chars

    // Generate title using OpenAI
    const { text: generatedTitle } = await generateText({
      model: openai(AI_MODEL_DEFAULT),
      prompt: `Based on the following conversation, generate a concise, descriptive title (maximum 50 characters). The title should capture the main topic or purpose of the conversation. Do not use quotes or special formatting.

Conversation:
${conversationText}

Title:`,
      maxRetries: 2,
      temperature: 0.7,
    })

    // Clean and limit the title
    const cleanTitle = generatedTitle
      .trim()
      .replace(/^["']|["']$/g, '') // Remove quotes
      .slice(0, 50) // Ensure max 50 characters

    if (!cleanTitle) {
      return NextResponse.json({ error: 'Failed to generate title' }, { status: 500 })
    }

    return NextResponse.json({ title: cleanTitle })
  } catch (err: unknown) {
    console.error('Error generating title:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
