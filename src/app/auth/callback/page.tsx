'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/supabaseClient'

export default function AuthCallback() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const logoutAndClearStorage = async () => {
    const supabase = await createClient()
    await supabase.auth.signOut()
    sessionStorage.clear()
    localStorage.clear()
  }

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for error in URL params (e.g., error=access_denied)
        const urlParams = new URLSearchParams(window.location.search)
        const urlError = urlParams.get('error')
        const errorDescription = urlParams.get('error_description')
        const supabase = await createClient()

        if (urlError) {
          await logoutAndClearStorage();
          console.error('Auth error from URL:', urlError, errorDescription)
          
          if (urlError === 'access_denied') {
            setError('This link has expired or is no longer valid. Please request a new password reset link.')
            return
          }
          
          setError('Authentication failed. Please try again from the login page.')
          return
        }

        // Get tokens from URL hash (invite/reset links)
        const hash = window.location.hash.substring(1)
        const hashParams = new URLSearchParams(hash)
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')
        const hashError = hashParams.get('error')
        const hashErrorDescription = hashParams.get('error_description')

        // Check for errors in hash (Supabase sometimes puts errors here)
        if (hashError) {
          await logoutAndClearStorage();
          console.error('Auth error from hash:', hashError, hashErrorDescription)
          
          if (hashError === 'access_denied') {
            setError('This link has expired or is no longer valid. Please request a new password reset link.')
            return
          }
          
          setError('Authentication failed. Please try again from the login page.')
          return
        }

        if (accessToken && refreshToken) {

          // Set the session with the tokens from the URL
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (sessionError) {
            console.error('Session error:', sessionError)
            setError('Failed to authenticate. Please try again.')
            return
          }

        } 

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          console.error('No user in session data')
          router.push('/login')
          return
        }

        // If this is a password recovery link (type=recovery), ALWAYS go to password reset
        // This handles the race condition where the flag might not be set yet
        if (type === 'recovery') {
          router.push('/forgot-password?reset_required=true')
          return
        }

        // If this is an invite link (type=invite), ALWAYS go to password reset
        // New users must set their password
        if (type === 'invite') {
          router.push('/forgot-password?reset_required=true')
          return
        }

        // Fallback: Check if user needs to reset password (if type is not set)
        if (user.user_metadata?.reset_password_required) {
          router.push('/forgot-password?reset_required=true')
          return
        }

        // Check if user needs to agree to EULA
        if (!user.user_metadata?.eula_agree_signed) {
          router.push('/eula')
          return
        }

        // All requirements met, go to main app
        router.push('/students')
      } catch (err) {
        console.error('Auth callback error:', err)
        setError('An error occurred during authentication.')
      }
    }

    handleAuthCallback()
  }, [router])

  if (error) {
    const isExpiredLink = error.includes('expired') || error.includes('no longer valid');
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center space-y-6">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            {/* Error Message */}
            <div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                {isExpiredLink ? 'Link Expired' : 'Authentication Error'}
              </h1>
              <p className="text-gray-600">{error}</p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {isExpiredLink ? (
                <>
                  <button
                    onClick={() => router.push('/forgot-password')}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Request New Password Reset Link
                  </button>
                  <button
                    onClick={() => router.push('/login')}
                    className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
                  >
                    Back to Login
                  </button>
                </>
              ) : (
                <button
                  onClick={() => router.push('/login')}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Back to Login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing authentication...</p>
      </div>
    </div>
  )
}

