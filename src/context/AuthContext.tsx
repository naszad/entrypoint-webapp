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
import { identifyUser, refreshSuperProperties, resetMixpanel } from '@/libs/mixpanelClient';
import { saveSelectedSchool } from '@/utils/selectedSchoolStorage';

interface AuthContextType {
  user: UserInfo | null
  setRefreshUser: (value: boolean) => void
  loading: boolean
  login: (email: string, password: string) => Promise<UserInfo | null>
  handleLogout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [refreshUser, setRefreshUser] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter();

  const setCookie = (key: string, value: string) => {
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/`;
  }

  const clearUserSession = () => {
    saveSelectedSchool(null);
    sessionStorage.clear();
    localStorage.clear();
    setCookie('selectedSchoolId', '')
    setCookie('isMultiSchoolUser', '')
    setCookie('customer_id', '')
    resetMixpanel(); // Clear Mixpanel user data on logout
    setUser(null);
  }

  const setupMixpanelUser = (user: UserInfo) => {
    identifyUser(user.user_id, {
      $email: user.email,
      $name: `${user.first_name} ${user.last_name}`,
    });
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
          setupMixpanelUser(user);
          
          if (user.isMultiSchoolUser) {
            setCookie('isMultiSchoolUser', user.isMultiSchoolUser.toString())
            saveSelectedSchool(null);
            // Don't redirect here - let middleware handle it
          } else {
            const primarySchool = user.schools?.[0] || null;
            saveSelectedSchool(primarySchool);
          }
          refreshSuperProperties();
          setLoading(false);
          setRefreshUser(false);
          return;
        } else {
          setLoading(false)
          setRefreshUser(false);
          return
        }

      } else {
        setLoading(false)
        setRefreshUser(false);
        return
      }
    }

    if (!user || refreshUser) {
      fetchUser()
    }
  }, [user, refreshUser, router])


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
        
        setUser({ ...userDetails});
        setupMixpanelUser(userDetails);

         // If user hasn't agreed to EULA, send them to EULA screen first
        if (!userDetails.eula_agree_timestamp) {
          router.push('/eula');
          return null;
        }
        setUser(userDetails);

        if (userDetails.isMultiSchoolUser) {
          setCookie('isMultiSchoolUser', userDetails.isMultiSchoolUser.toString())
          saveSelectedSchool(null);
          router.push('/select-school')
        } else {
          const primarySchool = userDetails.schools?.[0] || null;
          saveSelectedSchool(primarySchool);
          router.push('/students')
        }
        refreshSuperProperties();
        return userDetails;
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
    <AuthContext.Provider value={{ user, setRefreshUser, loading, login, handleLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
