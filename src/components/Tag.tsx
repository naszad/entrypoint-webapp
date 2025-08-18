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
  isEditMode?: boolean
  onEditModeChange?: (isEditing: boolean) => void
  dragHandleProps?: React.HTMLAttributes<HTMLElement> // Props for drag handle area
  isDragging?: boolean
}

export function Tag({ category, name, value, studentTagId, isNew, onEdit, onDelete, onMenuClick, isEditMode, onEditModeChange, dragHandleProps, isDragging }: TagProps) {
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
    <div className={`mr-1 relative group inline-flex items-center transition-all duration-300 ${isDragging ? 'opacity-50' : ''} ${entered ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-1 scale-95'}`}>
      {/* Absolutely positioned menu button */}
      {(onEdit || onDelete) && (
        <div
          className={`absolute inset-y-0 left-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-100 z-10 transform -translate-x-[50%]`}
        >
          <div
            className={`relative flex items-center h-full rounded-l-full ${bg} border-y border-l ${border} border-opacity-0 group-hover:border-opacity-100 transition-all`}
          >
            <button
              onClick={handleMenuButtonClick}
              className={`p-1 rounded-full hover:bg-black/10 ${text}`}
              aria-label="Tag options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* The visible tag, which does not change size */}
      <span
        className={`${bg} ${text} px-3 py-1 rounded-full text-sm font-medium border-y border-r ${border} border-opacity-0 group-hover:rounded-l-none group-hover:border-opacity-100 transition-all`}
        {...dragHandleProps}
        style={{ cursor: dragHandleProps ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        {value}
      </span>
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