'use client'

import { useEffect, useState } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/utils'

const transitionIndicatorVariants = cva(
  'fixed inset-x-0 top-0 z-50 h-1 animate-pulse',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        loading: 'bg-blue-500',
        success: 'bg-green-500',
        error: 'bg-red-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface TransitionIndicatorProps
  extends VariantProps<typeof transitionIndicatorVariants> {
  isLoading: boolean
  className?: string
}

export function TransitionIndicator({
  isLoading,
  variant,
  className,
}: TransitionIndicatorProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isLoading) {
      setVisible(true)
    } else {
      const timer = setTimeout(() => {
        setVisible(false)
      }, 500) // Hide after transition completes
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  if (!visible) return null

  return (
    <div
      className={cn(
        transitionIndicatorVariants({ variant }),
        className
      )}
    />
  )
} 