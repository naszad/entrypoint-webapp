import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  //SUPABASE_INTERNAL_URL is only used locally with docker-compose. Not needed for production.
  const supabaseUrl = process.env.SUPABASE_INTERNAL_URL ?? process.env.SUPABASE_URL!
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const selectedSchool = request.cookies.get('selectedSchoolId')?.value;
  const isMultiSchoolUser = request.cookies.get('isMultiSchoolUser')?.value === 'true';

  // Handle multi-school user redirection (but not if they're on EULA page)
  if (user && isMultiSchoolUser && !selectedSchool && 
      request.nextUrl.pathname !== '/select-school' && 
      request.nextUrl.pathname !== '/eula') {
    const url = request.nextUrl.clone()
    url.pathname = '/select-school'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from the login page
  // Note: EULA check is handled in AuthContext which will redirect to /eula if needed
  if (user && request.nextUrl.pathname === '/login') {    
    const url = request.nextUrl.clone()
    url.pathname = '/students'
    return NextResponse.redirect(url)
  }

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/forgot-password')
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}