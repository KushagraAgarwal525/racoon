"use client";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";
import { User } from "@/lib/auth-client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface DashboardHeaderProps {
  user: User | null;
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const { logout } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-2xl font-bold">
          Racoon
        </Link>

        <div className="relative">
          <button 
            className="flex items-center space-x-2 focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <span>{user?.displayName?.[0] || user?.email?.[0] || 'U'}</span>
              )}
            </div>
            <span className="hidden md:inline-block">
              {user?.displayName || user?.email || 'User'}
            </span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Profile
              </Link>
              <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Settings
              </Link>
              <button 
                onClick={handleLogout} 
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
