'use client'

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Mail, PlusCircle } from "lucide-react";
import { stringToColor } from "@/utils/utils";
import { Tag } from "@/components/Tag";
import { AddTagPanel } from "@/components/AddTagPanel";
import { CategoryTagInfo } from "@/types/StudentTagInfo";

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
  email,
  photoUrl,
  tags,
  allTagCategories,
  allTags,
  onTagAdd,
  onTagEdit,
  onTagDelete,
}) => {
  const [isAddTagPanelOpen, setIsAddTagPanelOpen] = useState(false);

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
          {/* Tags Section */}
          <div className="flex flex-wrap items-center gap-2 mt-1 transition-all duration-200">
            {tags && tags.map((category) =>
              category.tags.map((tag) => (
                <Tag
                  key={tag.studentTagId}
                  category={category.categoryName}
                  name={tag.tagName}
                  value={tag.tagValue}
                  studentTagId={tag.studentTagId}
                  onEdit={onTagEdit}
                  onDelete={onTagDelete}
                />
              ))
            )}
            {(allTagCategories && allTags && onTagAdd) && (
              <div className="relative">
                <button
                  onClick={() => setIsAddTagPanelOpen(true)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Add new tag"
                >
                  <PlusCircle className="h-6 w-6" />
                </button>
                {isAddTagPanelOpen && (
                  <AddTagPanel
                    categories={allTagCategories}
                    allTags={allTags}
                    onClose={() => setIsAddTagPanelOpen(false)}
                    onSave={handleSaveTag}
                  />
                )}
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