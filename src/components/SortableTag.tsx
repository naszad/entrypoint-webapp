'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Tag } from './Tag'

interface SortableTagProps {
  id: string
  category: string
  name: string
  value: string
  studentTagId: string
  onEdit?: (studentTagId: string, value: string) => void
  onDelete?: (studentTagId: string) => void
  onMenuClick?: (studentTagId: string, rect: DOMRect) => void
  isMenuOpen?: boolean
  isEditMode?: boolean
  onEditModeChange?: (isEditing: boolean) => void
}

export function SortableTag(props: SortableTagProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Combine attributes and listeners for the drag handle
  const dragHandleProps = {
    ...attributes,
    ...listeners,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="inline-block"
    >
      <Tag
        category={props.category}
        name={props.name}
        value={props.value}
        studentTagId={props.studentTagId}
        onEdit={props.onEdit}
        onDelete={props.onDelete}
        onMenuClick={props.onMenuClick}
        isMenuOpen={props.isMenuOpen}
        isEditMode={props.isEditMode}
        onEditModeChange={props.onEditModeChange}
        dragHandleProps={dragHandleProps}
        isDragging={isDragging}
      />
    </div>
  )
}