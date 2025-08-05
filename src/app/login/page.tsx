'use client'
import { useState, useEffect } from 'react'
import LoginHeader from '@/components/LoginHeader'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth();
  const [email, setEmail] = useState('test@email.com')
  const [password, setPassword] = useState('password')

  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setMessage(e.message);
      }
    }
  }

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('')
      }, 5000)
  
      // Cleanup the timer when the component unmounts or error changes
      return () => clearTimeout(timer)
    }
  }, [message])

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <LoginHeader description="" />
        {/* Login Form */}
        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="counselor@example.k12.in.us"
                label="Email"
              />
            </div>

            <div>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="********"
                label="Password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-600"
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Button
                variant="link"
                onClick={() => {
                  router.push('/forgot-password')
                }}
              >
                Forgot your password?
              </Button>
            </div>
          </div>

          <div>
            <Button
              variant="primary"
              className='w-full'
              onClick={handleLogin}
            >
              <span className='text-lg'>Log In</span>
            </Button>
          </div>

          {message && (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </main>
  );
} 