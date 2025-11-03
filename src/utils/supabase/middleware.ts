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

  if (user) {
    // Allow static files like PDFs to pass through
    if (request.nextUrl.pathname.startsWith('/api') || request.nextUrl.pathname.endsWith('.pdf')) {
      return supabaseResponse;
    }

    // Check if user needs to reset password (highest priority)
    // Allow access to /login and /forgot-password so user can choose to login with old password or reset
    if (user.user_metadata?.reset_password_required && 
        !request.nextUrl.pathname.startsWith('/forgot-password') &&
        !request.nextUrl.pathname.startsWith('/login')) {
      const url = request.nextUrl.clone()
      url.pathname = '/forgot-password'
      // Add a flag to indicate this is a required password reset
      url.searchParams.set('reset_required', 'true')
      return NextResponse.redirect(url)
    }

    // Check if user needs to agree to EULA (second priority)
    if (!user.user_metadata?.reset_password_required && !user.user_metadata?.eula_agree_signed && !request.nextUrl.pathname.startsWith('/eula')) {
      const url = request.nextUrl.clone()
      url.pathname = '/eula'
      return NextResponse.redirect(url)
    }

    const selectedSchool = request.cookies.get('selectedSchoolId')?.value;
    const isMultiSchoolUser = request.cookies.get('isMultiSchoolUser')?.value === 'true';

    // Handle multi-school user redirection (third priority)
    if (!user.user_metadata?.reset_password_required &&
        user.user_metadata?.eula_agree_signed &&
        isMultiSchoolUser && 
        !selectedSchool && 
        request.nextUrl.pathname !== '/select-school') {
      const url = request.nextUrl.clone()
      url.pathname = '/select-school'
      return NextResponse.redirect(url)
    }

    // Redirect authenticated users away from public pages (only if all requirements are met)
    const publicPaths = ['/login', '/forgot-password'];
    if (!user.user_metadata?.reset_password_required &&
        user.user_metadata?.eula_agree_signed &&
        publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {    
      const url = request.nextUrl.clone()
      url.pathname = '/students'
      return NextResponse.redirect(url)
    }
  } else {
    // Allow unauthenticated access to specific public API endpoints needed before login (e.g., forgot password)
    if (request.nextUrl.pathname === '/api/auth/forgot-password') {
      return supabaseResponse
    }

    if (!request.nextUrl.pathname.startsWith('/login') &&
      !request.nextUrl.pathname.startsWith('/auth') &&
      !request.nextUrl.pathname.startsWith('/forgot-password') &&
      !request.nextUrl.pathname.startsWith('/eula')
    ) {
      // no user, potentially respond by redirecting the user to the login page
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}