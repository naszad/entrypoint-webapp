'use client'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
import LoginHeader from '@/components/LoginHeader'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullScreenMessage, setFullScreenMessage] = useState('');
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false);
  const { handleLogout } = useAuth();

  const resetRequired = searchParams.get('reset_required') === 'true';

const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      if (!response.ok) {
        const error = await response.json();
        setMessage(error.error || 'Something went wrong, please try again later.');
        return;
      }

      setFullScreenMessage('Password reset email sent. Please check your email and spam folder.');
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Something went wrong, please try again later.'}`);
    } finally {
      setIsLoading(false);
    }     
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    setIsLoading(true);
    const supabase = await createClient()
    
    // Update the password
    const { error: passwordError } = await supabase.auth.updateUser({ password,
      data: { reset_password_required: false }
     })    

    if (passwordError) {
      const message = passwordError.message || 'Something went wrong while updating your password. Please try again if issue persists, use the forgot password link on login page to reset your password again.';
      setMessage(message);
      setIsLoading(false);
      return;
    }

    await supabase.auth.signOut();
    sessionStorage.clear();
    localStorage.clear();
    setShowUpdatePassword(false);
    setFullScreenMessage('Password updated successfully. Please login with your new password.');
    setIsLoading(false);
  }

  useEffect(() => {
    if (resetRequired) {
      setShowUpdatePassword(true);
    }
  }, [resetRequired]);

  if (showUpdatePassword) {
    const headerDescription = resetRequired 
      ? "You must set a new password to continue" 
      : "Update your password";

    return (
      <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <LoginHeader description={headerDescription} />
        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                label="New Password"
              />
            </div>
            <div>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="********"
                label="Confirm Password"
              />
            </div>
          </div>

          <div>
            <Button
              variant="primary"
              className='w-full'
              onClick={handleUpdatePassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className='text-lg'>Please wait...</span>
                </div>
              ) : (
                <span className='text-lg'>Update Password</span>
              )}
            </Button>
          </div>

          {resetRequired && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Or{' '}
                <Button
                  variant="link"
                  onClick={handleLogout}
                  className="text-sm"
                >
                  Go back to login page
                </Button>
              </p>
            </div>
          )}

          {message && (
            <Alert  className="mb-4"
              autoClose={true}
              variant="destructive"
              message={message}
              onClose={() => setMessage('')}
            />
          )}
        </div>
      </div>
    </main>
    )
  }

  if (fullScreenMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full space-y-8">
          <div className="space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-500">{fullScreenMessage}</h1>
              <Button variant="primary" className="mt-4" onClick={() => router.push('/login')}>
                <span className="text-md">Continue</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
      <LoginHeader description="Enter your email, we will send you a link to reset your password" />
        <form className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="email@example.com"
                label="Email"
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              className='w-full'
              onClick={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className='text-lg'>Please wait...</span>
                </div>
              ) : (
                <span className='text-lg'>Reset Password</span>
              )}
            </Button>
          </div>

          {message && (
            <Alert  className="mb-4"
              autoClose={true}
              variant="destructive"
              message={message}
              onClose={() => setMessage('')}
            />
          )}
        </form>
      </div>
    </main>
  );
} 