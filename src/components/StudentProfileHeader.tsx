'use client'

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Mail, PlusCircle } from "lucide-react";
import { stringToColor } from "@/utils/utils";
import { Tag } from "@/components/Tag";
import { SortableCategory } from "@/components/SortableCategory";
import { AddTagPanel } from "@/components/AddTagPanel";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { CategoryTagInfo } from "@/types/StudentTagInfo";
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
import { getTagColors } from '@/utils/tagColors';

interface StudentProfileHeaderProps {
  firstName: string;
  lastName: string;
  fullName: string;
  gradeLevel: string | number;
  graduationYear: string | number;
  studentId: string;
  enrollmentStatus: string;
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

export const StudentProfileHeader: React.FC<StudentProfileHeaderProps> = ({
  firstName,
  lastName,
  fullName,
  gradeLevel,
  graduationYear,
  studentId,
  enrollmentStatus,
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
  const [activeType, setActiveType] = useState<'category' | 'tag' | null>(null);
  const [localCategories, setLocalCategories] = useState(tags);
  const [tagMenuState, setTagMenuState] = useState<{
    studentTagId: string | null;
    position: { top: number; left: number } | null;
  }>({ studentTagId: null, position: null });
  const [editingTagId, setEditingTagId] = useState<string | null>(null);

  // Update local categories when props change
  React.useEffect(() => {
    setLocalCategories(tags);
  }, [tags]);

  // Create sortable items array for categories
  const sortableCategoryItems = useMemo(() => 
    localCategories?.map(cat => cat.categoryId) || [], 
    [localCategories]
  );
  
  // Check if student has any tags
  const hasAnyTags = useMemo(() => {
    if (!localCategories || localCategories.length === 0) return false;
    return localCategories.some(category => category.tags.length > 0);
  }, [localCategories]);

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
    const { active } = event;
    setActiveId(active.id as string);
    
    // Determine if we're dragging a category or a tag
    if (active.data.current?.type === 'category') {
      setActiveType('category');
    } else {
      setActiveType('tag');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !localCategories) {
      setActiveId(null);
      setActiveType(null);
      return;
    }
    
    const activeData = active.data.current;
    const overData = over.data.current;
    
    // Handle category reordering
    if (activeData?.type === 'category' && overData?.type === 'category') {
      if (active.id !== over.id) {
        const oldIndex = sortableCategoryItems.indexOf(active.id as string);
        const newIndex = sortableCategoryItems.indexOf(over.id as string);
        
        const reorderedCategories = arrayMove(localCategories, oldIndex, newIndex);
        setLocalCategories(reorderedCategories);
        
        if (onTagsReorder) {
          onTagsReorder(reorderedCategories);
        }
      }
    }
    // Handle tag reordering within the same category
    else if (!activeData?.type || activeData?.type === 'tag') {
      // Find which category contains the active and over tags
      let activeCategoryIndex = -1;
      let overCategoryIndex = -1;
      let activeTagIndex = -1;
      let overTagIndex = -1;
      
      localCategories.forEach((category, catIdx) => {
        const activeIdx = category.tags.findIndex(tag => tag.studentTagId === active.id);
        const overIdx = category.tags.findIndex(tag => tag.studentTagId === over.id);
        
        if (activeIdx !== -1) {
          activeCategoryIndex = catIdx;
          activeTagIndex = activeIdx;
        }
        if (overIdx !== -1) {
          overCategoryIndex = catIdx;
          overTagIndex = overIdx;
        }
      });
      
      // Only reorder if both tags are in the same category
      if (activeCategoryIndex !== -1 && activeCategoryIndex === overCategoryIndex) {
        const updatedCategories = [...localCategories];
        const category = updatedCategories[activeCategoryIndex];
        category.tags = arrayMove(category.tags, activeTagIndex, overTagIndex);
        
        setLocalCategories(updatedCategories);
        
        if (onTagsReorder) {
          onTagsReorder(updatedCategories);
        }
      }
    }
    
    setActiveId(null);
    setActiveType(null);
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

  // Find the active item for drag overlay
  interface TagWithCategory {
    studentTagId: string;
    tagId: string;
    tagName: string;
    tagValue: string;
    categoryName: string;
  }
  
  const activeItem = useMemo((): CategoryTagInfo | TagWithCategory | null => {
    if (!activeId || !localCategories) return null;
    
    if (activeType === 'category') {
      return localCategories.find(cat => cat.categoryId === activeId) || null;
    } else {
      // Find the tag across all categories
      for (const category of localCategories) {
        const tag = category.tags.find(t => t.studentTagId === activeId);
        if (tag) {
          return { ...tag, categoryName: category.categoryName };
        }
      }
    }
    return null;
  }, [activeId, activeType, localCategories]);

  return (
    <Card className="p-6 mb-6">
      {/* First Row: Profile Photo, Student Info, and Email Button */}
      <div id="student-info" className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {photoUrl ? (
            <Image
            src={photoUrl}
            alt={fullName}
            className="w-24 h-24 rounded-full object-cover flex-shrink-0"
            width={64}
            height={64}
            />
          ) : (
            <div className={`w-24 h-24 rounded-full flex items-center justify-center font-bold text-white text-4xl flex-shrink-0 ${stringToColor(fullName)}`}>
              {getUserInitials(firstName, lastName)}
            </div>
          )}
          <div>
            <div className="text-2xl font-bold">{fullName}</div>
            <div className="text-gray-600 font-medium">
              Grade {gradeLevel} • Class of {graduationYear}
              {studentId ? ` • ID: ${studentId}` : ''}
              {enrollmentStatus !== 'active' ? ` • Status: ${enrollmentStatus}` : ''}
            </div>
          </div>
        </div>
        <a
          href={`mailto:${email}`}
          className="flex items-center px-4 py-2 gap-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex-shrink-0"
        >
          <Mail size={20} />
          Email
        </a>
      </div>

      {/* Second Row: Tags Section */}
      <div id="student-tags" className="w-full">
        {/* Tags Section with Drag and Drop */}
        <div className="relative w-full">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
          >
            <SortableContext
              items={sortableCategoryItems}
              strategy={horizontalListSortingStrategy}
            >
              {/* Tags container with wrapping */}
              <div className="w-full">
                <div className="flex items-start gap-6 py-1 flex-wrap">
                  {localCategories?.map((category, index) => (
                    <div key={category.categoryId} className="flex items-start gap-6">
                      <SortableCategory
                        id={category.categoryId}
                        categoryId={category.categoryId}
                        categoryName={category.categoryName}
                        tags={category.tags}
                        allTags={allTags}
                        onTagEdit={onTagEdit}
                        onTagDelete={onTagDelete}
                        onTagMenuClick={handleTagMenuClick}
                        tagMenuState={tagMenuState}
                        editingTagId={editingTagId}
                        onEditModeChange={setEditingTagId}
                      />
                      
                      {/* Add tag button - attached to the last category */}
                      {index === localCategories.length - 1 && (allTagCategories && allTags && onTagAdd) && (
                        <div className={`relative flex-shrink-0 ${hasAnyTags ? 'mt-5' : ''}`}>
                          {hasAnyTags ? (
                            // Compact button when tags exist
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
                          ) : (
                            // Expanded button with text and tooltip when no tags
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsAddTagPanelOpen(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors border border-gray-200"
                                    aria-label="Add new tag"
                                  >
                                    <PlusCircle className="h-5 w-5" />
                                    <span className="text-sm font-medium">Add Tag</span>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Use tags to capture key information about a student</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Fallback Add tag button when no categories exist */}
                  {(!localCategories || localCategories.length === 0) && (allTagCategories && allTags && onTagAdd) && (
                    <div className="relative flex-shrink-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsAddTagPanelOpen(true);
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors border border-gray-200"
                              aria-label="Add new tag"
                            >
                              <PlusCircle className="h-5 w-5" />
                              <span className="text-sm font-medium">Add Tag</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Use tags to capture key information about a student</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              </div>
            </SortableContext>

            {/* Drag overlay for smooth dragging */}
            <DragOverlay>
              {activeItem && activeType === 'category' ? (
                <div className="opacity-80">
                  <div className="flex flex-col gap-1">
                    <span className={`text-xs font-semibold ${getTagColors((activeItem as CategoryTagInfo).categoryName).text} uppercase tracking-wider`}>
                      {(activeItem as CategoryTagInfo).categoryName}
                    </span>
                    <div className="flex items-center gap-2">
                      {(activeItem as CategoryTagInfo).tags.map((tag) => (
                        <Tag
                          key={tag.studentTagId}
                          category={(activeItem as CategoryTagInfo).categoryName}
                          name={tag.tagName}
                          value={tag.tagValue}
                          studentTagId={tag.studentTagId}
                          tagId={tag.tagId}
                          allTags={allTags}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : activeItem && activeType === 'tag' ? (
                <div className="opacity-80">
                  <Tag
                    category={'categoryName' in activeItem ? activeItem.categoryName : ''}
                    name={'tagName' in activeItem ? activeItem.tagName : ''}
                    value={'tagValue' in activeItem ? activeItem.tagValue : ''}
                    studentTagId={'studentTagId' in activeItem ? activeItem.studentTagId : ''}
                    tagId={'tagId' in activeItem ? activeItem.tagId : ''}
                    allTags={allTags}
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
    </Card>
  );
};