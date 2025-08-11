'use client'

import { MoreVertical } from 'lucide-react'
import React, { useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getTagColors } from '@/utils/tagColors'

interface TagProps {
  category: string
  name: string
  value: string
  studentTagId: string
  isNew?: boolean
  onEdit?: (studentTagId: string, value: string) => void
  onDelete?: (studentTagId: string) => void
  onMenuClick?: (studentTagId: string, rect: DOMRect) => void
  isMenuOpen?: boolean
  isEditMode?: boolean
  onEditModeChange?: (isEditing: boolean) => void
  dragHandleProps?: React.HTMLAttributes<HTMLElement> // Props for drag handle area
  isDragging?: boolean
}

export function Tag({ category, name, value, studentTagId, isNew, onEdit, onDelete, onMenuClick, isMenuOpen, isEditMode, onEditModeChange, dragHandleProps, isDragging }: TagProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const { bg, text, border } = getTagColors(category)

  // Smooth entrance animation for newly added tags
  const [entered, setEntered] = useState(!isNew)
  React.useEffect(() => {
    if (isNew) {
      const id = requestAnimationFrame(() => setEntered(true))
      return () => cancelAnimationFrame(id)
    }
  }, [isNew])

  // Sync edit mode with parent
  React.useEffect(() => {
    if (isEditMode !== undefined && isEditMode !== isEditing) {
      setIsEditing(isEditMode)
      if (!isEditMode) {
        setEditValue(value) // Reset value when exiting edit mode
      }
    }
  }, [isEditMode, isEditing, value])

  const handleSaveEdit = () => {
    if (onEdit && editValue.trim()) {
      onEdit(studentTagId, editValue.trim())
    }
    setIsEditing(false)
    if (onEditModeChange) {
      onEditModeChange(false)
    }
  }

  const handleCancelEdit = () => {
    setEditValue(value)
    setIsEditing(false)
    if (onEditModeChange) {
      onEditModeChange(false)
    }
  }

  const handleMenuButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onMenuClick) {
      const rect = e.currentTarget.getBoundingClientRect();
      onMenuClick(studentTagId, rect);
    }
  }

  if (isEditing) {
    return (
      <div className="inline-flex items-center gap-2">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveEdit()
            if (e.key === 'Escape') handleCancelEdit()
          }}
          className={`px-3 py-1 rounded-full text-sm font-medium border ${border} ${bg} ${text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          autoFocus
        />
        <button
          onClick={handleSaveEdit}
          className="text-green-600 hover:text-green-800"
          aria-label="Save"
        >
          ✓
        </button>
        <button
          onClick={handleCancelEdit}
          className="text-red-600 hover:text-red-800"
          aria-label="Cancel"
        >
          ✕
        </button>
      </div>
    )
  }

  const tagComponent = (
    <div className={`relative group inline-flex items-center transition-all duration-300 ${isDragging ? 'opacity-50' : ''} ${entered ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-1 scale-95'}`}>
      {/* Expandable tag container */}
      <div className={`flex items-center rounded-full ${bg} ${text} border ${border} border-opacity-0 group-hover:border-opacity-100 transition-all duration-200 overflow-hidden`}>
        {/* Menu button - appears on hover by expanding the container */}
        {(onEdit || onDelete) && (
          <div className="flex items-center justify-center w-0 group-hover:w-7 transition-all duration-200 overflow-hidden">
            <button
              onClick={handleMenuButtonClick}
              className={`p-0.5 rounded-full hover:bg-black/10 ${text} opacity-0 group-hover:opacity-100 transition-all duration-200 delay-75 ${isMenuOpen ? 'opacity-100' : ''}`}
              aria-label="Tag options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {/* Tag content - draggable area */}
        <span 
          className="px-3 py-1 text-sm font-medium whitespace-nowrap"
          {...dragHandleProps}
          style={{ cursor: dragHandleProps ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          {value}
        </span>
      </div>
    </div>
  )

  return (
    <div className="inline-block">
      {name !== value ? (
        <Tooltip>
          <TooltipTrigger asChild>
            {tagComponent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{name}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        tagComponent
      )}
    </div>
  )
}