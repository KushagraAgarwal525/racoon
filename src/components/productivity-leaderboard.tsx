'use client';

import { useState, useEffect } from 'react';

type LeaderboardEntry = {
  userId: string;
  displayName: string;
  photoURL: string;
  productiveTime: number; // in minutes
  totalTime: number; // in minutes
  rank?: number;
};

type LeaderboardProps = {
  userId?: string; // Current user's ID
  className?: string; // Add className prop for custom styling
};

export function ProductivityLeaderboard({ userId, className }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        // Include userId in the request if available
        const url = userId 
          ? `/api/productivity/leaderboard?userId=${userId}`
          : '/api/productivity/leaderboard';
          
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }
        const data = await response.json();
        
        setLeaderboard(data.leaderboard || []);
        
        // Find current user's rank if they're not in the top 10
        if (userId && data.userRank && data.userRank.userId === userId) {
          setUserRank(data.userRank);
        } else {
          setUserRank(null);
        }
        
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
    
    // Refresh every 5 minutes
    const intervalId = setInterval(fetchLeaderboard, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [userId]);

  if (loading) {
    return (
      <div className={`bg-white shadow rounded-lg p-6 w-full max-w-3xl mx-auto ${className || ''}`}>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Daily Productivity</h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white shadow rounded-lg p-6 w-full max-w-3xl mx-auto ${className || ''}`}>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Daily Productivity</h2>
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow rounded-lg p-6 w-full max-w-3xl mx-auto ${className || ''}`}>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Daily Leaderboard</h2>
      
      {leaderboard.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No productivity data available for today
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="w-[10%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th scope="col" className="w-[50%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="w-[20%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productive
                </th>
                <th scope="col" className="w-[20%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  %
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboard.map((entry, index) => (
                <tr 
                  key={entry.userId || index}
                  className={userId === entry.userId ? 'bg-blue-50' : ''}
                >
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {entry.photoURL && (
                        <img
                          className="h-6 w-6 min-w-[24px] rounded-full mr-2"
                          src={entry.photoURL}
                          alt=""
                        />
                      )}
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {entry.displayName || `User ${index + 1}`}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimeMinutes(entry.productiveTime)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.totalTime > 0 
                      ? Math.round((entry.productiveTime / entry.totalTime) * 100) 
                      : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {userRank && userId && !leaderboard.find(entry => entry.userId === userId) && (
            <>
              <div className="border-t border-gray-200 my-2"></div>
              <table className="min-w-full table-fixed">
                <tbody>
                  <tr className="bg-blue-50">
                    <td className="w-[10%] px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {userRank.rank}
                    </td>
                    <td className="w-[50%] px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {userRank.photoURL && (
                          <img
                            className="h-6 w-6 min-w-[24px] rounded-full mr-2"
                            src={userRank.photoURL}
                            alt=""
                          />
                        )}
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {userRank.displayName || 'You'}
                        </div>
                      </div>
                    </td>
                    <td className="w-[20%] px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimeMinutes(userRank.productiveTime)}
                    </td>
                    <td className="w-[20%] px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {userRank.totalTime > 0 
                        ? Math.round((userRank.productiveTime / userRank.totalTime) * 100) 
                        : 0}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
          
          {!userId && (
            <div className="text-center my-4 text-sm text-gray-500">
              Sign in to see your rank on the leaderboard
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to format time from minutes
function formatTimeMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  } else {
    return `${mins}m`;
  }
}