"use client";

import { useEffect } from "react";
import { initProductivityTracker, getProductivityTracker } from "@/lib/productivity-tracker";

interface ProductivityTrackerInitializerProps {
  userId: string;
}

export default function ProductivityTrackerInitializer({ userId }: ProductivityTrackerInitializerProps) {
  useEffect(() => {
    // Initialize and start tracking when component mounts (user logs in)
    if (userId) {
      console.log("User logged in, initializing productivity tracker");
      const tracker = initProductivityTracker(userId);
      tracker.startTracking();

      // Return cleanup function that stops tracking when component unmounts (user logs out)
      return () => {
        console.log("User logged out or navigated away, stopping productivity tracker");
        const currentTracker = getProductivityTracker();
        if (currentTracker) {
          currentTracker.stopTracking();
        }
      };
    }
  }, [userId]);

  // This component doesn't render anything
  return null;
}
