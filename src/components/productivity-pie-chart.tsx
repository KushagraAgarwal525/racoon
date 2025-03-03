'use client';

import { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

type ProductivityPieChartProps = {
  userId?: string;
};

export function ProductivityPieChart({ userId }: ProductivityPieChartProps) {
  const [productiveTime, setProductiveTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!userId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await fetch(`/api/productivity/today?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch today\'s productivity data');
        }
        
        const data = await response.json();
        setProductiveTime(data.productiveTime || 0);
        setTotalTime(data.totalTime || 0);
      } catch (err) {
        console.error('Error fetching productivity data:', err);
        setError('Failed to load productivity data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    
    // Refresh data every 5 minutes
    const intervalId = setInterval(fetchData, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [userId]);

  if (!userId) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mt-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Today's Productivity</h2>
        <div className="text-center text-gray-500 py-8">
          Sign in to see your productivity data
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mt-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Today's Productivity</h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mt-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Today's Productivity</h2>
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  // Calculate non-productive time
  const nonProductiveTime = Math.max(0, totalTime - productiveTime);
  
  // Format time for display
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
  
  // Data for pie chart
  const data = {
    labels: ['Productive', 'Non-Productive'],
    datasets: [
      {
        label: 'Time (minutes)',
        data: [productiveTime, nonProductiveTime],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${formatTime(value)} (${Math.round(value / totalTime * 100)}%)`;
          }
        }
      }
    },
  };

  // If no data yet
  if (totalTime === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mt-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Today's Productivity</h2>
        <div className="text-center text-gray-500 py-8">
          No productivity data recorded today
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mt-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Today's Productivity</h2>
      
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Productive Time</span>
          <span className="text-sm text-gray-500">{formatTime(productiveTime)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Total Time</span>
          <span className="text-sm text-gray-500">{formatTime(totalTime)}</span>
        </div>
      </div>
      
      <div className="mt-4 h-64 flex items-center justify-center">
        <Pie data={data} options={options} />
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-500">
        {Math.round((productiveTime / totalTime) * 100)}% productive today
      </div>
    </div>
  );
}