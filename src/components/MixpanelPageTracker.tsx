'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { trackEvent } from '@/libs/mixpanelClient'

// Normalization rules: order matters (first match wins)
// Extend this list as new dynamic routes are added.
function normalizePath(path: string): string {
  // Remove trailing slash except root
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1)

  const segments = path.split('/').filter(Boolean)

  const normalizedSegments = segments.map(seg => {
    // Common UUID pattern
    if (/^[0-9a-fA-F-]{32,36}$/.test(seg)) return ':id'
    // Numeric IDs
    if (/^\d+$/.test(seg)) return ':id'
    // Student specific pattern could be more explicit later
    return seg
  })

  // Custom replacements for known dynamic routes
  // Example: /students/:id/profile -> /students/:id/profile (already handled)
  // If you want to collapse entire entity views to a single token use logic here.

  return '/' + normalizedSegments.join('/')
}

export default function MixpanelPageTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastTrackedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname) return

    const normalized = normalizePath(pathname)
    const queryPresent = searchParams?.toString().length ? true : false

    // Build a stable name (avoid query params proliferation)
    const eventProps = {
      page: normalized,
      path: pathname,
      has_query: queryPresent,
    }

    const dedupeKey = normalized + '|' + (queryPresent ? 'q' : 'n')
    if (lastTrackedRef.current === dedupeKey) return

    if (trackEvent('Page View', eventProps)) {
      lastTrackedRef.current = dedupeKey
    }
  }, [pathname, searchParams])

  return null
}
