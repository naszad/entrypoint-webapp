'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { TransitionIndicator } from '@/components/ui/transition-indicator'

export function NavigationEvents() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    const handleStart = () => {
      setIsNavigating(true)
    }

    const handleStop = () => {
      setIsNavigating(false)
    }

    // Add event listeners for router events
    window.addEventListener('beforeunload', handleStart)
    window.addEventListener('load', handleStop)

    return () => {
      window.removeEventListener('beforeunload', handleStart)
      window.removeEventListener('load', handleStop)
    }
  }, [])

  // When the pathname or search params change, update navigation state
  useEffect(() => {
    setIsNavigating(false)
  }, [pathname, searchParams])

  // Either show transition for navigation or auth operations
  return <TransitionIndicator isLoading={isNavigating} variant="loading" />
} 