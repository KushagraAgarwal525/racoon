"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth state to be determined
    if (!loading) {
      if (user) {
        // User is logged in, redirect to dashboard
        router.push("/dashboard");
      } else {
        // Not logged in, show login options
        setIsLoading(false);
      }
    }
  }, [user, loading, router]);

  const handleEmailLogin = () => {
    router.push("/login");
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto text-center">
        <h1 className="text-4xl font-bold mb-8">Racoon</h1>
        <h2 className="text-2xl mb-12">Productivity Tracker</h2>
        
        {/* {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )} */}
        
        <div className="flex flex-col gap-4">
          <button
            onClick={handleEmailLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-6 py-3 transition-colors"
          >
            Continue with Email
          </button>
          
          <div className="mt-4 text-sm text-gray-600">
            Track your productivity and stay focused
          </div>
        </div>
      </div>
    </main>
  );
}