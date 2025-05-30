'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation'
import { getUserByAuthId } from '@/libs/userService';
import { UserInfo } from '@/types/UserInfo';
import { createClient } from '@/utils/supabase/supabaseClient';
import { loginWithCredentials } from '@/libs/authService';

interface AuthContextType {
  user: UserInfo | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.getUser()

      if (!error && data?.user) {

        const { id } = data.user
        const user = await getUserByAuthId(id);

        if (user) {
          console.log('user found: ', user);
          setUser({ ...user, role: "Counselor" });
          router.push('/dashboard')
          setLoading(false);
          return;
        } else {
          setLoading(false)
          router.push('/login')
          return
        }

      } else {
        setLoading(false)
        router.push('/login')
        return
      }
    }

    if (!user) {
      fetchUser()
    }
  }, [user, router])

const login = async (email: string, password: string) => {
    const { data, error } = await loginWithCredentials(email, password)

    if (error || !data.user) {
      throw new Error('Invalid credentials')
    } else {
      const { user } = data;
      const userDetails = await getUserByAuthId(user.id);
      if (userDetails) {
        setUser({ ...userDetails, role: "Counselor" });
        router.push('/dashboard')
      } else {
        throw new Error('Error fetching user details')
      }
      
    }
  }

  return loading ? (
    <div className="w-full h-screen flex items-center justify-center">
      <p className="text-xl text-gray-600">Loading...</p>
    </div>
  ) : (
    <AuthContext.Provider value={{ user, loading, login }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
