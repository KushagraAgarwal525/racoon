// "use client";

// import { DailyProductivityReport } from "@/lib/types";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Doughnut } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   ArcElement,
//   Tooltip,
//   Legend,
//   ChartData,
// } from "chart.js";

// ChartJS.register(ArcElement, Tooltip, Legend);

// export function ProductivityChart({
//   report,
// }: {
//   report: DailyProductivityReport;
// }) {
//   const data: ChartData<"doughnut"> = {
//     labels: ["Productive", "Neutral", "Unproductive"],
//     datasets: [
//       {
//         data: [
//           report.productiveTime,
//           report.neutralTime,
//           report.unproductiveTime,
//         ],
//         backgroundColor: [
//           "rgba(34, 197, 94, 0.8)", // green
//           "rgba(234, 179, 8, 0.8)",  // yellow
//           "rgba(239, 68, 68, 0.8)",  // red
//         ],
//         borderColor: [
//           "rgba(34, 197, 94, 1)",
//           "rgba(234, 179, 8, 1)",
//           "rgba(239, 68, 68, 1)",
//         ],
//         borderWidth: 1,
//       },
//     ],
//   };

//   const formatDuration = (ms: number) => {
//     const hours = Math.floor(ms / (1000 * 60 * 60));
//     const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
//     return `${hours}h ${minutes}m`;
//   };

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Daily Productivity Overview</CardTitle>
//       </CardHeader>
//       <CardContent className="flex flex-col items-center space-y-4">
//         <div className="w-64 h-64">
//           <Doughnut
//             data={data}
//             options={{
//               cutout: "70%",
//               plugins: {
//                 legend: {
//                   position: "bottom",
//                 },
//               },
//             }}
//           />
//         </div>
//         <div className="text-center space-y-2">
//           <p className="text-lg font-semibold">
//             Productivity Score: {report.productivityScore}%
//           </p>
//           <p className="text-sm text-muted-foreground">
//             Total Time: {formatDuration(report.totalTime)}
//           </p>
//         </div>
//       </CardContent>
//     </Card>
//   );
// } 