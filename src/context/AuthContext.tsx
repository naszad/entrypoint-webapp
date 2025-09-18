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
import { loginWithCredentials, logout } from '@/libs/authService';

interface AuthContextType {
  user: UserInfo | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  handleLogout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter();

  const setCookie = (key: string, value: string) => {
    document.cookie = `${key}=${value}; path=/`;
  }

  const clearUserSession = () => {
    sessionStorage.clear();
    localStorage.clear();
    setCookie('selectedSchoolId', '')
    setCookie('isMultiSchoolUser', '')
    setUser(null);
  }

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.getUser()

      if (!error && data?.user) {

        const { id } = data.user
        const user = await getUserByAuthId(id);

        if (user) {
          // Check if user needs to agree to EULA first
          if (!user.eula_agree_timestamp) {
            setLoading(false);
            router.push('/eula');
            return;
          }
          setUser(user);
          
          if (user.isMultiSchoolUser) {
            setCookie('isMultiSchoolUser', user.isMultiSchoolUser.toString())
            // Don't redirect here - let middleware handle it
          } else {
            setCookie('selectedSchoolId', user.schools?.[0]?.schoolId || '')
            sessionStorage.setItem('selectedSchool', user.schools?.[0] ? JSON.stringify(user.schools?.[0]) : '' )
          }
          setLoading(false);
          return;
        } else {
          setLoading(false)
          return
        }

      } else {
        setLoading(false)
        return
      }
    }

    if (!user) {
      fetchUser()
    }
  }, [user])

const handleLogout = async () => {
  await logout();
  clearUserSession();
}

const login = async (email: string, password: string) => {
    clearUserSession();
    const { data, error } = await loginWithCredentials(email, password)

    if (error || !data.user) {
      throw new Error('Invalid credentials')
    } else {
      const { user } = data;
      const userDetails = await getUserByAuthId(user.id);
      if (userDetails) {
         // If user hasn't agreed to EULA, send them to EULA screen first
        if (!userDetails.eula_agree_timestamp) {
          router.push('/eula');
          return;
        }
        setUser(userDetails);

        if (userDetails.isMultiSchoolUser) {
          setCookie('isMultiSchoolUser', userDetails.isMultiSchoolUser.toString())
          router.push('/select-school')
        } else {
          setCookie('selectedSchoolId', userDetails.schools?.[0]?.schoolId || '')
          sessionStorage.setItem('selectedSchool', userDetails.schools?.[0] ? JSON.stringify(userDetails.schools?.[0]) : '' )
          router.push('/students')
        }
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
    <AuthContext.Provider value={{ user, loading, login, handleLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
