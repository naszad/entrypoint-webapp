import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/supabaseServer';

// GET messages for a specific chat
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const chatId = url.searchParams.get('chatId');
    
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

    // Fetch messages for this chat
    const { data: messages, error } = await supabase
      .from('messages')
      .select('message_id, role, parts, created_at, metadata')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Unexpected error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Create a new message
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId, role, parts, metadata } = await req.json();
    
    if (!chatId || !role || !parts) {
      return NextResponse.json({ error: 'Chat ID, role, and parts are required' }, { status: 400 });
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

    // Insert the message
    const { data: message, error } = await supabase
      .from('messages')
      .insert([{
        chat_id: chatId,
        role,
        parts,
        created_at: new Date().toISOString(),
        ...(metadata && { metadata })
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Unexpected error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}