'use client'

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Mail, PlusCircle } from "lucide-react";
import { stringToColor } from "@/utils/utils";
import { Tag } from "@/components/Tag";
import { SortableTag } from "@/components/SortableTag";
import { AddTagPanel } from "@/components/AddTagPanel";
import { CategoryTagInfo, StudentTagValue } from "@/types/StudentTagInfo";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToHorizontalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import styles from '@/styles/TagScrollbar.module.css';

interface StudentProfileHeaderProps {
  firstName: string;
  lastName: string;
  fullName: string;
  gradeLevel: string | number;
  graduationYear: string | number;
  studentId: string;
  email: string;
  photoUrl?: string;
  tags?: CategoryTagInfo[];
  allTagCategories?: { tagCategoryId: string; name: string }[];
  allTags?: { tagId: string; name: string; categoryId: string; categoryName: string; values: string[] }[];
  onTagAdd?: (tag: { tagId?: string; tagName: string; tagCategoryId: string; value: string }) => void;
  onTagEdit?: (studentTagId: string, value: string) => void;
  onTagDelete?: (studentTagId: string) => void;
  onTagsReorder?: (reorderedTags: CategoryTagInfo[]) => void;
}

const getUserInitials = (firstName: string, lastName: string): string => {
  if (!firstName || !lastName) return '';
  const firstInitial = firstName?.[0] || '';
  const lastInitial = lastName?.[0] || '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
};

interface FlatTag extends StudentTagValue {
  categoryId: string;
  categoryName: string;
}

export const StudentProfileHeader: React.FC<StudentProfileHeaderProps> = ({
  firstName,
  lastName,
  fullName,
  gradeLevel,
  graduationYear,
  studentId,
  email,
  photoUrl,
  tags,
  allTagCategories,
  allTags,
  onTagAdd,
  onTagEdit,
  onTagDelete,
  onTagsReorder,
}) => {
  const [isAddTagPanelOpen, setIsAddTagPanelOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localTags, setLocalTags] = useState(tags);
  const [tagMenuState, setTagMenuState] = useState<{
    studentTagId: string | null;
    position: { top: number; left: number } | null;
  }>({ studentTagId: null, position: null });
  const [editingTagId, setEditingTagId] = useState<string | null>(null);

  // Update local tags when props change
  React.useEffect(() => {
    setLocalTags(tags);
  }, [tags]);

  // Flatten tags for easier sorting
  const flatTags = useMemo((): FlatTag[] => {
    if (!localTags) return [];
    return localTags.flatMap(category =>
      category.tags.map(tag => ({
        ...tag,
        categoryId: category.categoryId,
        categoryName: category.categoryName,
      }))
    );
  }, [localTags]);

  // Create sortable items array
  const sortableItems = useMemo(() => flatTags.map(tag => tag.studentTagId), [flatTags]);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = sortableItems.indexOf(active.id as string);
      const newIndex = sortableItems.indexOf(over.id as string);

      // Reorder the flat tags
      const reorderedFlatTags = arrayMove(flatTags, oldIndex, newIndex);
      
      // Rebuild the CategoryTagInfo structure
      const categoryMap = new Map<string, CategoryTagInfo>();
      
      reorderedFlatTags.forEach(tag => {
        if (!categoryMap.has(tag.categoryId)) {
          categoryMap.set(tag.categoryId, {
            categoryId: tag.categoryId,
            categoryName: tag.categoryName,
            tags: [],
          });
        }
        
        const category = categoryMap.get(tag.categoryId)!;
        category.tags.push({
          studentTagId: tag.studentTagId,
          tagId: tag.tagId,
          tagName: tag.tagName,
          tagValue: tag.tagValue,
        });
      });

      const reorderedTags = Array.from(categoryMap.values());
      setLocalTags(reorderedTags);
      
      // Notify parent of reorder
      if (onTagsReorder) {
        onTagsReorder(reorderedTags);
      }
    }
    
    setActiveId(null);
  };

  const handleSaveTag = async (tag: {
    tagId?: string;
    tagName: string;
    tagCategoryId: string;
    value: string;
  }) => {
    if (onTagAdd) {
      await onTagAdd(tag);
    }
  };

  const handleTagMenuClick = (studentTagId: string, rect: DOMRect) => {
    if (tagMenuState.studentTagId === studentTagId) {
      // Close if clicking the same tag
      setTagMenuState({ studentTagId: null, position: null });
    } else {
      // Open menu for this tag
      setTagMenuState({
        studentTagId,
        position: {
          top: rect.bottom + 5, // Add a small gap
          left: rect.left,
        },
      });
    }
  };

  const handleTagMenuDelete = () => {
    if (tagMenuState.studentTagId && onTagDelete) {
      onTagDelete(tagMenuState.studentTagId);
      setTagMenuState({ studentTagId: null, position: null });
    }
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setTagMenuState({ studentTagId: null, position: null });
    };
    
    if (tagMenuState.studentTagId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [tagMenuState.studentTagId]);

  // Find the active tag for drag overlay
  const activeTag = activeId ? flatTags.find(tag => tag.studentTagId === activeId) : null;

  return (
    <Card className="flex items-center justify-between p-6 mb-6">
      <div className="flex items-center gap-4">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={fullName}
            className="w-16 h-16 rounded-full object-cover"
            width={64}
            height={64}
          />
        ) : (
          <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-2xl ${stringToColor(fullName)}`}>
            {getUserInitials(firstName, lastName)}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <div className="text-2xl font-bold">{fullName}</div>
          <div className="text-gray-600 font-medium">
            Grade {gradeLevel} • Class of {graduationYear}
            {studentId ? ` • ID: ${studentId}` : ''}
          </div>
          {/* Tags Section with Drag and Drop */}
          <div className="max-w-full relative">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
            >
              <SortableContext
                items={sortableItems}
                strategy={horizontalListSortingStrategy}
              >
                {/* Horizontal scroll container */}
                <div className={`overflow-x-auto overflow-y-visible max-w-full pb-1 ${styles.scrollContainer}`}>
                  <div className="flex items-center gap-2 py-1 min-w-max">
                    {flatTags.map((tag) => (
                      <SortableTag
                        key={tag.studentTagId}
                        id={tag.studentTagId}
                        category={tag.categoryName}
                        name={tag.tagName}
                        value={tag.tagValue}
                        studentTagId={tag.studentTagId}
                        onEdit={onTagEdit}
                        onDelete={onTagDelete}
                        onMenuClick={handleTagMenuClick}
                        isMenuOpen={tagMenuState.studentTagId === tag.studentTagId}
                        isEditMode={editingTagId === tag.studentTagId}
                        onEditModeChange={(isEditing) => {
                          if (!isEditing) {
                            setEditingTagId(null)
                          }
                        }}
                      />
                    ))}
                    
                    {/* Add tag button */}
                    {(allTagCategories && allTags && onTagAdd) && (
                      <div className="relative flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsAddTagPanelOpen(true);
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          aria-label="Add new tag"
                        >
                          <PlusCircle className="h-6 w-6" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </SortableContext>

              {/* Drag overlay for smooth dragging */}
              <DragOverlay>
                {activeTag ? (
                  <div className="opacity-80">
                    <Tag
                      category={activeTag.categoryName}
                      name={activeTag.tagName}
                      value={activeTag.tagValue}
                      studentTagId={activeTag.studentTagId}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
            
            {/* Add Tag Panel - positioned outside scroll container */}
            {isAddTagPanelOpen && allTagCategories && allTags && (
              <AddTagPanel
                categories={allTagCategories}
                allTags={allTags}
                onClose={() => setIsAddTagPanelOpen(false)}
                onSave={handleSaveTag}
              />
            )}
            
            {/* Tag Menu - positioned outside scroll container */}
            {tagMenuState.studentTagId && tagMenuState.position && (
              <div
                className="fixed z-50 w-28 bg-white rounded-md shadow-lg border border-gray-200 text-gray-700"
                style={{
                  top: `${tagMenuState.position.top}px`,
                  left: `${tagMenuState.position.left}px`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <ul className="py-1">
                  {onTagEdit && (
                    <li>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Set the tag to edit mode
                          setEditingTagId(tagMenuState.studentTagId);
                          // Close the menu
                          setTagMenuState({ studentTagId: null, position: null });
                        }}
                        className="w-full text-left block px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        Edit
                      </button>
                    </li>
                  )}
                  {onTagDelete && (
                    <li>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTagMenuDelete();
                        }}
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
        </div>
      </div>
      <a
        href={`mailto:${email}`}
        className="flex items-center px-4 py-2 z-50 gap-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
      >
        <Mail size={20} />
        Email
      </a>
    </Card>
  );
};