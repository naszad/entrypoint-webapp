'use client'

// --- REACT & THIRD-PARTY IMPORTS ---
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@ai-sdk/react'
import ReactMarkdown from "react-markdown"
import Link from 'next/link'

// --- ICON IMPORTS ---
import { Send, MoveDown, Trash2 } from 'lucide-react'

// --- UI COMPONENT IMPORTS ---
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar'
import { TypingAnimation } from './TypingAnimation/TypingAnimation'

// --- UTILITY IMPORTS ---
import { cn } from '@/utils/utils'

// --- TYPE DEFINITIONS ---
type ToolResult = {
  url?: string;
  filtersApplied?: Record<string, unknown>;
  description?: string;
  [key: string]: unknown;
};

type MessagePart = {
  type: 'text' | 'tool-call' | 'tool-result';
  text?: string;
  toolCallId?: string;
  toolName?: string;
  args?: Record<string, unknown>;
  result?: ToolResult;
};

type LegacyToolInvocation = {
  toolName: string;
  result?: ToolResult;
};

type UIMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: MessagePart[];
  // Legacy support
  content?: string;
  toolInvocations?: LegacyToolInvocation[];
};

// --- COMPONENT DEFINITION ---
export function ChatAssistant() {
  // --- STATE: UI & INTERACTION ---
  const [showJumpToBottom, setShowJumpToBottom] = useState(false)
  const [input, setInput] = useState('')
  
  // --- STATE: NAVIGATION TRACKING ---
  const [lastNavigatedMessageId, setLastNavigatedMessageId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('lastNavigatedMessageId');
    }
    return null;
  });

  // --- STATE: CHAT INITIALIZATION ---
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

  // --- REFS ---
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  
  // --- HOOKS ---
  const router = useRouter();
  const { messages, sendMessage, status, setMessages } = useChat({
    messages: initialMessages,
  });

  // --- HELPER FUNCTIONS: MESSAGE PROCESSING ---
  const extractToolResult = useCallback((message: UIMessage) => {
    if (message.role !== 'assistant') return null;

    // v5 uses parts structure - prioritize this
    if (message.parts && message.parts.length > 0) {
      const toolResultPart = message.parts.find(
        (part: MessagePart) => part.type === 'tool-result' && part.toolName === 'filter_students'
      );
      if (toolResultPart?.result) {
        return toolResultPart.result;
      }
    }

    // Fallback to v4 toolInvocations for backward compatibility
    if (message.toolInvocations && message.toolInvocations.length > 0) {
      const filterStudentsTool = message.toolInvocations.find(
        (inv: LegacyToolInvocation) => inv.toolName === 'filter_students'
      );
      if (filterStudentsTool?.result) {
        return filterStudentsTool.result;
      }
    }

    return null;
  }, []);

  const getMessageContent = useCallback((message: UIMessage) => {
    // v5 uses parts structure - prioritize this
    if (message.parts && message.parts.length > 0) {
      return message.parts
        .filter((part: MessagePart) => part.type === 'text')
        .map((part: MessagePart) => part.text || '')
        .join('');
    }

    // Fallback to v4 content structure for backward compatibility
    return message.content || '';
  }, []);

  // --- HELPER FUNCTIONS: SCROLL MANAGEMENT ---
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
    setShowJumpToBottom(!isAtBottom)
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // --- EVENT HANDLERS ---
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }, [])

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    sendMessage({ text: input });
    setInput('');
  }, [input, sendMessage])

  const clearChat = useCallback(() => {
    setMessages([]);
    setInput('');
    localStorage.removeItem('chatAssistantMessages');
    setLastNavigatedMessageId(null);
  }, [setMessages])

  // --- EFFECTS: PERSISTENCE ---
  // Persist navigation state to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (lastNavigatedMessageId) {
        sessionStorage.setItem('lastNavigatedMessageId', lastNavigatedMessageId);
      } else {
        sessionStorage.removeItem('lastNavigatedMessageId');
      }
    }
  }, [lastNavigatedMessageId]);

  // Persist chat messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('chatAssistantMessages', JSON.stringify(messages));
    } catch (err) {
      console.error('Failed to store chat messages', err);
    }
  }, [messages]);

  // --- EFFECTS: NAVIGATION ---
  // Auto-navigate when filter_students tool result is available
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1] as UIMessage;

    if (lastMessage.id === lastNavigatedMessageId) return;

    const toolResult = extractToolResult(lastMessage);
    if (toolResult?.url) {
      router.push(toolResult.url);
      setLastNavigatedMessageId(lastMessage.id);
    }
  }, [messages, router, lastNavigatedMessageId, extractToolResult]);

  // --- EFFECTS: SCROLL MANAGEMENT ---
  // Set up scroll event listener
  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages, scrollToBottom])

  // --- COMPONENT RENDERING ---
  return (
      <Sidebar side="right">
        {/* SIDEBAR HEADER */}
        <SidebarHeader className="p-4">
          <div className="flex items-center justify-between mb-4 border-b pb-4">
            <div className="flex items-center gap-2 flex-1">
              <h2 className="text-lg font-semibold">Assistant</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={clearChat} variant="ghost" size="icon" aria-label="Clear chat history">
                <Trash2 size={20} />
              </Button>
            </div>
          </div>
        </SidebarHeader>
        
        {/* MESSAGES CONTENT */}
        <SidebarContent className="p-4">
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto relative"
          >
            {/* MESSAGE LIST */}
            {messages.map((message) => {
              const uiMessage = message as UIMessage;
              const toolResult = extractToolResult(uiMessage);
              const textContent = getMessageContent(uiMessage);

              return (
                <div
                  key={uiMessage.id}
                  className={cn(
                    "p-2 rounded-lg mb-2 max-w-[85%]",
                    uiMessage.role === 'user'
                      ? "ml-auto bg-blue-100"
                      : "mr-auto bg-gray-100"
                  )}
                >
                  {/* MESSAGE TEXT */}
                  <div className="prose prose-sm max-w-none prose-a:text-blue-600">
                    <ReactMarkdown>{textContent}</ReactMarkdown>
                  </div>
                  
                  {/* TOOL RESULT BUTTON */}
                  {toolResult?.url && (
                    <div className="mt-2">
                      <Button asChild variant="action" size="sm" className="h-auto">
                        <Link href={toolResult.url}>
                          {toolResult.description || 'View Students'}
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
            
            {/* SCROLL ANCHOR */}
            <div ref={messagesEndRef} />
            
            {/* TYPING INDICATOR */}
            {status === 'submitted' && <TypingAnimation />}
            
            {/* JUMP TO BOTTOM BUTTON */}
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
        </SidebarContent>
        
        {/* INPUT AREA */}
        <div className="mt-auto p-4 border-t">
          <div className="flex gap-2">
            <div className="w-[95%]">
              <Input
                autoFocus={true}
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
      </Sidebar>
  )
} 