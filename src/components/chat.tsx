'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/conversation';
import { Message, MessageContent } from '@/components/message';
import {
  PromptInput,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/prompt-input';
import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useRouter } from 'next/navigation';
import { Response } from '@/components/response';
import { 
  Actions, 
  Action, 
} from '@/components/actions';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/tool';
import { 
  GlobeIcon, 
  CopyIcon,
  CheckIcon,
  MessageCircle,
} from 'lucide-react';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/sources';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/reasoning';
import { TypingAnimation } from '@/components/TypingAnimation/TypingAnimation';
import { 
  Sidebar,
  SidebarHeader,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button';
import { DropdownHistory } from './dropdown-history';
import { DBMessage } from '@/models/Messages';
import type { AllToolUIParts } from '@/types/ChatToolTypes';

const models = [
  {
    name: 'GPT 4o',
    value: 'gpt-4o',
  },
];

export function Chat() {
  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const router = useRouter();
  
  const { messages, sendMessage, status, setMessages, addToolResult } = useChat({
    transport: new DefaultChatTransport({
        api: '/api/ai'
    }),
    // Handle client-side tools that should be automatically executed
    async onToolCall({ toolCall }) {
      // Check if it's a dynamic tool first for proper type narrowing
      if (toolCall.dynamic) {
        return;
      }

      if (toolCall.toolName === 'navigate') {
        // Automatically navigate to the provided URL
        const { url } = toolCall.input as { url: string };
        console.log('Auto-navigating to:', url);
        router.push(url);
        
        // Add tool result without await to avoid potential deadlocks
        addToolResult({
          tool: 'navigate',
          toolCallId: toolCall.toolCallId,
          output: { success: true, navigatedTo: url },
        });
      }
    },
  });

  const loadChat = async (chatId: string) => {
    setLoadingChat(true);
    try {
      const response = await fetch(`/api/ai/messages?chatId=${chatId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load chat');
      }

      const { messages: chatMessages } = await response.json();
      
      // Convert database messages to useChat format
      const uiMessages = chatMessages.map((msg: DBMessage) => {
        const parts = Array.isArray(msg.parts) ? msg.parts : [];
        console.log(`Loading message ${msg.messageId} with ${parts.length} parts:`, 
          parts.map((part: { type?: string }) => part.type))
        return {
          id: msg.messageId,
          role: msg.role,
          parts: msg.parts,
          createdAt: new Date(msg.createdAt)
        }
      });

      setMessages(uiMessages);
      setCurrentChatId(chatId);
      
      // Scroll to bottom after loading messages
      setTimeout(() => {
        const conversationElement = document.querySelector('[role="log"]');
        if (conversationElement) {
          conversationElement.scrollTop = conversationElement.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error('Error loading chat:', error);
      // Could add error toast here
    } finally {
      setLoadingChat(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    let chatId = currentChatId;
    
    // If no current chat, create one first
    if (!chatId) {
      try {
        const response = await fetch('/api/ai/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: input }),
        });
        
        if (response.ok) {
          const { chat } = await response.json();
          chatId = chat.chat_id;
          setCurrentChatId(chatId);
        }
      } catch (error) {
        console.error('Error creating chat:', error);
        // Fallback to letting backend create the chat
      }
    }

    sendMessage({ text: input }, {
      body: {
        model: model,
        webSearch: webSearch,
        chatId: chatId,
      },
    });
    setInput('');
  };

  return (
    <Sidebar side="right">
        <SidebarHeader className="p-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2 flex-1">
              <h2 className="text-lg font-semibold">Assistant</h2>
              {currentChatId && (
                <Button variant="outline" size="sm" onClick={startNewChat} className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  New Chat
                </Button>
              )}
            </div>
            <DropdownHistory onChatSelect={loadChat} />
          </div>
        </SidebarHeader>
        <Conversation className="h-full">
            <ConversationContent>
                {loadingChat && (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading chat...</div>
                  </div>
                )}
                {messages.map((message, messageIndex) => (
                <div key={message.id}>
                    {message.role === 'assistant' && webSearch && (
                    <Sources>
                        <SourcesTrigger
                        count={
                            message.parts.filter(
                            (part) => part.type === 'source-url',
                            ).length
                        }
                        />
                        {message.parts.filter((part) => part.type === 'source-url').map((part, i) => (
                        <SourcesContent key={`${message.id}-${i}`}>
                            <Source
                            key={`${message.id}-${i}`}
                            href={part.url}
                            title={part.url}
                            />
                        </SourcesContent>
                        ))}
                    </Sources>
                    )}
                    <Message from={message.role} key={message.id}>
                    <MessageContent>
                        {message.parts.map((part, i) => {
                        switch (part.type) {
                            case 'text':
                              const isLastMessage = messageIndex === messages.length - 1;
                            return (
                                <div key={`${message.id}-${i}`}>
                                <Response defaultOrigin="http://localhost:3000" allowedLinkPrefixes={['/students/', '/grades/']}>{part.text}</Response>
                                {message.role === 'assistant' && isLastMessage && (
                                    <Actions className="mt-2">
                                        <Action
                                            onClick={() => {
                                                navigator.clipboard.writeText(part.text);
                                                setCopiedMessageId(message.id);
                                                setTimeout(() => setCopiedMessageId(null), 2000);
                                            }}
                                            label="Copy"
                                        >
                                            {copiedMessageId === message.id ? (
                                                <CheckIcon className="size-3" />
                                            ) : (
                                                <CopyIcon className="size-3" />
                                            )}
                                        </Action>
                                    </Actions>
                                    )}
                                </div>
                            );
                            case 'reasoning':
                            return (
                                <Reasoning
                                key={`${message.id}-${i}`}
                                className="w-full"
                                isStreaming={status === 'streaming'}
                                >
                                <ReasoningTrigger />
                                <ReasoningContent>{part.text}</ReasoningContent>
                                </Reasoning>
                            );
                            default:
                            // Handle tool UI parts
                            if (part.type.startsWith('tool-')) {
                                const toolPart = part as AllToolUIParts;
                                // Setting this to false for now to prevent the tools from crowding the UI
                                // const shouldDefaultOpen = toolPart.state === 'output-available' || toolPart.state === 'output-error';
                                const shouldDefaultOpen = false;
                                
                                return (
                                <Tool key={`${message.id}-${i}`} defaultOpen={shouldDefaultOpen}>
                                    <ToolHeader 
                                        type={toolPart.type} 
                                        state={toolPart.state}
                                        output={toolPart.output}
                                        errorText={toolPart.errorText}
                                    />
                                    <ToolContent>
                                    {toolPart.input && <ToolInput input={toolPart.input} />}
                                    {(toolPart.output || toolPart.errorText) && (
                                        <ToolOutput 
                                        output={toolPart.output} 
                                        errorText={toolPart.errorText}
                                        type={toolPart.type}
                                        />
                                    )}
                                    </ToolContent>
                                </Tool>
                                );
                            }
                            return null;
                        }
                        })}
                    </MessageContent>
                    </Message>
                </div>
                ))}
                {status === 'submitted' && <TypingAnimation />}
            </ConversationContent>
            <ConversationScrollButton />
        </Conversation>
        <PromptInput onSubmit={handleSubmit} className="mt-4">
            <PromptInputTextarea
                onChange={(e) => setInput(e.target.value)}
                value={input}
            />
            <PromptInputToolbar>
                <PromptInputTools>
                    <PromptInputButton
                        variant={webSearch ? 'default' : 'ghost'}
                        onClick={() => setWebSearch(!webSearch)}
                    >
                        <GlobeIcon size={16} />
                        <span>Search</span>
                    </PromptInputButton>
                    <PromptInputModelSelect
                        onValueChange={(value) => {
                        setModel(value);
                        }}
                        value={model}
                    >
                        <PromptInputModelSelectTrigger>
                            <PromptInputModelSelectValue />
                        </PromptInputModelSelectTrigger>
                        <PromptInputModelSelectContent>
                        {models.map((model) => (
                            <PromptInputModelSelectItem key={model.value} value={model.value}>
                            {model.name}
                            </PromptInputModelSelectItem>
                        ))}
                        </PromptInputModelSelectContent>
                    </PromptInputModelSelect>
                </PromptInputTools>
                <PromptInputSubmit disabled={!input} status={status} />
            </PromptInputToolbar>
        </PromptInput>
    </Sidebar>
  );
};