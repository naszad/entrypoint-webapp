'use client'

import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/utils/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, className, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500",
            className
          )}
          {...props}
        />
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
