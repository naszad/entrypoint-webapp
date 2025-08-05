'use client'

import { MoreVertical } from 'lucide-react'
import { useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getTagColors } from '@/utils/tagColors'

interface TagProps {
  category: string
  name: string
  value: string
  studentTagId: string
  onEdit?: (studentTagId: string, value: string) => void
  onDelete?: (studentTagId: string) => void
}

export function Tag({ category, name, value, studentTagId, onEdit, onDelete }: TagProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const { bg, text, border } = getTagColors(category)

  const handleEdit = () => {
    setIsEditing(true)
    setIsMenuOpen(false)
  }

  const handleSaveEdit = () => {
    if (onEdit && editValue.trim()) {
      onEdit(studentTagId, editValue.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(studentTagId)
    }
    setIsMenuOpen(false)
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
    <div className="relative group inline-flex items-center transition-all duration-200">
      {/* Expandable tag container */}
      <div className={`flex items-center rounded-full ${bg} ${text} border ${border} border-opacity-0 group-hover:border-opacity-100 transition-all duration-200 overflow-hidden`}>
        {/* Menu button - appears on hover by expanding the container */}
        {(onEdit || onDelete) && (
          <div className="flex items-center justify-center w-0 group-hover:w-7 transition-all duration-200 overflow-hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-0.5 rounded-full hover:bg-black/10 ${text} opacity-0 group-hover:opacity-100 transition-all duration-200 delay-75`}
              aria-label="Tag options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {/* Tag content */}
        <span className="px-3 py-1 text-sm font-medium whitespace-nowrap">
          {value}
        </span>
      </div>

      {/* Dropdown menu */}
      {isMenuOpen && (onEdit || onDelete) && (
        <div
          className="absolute left-0 top-full mt-1 w-28 bg-white rounded-md shadow-lg z-20 border border-gray-200 text-gray-700"
          onMouseLeave={() => setIsMenuOpen(false)}
        >
          <ul className="py-1">
            {onEdit && (
              <li>
                <button 
                  onClick={handleEdit}
                  className="w-full text-left block px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Edit
                </button>
              </li>
            )}
            {onDelete && (
              <li>
                <button 
                  onClick={handleDelete}
                  className="w-full text-left block px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                >
                  Delete
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
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