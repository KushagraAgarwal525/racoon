"use client";
import { useState, useEffect } from "react";
import { fetchWithErrorHandling } from '../../utils/api-helpers';
import { ErrorFallback } from '../ui/error-fallback';

interface LeaderboardUser {
  email: string;
  username: string;
  productiveTime: number;
  totalTime: number;
}

export default function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchWithErrorHandling('/api/productivity/leaderboard') as { leaderboard: LeaderboardUser[] };
      setUsers(data.leaderboard || []);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch leaderboard"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    
    // Refresh every 5 minutes
    const intervalId = setInterval(fetchLeaderboard, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  if (error) {
    return <ErrorFallback message="Failed to load leaderboard" onRetry={fetchLeaderboard} />;
  }

  if (isLoading) {
    return <div className="w-full p-6 bg-gray-100 rounded-lg animate-pulse">Loading leaderboard...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
      
      {users.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No data available yet
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((user, index) => (
            <div key={user.username} className="flex items-center">
              <div className="font-bold text-xl w-6">{index + 1}</div>
              <div className="ml-2 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                {/* {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                ) : ( */}
                  <span>{user.username}</span>
                {/* } */}
              </div>
              <div className="ml-3 flex-grow">
                <div className="font-medium">{user.username}</div>
              </div>
              <div className="font-bold">{user.productiveTime}m</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
