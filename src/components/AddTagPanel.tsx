'use client'

import { X } from 'lucide-react'
import { useState, useMemo } from 'react'

interface AddTagPanelProps {
  categories: { tagCategoryId: string; name: string }[]
  allTags: { tagId: string; name: string; categoryId: string; categoryName: string; values: string[] }[]
  onClose: () => void
  onSave: (tag: { tagId?: string; tagName: string; tagCategoryId: string; value: string }) => void
}

export function AddTagPanel({
  categories,
  allTags,
  onClose,
  onSave,
}: AddTagPanelProps) {
  const [categoryId, setCategoryId] = useState('')
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [isCreatingNewTag, setIsCreatingNewTag] = useState(false)
  const [filteredTagNames, setFilteredTagNames] = useState<{ tagId: string; name: string }[]>([])
  const [filteredTagValues, setFilteredTagValues] = useState<string[]>([])
  const [selectedTagId, setSelectedTagId] = useState<string | undefined>()

  const uniqueTagNames = useMemo(() => {
    if (categoryId) {
      // Filter tags by selected category
      return allTags
        .filter(t => t.categoryId === categoryId)
        .map(t => ({ tagId: t.tagId, name: t.name }))
    }
    // Show all tags if no category selected
    return allTags.map(t => ({ tagId: t.tagId, name: t.name }))
  }, [allTags, categoryId])

  const possibleTagValues = useMemo(() => {
    if (!selectedTagId) return []
    const tag = allTags.find(t => t.tagId === selectedTagId)
    return tag?.values ?? []
  }, [selectedTagId, allTags])

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategoryId = e.target.value
    setCategoryId(newCategoryId)
    // Reset tag selection when category changes
    setName('')
    setValue('')
    setSelectedTagId(undefined)
    setFilteredTagNames([])
    setFilteredTagValues([])
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setName(newName)
    setSelectedTagId(undefined)

    if (newName) {
      const filtered = uniqueTagNames.filter(tag =>
        tag.name.toLowerCase().includes(newName.toLowerCase()),
      )
      setFilteredTagNames(filtered)
      
      // Check if this is an exact match with an existing tag
      const exactMatch = filtered.find(tag => tag.name.toLowerCase() === newName.toLowerCase())
      if (exactMatch) {
        setIsCreatingNewTag(false)
        setSelectedTagId(exactMatch.tagId)
      } else {
        setIsCreatingNewTag(true)
      }
    } else {
      setFilteredTagNames([])
      setIsCreatingNewTag(false)
    }
  }

  const handleNameBlur = () => {
    if (name) {
      setValue(name)
    }
  }

  const handleSelectTagName = (tagId: string, tagName: string) => {
    setName(tagName)
    setSelectedTagId(tagId)
    setFilteredTagNames([])
    setIsCreatingNewTag(false)

    // Auto-select category if not already selected
    if (!categoryId) {
      const selectedTag = allTags.find(t => t.tagId === tagId)
      if (selectedTag) {
        setCategoryId(selectedTag.categoryId)
      }
    }
  }

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)

    if (newValue && possibleTagValues.length > 0) {
      const filtered = possibleTagValues.filter(val =>
        val.toLowerCase().includes(newValue.toLowerCase()),
      )
      setFilteredTagValues(filtered)
    } else {
      setFilteredTagValues([])
    }
  }

  const handleSelectTagValue = (tagValue: string) => {
    setValue(tagValue)
    setFilteredTagValues([])
  }

  const handleSave = () => {
    if (!categoryId || !name || !value) return

    onSave({
      tagId: isCreatingNewTag ? undefined : selectedTagId,
      tagName: name,
      tagCategoryId: categoryId,
      value: value.trim(),
    })
    onClose()
  }

  const canEditValue = categoryId && name

  return (
    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg z-50 border border-gray-200">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Add New Tag</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700"
            >
              Category
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={handleCategoryChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.tagCategoryId} value={cat.tagCategoryId}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <small className="text-gray-500 text-xs">What to track, e.g. &quot;Target College&quot; or &quot;Sport&quot;</small>
            <div className="relative">
              <input
                type="text"
                id="name"
                value={name}
                onBlur={handleNameBlur}
                onChange={handleNameChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter or select a tag name"
              />
              {filteredTagNames.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto">
                  {filteredTagNames.map(tag => (
                    <li
                      key={tag.tagId}
                      onClick={() => handleSelectTagName(tag.tagId, tag.name)}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                    >
                      {tag.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {isCreatingNewTag && name && categoryId && (
              <p className="mt-2 text-sm text-blue-600">
                A new tag &quot;{name}&quot; will be created in this category.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="value"
              className="block text-sm font-medium text-gray-700"
            >
              Display
            </label>
            <small className="text-gray-500 text-xs">What will be shown, e.g. &quot;Purdue&quot; or &quot;Basketball&quot;</small>
            <div className="relative">
              <input
                type="text"
                id="value"
                value={value}
                onChange={handleValueChange}
                disabled={!canEditValue}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder={canEditValue ? 'Enter tag value' : 'Select category and name first'}
              />
              {filteredTagValues.length > 0 && canEditValue && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto">
                  {filteredTagValues.map(val => (
                    <li
                      key={val}
                      onClick={() => handleSelectTagValue(val)}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                    >
                      {val}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canEditValue || !value}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}