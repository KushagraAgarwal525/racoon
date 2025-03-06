import { pipe as screenpipe } from "@screenpipe/browser";

/**
 * Check if Screenpipe is properly initialized and available
 */
export function checkScreenpipeStatus(): { available: boolean; message: string } {
  if (typeof screenpipe === 'undefined' || !screenpipe) {
    return {
      available: false,
      message: "Screenpipe is not available. Make sure @screenpipe/browser is properly installed and imported."
    };
  }
  
  if (typeof screenpipe.queryScreenpipe !== 'function') {
    return {
      available: false,
      message: "Screenpipe is available but the queryScreenpipe method is missing or not a function."
    };
  }
  
  return {
    available: true,
    message: "Screenpipe is properly initialized and ready to use."
  };
}

/**
 * Try to initialize Screenpipe manually
 * This is a fallback in case automatic initialization fails
 */
export function initializeScreenpipe(): { success: boolean; message: string } {
  try {
    // Check if already available
    const status = checkScreenpipeStatus();
    if (status.available) {
      return { success: true, message: "Screenpipe was already initialized." };
    }
    
    // If this is running in a browser environment
    if (typeof window !== 'undefined') {
      console.log("Attempting to initialize Screenpipe manually...");
      // You might need to add more initialization logic here
      // depending on how Screenpipe needs to be set up
      
      // Check again after attempt
      const newStatus = checkScreenpipeStatus();
      return { 
        success: newStatus.available, 
        message: newStatus.available 
          ? "Successfully initialized Screenpipe."
          : "Failed to initialize Screenpipe manually." 
      };
    }
    
    return { 
      success: false, 
      message: "Cannot initialize Screenpipe in a non-browser environment." 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Error initializing Screenpipe: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}
