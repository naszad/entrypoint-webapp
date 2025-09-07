'use client';

import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { HistoryIcon, MessageCircle } from 'lucide-react';
import { DropdownHistoryItem } from './dropdown-history-item';

interface Chat {
  chat_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatsResponse {
  chats: Chat[];
}

interface DropdownHistoryProps {
  onChatSelect: (chatId: string) => void;
}

export function DropdownHistory({ onChatSelect }: DropdownHistoryProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch('/api/ai/chats');
        
        if (!response.ok) {
          throw new Error('Failed to fetch chats');
        }

        const data: ChatsResponse = await response.json();
        setChats(data.chats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  // Refresh chats when dropdown opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      const fetchChats = async () => {
        try {
          const response = await fetch('/api/ai/chats');
          
          if (!response.ok) {
            throw new Error('Failed to fetch chats');
          }

          const data: ChatsResponse = await response.json();
          setChats(data.chats);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      };

      fetchChats();
    }
  };



  const handleChatSelect = (chatId: string) => {
    onChatSelect(chatId);
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent chat selection when clicking delete
    
    if (!confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/ai/chats', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId })
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      // Remove chat from local state
      setChats(prevChats => prevChats.filter(chat => chat.chat_id !== chatId));
    } catch (err) {
      console.error('Error deleting chat:', err);
      // Could add error toast here
      alert('Failed to delete chat. Please try again.');
    }
  };

  const handleEditChat = async (chatId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/ai/chats/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });

      if (!response.ok) {
        throw new Error('Failed to update chat title');
      }

      const { chat: updatedChat } = await response.json();

      // Update chat in local state
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.chat_id === chatId 
            ? { ...chat, title: updatedChat.title, updated_at: updatedChat.updated_at }
            : chat
        )
      );
    } catch (err) {
      console.error('Error updating chat title:', err);
      alert('Failed to update chat title. Please try again.');
      throw err; // Re-throw so the component can handle the error
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <HistoryIcon className="h-4 w-4" />
          <span>Chat History</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Recent Conversations
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            Loading chats...
          </div>
        ) : error ? (
          <div className="px-2 py-4 text-center text-sm text-red-500">
            Error: {error}
          </div>
        ) : chats.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No chat history found
          </div>
        ) : (
          chats.map((chat) => (
                         <DropdownHistoryItem
               key={chat.chat_id}
               chat={chat}
               onChatSelect={handleChatSelect}
               onClose={() => setIsOpen(false)}
               onDelete={handleDeleteChat}
               onEdit={handleEditChat}
             />
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
