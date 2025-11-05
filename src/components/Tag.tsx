'use client'

import { MoreVertical } from 'lucide-react'
import React, { useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getTagColors } from '@/utils/tagColors'
import { getFuzzyMatchingValue } from '@/utils/utils'

interface TagProps {
  category: string
  name: string
  value: string
  studentTagId: string
  tagId: string
  allTags?: { tagId: string; name: string; categoryId: string; categoryName: string; values: string[] }[]
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

export function Tag({ category, name, value, studentTagId, tagId, allTags, isNew, onEdit, onDelete, onMenuClick, isMenuOpen, isEditMode, onEditModeChange, dragHandleProps, isDragging }: TagProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isHovered, setIsHovered] = useState(false)
  const [filteredTagValues, setFilteredTagValues] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const { bg, text, border, borderHex } = getTagColors(category)

  // Get possible values for this tag
  const possibleTagValues = React.useMemo(() => {
    if (!allTags || !tagId) return []
    const currentTag = allTags.find(t => t.tagId === tagId)
    return currentTag?.values ?? []
  }, [allTags, tagId])

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

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setEditValue(newValue)

    if (!newValue || possibleTagValues.length === 0) {
      setFilteredTagValues([]);
      setShowSuggestions(false);
      return;
    }
    
    const { bestMatch, score } = getFuzzyMatchingValue(newValue, possibleTagValues);
    const isStrongMatch = score > 0.8;
    
    setFilteredTagValues(isStrongMatch ? [bestMatch] : []);
    setShowSuggestions(isStrongMatch);
  }

  const handleSelectTagValue = (tagValue: string) => {
    setEditValue(tagValue)
    setFilteredTagValues([])
    setShowSuggestions(false)
  }

  const handleSaveEdit = () => {
    if (onEdit && editValue.trim()) {
      onEdit(studentTagId, editValue.trim())
    }
    setIsEditing(false)
    setShowSuggestions(false)
    if (onEditModeChange) {
      onEditModeChange(false)
    }
  }

  const handleCancelEdit = () => {
    setEditValue(value)
    setIsEditing(false)
    setShowSuggestions(false)
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
        <div className="relative">
          <input
            type="text"
            value={editValue}
            onChange={handleValueChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit()
              if (e.key === 'Escape') handleCancelEdit()
            }}
            onFocus={() => {
              if (filteredTagValues.length > 0) {
                setShowSuggestions(true)
              }
            }}
            className={`px-3 py-1 rounded-full text-sm font-medium border ${border} ${bg} ${text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            autoFocus
          />
          {showSuggestions && filteredTagValues.length > 0 && (
            <ul className="absolute z-50 w-full max-w-xs bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg" style={{ minWidth: '200px' }}>
              {filteredTagValues.map((tagValue) => (
                <li
                  key={tagValue}
                  onClick={() => handleSelectTagValue(tagValue)}
                  className="px-3 py-2 cursor-pointer text-sm hover:bg-gray-100"
                >
                  {tagValue}
                </li>
              ))}
            </ul>
          )}
        </div>
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
    <div 
      className={`mr-1 relative group inline-flex items-center transition-all duration-300 ${isDragging ? 'opacity-50' : ''} ${entered ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-1 scale-95'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Absolutely positioned menu button */}
      {(onEdit || onDelete) && (
        <div
          className={`absolute inset-y-0 left-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-100 z-10 transform -translate-x-[50%]`}
        >
          <div
            className={`relative flex items-center h-full rounded-l-full ${bg} border-y border-l border-transparent transition-all`}
            style={{ borderColor: isHovered ? borderHex : 'transparent' }}
          >
            <button
              onClick={handleMenuButtonClick}
              className={`p-0.5 rounded-full hover:bg-black/10 ${text} opacity-0 group-hover:opacity-100 transition-all duration-200 delay-75 ${isMenuOpen ? 'opacity-100' : ''}`}
              aria-label="Tag options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* The visible tag, which does not change size */}
      <span
        className={`${bg} ${text} px-3 py-1 rounded-full text-sm font-medium border border-transparent group-hover:rounded-l-none transition-all`}
        {...dragHandleProps}
        style={{ 
          cursor: dragHandleProps ? (isDragging ? 'grabbing' : 'grab') : 'default',
          borderColor: isHovered ? borderHex : 'transparent',
        }}
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