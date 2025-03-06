// 'use client';

// import { useEffect, useState } from 'react';
// import { Bar } from 'react-chartjs-2';
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// } from 'chart.js';

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend
// );

// type WeeklyProductivityChartProps = {
//   userId?: string;
// };

// type DailyData = {
//   date: string;
//   productiveTime: number;
//   totalTime: number;
// };

// export function WeeklyProductivityChart({ userId }: WeeklyProductivityChartProps) {
//   const [weeklyData, setWeeklyData] = useState<DailyData[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     async function fetchData() {
//       if (!userId) {
//         setLoading(false);
//         return;
//       }
      
//       try {
//         setLoading(true);
//         const response = await fetch(`/api/productivity/history?userId=${userId}&days=7`);
//         if (!response.ok) {
//           throw new Error('Failed to fetch weekly productivity data');
//         }
        
//         const data = await response.json();
//         setWeeklyData(data.history || []);
//       } catch (err) {
//         console.error('Error fetching weekly data:', err);
//         setError('Failed to load weekly productivity data');
//       } finally {
//         setLoading(false);
//       }
//     }
    
//     fetchData();
    
//     // Refresh data every hour
//     const intervalId = setInterval(fetchData, 60 * 60 * 1000);
    
//     return () => clearInterval(intervalId);
//   }, [userId]);

//   if (!userId) {
//     return (
//       <div className="bg-white shadow rounded-lg p-6 mt-6">
//         <h2 className="text-lg font-medium text-gray-900 mb-4">Weekly Productivity</h2>
//         <div className="text-center text-gray-500 py-8">
//           Sign in to see your weekly productivity data
//         </div>
//       </div>
//     );
//   }

//   if (loading) {
//     return (
//       <div className="bg-white shadow rounded-lg p-6 mt-6">
//         <h2 className="text-lg font-medium text-gray-900 mb-4">Weekly Productivity</h2>
//         <div className="flex justify-center items-center h-64">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="bg-white shadow rounded-lg p-6 mt-6">
//         <h2 className="text-lg font-medium text-gray-900 mb-4">Weekly Productivity</h2>
//         <div className="text-center text-red-500">{error}</div>
//       </div>
//     );
//   }

//   // Format data for chart
//   const dates = weeklyData.map(dataPoint => {
//     // Convert date format from DD-MM-YYYY to more readable format
//     const [dayStr, monthStr] = dataPoint.date.split('-');
//     return `${dayStr}/${monthStr}`;
//   });
  
//   const productiveMinutes = weeklyData.map(dataPoint => dataPoint.productiveTime);
  
//   // Format time for display
//   const formatTime = (minutes: number) => {
//     const hours = Math.floor(minutes / 60);
//     const mins = minutes % 60;
//     return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
//   };
  
//   // Data for bar chart
//   const data = {
//     labels: dates,
//     datasets: [
//       {
//         label: 'Productive Time',
//         data: productiveMinutes,
//         backgroundColor: 'rgba(54, 162, 235, 0.6)',
//         borderColor: 'rgba(54, 162, 235, 1)',
//         borderWidth: 1,
//       },
//     ],
//   };

//   const options = {
//     responsive: true,
//     plugins: {
//       legend: {
//         position: 'bottom' as const,
//       },
//       tooltip: {
//         callbacks: {
//           label: function(context: any) {
//             const label = context.dataset.label || '';
//             const value = context.raw || 0;
//             return `${label}: ${formatTime(value)}`;
//           }
//         }
//       }
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         ticks: {
//           callback: function(value: any) {
//             const hours = Math.floor(value / 60);
//             return hours > 0 ? `${hours}h` : `${value}m`;
//           }
//         },
//         title: {
//           display: true,
//           text: 'Time'
//         }
//       },
//       x: {
//         title: {
//           display: true,
//           text: 'Date'
//         }
//       }
//     },
//   };

//   // If no data yet
//   if (weeklyData.length === 0) {
//     return (
//       <div className="bg-white shadow rounded-lg p-6 mt-6">
//         <h2 className="text-lg font-medium text-gray-900 mb-4">Weekly Productivity</h2>
//         <div className="text-center text-gray-500 py-8">
//           No productivity data recorded this week
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white shadow rounded-lg p-6 mt-6">
//       <h2 className="text-lg font-medium text-gray-900 mb-4">Weekly Productivity</h2>
      
//       <div className="h-64 mt-4">
//         <Bar data={data} options={options} />
//       </div>
      
//       <div className="mt-4 text-center text-sm text-gray-500">
//         Last 7 days of productivity
//       </div>
//     </div>
//   );
// }