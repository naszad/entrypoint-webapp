'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import ReactMarkdown from "react-markdown";
import { MessagesSquare, Send, ChevronRight, MoveDown, Plus, ChevronDown, Trash2, Edit3, X, Check, Sparkles, Settings, ThumbsUp, ThumbsDown, Minus, MessageCircle, CheckCircle, XCircle } from 'lucide-react'
import { useChat } from '@ai-sdk/react';
import { cn } from '@/utils/utils'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { TypingAnimation } from './TypingAnimation/TypingAnimation';
import { useChatAssistantOpen } from "@/context/ChatAssistantOpenContext";
import { registerSuperProperties } from '@/libs/mixpanelClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChatMessage } from '@/types/Models';

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

type GradesFiltersApplied = {
  fullName?: string;
  course_localCourseCode?: string;
  course_name?: string;
  gradeLetter?: string;
  gradePercentage?: {
    percentage: number;
    operator: 'eq' | 'gte' | 'lte';
  };
  gradeCode?: string;
  credit_type?: string;
  updatedAfter?: string;
  updatedBefore?: string;
};

type ChatInfo = {
  chat_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

type ToolInvocation = {
  toolName: string;
  result: {
    url?: string;
    filtersApplied?: FiltersApplied | GradesFiltersApplied;
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

const generateGradesFilterDescription = (filters?: GradesFiltersApplied): string => {
  if (!filters || Object.keys(filters).length === 0) {
    return 'View All Grades';
  }

  const descriptions: string[] = [];

  if (filters.fullName) {
    descriptions.push(`student: "${filters.fullName}"`);
  }
  if (filters.course_localCourseCode) {
    descriptions.push(`course code: "${filters.course_localCourseCode}"`);
  }
  if (filters.course_name) {
    descriptions.push(`course: "${filters.course_name}"`);
  }
  if (filters.gradeLetter) {
    descriptions.push(`grade: ${filters.gradeLetter}`);
  }
  if (filters.gradePercentage) {
    const { percentage, operator } = filters.gradePercentage;
    switch (operator) {
      case 'eq':
        descriptions.push(`${percentage}%`);
        break;
      case 'gte':
        descriptions.push(`${percentage}%+`);
        break;
      case 'lte':
        descriptions.push(`≤${percentage}%`);
        break;
    }
  }
  if (filters.gradeCode) {
    descriptions.push(`code: ${filters.gradeCode}`);
  }
  if (filters.credit_type) {
    descriptions.push(`subject: ${filters.credit_type}`);
  }
  if (filters.updatedAfter) {
    descriptions.push(`updated after ${filters.updatedAfter}`);
  }
  if (filters.updatedBefore) {
    descriptions.push(`updated before ${filters.updatedBefore}`);
  }

  let fullDescription = `View grades: ${descriptions.join(', ')}`;
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
  const [lastNavigatedMessageId, setLastNavigatedMessageId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('lastNavigatedMessageId');
    }
    return null;
  });

  // Current chat ID state with timeout checking
  // Environment variable: CHAT_TIMEOUT_HOURS (default: 24 hours)
  // Controls how long a chat ID is kept before expiring and creating a new chat
  const [currentChatId, setCurrentChatId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('currentChatData');
      if (storedData) {
        try {
          const { chatId, timestamp } = JSON.parse(storedData);
          const timeoutHours = parseInt(window.env.CHAT_TIMEOUT_HOURS != 'undefined' ? window.env.CHAT_TIMEOUT_HOURS : '24');
          const timeoutMs = timeoutHours * 60 * 60 * 1000; // Convert hours to milliseconds
          if ((Date.now() - timestamp) < timeoutMs) {
            return chatId;
          } else {
            // Chat has expired, remove it
            localStorage.removeItem('currentChatData');
            return null;
          }
        } catch {
          // Invalid stored data, remove it
          localStorage.removeItem('currentChatData');
          return null;
        }
      }
    }
    return null;
  });

  // Track when we're loading existing messages vs receiving new ones
  const [isLoadingExistingChat, setIsLoadingExistingChat] = useState(false);
  
  // Track initialization to prevent multiple chat creation using ref for immediate updates
  const initializationRef = useRef({
    isInitializing: false,
    hasInitialized: false
  });

  // Track chat switching to prevent navigation - using ref for immediate access
  const isSwitchingChatsRef = useRef(false);
  
  // Track ID syncing to prevent duplicate syncs
  const isSyncingIdsRef = useRef(false);
  const syncedMessageIdsRef = useRef<Set<string>>(new Set());

  // Chat list state
  const [chatList, setChatList] = useState<ChatInfo[]>([]);
  const [showChatDropdown, setShowChatDropdown] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [isTitleHovered, setIsTitleHovered] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  // Dev options state
  const [showDevOptions, setShowDevOptions] = useState(false);
  const [isDevOptionsEnabled, setIsDevOptionsEnabled] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const devOptionsRef = useRef<HTMLDivElement>(null);

  // Available OpenAI models for dev options
  const availableModels = useMemo(() => [
    { value: 'gpt-5', label: 'GPT-5' },
    { value: 'gpt-5-mini', label: 'GPT-5 Mini' },
    { value: 'gpt-5-nano', label: 'GPT-5 Nano' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
  ], []);

  // Message feedback state - maps message ID to sentiment
  const [messageFeedback, setMessageFeedback] = useState<Record<string, 'positive' | 'neutral' | 'negative'>>({});
  
  // Track which messages have had their feedback loaded
  const [loadedFeedbackMessages, setLoadedFeedbackMessages] = useState<Set<string>>(new Set());
  
  // Enhanced feedback state for comments and tags
  const [feedbackComments, setFeedbackComments] = useState<Record<string, string>>({});
  const [feedbackTags, setFeedbackTags] = useState<Record<string, string[]>>({});
  const [showFeedbackDetails, setShowFeedbackDetails] = useState<Record<string, boolean>>({});
  const [feedbackStatus, setFeedbackStatus] = useState<Record<string, 'idle' | 'submitting' | 'success' | 'error'>>({});
  
  // Available feedback tags
  const availableFeedbackTags = ['helpful', 'accurate', 'incomplete', 'misleading', 'too_verbose', 'unclear', 'not_relevant'];
  
  // Map AI SDK message IDs to database message IDs
  const [messageIdMapping, setMessageIdMapping] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (lastNavigatedMessageId) {
        sessionStorage.setItem('lastNavigatedMessageId', lastNavigatedMessageId);
      } else {
        sessionStorage.removeItem('lastNavigatedMessageId');
      }
    }
  }, [lastNavigatedMessageId]);

  // Persist current chat ID with timestamp
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (currentChatId) {
        const chatData = {
          chatId: currentChatId,
          timestamp: Date.now()
        };
        localStorage.setItem('currentChatData', JSON.stringify(chatData));
      } else {
        localStorage.removeItem('currentChatData');
      }
    }
  }, [currentChatId]);

  // Exit editing mode when assistant closes
  useEffect(() => {
    if (!isChatAssistantOpen && isEditingTitle) {
      cancelEditingTitle();
    }
  }, [isChatAssistantOpen, isEditingTitle]);

  // Check for dev options environment setting
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDevOptionsEnabledInEnv = window.env?.ENABLE_DEV_OPTIONS === 'true';
      
      // Enable dev options if environment allows it
      setIsDevOptionsEnabled(isDevOptionsEnabledInEnv);
      
      // Load saved model from localStorage
      const savedModel = localStorage.getItem('devSelectedModel');
      if (savedModel && availableModels.some(model => model.value === savedModel)) {
        setSelectedModel(savedModel);
      }
    }
  }, [availableModels]);

  // Handle click outside dev options dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (devOptionsRef.current && !devOptionsRef.current.contains(event.target as Node)) {
        setShowDevOptions(false);
      }
    }

    if (showDevOptions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDevOptions]);

  // Local state for input since AI SDK v5 doesn't provide it
  const [input, setInput] = useState('');

  const {
    messages,
    sendMessage,
    status,
    setMessages,
  } = useChat({
    id: 'chat-assistant'
  });

  // Function to sync message IDs with database
  const syncMessageIds = async () => {
    if (!currentChatId || messages.length === 0) return;
    
    // Prevent duplicate syncing
    if (isSyncingIdsRef.current) {
      console.log('Sync already in progress, skipping...');
      return;
    }
    
    try {
      isSyncingIdsRef.current = true;
      
      // Fetch the latest messages from the database to get their real IDs
      const response = await fetch(`/api/chat/${currentChatId}`);
      if (response.ok) {
        const { messages: dbMessages } = await response.json();
        
        // Create mapping based on message position and content
        const newMapping: Record<string, string> = {};
        
        messages.forEach((aiMessage, index) => {
          // Skip if already synced
          if (syncedMessageIdsRef.current.has(aiMessage.id)) {
            return;
          }
          
          // Find corresponding database message by position and role
          const dbMessage = dbMessages[index];
          if (dbMessage && dbMessage.role === aiMessage.role) {
            // Map AI SDK ID to database message ID
            if (aiMessage.id !== dbMessage.message_id) {
              newMapping[aiMessage.id] = dbMessage.message_id;
              syncedMessageIdsRef.current.add(aiMessage.id);
            }
          }
        });
        
        if (Object.keys(newMapping).length > 0) {
          console.log('Synced message IDs:', newMapping);
          setMessageIdMapping(prev => ({ ...prev, ...newMapping }));
        } else {
          console.log('No new message IDs to sync');
        }
      }
    } catch (error) {
      console.error('Error syncing message IDs:', error);
    } finally {
      isSyncingIdsRef.current = false;
    }
  };

  // Load feedback for assistant messages when messages change
  useEffect(() => {
    if (!currentChatId || messages.length === 0) return;
    
    // Process assistant messages
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    
    // Find messages that need feedback loading
    const messagesToLoad = assistantMessages.filter(message => {
      // Skip if already loaded
      if (loadedFeedbackMessages.has(message.id)) {
        return false;
      }
      
      // Check if this is a temporary ID that needs syncing
      const isTempId = !message.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      // If it's a temp ID and we don't have a mapping yet, we need to sync first
      if (isTempId && !messageIdMapping[message.id]) {
        return false; // Will be handled by the sync effect
      }
      
      return true;
    });
    
    // Load feedback for messages that are ready
    messagesToLoad.forEach(message => {
      loadMessageFeedback(message.id);
      setLoadedFeedbackMessages(prev => new Set(prev).add(message.id));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, currentChatId, messageIdMapping]);

  // Function to create a new empty chat
  const createNewChat = async () => {
    console.log('createNewChat called');
    try {
      const response = await fetch('/api/chat/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: null })
      });
      
      if (response.ok) {
        const { chatId } = await response.json();
        console.log('New chat created with ID:', chatId);
        setCurrentChatId(chatId);
        updateChatTimestamp(chatId);
        return chatId;
      } else {
        console.error('Failed to create chat - response not ok:', response.status);
      }
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
    return null;
  };

  // Function to load user's chat list
  const loadChatList = async () => {
    try {
      setIsLoadingChats(true);
      const response = await fetch('/api/chat');
      if (response.ok) {
        const { chats } = await response.json();
        setChatList(chats || []);
        return chats;
      } else {
        console.error('Failed to load chat list:', response.status);
        setChatList([]);
      }
    } catch (error) {
      console.error('Failed to load chat list:', error);
      setChatList([]);
    } finally {
      setIsLoadingChats(false);
    }
    return [];
  };

  // Function to load chat from database
  const loadChat = async (chatId: string) => {
    try {
      setIsLoadingExistingChat(true);
      const response = await fetch(`/api/chat/${chatId}`);
      if (response.ok) {
        const { chat, messages: chatMessages } = await response.json();
        
        // Convert database messages to AI SDK format and track ID mapping
        const convertedMessages = chatMessages.map((msg:ChatMessage) => {
          // For loaded messages, the AI SDK ID is the same as the database ID
          const messageId = msg.message_id;
          return {
            id: messageId,
            role: msg.role,
            parts: Array.isArray(msg.parts) ? msg.parts : [{ type: 'text', text: msg.parts }]
          };
        });
        
        // No need to map IDs for loaded messages since they use database IDs directly
        setMessages(convertedMessages);
        setCurrentChatId(chatId);
        updateChatTimestamp(chatId);
        
        return chat;
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    } finally {
      setIsLoadingExistingChat(false);
    }
    return null;
  };

  // Function to load feedback for a specific message
  const loadMessageFeedback = async (messageId: string) => {
    if (!currentChatId) return;
    
    // Skip if this is a temporary ID without a mapping
    const isTempId = !messageId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    if (isTempId && !messageIdMapping[messageId]) {
      console.log('Skipping feedback load for unmapped temporary ID:', messageId);
      return;
    }
    
    // Use the database message ID if we have a mapping, otherwise use the provided ID
    const dbMessageId = messageIdMapping[messageId] || messageId;
    
    try {
      const response = await fetch(`/api/chat/${currentChatId}/messages/${dbMessageId}/feedback`);
      if (response.ok) {
        const { feedback } = await response.json();
        if (feedback) {
          setMessageFeedback(prev => ({
            ...prev,
            [messageId]: feedback.sentiment
          }));
          if (feedback.comment) {
            setFeedbackComments(prev => ({
              ...prev,
              [messageId]: feedback.comment
            }));
          }
          if (feedback.tags && Array.isArray(feedback.tags)) {
            setFeedbackTags(prev => ({
              ...prev,
              [messageId]: feedback.tags
            }));
          }
        }
      }
    } catch (error) {
      console.error('Failed to load message feedback:', error);
    }
  };

  // Function to switch to a different chat
  const switchToChat = async (chatId: string) => {
    if (chatId === currentChatId) {
      setShowChatDropdown(false);
      return;
    }
    
    setShowChatDropdown(false);
    
    // Set switching flag immediately (synchronous)
    isSwitchingChatsRef.current = true;
    
    const chat = await loadChat(chatId);
    if (chat) {
      // Reset navigation tracking to prevent auto-navigation on chat switch
      setLastNavigatedMessageId(null);
      // Clear loaded feedback tracking for the new chat
      setLoadedFeedbackMessages(new Set());
      // Clear message ID mapping for the new chat
      setMessageIdMapping({});
      // Clear synced IDs tracking
      syncedMessageIdsRef.current = new Set();
    }
    
    // Reset switching flag after a delay to ensure navigation effect doesn't trigger
    setTimeout(() => {
      isSwitchingChatsRef.current = false;
    }, 200);
  };

  // Function to delete a chat (soft delete)
  const deleteChat = async (chatId: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId })
      });

      if (response.ok) {
        // If we deleted the current chat, load the most recent remaining chat
        if (chatId === currentChatId) {
          // Refresh the chat list and set the most recent chat as current
          const updatedChats = await loadChatList();
          if (updatedChats && updatedChats.length > 0) {
            // Load the most recent chat (first in the list since it's ordered by updated_at desc)
            const mostRecentChat = updatedChats[0];
            await loadChat(mostRecentChat.chat_id);
          } else {
            // No chats left, create a new one
            await clearChat();
          }
        } else {
          // Just refresh the chat list
          await loadChatList();
        }
      } else {
        console.error('Failed to delete chat');
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  // Title editing functions
  const startEditingTitle = () => {
    if (currentChatId && chatList.length > 0) {
      const currentChat = chatList.find(chat => chat.chat_id === currentChatId);
      setEditingTitle(currentChat?.title || '');
      setIsEditingTitle(true);
    }
  };

  const cancelEditingTitle = () => {
    setIsEditingTitle(false);
    setEditingTitle('');
  };

  const saveTitle = async () => {
    if (!currentChatId) {
      cancelEditingTitle();
      return;
    }

    const trimmedTitle = editingTitle.trim();
    const currentChat = chatList.find(chat => chat.chat_id === currentChatId);
    const currentTitle = currentChat?.title || '';

    // If title didn't change, just exit edit mode without API call
    if (trimmedTitle === currentTitle) {
      setIsEditingTitle(false);
      setEditingTitle('');
      return;
    }

    // Don't allow empty titles
    if (!trimmedTitle) {
      cancelEditingTitle();
      return;
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: currentChatId, title: trimmedTitle })
      });

      if (response.ok) {
        // Refresh the chat list to get updated timestamp and proper ordering
        await loadChatList();
        setIsEditingTitle(false);
        setEditingTitle('');
      } else {
        console.error('Failed to update chat title');
      }
    } catch (error) {
      console.error('Failed to update chat title:', error);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitle();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditingTitle();
    }
  };

  const generateTitle = async () => {
    if (!currentChatId || isGeneratingTitle) {
      return;
    }

    setIsGeneratingTitle(true);
    try {
      const response = await fetch('/api/chat/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: currentChatId })
      });

      if (response.ok) {
        const { title } = await response.json();
        setEditingTitle(title);
      } else {
        const errorData = await response.json();
        console.error('Failed to generate title:', errorData.error);
        // Optionally show user-friendly error message
      }
    } catch (error) {
      console.error('Failed to generate title:', error);
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  // Dev options functions
  const handleModelChange = (modelValue: string) => {
    setSelectedModel(modelValue);
    localStorage.setItem('devSelectedModel', modelValue);
    setShowDevOptions(false);
  };

  // Toggle a feedback tag for a message
  const toggleFeedbackTag = (messageId: string, tag: string) => {
    const currentTags = feedbackTags[messageId] || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    
    setFeedbackTags(prev => ({
      ...prev,
      [messageId]: newTags
    }));
  };

  // Feedback functions
  const submitFeedback = async (
    messageId: string, 
    sentiment: 'positive' | 'neutral' | 'negative',
    includeDetails: boolean = false
  ) => {
    if (!currentChatId) return;
    
    // Set submitting status
    setFeedbackStatus(prev => ({ ...prev, [messageId]: 'submitting' }));
    
    try {
      interface FeedbackPayload {
        sentiment: 'positive' | 'neutral' | 'negative';
        comment?: string;
        tags?: string[];
      }
      
      const payload: FeedbackPayload = { sentiment };
      
      // Include comment and tags if details are being submitted
      if (includeDetails) {
        const comment = feedbackComments[messageId];
        const tags = feedbackTags[messageId];
        
        if (comment && comment.trim()) {
          payload.comment = comment.trim();
        }
        if (tags && tags.length > 0) {
          payload.tags = tags;
        }
      }
      
      // Use the database message ID if we have a mapping
      const dbMessageId = messageIdMapping[messageId] || messageId;
      
      // Log for debugging
      if (messageId !== dbMessageId) {
        console.log('Submitting feedback with mapped ID:', { original: messageId, mapped: dbMessageId });
      }
      
      const response = await fetch(`/api/chat/${currentChatId}/messages/${dbMessageId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        // Update local state
        setMessageFeedback(prev => ({
          ...prev,
          [messageId]: sentiment
        }));
        
        // Set success status
        setFeedbackStatus(prev => ({ ...prev, [messageId]: 'success' }));
        
        // Clear success status after 2 seconds
        setTimeout(() => {
          setFeedbackStatus(prev => ({ ...prev, [messageId]: 'idle' }));
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to submit feedback:', errorData);
        setFeedbackStatus(prev => ({ ...prev, [messageId]: 'error' }));
        
        // Show error message if available
        if (errorData.error) {
          console.error(`Feedback error: ${errorData.error}`);
        }
        
        // Clear error status after 3 seconds
        setTimeout(() => {
          setFeedbackStatus(prev => ({ ...prev, [messageId]: 'idle' }));
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setFeedbackStatus(prev => ({ ...prev, [messageId]: 'error' }));
      
      // Clear error status after 3 seconds
      setTimeout(() => {
        setFeedbackStatus(prev => ({ ...prev, [messageId]: 'idle' }));
      }, 3000);
    }
  };
  
  // Submit detailed feedback with comment and tags
  const submitDetailedFeedback = async (messageId: string) => {
    const sentiment = messageFeedback[messageId];
    if (sentiment) {
      await submitFeedback(messageId, sentiment, true);
    }
  };

  // Handler to clear chat history and create new chat
  const clearChat = async () => {
    setMessages([]);
    setInput('');
    setLastNavigatedMessageId(null);
    setMessageFeedback({}); // Clear feedback state
    setLoadedFeedbackMessages(new Set()); // Clear loaded feedback tracking
    setFeedbackComments({}); // Clear feedback comments
    setFeedbackTags({}); // Clear feedback tags
    setShowFeedbackDetails({}); // Clear feedback details visibility
    setFeedbackStatus({}); // Clear feedback status
    setMessageIdMapping({}); // Clear message ID mapping
    syncedMessageIdsRef.current = new Set(); // Clear synced IDs tracking
    
    // Reset initialization state to allow new chat creation
    initializationRef.current.hasInitialized = false;
    
    // Create a new empty chat
    const newChatId = await createNewChat();
    if (newChatId) {
      setCurrentChatId(newChatId);
      updateChatTimestamp(newChatId);
      initializationRef.current.hasInitialized = true;
      // Reload chat list to include the new chat
      await loadChatList();
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // Update chat timestamp to prevent timeout during active usage
  const updateChatTimestamp = (chatId: string) => {
    if (typeof window !== 'undefined') {
      const chatData = {
        chatId: chatId,
        timestamp: Date.now()
      };
      localStorage.setItem('currentChatData', JSON.stringify(chatData));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Prevent submission if already processing
    if (status === 'streaming' || status === 'submitted') return;

    // Ensure we have a chat ID
    let chatId = currentChatId;
    if (!chatId) {
      chatId = await createNewChat();
      if (!chatId) {
        console.error('Failed to create chat');
        return;
      }
    }

    const messageText = input.trim();
    
    // Update chat timestamp to keep it active
    updateChatTimestamp(chatId);
    
    // Send the message using the AI SDK v5 API with chat context
    // Backend will handle saving both user and AI messages
    sendMessage({ text: messageText }, {
      body: {
        chatId: currentChatId,
        ...(isDevOptionsEnabled && { selectedModel })
      }
    });
    
    setInput(''); // Clear input after sending
  };

  // Initialize chat on component mount
  useEffect(() => {
    const initializeChat = async () => {
      // Prevent multiple initializations using ref for immediate synchronous check
      if (initializationRef.current.isInitializing || initializationRef.current.hasInitialized) {
        console.log('Skipping initialization - already in progress or completed');
        return;
      }
      
      console.log('Starting chat initialization');
      initializationRef.current.isInitializing = true;
      
      try {
        // Always load chat list first
        const chats = await loadChatList();
        
        // Helper function to check if a chat is too old (more than 30 days)
        const isChatTooOld = (updatedAt: string): boolean => {
          const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
          const chatDate = new Date(updatedAt).getTime();
          const now = Date.now();
          return (now - chatDate) > thirtyDaysInMs;
        };
        
        if (currentChatId) {
          console.log('Loading existing chat:', currentChatId);
          // Try to load existing chat from database
          const chat = await loadChat(currentChatId);
          if (!chat) {
            console.log('Failed to load chat, checking for other chats');
            // If loading fails, check if there are other chats
            if (chats && chats.length > 0) {
              const mostRecentChat = chats[0];
              // Check if most recent chat is too old (>30 days)
              if (isChatTooOld(mostRecentChat.updated_at)) {
                console.log('Most recent chat is older than 30 days, creating new chat');
                await createNewChat();
                await loadChatList();
              } else {
                console.log('Loading most recent chat:', mostRecentChat.chat_id);
                // Load the most recent chat (first in list, ordered by updated_at DESC)
                await loadChat(mostRecentChat.chat_id);
              }
            } else {
              console.log('No chats found, creating new one');
              // No chats exist, create a new one
              await createNewChat();
              // Reload chat list to include the new chat
              await loadChatList();
            }
          }
        } else {
          // No currentChatId in localStorage
          if (chats && chats.length > 0) {
            const mostRecentChat = chats[0];
            // Check if most recent chat is too old (>30 days)
            if (isChatTooOld(mostRecentChat.updated_at)) {
              console.log('Most recent chat is older than 30 days, creating new chat');
              await createNewChat();
              await loadChatList();
            } else {
              console.log('No current chat ID, loading most recent chat:', mostRecentChat.chat_id);
              // Load the most recent chat (first in list, ordered by updated_at DESC)
              await loadChat(mostRecentChat.chat_id);
            }
          } else {
            console.log('No chat ID found and no existing chats, creating new chat');
            // No chats exist, create a new chat
            await createNewChat();
            // Reload chat list to include the new chat
            await loadChatList();
          }
        }
      } finally {
        initializationRef.current.isInitializing = false;
        initializationRef.current.hasInitialized = true;
        console.log('Chat initialization completed');
      }
    };

    initializeChat();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - intentionally using initial currentChatId from localStorage

  // Messages are now persisted in database, no local storage needed


  // Automatic navigation when a filter_students tool result is available
  // Only navigate for NEW AI responses, not when loading existing chats
  useEffect(() => {
    if (messages.length === 0) return;
    
    // Don't navigate if we're currently switching chats (immediate check via ref)
    if (isSwitchingChatsRef.current) return;
    
    // Don't navigate if we're currently loading existing chat messages
    if (isLoadingExistingChat) return;
    
    // Only trigger navigation if we just finished streaming a response
    if (status !== 'ready') return;
    
    const lastMessage = messages[messages.length - 1];

    // Skip if we already navigated for this message
    if (lastMessage.id === lastNavigatedMessageId) return;

    // Only navigate for assistant messages with tool results
    if (lastMessage.role === 'assistant' && lastMessage.parts) {
      // Look for tool parts in the message parts array
      const toolParts = lastMessage.parts.filter((part) => 
        part.type === 'tool-filter_students' || 
        part.type === 'tool-filter_grades' ||
        (part.type === 'dynamic-tool' && 
         'toolName' in part &&
         (part.toolName === 'filter_students' || part.toolName === 'filter_grades'))
      );
      
      const toolPart = toolParts.find((part) => {
        // Check if tool part has output with our expected structure
        return 'output' in part && 
               part.output && 
               typeof part.output === 'object' && 
               'url' in part.output;
      });

      if (toolPart && 'output' in toolPart && toolPart.output && 
          typeof toolPart.output === 'object' && toolPart.output !== null && 
          'url' in toolPart.output) {
        router.push((toolPart.output as { url: string }).url);
        setLastNavigatedMessageId(lastMessage.id);
      }
    }
  }, [messages, router, lastNavigatedMessageId, status, isLoadingExistingChat]);

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
  
  // Sync message IDs when streaming completes
  useEffect(() => {
    if (status === 'ready' && currentChatId && messages.length > 0) {
      // Check if we have unmapped messages (AI SDK temporary IDs) that haven't been synced yet
      const hasUnmappedMessages = messages.some(msg => {
        const isTempId = !msg.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        const notMapped = !messageIdMapping[msg.id];
        const notSynced = !syncedMessageIdsRef.current.has(msg.id);
        return isTempId && notMapped && notSynced;
      });
      
      if (hasUnmappedMessages && !isSyncingIdsRef.current) {
        // Delay slightly to ensure database has been updated
        const timeoutId = setTimeout(() => {
          syncMessageIds();
        }, 1000);
        
        // Cleanup timeout on unmount or dependency change
        return () => clearTimeout(timeoutId);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, currentChatId, messages.length])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowChatDropdown(false);
      }
    };

    if (showChatDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showChatDropdown]);

  // Save state to localStorage and emit storage event
  const handleToggle = () => {
    const newState = !isChatAssistantOpen
    setIsChatAssistantOpen(newState)
    localStorage.setItem('chatAssistantOpen', JSON.stringify(newState))
    window.dispatchEvent(new Event('storage'))
  }
  // Ensure Mixpanel super property is set on mount and when state changes
  useEffect(() => {
    registerSuperProperties({ chat_panel_open: isChatAssistantOpen });
  }, [isChatAssistantOpen])

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
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div 
                className={cn(
                  "flex-shrink-0",
                  currentChatId && !isEditingTitle ? "cursor-pointer" : "cursor-default"
                )}
                onMouseEnter={() => currentChatId && !isEditingTitle && setIsTitleHovered(true)}
                onMouseLeave={() => setIsTitleHovered(false)}
                onClick={currentChatId && !isEditingTitle ? startEditingTitle : (isEditingTitle ? generateTitle : undefined)}
              >
                {isEditingTitle ? (
                  <Sparkles 
                    size={20} 
                    className={cn(
                      "text-purple-500",
                      isGeneratingTitle ? "animate-pulse" : "cursor-pointer hover:text-purple-600"
                    )} 
                  />
                ) : isTitleHovered && currentChatId ? (
                  <Edit3 size={20} className="text-blue-500" />
                ) : (
                  <MessagesSquare size={20} className="text-blue-500" />
                )}
              </div>
              
              {isEditingTitle ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    className="text-lg font-semibold flex-1"
                    placeholder="Enter chat title"
                    autoFocus
                  />
                  <Button
                    onClick={saveTitle}
                    variant="ghost"
                    size="sm"
                    aria-label="Save title"
                  >
                    <Check size={16} className="text-green-600" />
                  </Button>
                  <Button
                    onClick={cancelEditingTitle}
                    variant="ghost"
                    size="sm"
                    aria-label="Cancel editing"
                  >
                    <X size={16} className="text-red-600" />
                  </Button>
                </div>
              ) : (
                <h2 
                  className={cn(
                    "text-lg font-semibold truncate flex-1 min-w-0",
                    currentChatId ? "cursor-pointer" : "cursor-default"
                  )}
                  onClick={currentChatId ? startEditingTitle : undefined}
                  onMouseEnter={() => currentChatId && setIsTitleHovered(true)}
                  onMouseLeave={() => setIsTitleHovered(false)}
                >
                  {(() => {
                    if (currentChatId && chatList.length > 0) {
                      const currentChat = chatList.find(chat => chat.chat_id === currentChatId);
                      return currentChat?.title || 'New Chat';
                    }
                    return 'Assistant';
                  })()}
                </h2>
              )}
              {chatList.length > 1 && !isEditingTitle && (
                <div className="relative" ref={dropdownRef}>
                  <Button
                    onClick={() => setShowChatDropdown(!showChatDropdown)}
                    variant="ghost"
                    size="sm"
                    className="gap-1 px-2"
                    aria-label="Select chat"
                  >
                    <ChevronDown size={14} />
                  </Button>
                  {showChatDropdown && (
                    <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
                      {isLoadingChats ? (
                        <div className="p-2 text-sm text-gray-500">Loading chats...</div>
                      ) : (
                        chatList.map((chat) => (
                          <div
                            key={chat.chat_id}
                            className={cn(
                              "flex items-center justify-between p-2 text-sm hover:bg-gray-50 first:rounded-t-md last:rounded-b-md",
                              chat.chat_id === currentChatId && "bg-blue-50 text-blue-700"
                            )}
                          >
                            <button
                              onClick={() => switchToChat(chat.chat_id)}
                              className="flex-1 text-left"
                            >
                              <div className="font-medium truncate">{chat.title || 'New Chat'}</div>
                              <div className="text-xs text-gray-500 truncate">
                                {new Date(chat.updated_at).toLocaleDateString()}
                              </div>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteChat(chat.chat_id);
                              }}
                              className="p-1 hover:bg-red-100 rounded text-red-500 hover:text-red-700"
                              aria-label="Delete chat"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isEditingTitle && (
                <Button onClick={clearChat} variant="ghost" size="sm" aria-label="Start new chat" className="gap-1">
                  <Plus size={16} />
                  New
                </Button>
              )}
              <Button onClick={handleToggle} variant="ghost" size="icon" aria-label="Minimize Assistant">
                <ChevronRight size={20} />
              </Button>
            </div>
          </div>
          
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto relative pt-4"
          >
            {messages.map((message) => {
              let toolResult: ToolInvocation['result'] | undefined;
              let toolName: string | undefined;

              if (message.role === 'assistant' && message.parts) {
                // Look for tool parts in the message parts array
                const toolParts = message.parts.filter((part) => 
                  part.type === 'tool-filter_students' || 
                  part.type === 'tool-filter_grades' ||
                  (part.type === 'dynamic-tool' && 
                   'toolName' in part &&
                   (part.toolName === 'filter_students' || part.toolName === 'filter_grades'))
                );
                
                const toolPart = toolParts.find((part) => {
                  // Check if tool part has output with our expected structure
                  return 'output' in part && 
                         part.output && 
                         typeof part.output === 'object' && 
                         'url' in part.output;
                });

                if (toolPart && 'output' in toolPart && toolPart.output) {
                  toolResult = toolPart.output as ToolInvocation['result'];
                  toolName = toolPart.type === 'dynamic-tool' && 'toolName' in toolPart
                    ? toolPart.toolName 
                    : toolPart.type.replace('tool-', '');
                }
              }
              return (
              <div
                key={message.id}
                className={cn(
                  "p-2 rounded-lg mb-2 max-w-[85%]",
                  message.role === 'user'
                    ? "ml-auto bg-blue-100"
                    : "mr-auto bg-gray-100"
                )}
              >
                <div className="prose prose-sm max-w-none prose-a:text-blue-600">
                  <ReactMarkdown>
                    {message.parts
                      ?.filter((part) => part.type === 'text')
                      ?.map((part) => part.text)
                      ?.join('') || ''}
                  </ReactMarkdown>
                </div>
                {toolResult?.url && (
                  <div className="mt-2">
                    <Button asChild variant="action" size="sm" className="h-auto whitespace-normal">
                      <Link href={toolResult.url}>
                        {toolName === 'filter_grades' 
                          ? generateGradesFilterDescription(toolResult.filtersApplied as GradesFiltersApplied)
                          : generateFilterDescription(toolResult.filtersApplied as FiltersApplied)
                        }
                      </Link>
                    </Button>
                  </div>
                )}
                
                {/* Feedback UI for assistant messages */}
                {message.role === 'assistant' && (
                  <div className="mt-2 border-t pt-2">
                    <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                      <span className="text-xs text-gray-500 mr-2">Feedback:</span>
                      <Button
                        onClick={() => submitFeedback(message.id, 'positive')}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-6 w-6 p-0",
                          messageFeedback[message.id] === 'positive' 
                            ? "text-green-600 bg-green-50" 
                            : "text-gray-400 hover:text-green-600"
                        )}
                        aria-label="Positive feedback"
                        disabled={feedbackStatus[message.id] === 'submitting'}
                      >
                        <ThumbsUp size={12} />
                      </Button>
                      <Button
                        onClick={() => submitFeedback(message.id, 'neutral')}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-6 w-6 p-0",
                          messageFeedback[message.id] === 'neutral' 
                            ? "text-yellow-600 bg-yellow-50" 
                            : "text-gray-400 hover:text-yellow-600"
                        )}
                        aria-label="Neutral feedback"
                        disabled={feedbackStatus[message.id] === 'submitting'}
                      >
                        <Minus size={12} />
                      </Button>
                      <Button
                        onClick={() => submitFeedback(message.id, 'negative')}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-6 w-6 p-0",
                          messageFeedback[message.id] === 'negative' 
                            ? "text-red-600 bg-red-50" 
                            : "text-gray-400 hover:text-red-600"
                        )}
                        aria-label="Negative feedback"
                        disabled={feedbackStatus[message.id] === 'submitting'}
                      >
                        <ThumbsDown size={12} />
                      </Button>
                      
                      {/* Expand button for details */}
                      <Button
                        onClick={() => setShowFeedbackDetails(prev => ({
                          ...prev,
                          [message.id]: !prev[message.id]
                        }))}
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1 ml-2 text-gray-400 hover:text-blue-600"
                        aria-label="Add details"
                      >
                        {showFeedbackDetails[message.id] ? (
                          <X size={12} />
                        ) : (
                          <>
                            <MessageCircle size={12} className="mr-1" />
                            <span className="text-xs">Add details</span>
                          </>
                        )}
                      </Button>
                      
                      {/* Status indicators */}
                      {feedbackStatus[message.id] === 'submitting' && (
                        <span className="text-xs text-gray-500 ml-2">Saving...</span>
                      )}
                      {feedbackStatus[message.id] === 'success' && (
                        <CheckCircle size={14} className="text-green-600 ml-2" />
                      )}
                      {feedbackStatus[message.id] === 'error' && (
                        <XCircle size={14} className="text-red-600 ml-2" />
                      )}
                    </div>
                    
                    {/* Expandable feedback details section */}
                    {showFeedbackDetails[message.id] && (
                      <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                        {/* Tags selection */}
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">
                            Tags (optional):
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {availableFeedbackTags.map(tag => (
                              <button
                                key={tag}
                                onClick={() => toggleFeedbackTag(message.id, tag)}
                                className={cn(
                                  "text-xs px-2 py-1 rounded-full border transition-colors",
                                  (feedbackTags[message.id] || []).includes(tag)
                                    ? "bg-blue-100 text-blue-700 border-blue-300"
                                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                )}
                              >
                                {tag.replace('_', ' ')}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Comment textarea */}
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">
                            Comments (optional):
                          </label>
                          <textarea
                            value={feedbackComments[message.id] || ''}
                            onChange={(e) => setFeedbackComments(prev => ({
                              ...prev,
                              [message.id]: e.target.value
                            }))}
                            placeholder="Share additional thoughts or suggestions..."
                            className="w-full text-xs p-2 border rounded-md resize-none h-16 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            maxLength={500}
                          />
                          <div className="text-xs text-gray-400 text-right mt-1">
                            {(feedbackComments[message.id] || '').length}/500
                          </div>
                        </div>
                        
                        {/* Submit button for detailed feedback */}
                        <Button
                          onClick={() => submitDetailedFeedback(message.id)}
                          variant="primary"
                          size="sm"
                          className="text-xs"
                          disabled={
                            !messageFeedback[message.id] || 
                            feedbackStatus[message.id] === 'submitting'
                          }
                        >
                          {feedbackStatus[message.id] === 'submitting' 
                            ? 'Saving...' 
                            : 'Save Feedback Details'}
                        </Button>
                        {!messageFeedback[message.id] && (
                          <p className="text-xs text-amber-600">
                            Please select a rating first (👍/➖/👎)
                          </p>
                        )}
                      </div>
                    )}
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
              <div className="flex-1">
                <Input
                  autoFocus={isChatAssistantOpen}
                  placeholder={status === 'streaming' || status === 'submitted' ? "Please wait..." : "How can I help?"}
                  value={input}
                  onChange={handleInputChange}
                  disabled={status === 'streaming' || status === 'submitted'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && status !== 'streaming' && status !== 'submitted') {
                      e.preventDefault()
                      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
                    }
                  }}
                />
              </div>
              {isDevOptionsEnabled && (
                <div className="relative" ref={devOptionsRef}>
                  <Button
                    onClick={() => setShowDevOptions(!showDevOptions)}
                    variant="ghost"
                    size="icon"
                    aria-label="Dev Options"
                    className="mt-2"
                  >
                    <Settings size={16} />
                  </Button>
                  {showDevOptions && (
                    <div className="absolute bottom-12 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[200px]">
                      <div className="p-2">
                        <div className="text-xs font-semibold text-gray-500 mb-2">Dev Options</div>
                        <div className="mb-2">
                          <label className="text-xs text-gray-600 mb-1 block">OpenAI Model:</label>
                          <div className="space-y-1">
                            {availableModels.map((model) => (
                              <button
                                key={model.value}
                                onClick={() => handleModelChange(model.value)}
                                className={cn(
                                  "w-full text-left text-xs px-2 py-1 rounded hover:bg-gray-100",
                                  selectedModel === model.value ? "bg-blue-100 text-blue-700" : "text-gray-700"
                                )}
                              >
                                {model.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <Button 
                onClick={handleSubmit} 
                className='mt-2' 
                variant="primary" 
                size="icon"
                disabled={status === 'streaming' || status === 'submitted'}
              >
                <Send size={40} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 
