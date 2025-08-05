'use client'
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const HomePage = () => {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.push('/login');
    } else if (user) {
      router.push('//students');
    }
  }, [user, router]);

  return null;
};

export default HomePage;

