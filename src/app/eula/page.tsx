'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function EulaPage() {
  const router = useRouter()
  const { user, handleLogout } = useAuth()
  const [agreeing, setAgreeing] = useState(false);

  // Redirect users who have already agreed to EULA
  useEffect(() => {
    if (user && user.eulaAgreeTimestamp) {
      router.push('/');
    }
  }, [user, router]);

  // Show loading while user data is being checked or if user has already agreed
  if (user && user.eulaAgreeTimestamp) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleBack = async () => {
    // Don't record EULA agreement, just log out and return to login screen
    await handleLogout()
    router.push('/login')
  }

  const handleAgree = async () => {
    setAgreeing(true)
    try {
      const res = await fetch('/api/users/eula-agree', { method: 'POST' })
      if (!res.ok) {
        throw new Error('Failed to record EULA agreement')
      }
      
      // Force a page refresh to reload user data with updated EULA timestamp
      // This ensures AuthContext fetchUser runs and sets proper cookies
      window.location.href = '/';
    } catch (err) {
      console.error(err)
      setAgreeing(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-5xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">End User License Agreement</h1>
          <p className="text-gray-600">Please review and agree to the terms below to continue using EntryPoint SRM</p>
        </div>
        
        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 mb-6">
          <div className="h-150 overflow-auto bg-white rounded border">
            <object 
              data="/EntryPoint_EULA.pdf" 
              type="application/pdf" 
              width="100%" 
              height="100%"
              className="min-h-full"
            >
              <div className="p-6 text-center">
                <p className="text-gray-600 mb-4">
                  Your browser does not support viewing PDFs directly.
                </p>
                <a 
                  href="/EntryPoint_EULA.pdf" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Download and View EULA
                </a>
              </div>
            </object>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <button 
            onClick={handleBack} 
            className="px-6 py-2 rounded-md bg-gray-500 text-white hover:bg-gray-600 transition-colors font-medium"
          >
            Back
          </button>
          <button 
            onClick={handleAgree} 
            disabled={agreeing} 
            className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {agreeing ? 'Processing...' : 'I Agree'}
          </button>
        </div>
      </div>
    </div>
  )
}
