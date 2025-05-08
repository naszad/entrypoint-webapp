'use client'
import { useAuth } from '@/context/AuthContext';
import { redirect } from 'next/navigation';
const HomePage = () => {
  const { user } = useAuth()
  if (!user) redirect('/login')
  redirect('/dashboard')
}

export default HomePage

