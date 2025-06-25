'use client'

import { useState, useEffect, useRef } from 'react'
import { MessagesSquare, Send, X, MoveDown, Trash2 } from 'lucide-react'
import { useChat } from '@ai-sdk/react';
import { cn } from '@/utils/utils'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { TypingAnimation } from './TypingAnimation/TypingAnimation';
import { useChatAssistantOpen } from "@/context/ChatAssistantOpenContext";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type FiltersApplied = {
  gradeLevel?: number;
  fullName?: string;
  enrollmentStatus?: 'active' | 'inactive';
  gender?: 'male' | 'female';
  homeroomName?: string;
  graduationYear?: number;
  email?: string;
  ageFilter?: {
    age: number;
    operator: 'eq' | 'gte' | 'lte';
  };
};

type ToolInvocation = {
  toolName: string;
  result: {
    url?: string;
    filtersApplied?: FiltersApplied;
  }
}

const generateFilterDescription = (filters?: FiltersApplied): string => {
  if (!filters || Object.keys(filters).length === 0) {
    return 'View All Students';
  }

  const descriptions: string[] = [];

  if (filters.gradeLevel) {
    descriptions.push(`grade ${filters.gradeLevel}`);
  }
  if (filters.fullName) {
    descriptions.push(`name: "${filters.fullName}"`);
  }
  if (filters.enrollmentStatus) {
    descriptions.push(filters.enrollmentStatus);
  }
  if (filters.gender) {
    descriptions.push(filters.gender);
  }
  if (filters.homeroomName) {
    descriptions.push(`homeroom: "${filters.homeroomName}"`);
  }
  if (filters.graduationYear) {
    descriptions.push(`graduating ${filters.graduationYear}`);
  }
  if (filters.email) {
    descriptions.push(`email: "${filters.email}"`);
  }
  if (filters.ageFilter) {
    const { age, operator } = filters.ageFilter;
    switch (operator) {
      case 'eq':
        descriptions.push(`age ${age}`);
        break;
      case 'gte':
        descriptions.push(`age ${age}+`);
        break;
      case 'lte':
        descriptions.push(`age <= ${age}`);
        break;
    }
  }

  let fullDescription = `View students: ${descriptions.join(', ')}`;
  if (fullDescription.length > 50) {
    fullDescription = fullDescription.substring(0, 47) + '...';
  }
  return fullDescription;
};

export function ChatAssistant() {
  const { isChatAssistantOpen, setIsChatAssistantOpen } = useChatAssistantOpen()
  const [showJumpToBottom, setShowJumpToBottom] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const router = useRouter();
  const [lastNavigatedMessageId, setLastNavigatedMessageId] = useState<string | null>(null);

  // Load initial messages from localStorage for persistence
  const [initialMessages] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('chatAssistantMessages');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (err) {
          console.error('Failed to parse stored chat messages', err);
        }
      }
    }
    return [];
  });

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: handleChatSubmit,
    status,
    setMessages,
    setInput,
  } = useChat({
    id: 'chat-assistant',
    initialMessages,
  });

  // Handler to clear chat history
  const clearChat = () => {
    setMessages([]);
    setInput('');
    localStorage.removeItem('chatAssistantMessages');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    // `handleChatSubmit` will automatically append the user's message (from `input`)
    // and send it to the API. The `useChat` hook manages the message list and
    // will handle the full request-response cycle with tools.
    handleChatSubmit(e as React.FormEvent<HTMLFormElement>);
  };

  // Persist chat messages to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('chatAssistantMessages', JSON.stringify(messages));
    } catch (err) {
      console.error('Failed to store chat messages', err);
    }
  }, [messages]);

  // Automatic navigation when a filter_students tool result is available
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];

    if (lastMessage.id === lastNavigatedMessageId) return;

    if (lastMessage.role === 'assistant' && lastMessage.toolInvocations) {
      const toolInvocation = (lastMessage.toolInvocations as ToolInvocation[]).find(
        (inv) => inv.toolName === 'filter_students'
      );

      if (toolInvocation?.result?.url) {
        router.push(toolInvocation.result.url);
        setLastNavigatedMessageId(lastMessage.id);
      }
    }
  }, [messages, router, lastNavigatedMessageId]);

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('chatAssistantOpen')
    if (savedState !== null) {
      setIsChatAssistantOpen(JSON.parse(savedState))
    }
    // Listen for storage events
    const handleStorageChange = () => {
      const saved = localStorage.getItem('chatAssistantOpen');
      if (saved !== null) {
        setIsChatAssistantOpen(JSON.parse(saved));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [setIsChatAssistantOpen]);

  // Handle scroll events
  const handleScroll = () => {
    if (!messagesContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
    setShowJumpToBottom(!isAtBottom)
  }

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Add scroll event listener
  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages])

  // Save state to localStorage and emit storage event
  const handleToggle = () => {
    const newState = !isChatAssistantOpen
    setIsChatAssistantOpen(newState)
    localStorage.setItem('chatAssistantOpen', JSON.stringify(newState))
    window.dispatchEvent(new Event('storage'))
  }

  return (
    <>
      {!isChatAssistantOpen && (
        <Button id="chat-assistant-button"
          onClick={handleToggle}
          className="fixed top-9 right-9 z-50 gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          aria-label="Open Assistant"
        >
          <MessagesSquare size={20} className="text-blue-500" /> Assistant
        </Button>
      )}

      <div
        className={cn(
          'fixed top-0 right-0 h-full w-[400px] bg-background border-l transform transition-transform duration-300 ease-in-out z-40 shadow-[-4px_0_10px_rgba(0,0,0,0.1)]',
          isChatAssistantOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b pb-4">
            <div className="flex items-center gap-2 flex-1">
              <MessagesSquare size={20} className="text-blue-500" />
              <h2 className="text-lg font-semibold">Assistant</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={clearChat} variant="ghost" size="icon" aria-label="Clear chat history">
                <Trash2 size={20} />
              </Button>
              <Button onClick={handleToggle} variant="ghost" size="icon" aria-label="Close Assistant">
                <X size={20} />
              </Button>
            </div>
          </div>
          
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto relative"
          >
            {messages.map((message) => {
              let toolResult: ToolInvocation['result'] | undefined;

              if (message.role === 'assistant' && message.toolInvocations) {
                const toolInvocation = (message.toolInvocations as ToolInvocation[]).find(
                  (inv) => inv.toolName === 'filter_students'
                );
                if (toolInvocation?.result?.url) {
                  toolResult = toolInvocation.result;
                }
              }
              return (
              <div
                key={message.id}
                className={cn(
                  "whitespace-pre-wrap p-2 rounded-lg mb-2 max-w-[85%]",
                  message.role === 'user'
                    ? "ml-auto bg-blue-100"
                    : "mr-auto bg-gray-100"
                )}
              >
                {message.content}
                {toolResult?.url && (
                  <div className="mt-2">
                    <Button asChild variant="action" size="sm" className="h-auto">
                      <Link href={toolResult.url}>
                        {generateFilterDescription(toolResult.filtersApplied)}
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
              )
            })}
            <div ref={messagesEndRef} />
            {(status === 'submitted' || status === 'streaming') && <TypingAnimation />}
            {showJumpToBottom && (
              <Button
                variant="primary"
                size="sm"
                onClick={scrollToBottom}
                className="fixed bottom-24 left-1/2 transform -translate-x-1/2"
              >
                <MoveDown size={20} />
                Jump to bottom
              </Button>
            )}
          </div>

          <div className="mt-auto p-2 border-t">
            <div className="flex gap-2">
              <div className="w-[95%]">
                <Input
                  autoFocus={isChatAssistantOpen}
                  placeholder="Need help? Press enter to send"
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
                    }
                  }}
                />
              </div>
              <Button onClick={handleSubmit} className='mt-2' variant="primary" size="icon">
                <Send size={40} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 