'use client';

import { useState } from 'react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Trash2, Pencil, Check, X } from 'lucide-react';

interface Chat {
  chat_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface DropdownHistoryItemProps {
  chat: Chat;
  onChatSelect: (chatId: string) => void;
  onClose: () => void;
  onDelete: (chatId: string, e: React.MouseEvent) => void;
  onEdit: (chatId: string, newTitle: string) => void;
}

export function DropdownHistoryItem({ 
  chat, 
  onChatSelect, 
  onClose, 
  onDelete,
  onEdit
}: DropdownHistoryItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chat.title);
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleEditStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditTitle(chat.title);
  };

  const handleEditSave = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (editTitle.trim() === chat.title.trim()) {
      setIsEditing(false);
      return;
    }

    try {
      onEdit(chat.chat_id, editTitle.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving title:', error);
      setEditTitle(chat.title); // Reset on error
      setIsEditing(false);
    }
  };

  const handleEditCancel = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditTitle(chat.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  return (
    <DropdownMenuItem
      onClick={!isEditing ? () => {
        onChatSelect(chat.chat_id);
        onClose();
      } : undefined}
      className="cursor-pointer group"
    >
      <div className="flex items-start justify-between w-full gap-2">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-6 text-sm font-medium"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="font-medium text-sm truncate">
              {chat.title}
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Clock className="h-3 w-3" />
            {formatDate(chat.updated_at)}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditSave}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditCancel}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditStart}
                className="group-hover:opacity-100 h-6 w-6 p-0 text-muted-foreground hover:text-blue-500 transition-all"
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => onDelete(chat.chat_id, e)}
                className="group-hover:opacity-100 h-6 w-6 p-0 text-muted-foreground hover:text-red-500 transition-all"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    </DropdownMenuItem>
  );
}
