import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/supabaseServer';

// PATCH - Update chat (e.g., title, timestamp)
export async function PATCH(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = await params;
    const updates = await req.json();
    
    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    // Add updated_at timestamp to all updates
    const updatesWithTimestamp = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Update the chat (with user ownership verification)
    const { data: chat, error } = await supabase
      .from('chats')
      .update(updatesWithTimestamp)
      .eq('chat_id', chatId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating chat:', error);
      return NextResponse.json({ error: 'Failed to update chat' }, { status: 500 });
    }

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json({ chat });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Unexpected error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}