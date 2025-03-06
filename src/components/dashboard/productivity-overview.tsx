"use client";
import { useEffect, useState } from "react";
import { fetchWithErrorHandling } from '../../utils/api-helpers';
import { ErrorFallback } from '../ui/error-fallback';

interface ProductivityData {
  date: string;
  productiveTime: number;
  totalTime: number;
}

interface ProductivityOverviewProps {
  userId: string | undefined;
}

export default function ProductivityOverview({ userId }: ProductivityOverviewProps) {
  const [productivityData, setProductivityData] = useState<ProductivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProductivityData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await fetchWithErrorHandling(`/api/productivity/history?userId=${userId}`);
      // Type guard to safely access the history property
      if (data && typeof data === 'object' && 'history' in data) {
        setProductivityData((data as { history: ProductivityData[] }).history || []);
      } else {
        setProductivityData([]);
      }
    } catch (err) {
      console.error("Error fetching productivity data:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch productivity data"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;

    fetchProductivityData();

    // Set up interval to refresh data
    const intervalId = setInterval(fetchProductivityData, 60000); // Refresh every minute
    
    return () => clearInterval(intervalId);
  }, [userId]);

  // Calculate today's productivity score
  const todayData = productivityData[0] || { productiveTime: 0, totalTime: 0 };
  const productivityScore = todayData.totalTime > 0 
    ? Math.round((todayData.productiveTime / todayData.totalTime) * 100) 
    : 0;
    // Format time (convert minutes to hours and minutes)
    const formatTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

  if (error) {
    return <ErrorFallback message="Failed to load productivity data" onRetry={fetchProductivityData} />;
  }

  if (isLoading) {
    return <div className="w-full p-6 bg-gray-100 rounded-lg animate-pulse">Loading productivity data...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Productivity Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-500 mb-1">Productivity Score</h3>
          <p className="text-3xl font-bold">{productivityScore}%</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-500 mb-1">Productive Time</h3>
          <p className="text-3xl font-bold">
            {formatTime(todayData.productiveTime)}
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Time</h3>
          <p className="text-3xl font-bold">
            {formatTime(todayData.totalTime)}
          </p>
        </div>
      </div>
      
      {/* Chart would go here in a real implementation - simplified version for now */}
      <div className="relative bg-gray-100 h-16 rounded overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-blue-500"
          style={{ width: `${productivityScore}%` }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center text-sm">
          {productivityScore}% productive
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-500 text-center">
        {`Today's productivity based on ${formatTime(todayData.totalTime)} tracked time`}
      </div>
    </div>
  );
}
