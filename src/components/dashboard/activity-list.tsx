"use client";
import { useState, useEffect } from "react";

interface ActivityItem {
  appName: string;
  duration: number;
  category: 'productive' | 'neutral' | 'unproductive';
}

interface ActivityListProps {
  userId: string | undefined;
}

export default function ActivityList({ userId }: ActivityListProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Example data for when we don't have actual data
  const sampleActivities: ActivityItem[] = [
    { appName: "VS Code", duration: 3600000, category: "productive" },
    { appName: "Chrome", duration: 1800000, category: "neutral" },
    { appName: "Slack", duration: 900000, category: "neutral" },
    { appName: "YouTube", duration: 1200000, category: "unproductive" },
    { appName: "Notion", duration: 1500000, category: "productive" }
  ];
  
  useEffect(() => {
    // In a real app, fetch data from API
    // For now, simulate loading and use sample data
    const timer = setTimeout(() => {
      setActivities(sampleActivities);
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [userId]);

  // Format time (convert ms to hours and minutes)
  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "productive":
        return "bg-green-100 text-green-800";
      case "unproductive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
      
      <div className="overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-1">Application</th>
              <th className="text-left py-2 px-1">Duration</th>
              <th className="text-left py-2 px-1">Category</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity, index) => (
              <tr key={index} className="border-b">
                <td className="py-2 px-1">{activity.appName}</td>
                <td className="py-2 px-1">{formatTime(activity.duration)}</td>
                <td className="py-2 px-1">
                  <span className={`rounded-full px-2 py-1 text-xs ${getCategoryColor(activity.category)}`}>
                    {activity.category}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
