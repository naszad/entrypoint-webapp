'use client'

import { useState, useEffect, useRef } from 'react'
import { MessagesSquare, Send, X, MoveDown, Trash2 } from 'lucide-react'
import { useChat } from '@ai-sdk/react';
import { cn } from '@/utils/utils'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { TypingAnimation } from './TypingAnimation/TypingAnimation';

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [showJumpToBottom, setShowJumpToBottom] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

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

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('chatAssistantOpen')
    if (savedState !== null) {
      setIsOpen(JSON.parse(savedState))
    }
  }, [])

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
    const newState = !isOpen
    setIsOpen(newState)
    localStorage.setItem('chatAssistantOpen', JSON.stringify(newState))
    // Emit storage event for other components to listen to
    window.dispatchEvent(new Event('storage'))
  }

  return (
    <>
      {!isOpen && (
        <Button
          onClick={handleToggle}
          className="fixed top-4 right-6 z-50 gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          aria-label="Open Assistant"
        >
          <MessagesSquare size={20} /> Assistant
        </Button>
      )}

      <div
        className={cn(
          'fixed top-0 right-0 h-full w-[400px] bg-background border-l transform transition-transform duration-300 ease-in-out z-40 shadow-[-4px_0_10px_rgba(0,0,0,0.1)]',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b pb-4">
            <div className="flex items-center gap-2 flex-1">
              <MessagesSquare size={20} />
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
            {messages.map(message => (
              <div
                key={message.id}
                className={cn(
                  "whitespace-pre-wrap p-2 rounded-lg mb-2 max-w-[85%]",
                  message.role === 'user'
                    ? "ml-auto bg-blue-100"
                    : "mr-auto bg-gray-100"
                )}
              >
                {/* Display streamed parts if available, otherwise fallback to content */}
                {message.parts && message.parts.length > 0 ? (
                  message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return <div key={`${message.id}-${i}`}>{part.text}</div>
                      default:
                        return null
                    }
                  })
                ) : (
                  <div>{message.content}</div>
                )}
              </div>
            ))}
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
                  autoFocus={isOpen}
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