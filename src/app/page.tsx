'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/use-auth';
import { ProductivityLeaderboard } from '@/components/productivity-leaderboard';
import { ProductivityPieChart } from '@/components/productivity-pie-chart';
import { WeeklyProductivityChart } from '@/components/weekly-productivity-chart';
import { initProductivityTracker } from '@/lib/productivity-tracker';

export default function Home() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, loading, signInWithGoogle, signOut } = useAuth();
    const [authLoading, setAuthLoading] = useState(false);
    useEffect(() => {
        if (user?.uid) {
            const tracker = initProductivityTracker(user.uid);
            tracker.startTracking();
            
            return () => {
                tracker.stopTracking();
            };
        }
    }, [user?.uid]);
    const handleAuth = async () => {
        setAuthLoading(true);
        try {
            if (user) {
                // If user is logged in, log out
                await signOut();
                console.log('User signed out successfully');
            } else {
                // If user is not logged in, log in
                const result = await signInWithGoogle();
                console.log('Successfully logged in:', result);
                
                // Add the user to the database if they're logging in for the first time
                if (result) {
                    try {
                        // Check if user already exists
                        const response = await fetch(`/api/users/check?userId=${result.uid}`);
                        const data = await response.json();
                        
                        if (!data.exists) {
                            // User doesn't exist, create a new user record
                            await fetch('/api/users/create', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    userId: result.uid,
                                    displayName: result.displayName || `User-${result.uid.substring(0, 6)}`,
                                    email: result.email,
                                    photoURL: result.photoURL || '',
                                    createdAt: new Date().toISOString(),
                                }),
                            });
                            console.log('User added to database');
                        }
                    } catch (dbError) {
                        console.error('Error saving user to database:', dbError);
                    }
                }
            }
        } catch (error) {
            console.error('Authentication error:', error);
        } finally {
            setAuthLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Link href="/" className="font-bold text-xl text-blue-600">
                                    Racoon
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <button
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded flex items-center"
                                onClick={handleAuth}
                                disabled={loading || authLoading}
                            >
                                {loading || authLoading ? (
                                    <span>Loading...</span>
                                ) : user ? (
                                    <>
                                        <img 
                                            src={user.photoURL || undefined} 
                                            alt={user.displayName || 'User'} 
                                            className="w-5 h-5 rounded-full mr-2"
                                        />
                                        <span>Logout</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                                            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                                            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                                            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                                            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                                        </svg>
                                        <span>Login with Google</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Mobile menu button */}
                        <div className="flex items-center sm:hidden">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                                aria-expanded="false"
                            >
                                <span className="sr-only">Open main menu</span>
                                {/* Icon when menu is closed */}
                                {!isMenuOpen ? (
                                    <svg
                                        className="block h-6 w-6"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 6h16M4 12h16M4 18h16"
                                        />
                                    </svg>
                                ) : (
                                    /* Icon when menu is open */
                                    <svg
                                        className="block h-6 w-6"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu, show/hide based on menu state */}
                {isMenuOpen && (
                    <div className="sm:hidden">
                        <div className="pt-2 pb-3 space-y-1">
                            <div className="flex justify-center">
                                <button
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded w-full mx-4 flex items-center justify-center"
                                    onClick={handleAuth}
                                    disabled={loading || authLoading}
                                >
                                    {loading || authLoading ? 'Loading...' : user ? 'Logout' : 'Login with Google'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Main content */}
            <div className="py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="md:grid md:grid-cols-3 md:gap-6">
                        <div className="md:col-span-2">
                            <h1 className="text-3xl font-bold text-gray-900">
                                {user ? `Welcome, ${user.displayName || 'User'}!` : 'Welcome to Racoon'}
                            </h1>
                            <p className="mt-4 text-gray-600">
                                {user 
                                    ? 'Track your productivity and manage your tasks efficiently.' 
                                    : 'Sign in to start tracking your productivity.'}
                            </p>
                            
                            {/* Productivity charts */}
                            <ProductivityPieChart userId={user?.uid} />
                            <WeeklyProductivityChart userId={user?.uid} />
                        </div>
                        
                        {/* Daily Leaderboard */}
                        <div className="mt-8 md:mt-0">
                            <ProductivityLeaderboard userId={user?.uid} />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}