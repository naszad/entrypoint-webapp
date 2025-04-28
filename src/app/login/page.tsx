'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/libs/supabaseClient'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import RoleSelection from '@/components/RoleSelection'
import LoginHeader from '@/components/LoginHeader'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [selectedRole, setSelectedRole] = useState('student')
  

  useEffect(() => {
    localStorage.removeItem('lastScenarioTrigger')
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
    else { 
      setMessage(`Logged in as ${data.user.email}`);
      router.push('/dashboard')
    }
    // const routes = {
    //   student: '/student/emma-johnson',
    //   parent: '/parent',
    //   counselor: '/counselor'
    // }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <LoginHeader/>
        {/* Login Form */}
        <form className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email} onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="student@example.k12.in.us"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password} onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="********"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Role Selection Dropdown */}
          <div className="relative">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              I am a:
            </label>
            <div className="relative">
              <select
                id="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="appearance-none w-full bg-white border border-gray-300 rounded-lg py-2 px-4 pr-8 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
              >
                <option value="student">Student</option>
                <option value="parent">Parent</option>
                <option value="counselor">Counselor</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDownIcon className="h-4 w-4" />
              </div>
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
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handleLogin}
            >
              Log In
            </button>
          </div>
          <div>
          <p>{message}</p>
          </div>
        </form>

        {/* Role Selection */}
        <RoleSelection/>
      </div>
    </main>
  )
} 