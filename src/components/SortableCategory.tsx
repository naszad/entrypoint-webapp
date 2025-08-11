'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableTag } from './SortableTag'
import { getTagColors } from '@/utils/tagColors'
import { GripHorizontal } from 'lucide-react'

interface SortableCategoryProps {
  id: string
  categoryId: string
  categoryName: string
  tags: Array<{
    studentTagId: string
    tagId: string
    tagName: string
    tagValue: string
  }>
  onTagEdit?: (studentTagId: string, value: string) => void
  onTagDelete?: (studentTagId: string) => void
  onTagMenuClick?: (studentTagId: string, rect: DOMRect) => void
  tagMenuState?: {
    studentTagId: string | null
    position: { top: number; left: number } | null
  }
  editingTagId?: string | null
  onEditModeChange?: (tagId: string | null) => void
}

export function SortableCategory({
  id,
  categoryId,
  categoryName,
  tags,
  onTagEdit,
  onTagDelete,
  onTagMenuClick,
  tagMenuState,
  editingTagId,
  onEditModeChange,
}: SortableCategoryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    data: {
      type: 'category',
      categoryId,
      categoryName,
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const { text } = getTagColors(categoryName)
  
  // Create sortable items array for tags within this category
  const sortableTagItems = tags.map(tag => tag.studentTagId)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`inline-flex flex-col gap-1 ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* Category Label - Draggable */}
      <div 
        className="flex items-center gap-1 group"
        {...attributes}
        {...listeners}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <GripHorizontal className={`h-3 w-3 ${text} opacity-0 group-hover:opacity-60 transition-opacity`} />
        <span className={`text-xs font-semibold ${text} uppercase tracking-wider select-none`}>
          {categoryName}
        </span>
      </div>
      
      {/* Tags within this category */}
      <div className="flex items-center gap-2">
        <SortableContext
          items={sortableTagItems}
          strategy={horizontalListSortingStrategy}
        >
          {tags.map((tag) => (
            <SortableTag
              key={tag.studentTagId}
              id={tag.studentTagId}
              category={categoryName}
              name={tag.tagName}
              value={tag.tagValue}
              studentTagId={tag.studentTagId}
              isNew={tag.studentTagId.startsWith('temp:')}
              onEdit={onTagEdit}
              onDelete={onTagDelete}
              onMenuClick={onTagMenuClick}
              isMenuOpen={tagMenuState?.studentTagId === tag.studentTagId}
              isEditMode={editingTagId === tag.studentTagId}
              onEditModeChange={(isEditing) => {
                if (!isEditing && onEditModeChange) {
                  onEditModeChange(null)
                }
              }}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
