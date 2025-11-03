'use client'
import { useState } from 'react'
import LoginHeader from '@/components/LoginHeader'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth();
  const isLocalDevelopment = process.env.NODE_ENV === 'development';
  const [email, setEmail] = useState(isLocalDevelopment ? 'test@email.com' : '')
  const [password, setPassword] = useState(isLocalDevelopment ? 'password' : '')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    
    try {
      await login(email, password);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setMessage(e.message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <LoginHeader description="" />
        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="username@example.k12.in.us"
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
                type="button"
                variant="link"
                onClick={() => {
                  router.push('/forgot-password')
                }}
                disabled={isLoading}
              >
                Forgot your password?
              </Button>
            </div>
          </div>

          <div>
            <Button
              variant="primary"
              className='w-full'
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className='text-lg'>Please wait...</span>
                </div>
              ) : (
                <span className='text-lg'>Log In</span>
              )}
            </Button>
          </div>

          {message && (
            <Alert  className="mb-4"
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
