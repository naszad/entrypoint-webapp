'use client'
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const HomePage = () => {
  const router = useRouter();

  useEffect(() => {
    // Let middleware handle all auth flow redirects (password reset, EULA, etc.)
    // Just redirect to students - middleware will catch and redirect if needed
    router.push('/students');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
};

export default HomePage;

