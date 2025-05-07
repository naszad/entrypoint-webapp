'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useTransition,
} from 'react'
import { supabase } from '@/libs/supabaseClient'
import { useRouter } from 'next/navigation'
import { getUserByAuthId } from '@/libs/userService';
import { UserInfo } from '@/types/UserInfo';

interface AuthContextType {
  user: UserInfo | null
  loading: boolean
  isPending: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser()

      if (!error && data?.user) {

        const { id } = data.user
        const user = await getUserByAuthId(id);

        if (user) {

          console.log('user found: ', user);
          
          setUser({ ...user, role: "Counselor" });
        } else {
          setLoading(false)
          router.push("/login");
        }

      } else {
        setLoading(false)
        router.push('/login')
      }

      setLoading(false)
    }

    if (!user) {
      fetchUser()
    }
  }, [user, router])

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

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

  const logout = async () => {
    startTransition(async () => {
      try {
        const { error } = await supabase.auth.signOut()
        if (!error) {
          router.push('/login')
          setUser(null)
        } else {
          console.error('Error during logout:', error)
        }
      } catch (error) {
        console.error('Error during logout:', error)
      }
    })
  }

  const isLoading = loading || isPending

  return isLoading && !isPending ? (
    <div className="w-full h-screen flex items-center justify-center">
      <p className="text-xl text-gray-600">Loading...</p>
    </div>
  ) : (
    <AuthContext.Provider value={{ user, loading: isLoading, isPending, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
