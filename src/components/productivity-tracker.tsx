"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import productivityService from '../services/productivity-service';

export function ProductivityTracker() {
  const { data: session, status } = useSession();
  
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      // Start tracking when user is logged in, passing the user email as identifier
      productivityService.startTracking(session.user.email);
      
      // Stop tracking when component unmounts
      return () => {
        productivityService.stopTracking();
      };
    }
  }, [status, session]);
  
  // This is a utility component that doesn't render anything
  return null;
}
