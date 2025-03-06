"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import ProtectedRoute from "@/components/protected-route";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import ProductivityOverview from "@/components/dashboard/productivity-overview";
import ActivityList from "@/components/dashboard/activity-list";
import Leaderboard from "@/components/dashboard/leaderboard";
import ProductivityTrackerInitializer from "@/components/productivity/tracker-initializer";

export default function DashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Initialize productivity tracker when user is available */}
        {user?.uid && <ProductivityTrackerInitializer userId={user.uid} />}
        
        <DashboardHeader user={user} />
        <main className="container mx-auto py-6 px-4">
          <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ProductivityOverview userId={user?.uid} />
                <ActivityList userId={user?.uid} />
              </div>
              <div>
                <Leaderboard />
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
