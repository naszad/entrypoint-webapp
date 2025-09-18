'use client'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { MoveLeft } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/supabaseClient'
import { useRouter } from 'next/navigation'
import LoginHeader from '@/components/LoginHeader'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullScreenMessage, setFullScreenMessage] = useState('');
  const [message, setMessage] = useState('')

const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.env.APP_URL}/forgot-password`
    })

    if (error) {
      setMessage(error.message);
    } else {
    setFullScreenMessage('Password reset email sent. Please check your email.');
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    const supabase = await createClient() 
    const { error } = await supabase.auth.updateUser({ password })    

    if (error) {
      setMessage(error.message);
    } else {
      setFullScreenMessage('Password updated successfully. Please login with your new password.');
    }
  }

  useEffect(() => {
    const handlePasswordRecovery = async () => {
    const supabase = await createClient()
    await supabase.auth.onAuthStateChange(async (event) => {
      if (event == "PASSWORD_RECOVERY") {
        setShowUpdatePassword(true);
      }
    })
  }
  handlePasswordRecovery();
  }, [])

  if (showUpdatePassword) {

    return (
      <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <LoginHeader description="Update your password" />
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
            >
              <span className='text-lg'>Update Password</span>
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
                <MoveLeft className="w-4 h-4" />
                <span className="text-md">Back to Login</span>
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
            >
              <span className='text-lg'>Reset Password</span>
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