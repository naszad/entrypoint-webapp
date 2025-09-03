import { createBrowserClient } from '@supabase/ssr'

// This function creates a Supabase client for the browser.
// It reads the Supabase URL and anonymous key from the window object.
// These values are injected into the HTML by the root layout.
export function createClient() {
  return createBrowserClient(
    window.env.SUPABASE_URL!,
    window.env.SUPABASE_ANON_KEY!
  )
}