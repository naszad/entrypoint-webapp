import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient(isAdmin: boolean = false) {
  const cookieStore = await cookies()

  //SUPABASE_INTERNAL_URL is only used locally with docker-compose. Not needed for production.
  const supabaseUrl = process.env.SUPABASE_INTERNAL_URL ?? process.env.SUPABASE_URL!
  const supabaseKey = isAdmin ? process.env.SUPABASE_SERVICE_KEY! : process.env.SUPABASE_ANON_KEY!
  
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}