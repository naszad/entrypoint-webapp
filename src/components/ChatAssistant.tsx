'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MessagesSquare, Send, X, MoveDown } from 'lucide-react'
import { useChat } from '@ai-sdk/react';
import { cn } from '@/utils/utils'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { TypingAnimation } from './TypingAnimation/TypingAnimation';

export function ChatAssistant() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false)
  const [showJumpToBottom, setShowJumpToBottom] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    onToolCall: ({ toolCall }) => {
      if (toolCall.toolName === 'navigate') {
        const { url, description } = toolCall.args as {
          url: string,
          description: string
        };

        if (typeof url === 'string' && typeof description === 'string') {
          console.log(`Executing navigation tool to URL: ${url} (Description: "${description}")`);
          
          // Use router.push for client-side navigation
          router.push(url);
          
          return; 
        } else {
          console.error('Invalid url or description argument for navigate tool:', toolCall.args);
          return;
        }
      }
    }
  });

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
      <Button
        onClick={handleToggle}
        className="fixed top-4 right-6 z-50 gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        aria-label={isOpen ? 'Close Assistant' : 'Open Assistant'}
      >
        {isOpen ? <X size={20} /> : (<><MessagesSquare size={20}  /> Assistant</>)}
      </Button>

      <div
        className={cn(
          'fixed top-0 right-0 h-full w-[400px] bg-background border-l transform transition-transform duration-300 ease-in-out z-40 shadow-[-4px_0_10px_rgba(0,0,0,0.1)]',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b pb-4">
            <MessagesSquare size={20} />
            <h2 className="text-lg font-semibold">Assistant</h2>
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
                      case 'tool-invocation': {
                        const invocation = part.toolInvocation
                        if (invocation.state === 'call' || invocation.state === 'partial-call') {
                          return (
                            <div key={`${message.id}-${i}`} className="text-sm text-gray-600 italic">
                              {`Calling tool "${invocation.toolName}" with args:`}
                              <pre className="whitespace-pre-wrap">{JSON.stringify(invocation.args, null, 2)}</pre>
                            </div>
                          )
                        }
                        if (invocation.state === 'result') {
                          // Special handling for navigation tool results
                          if (invocation.toolName === 'navigate') {
                            const { url, description } = invocation.result as { url: string; description: string };
                            return (
                              <div key={`${message.id}-${i}`} className="flex flex-col">
                                <a href={url} className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-md border border-blue-200 hover:bg-blue-200 hover:text-blue-800 transition-colors duration-150 mt-1">
                                  {description}
                                </a>
                              </div>
                            );
                          }
                          
                          // Default tool result display
                          return (
                            <div key={`${message.id}-${i}`} className="text-sm text-gray-600 italic">
                              {`Tool result from "${invocation.toolName}":`}
                              <pre className="whitespace-pre-wrap">{JSON.stringify(invocation.result, null, 2)}</pre>
                            </div>
                          )
                        }
                        return null
                      }
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
                      handleSubmit(e)
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