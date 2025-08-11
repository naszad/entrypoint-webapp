'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { getTagColors } from '@/utils/tagColors'

export interface SuggestedTag {
  category: string
  name: string
  value: string
  tagId?: string
  tagCategoryId: string
}

interface SuggestedTagsProps {
  tags: SuggestedTag[]
  onAddTags: (tags: SuggestedTag[]) => void
}

export function SuggestedTags({ tags, onAddTags }: SuggestedTagsProps) {
  const [suggestedTags, setSuggestedTags] = useState(tags)

  if (suggestedTags.length === 0) {
    return null
  }

  const handleRemoveTag = (tagToRemove: SuggestedTag) => {
    setSuggestedTags(suggestedTags.filter(tag => tag !== tagToRemove))
  }

  const tagCategories = [...new Set(suggestedTags.map(tag => tag.category))]

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-700">Suggested Tags</h3>
      <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
        {tagCategories.map(category => {
          const { text } = getTagColors(category)
          return (
            <div key={category}>
              <h4 className={`text-xs font-bold uppercase ${text} mb-2`}>{category}</h4>
              <div className="flex flex-wrap items-center gap-2">
                {suggestedTags
                  .filter(tag => tag.category === category)
                  .map((tag, index) => {
                    const { bg, text } = getTagColors(tag.category)
                    return (
                      <div
                        key={`${tag.category}-${tag.name}-${index}`}
                        className="relative group inline-flex items-center"
                      >
                        <span
                          className={`${bg} ${text} px-3 py-1 rounded-full text-sm font-medium`}
                        >
                          {tag.value}
                        </span>
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="absolute -top-1 -right-1 bg-gray-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={`Remove ${tag.value} tag`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  })}
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-4">
        <button
          onClick={() => onAddTags(suggestedTags)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Tags
        </button>
      </div>
    </div>
  )
}
