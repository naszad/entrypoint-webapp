import { convertToModelMessages } from 'ai';
import { createClient } from '@/utils/supabase/supabaseServer';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ChatMessage } from '@/types/Models';
import { UIMessage } from 'ai';

// Import new modular services
import { createToolRegistry } from './tools';
import { routeChatRequest } from './workflows/routingWorkflow';
import { runWorkflow } from './workflows/workflowRegistry';

type ModelMessage = ReturnType<typeof convertToModelMessages>[number];

function extractTextFromContent(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }
        if (item && typeof item === 'object' && 'text' in item && typeof (item as { text?: unknown }).text === 'string') {
          return (item as { text: string }).text;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }

  if (content && typeof content === 'object' && 'text' in (content as { text?: unknown }) && typeof (content as { text?: unknown }).text === 'string') {
    return (content as { text: string }).text;
  }

  return '';
}

function extractTextFromMessage(message: ModelMessage | Record<string, unknown>): string {
  const fromContent = 'content' in message ? extractTextFromContent((message as { content?: unknown }).content) : '';
  if (fromContent) {
    return fromContent;
  }

  if ('parts' in message && Array.isArray((message as { parts?: unknown }).parts)) {
    const parts = (message as { parts: unknown[] }).parts;
    return parts
      .map((part) => {
        if (part && typeof part === 'object' && 'text' in (part as { text?: unknown }) && typeof (part as { text?: unknown }).text === 'string') {
          return (part as { text: string }).text;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }

  return '';
}

function findLatestUserMessageText(messages: ModelMessage[]): string {
  for (let idx = messages.length - 1; idx >= 0; idx -= 1) {
    const message = messages[idx];
    if (message.role === 'user') {
      const text = extractTextFromMessage(message);
      if (text.trim()) {
        return text;
      }
    }
  }
  return '';
}

function buildConversationSummary(messages: ModelMessage[], limit = 6): string {
  if (!messages.length) {
    return '';
  }

  const startIndex = Math.max(messages.length - limit, 0);
  return messages
    .slice(startIndex)
    .map((message) => {
      const role = message.role?.toUpperCase?.() ?? String(message.role ?? 'UNKNOWN').toUpperCase();
      const text = extractTextFromMessage(message);
      if (!text.trim()) {
        return '';
      }
      return `${role}: ${text.trim()}`;
    })
    .filter(Boolean)
    .join('\n');
}

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// GET endpoint to list all saved chats for the user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get all non-deleted chats for the user (without messages)
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('chat_id, title, created_at, updated_at')
      .eq('user_id', userData.user.id)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (chatsError) {
      return NextResponse.json({ error: 'Failed to load chats' }, { status: 500 });
    }

    return NextResponse.json({ chats });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { messages: uiMessages, chatId, selectedModel } = await req.json();
  
  // Require chatId to be present
  if (!chatId) {
    return NextResponse.json({ error: 'Chat ID is required. Create a chat first using /api/chat/new' }, { status: 400 });
  }

  // Only allow selectedModel if dev options are enabled via environment variable
  const isDevOptionsEnabled = process.env.ENABLE_DEV_OPTIONS === 'true';
  const modelToUse = (isDevOptionsEnabled && selectedModel) ? selectedModel : 'gpt-4o';
  console.log('modelToUse', modelToUse);
  
  let messages = convertToModelMessages(uiMessages);

  // Always load the full conversation from the database since only latest message is sent
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {

    // Load existing messages from the database
    const { data: existingMessages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      return NextResponse.json({ error: 'Failed to load chat messages' }, { status: 500 });
    }

    // Convert database messages to AI SDK format (text only, no tool calls)
    const dbMessages = existingMessages.map((msg: ChatMessage) => {
      let textContent = '';
      
      if (Array.isArray(msg.parts)) {
        // Extract only text parts, ignore tool calls and tool results
        const parts = msg.parts as { type: string; text: string }[];
        const textParts = parts.filter((part) => part.type === 'text');
        textContent = textParts.map((part) => part.text || '').join('');
      } else if (typeof msg.parts === 'string') {
        textContent = msg.parts;
      }
      
      return {
        id: msg.message_id,
        role: msg.role,
        content: textContent,
        parts: [{ type: 'text' as const, text: textContent }]
      };
    });
    
    // Combine existing messages with the new message
    if (uiMessages.length > 0) {
      const newMessage = convertToModelMessages([uiMessages[uiMessages.length - 1]]);
      messages = [...convertToModelMessages(dbMessages as UIMessage[]), ...newMessage];
    } else {
      messages = convertToModelMessages(dbMessages as UIMessage[]);
    }
  } catch (error) {
    console.error('Error loading existing messages:', error);
    return NextResponse.json({ error: 'Failed to load conversation' }, { status: 500 });
  }

  // Fetch selectedSchoolId from cookies at the beginning so it's available to all tools
  const cookieStore = await cookies();
  const selectedSchoolId = cookieStore.get('selectedSchoolId')?.value;

  // Save the new user message and update chat timestamp
  if (uiMessages && uiMessages.length > 0) {
    try {
      const supabase = await createClient();
      
      // Update existing chat timestamp
      await supabase
        .from('chats')
        .update({ updated_at: new Date() })
        .eq('chat_id', chatId);

      // Save the new user message (only the latest one sent from frontend)
      const latestMessage = uiMessages[uiMessages.length - 1];
      
      // Extract text content from the message
      let textContent = '';
      if (latestMessage.parts && Array.isArray(latestMessage.parts)) {
        // AI SDK format: message has parts array
        const messageParts = latestMessage.parts as { type: string; text: string }[];
        textContent = messageParts
          .filter((part) => part.type === 'text')
          .map((part) => part.text)
          .join('');
      } else if (typeof latestMessage.content === 'string') {
        // Fallback: direct string content
        textContent = latestMessage.content;
      } else if (Array.isArray(latestMessage.content)) {
        // Fallback: array of content parts
        const messageContent = latestMessage.content as { type: string; text: string }[];
        textContent = messageContent
          .filter((part) => part.type === 'text')
          .map((part) => part.text)
          .join('');
      } else if (latestMessage.content && typeof latestMessage.content === 'object' && latestMessage.content.text) {
        // Fallback: object with text property
        textContent = latestMessage.content.text;
      }
      
      const messageToInsert = {
        chat_id: chatId,
        role: latestMessage.role,
        parts: [{ type: 'text', text: textContent }],
        created_at: new Date(),
        metadata: latestMessage.metadata || null
      };

      // Insert only the new user message (don't delete existing messages)
      await supabase
        .from('chat_messages')
        .insert(messageToInsert);
    } catch (error) {
      console.error('Error saving user message:', error);
      // Don't fail the request if message saving fails
    }
  }

  // Create tool registry with context
  const toolRegistry = createToolRegistry({
    selectedSchoolId,
    userId: userData.user.id
  });

  const latestUserMessageText = findLatestUserMessageText(messages);
  const conversationSummary = buildConversationSummary(messages);
  const routingDecision = await routeChatRequest({
    latestUserMessage: latestUserMessageText,
    conversationSummary,
    toolRegistry
  });

  console.log('Routing decision', {
    category: routingDecision.category,
    confidence: routingDecision.confidence,
    workflow: routingDecision.workflowId,
    tools: routingDecision.toolNames
  });

  const workflowStream = await runWorkflow({
    messages,
    model: modelToUse,
    toolRegistry,
    decision: routingDecision,
    chatId,
    latestUserMessage: latestUserMessageText,
    conversationSummary
  });

  return workflowStream.toUIMessageStreamResponse();
}

// DELETE endpoint to soft delete a chat
export async function DELETE(req: Request) {
  try {
    const { chatId } = await req.json();
    
    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }
    
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Soft delete the chat by setting deleted_at timestamp
    const { error: deleteError } = await supabase
      .from('chats')
      .update({ deleted_at: new Date().toISOString() })
      .eq('chat_id', chatId)
      .eq('user_id', userData.user.id); // Ensure user owns the chat

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { chatId, title } = await request.json();

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    // Update chat title and updated_at timestamp
    const { data, error } = await supabase
      .from('chats')
      .update({ 
        title,
        updated_at: new Date().toISOString()
      })
      .eq('chat_id', chatId)
      .eq('user_id', userData.user.id) // Ensure user owns the chat
      .select();

    if (error) {
      return NextResponse.json({ error: 'Failed to update chat title' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Chat not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, chat: data[0] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
