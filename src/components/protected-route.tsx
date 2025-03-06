"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Don't render anything on the server or before mounted on the client
  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-2">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in the useEffect
  }

  return <>{children}</>;
}
