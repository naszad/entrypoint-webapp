import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/supabaseServer';
import { generateTitleFromUserMessage } from '@/utils/ai/actions';
import { UIMessage } from 'ai';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch chats for the current user, ordered by most recently updated
    const { data: chats, error } = await supabase
      .from('chats')
      .select('chat_id, title, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching chats:', error);
      return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
    }

    return NextResponse.json({ chats: chats || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Unexpected error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { message } = await req.json();
    
    // For now, use a simple title to avoid AI generation issues
    let title: string;
    try {
      // Convert string message to UIMessage format for title generation
      const uiMessage: UIMessage = {
        id: 'temp',
        role: 'user',
        parts: [{ type: 'text', text: message }]
      };
      
      title = await generateTitleFromUserMessage({ message: uiMessage });
    } catch (error) {
      console.error('Error generating title:', error);
      // Fallback to simple truncated message
      title = message.length > 50 ? message.substring(0, 50) + '...' : message;
    }
    
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Insert new chat
    const { data: chat, error } = await supabase
      .from('chats')
      .insert([
        { 
          title: title.trim(),
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating chat:', error);
      return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
    }

    return NextResponse.json({ chat }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Unexpected error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body to get chat ID
    const { chatId } = await req.json();
    
    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    // Verify user owns this chat
    const { data: chat } = await supabase
      .from('chats')
      .select('chat_id')
      .eq('chat_id', chatId)
      .eq('user_id', user.id)
      .single();

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Delete all messages associated with the chat first
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('chat_id', chatId);

    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
      return NextResponse.json({ error: 'Failed to delete messages' }, { status: 500 });
    }

    // Delete the chat itself
    const { error: chatError } = await supabase
      .from('chats')
      .delete()
      .eq('chat_id', chatId)
      .eq('user_id', user.id);

    if (chatError) {
      console.error('Error deleting chat:', chatError);
      return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Unexpected error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}