import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAgentUIStream, createUIMessageStreamResponse, NoSuchModelError, readUIMessageStream } from 'ai';
import type { LanguageModel, UIMessage, UIDataTypes, UITools, UIMessageChunk } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import { createClient } from '@/utils/supabase/supabaseServer';
import type { ChatMessage } from '@/types/Models';
import { createAgentRuntime } from '@/ai';
import type { RoutingDecision } from '@/ai';

const AI_MODEL_DEFAULT = process.env.AI_MODEL_DEFAULT || 'openai/gpt-4o';

export const maxDuration = 30;

interface IncomingRequestBody {
  messages?: AnyUIMessage[];
  chatId?: string;
  selectedModel?: string;
}

type ModelMessage = AnyUIMessage;
type AnyUIMessage = UIMessage<unknown, UIDataTypes, UITools>;
type BasicUIMessage = UIMessage<unknown, never, UITools>;

type DbMessageParts = { type: string; text?: string }[] | string | null;

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function POST(req: Request) {
  console.log('chat-v2: received request');
  try {
    const { messages: incomingMessages = [], chatId, selectedModel }: IncomingRequestBody = await req.json();

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required. Use /api/chat/new before calling chat-v2.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const modelIdentifier = selectedModel && process.env.ENABLE_DEV_OPTIONS === 'true' ? selectedModel : AI_MODEL_DEFAULT;

    let languageModel: LanguageModel;
    try {
      languageModel = resolveLanguageModel(modelIdentifier);
    } catch (error) {
      console.error('chat-v2: failed to resolve language model', { modelIdentifier, error });
      const message = error instanceof Error ? error.message : 'Failed to resolve AI model';
      const isClientError =
        error instanceof NoSuchModelError ||
        (error instanceof Error && (message.startsWith('Unsupported') || message.startsWith('Invalid model identifier')));
      return NextResponse.json({ error: message }, { status: isClientError ? 400 : 500 });
    }

    const { data: existingMessages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('chat-v2: failed to load existing messages', messagesError);
      return NextResponse.json({ error: 'Failed to load chat messages' }, { status: 500 });
    }

    const dbMessages = (existingMessages ?? []).map(convertDbMessageToUIMessage);
    const combinedMessages = mergeMessages(dbMessages, incomingMessages);

    const latestIncoming = incomingMessages[incomingMessages.length - 1];
    if (latestIncoming && latestIncoming.role === 'user') {
      await persistUserMessage({
        supabase,
        chatId,
        message: latestIncoming
      });
    }

    const cookieStore = await cookies();
  const selectedSchoolIdRaw = cookieStore.get('selectedSchoolId')?.value ?? null;
  const selectedCustomerIdRaw = cookieStore.get('customer_id')?.value ?? null;
  const selectedSchoolId = selectedSchoolIdRaw?.trim() || null;
  const selectedCustomerId = selectedCustomerIdRaw?.trim() || null;

    const runtime = createAgentRuntime({
      model: languageModel,
      context: {
        supabase,
        selectedSchoolId,
        selectedCustomerId,
        userId: userData.user.id
      }
    });

    const latestUserText = findLatestUserMessageText(combinedMessages);
    const conversationSummary = buildConversationSummary(combinedMessages);
  const decision = await runtime.decide({ latestUserMessage: latestUserText, conversationSummary });

    console.log('chat-v2 routing decision', {
      agentId: decision.agentId,
      reason: decision.reason,
      signals: decision.signals
    });

    const runtimeMessages = combinedMessages
      .map(toBasicUIMessage)
      .filter((message) => message.parts.length > 0);

    const streamInput = {
      agent: decision.agent,
      messages: runtimeMessages,
      originalMessages: runtimeMessages
    };

    const agentStream = await createAgentUIStream(streamInput as unknown as Parameters<typeof createAgentUIStream>[0]);

    const [responseStream, persistenceStream] = agentStream.tee();

    persistAssistantTurn(persistenceStream, {
      supabase,
      chatId,
      decision
    }).catch((error) => {
      console.error('chat-v2: failed to persist assistant turn', error);
    });

    return createUIMessageStreamResponse({
      stream: responseStream
    });
  } catch (error) {
    console.error('chat-v2: unexpected error', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function mergeMessages(existing: AnyUIMessage[], incoming: AnyUIMessage[]): AnyUIMessage[] {
  if (incoming.length === 0) {
    return existing;
  }

  const existingIds = new Set(existing.map((message) => message.id));
  const merged = [...existing];

  for (const message of incoming) {
    if (!existingIds.has(message.id)) {
      merged.push(message);
    }
  }

  return merged;
}

async function persistUserMessage({
  supabase,
  chatId,
  message
}: {
  supabase: SupabaseClient;
  chatId: string;
  message: AnyUIMessage;
}) {
  const textContent = extractTextFromMessage(message);
  const parts = buildPersistableParts(message, textContent);
  if (parts.length === 0) {
    return;
  }

  const now = new Date().toISOString();

  try {
    await Promise.all([
      supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          role: message.role,
          parts,
          metadata: (message as { metadata?: Record<string, unknown> }).metadata ?? null,
          created_at: now
        }),
      supabase.from('chats').update({ updated_at: now }).eq('chat_id', chatId)
    ]);
  } catch (error) {
    console.error('chat-v2: failed to persist user message', error);
  }
}

async function persistAssistantTurn(
  stream: ReadableStream<unknown>,
  {
    supabase,
    chatId,
    decision
  }: {
    supabase: SupabaseClient;
    chatId: string;
    decision: RoutingDecision;
  }
) {
  let lastAssistantMessage: AnyUIMessage | undefined;
  try {
    const uiMessageStream = readUIMessageStream<AnyUIMessage>({
      stream: stream as ReadableStream<UIMessageChunk>,
      terminateOnError: false,
      onError: (error) => {
        console.error('chat-v2: assistant stream error', error);
      }
    });

    for await (const message of uiMessageStream) {
      if (message.role === 'assistant') {
        lastAssistantMessage = message;
      }
    }
  } catch (error) {
    console.error('chat-v2: failed to read assistant stream', error);
    return;
  }

  if (!lastAssistantMessage) {
    return;
  }

  const textContent = extractTextFromMessage(lastAssistantMessage);
  const parts = buildPersistableParts(lastAssistantMessage, textContent);
  if (parts.length === 0) {
    return;
  }

  const now = new Date().toISOString();

  try {
    await Promise.all([
      supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          role: 'assistant',
          parts,
          metadata: {
            ...((lastAssistantMessage as { metadata?: Record<string, unknown> }).metadata ?? {}),
            v2: {
              agentId: decision.agentId,
              reason: decision.reason,
              signals: decision.signals
            }
          },
          created_at: now
        }),
      supabase.from('chats').update({ updated_at: now }).eq('chat_id', chatId)
    ]);
  } catch (error) {
    console.error('chat-v2: failed to persist assistant message', error);
  }
}

function convertDbMessageToUIMessage(message: ChatMessage): AnyUIMessage {
  const parts = normalizeDbParts(message.parts as DbMessageParts);
  return {
    id: (message as { message_id?: string }).message_id ?? crypto.randomUUID(),
    role: normalizeRole((message as { role?: string }).role),
    parts,
    metadata: (message as { metadata?: Record<string, unknown> }).metadata ?? undefined
  } as AnyUIMessage;
}

function normalizeDbParts(parts: DbMessageParts): AnyUIMessage['parts'] {
  if (!parts) {
    return [] as AnyUIMessage['parts'];
  }

  if (typeof parts === 'string') {
    return [{ type: 'text', text: parts }] as AnyUIMessage['parts'];
  }

  const combined = parts
    .map((part) => (typeof part.text === 'string' ? part.text : ''))
    .filter((text) => text.length > 0)
    .join('\n');

  if (!combined) {
    return [] as AnyUIMessage['parts'];
  }

  return [{ type: 'text', text: combined }] as AnyUIMessage['parts'];
}

function extractTextFromMessage(message: ModelMessage | undefined): string {
  if (!message) {
    return '';
  }

  if (Array.isArray(message.parts)) {
    return message.parts.reduce<string>((accumulator, part) => {
      if (part.type === 'text' && typeof (part as { text?: string }).text === 'string') {
        return accumulator + (part as { text: string }).text;
      }
      return accumulator;
    }, '');
  }

  return '';
}

function buildPersistableParts(message: AnyUIMessage | undefined, fallbackText?: string): AnyUIMessage['parts'] {
  if (!message) {
    return [] as AnyUIMessage['parts'];
  }

  const existingParts = Array.isArray(message.parts) ? (message.parts as AnyUIMessage['parts']) : ([] as AnyUIMessage['parts']);
  if (existingParts.length > 0) {
    return existingParts;
  }

  const text = (fallbackText ?? extractTextFromMessage(message)).trim();
  if (!text) {
    return [] as AnyUIMessage['parts'];
  }

  return [{ type: 'text', text }] as AnyUIMessage['parts'];
}

function findLatestUserMessageText(messages: ModelMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
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

function toBasicUIMessage(message: AnyUIMessage): BasicUIMessage {
  const metadata = (message as { metadata?: Record<string, unknown> }).metadata;
  const parts = toBasicParts(message);
  const base: BasicUIMessage = {
    id: message.id,
    role: message.role,
    parts
  };

  if (metadata) {
    base.metadata = metadata;
  }

  return base;
}

function toBasicParts(message: AnyUIMessage): BasicUIMessage['parts'] {
  const text = extractTextFromMessage(message);
  if (!text) {
    return [] as BasicUIMessage['parts'];
  }

  return [{ type: 'text', text }] as BasicUIMessage['parts'];
}

function normalizeRole(role?: string): 'system' | 'user' | 'assistant' {
  if (role === 'system' || role === 'user' || role === 'assistant') {
    return role;
  }
  return 'assistant';
}

function resolveLanguageModel(modelIdentifier: string): LanguageModel {
  const trimmedIdentifier = modelIdentifier.trim();
  if (!trimmedIdentifier) {
    throw new Error('Invalid model identifier: value is empty');
  }

  const [initialProvider, ...rest] = trimmedIdentifier.split('/');
  let provider = initialProvider;
  let modelName = rest.join('/');

  if (!modelName) {
    modelName = provider;
    provider = 'openai';
  }

  switch (provider) {
    case 'openai': {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not configured for OpenAI model selection');
      }

      const openai = createOpenAI({
        apiKey,
        baseURL: process.env.OPENAI_BASE_URL,
        organization: process.env.OPENAI_ORGANIZATION,
        project: process.env.OPENAI_PROJECT
      });

      return openai.languageModel(modelName);
    }
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}
