import { v4 as uuidv4 } from 'uuid';
import { pipe } from "@screenpipe/browser";
import { generateText } from "ai";
import { ollama } from "ollama-ai-provider";

// Base categories for certain apps that don't need AI analysis
const BASE_CATEGORIES: Record<string, 'productive' | 'unproductive'> = {
  'vscode': 'productive',
  'code': 'productive',
  'cursor': 'productive',
  'spotify': 'unproductive',
  'netflix': 'unproductive',
  'youtube': 'unproductive',
  'facebook': 'unproductive',
  'instagram': 'unproductive',
  'twitter': 'unproductive',
};

interface ActivityWithTimestamp {
  appName: string;
  windowName: string;
  timestamp: string;
  duration: number;
}

type ProductivityUpdate = {
  userId: string;
  taskId: string;
  timestamp: string;
  totalTime: number; // in minutes
  productiveTime: number; // in minutes
  categories?: Record<string, number>;
};

class ProductivityTracker {
  // Make userId accessible outside the class
  readonly userId: string;
  private updateInterval: NodeJS.Timeout | null = null;
  private lastProcessedTimestamp: string | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Start fetching data from Screenpipe and updating database
   */
  startTracking() {
    if (this.updateInterval) {
      return; // Already running
    }

    console.log(`Starting productivity data processing for user ${this.userId}...`);
    
    // Set the last processed timestamp to now
    this.lastProcessedTimestamp = new Date().toISOString();

    // Process and update every minute
    this.updateInterval = setInterval(() => {
      this.processAndUpdateProductivity();
    }, 60 * 1000); // Every minute

    // Run an initial processing immediately
    setTimeout(() => {
      this.processAndUpdateProductivity();
    }, 5000); // Wait 5 seconds before first run
  }

  /**
   * Stop the processing interval
   */
  stopTracking() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log(`Stopped productivity processing for user ${this.userId}`);
    }
  }

  /**
   * Process Screenpipe data and update database
   */
  private async processAndUpdateProductivity(): Promise<void> {
    try {
      // Define time range to process - last minute or since last processing
      const endTime = new Date();
      const startTime = this.lastProcessedTimestamp 
        ? new Date(this.lastProcessedTimestamp) 
        : new Date(endTime.getTime() - 60 * 1000); // Default to 1 minute ago
      
      // Don't process if the time span is too short (less than 10 seconds)
      if (endTime.getTime() - startTime.getTime() < 10000) {
        console.log("Skipping update - time span too short");
        return;
      }

      console.log(`Processing activity from ${startTime.toLocaleTimeString()} to ${endTime.toLocaleTimeString()}`);

      // Query Screenpipe for data in the specified time range
      const screenData = await pipe.queryScreenpipe({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        limit: 100, // Should be plenty for a minute
        contentType: 'ocr',
      });

      if (!screenData || screenData.data.length === 0) {
        console.log("No activity detected in the specified time range");
        // Update the last processed timestamp even if no data
        this.lastProcessedTimestamp = endTime.toISOString();
        return;
      }

      // Extract and format activities with timestamps
      const rawActivities: ActivityWithTimestamp[] = screenData.data
        .filter(item => 'type' in item && item.type === 'OCR')
        .map(item => {
          const content = item.content;
          if (typeof content === 'object' && content !== null) {
            return {
              appName: String(content.appName || 'unknown'),
              windowName: String(content.windowName || ''),
              timestamp: String(content.timestamp || new Date().toISOString()),
              duration: 60000  // Fixed 1-minute duration for aggregation
            };
          }
          return null;
        })
        .filter((item): item is ActivityWithTimestamp => item !== null);

      if (rawActivities.length === 0) {
        console.log("No valid activities found");
        this.lastProcessedTimestamp = endTime.toISOString();
        return;
      }

      // Aggregate activities by minute
      const aggregatedActivities = this.aggregateActivitiesByMinute(rawActivities);
      
      // Remove manual incrementation of totalMinutes and set after processing
      const categories: Record<string, number> = {};
      let productiveMinutes = 0;
      
      // Process each aggregated activity
      for (const activity of aggregatedActivities) {
        const category = await this.categorizeActivityWithAI(activity.appName, activity.windowName);

        if (category === 'productive') {
          productiveMinutes += 1;
        }
        
        // Track app usage for reporting
        categories[activity.appName] = (categories[activity.appName] || 0) + 1;
        
        console.log('\nProcessed Activity:');
        console.log(`Time: ${new Date(activity.timestamp).toLocaleTimeString()}`);
        console.log(`Application: ${activity.appName}`);
        console.log(`Window: ${activity.windowName}`);
        console.log(`Category: ${category}`);
      }

      // Set totalMinutes to the number of aggregated activities
      const totalMinutes = aggregatedActivities.length;
      
      // Only send update if we have data
      if (totalMinutes > 0) {
        console.log("POST1");
        const update: ProductivityUpdate = {
          userId: this.userId,
          taskId: uuidv4(), // Generate unique task ID
          timestamp: endTime.toISOString(),
          totalTime: totalMinutes,
          productiveTime: productiveMinutes,
          categories: categories
        };
        console.log("POST2");
        console.log(`Sending update: ${productiveMinutes}/${totalMinutes} minutes productive (${Math.round((productiveMinutes/totalMinutes)*100)}%)`);

        // Send the update to the server
        const updateResponse = await fetch('/api/productivity/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(update),
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(`Failed to send productivity update: ${errorData.error || updateResponse.statusText}`);
        }

        console.log(`Successfully updated productivity data`);
      } else {
        console.log("No activities to update");
      }

      // Update the last processed timestamp
      this.lastProcessedTimestamp = endTime.toISOString();

    } catch (error) {
      console.error('Error calculating and updating productivity:', error);
    }
  }

  /**
   * Helper function that aggregates activities by minute
   */
  private aggregateActivitiesByMinute(activities: ActivityWithTimestamp[]): ActivityWithTimestamp[] {
    const minuteMap = new Map<string, ActivityWithTimestamp>();

    // Sort activities by timestamp for chronological order
    const sortedActivities = [...activities].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (const activity of sortedActivities) {
      const minuteKey = this.getMinuteKey(activity.timestamp);
      const existing = minuteMap.get(minuteKey);

      // Replace existing activity if:
      // 1. No existing activity for this minute, or
      // 2. Current activity has longer duration, or
      // 3. Same duration but current activity is more recent
      if (!existing || 
          activity.duration > existing.duration || 
          (activity.duration === existing.duration && 
           new Date(activity.timestamp) > new Date(existing.timestamp))) {
        minuteMap.set(minuteKey, activity);
      }
    }

    return Array.from(minuteMap.values());
  }

  /**
   * Helper function to get a minute key from a timestamp
   */
  private getMinuteKey(timestamp: string): string {
    const date = new Date(timestamp);
    // Format: YYYY-MM-DD-HH-mm
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`;
  }

  /**
   * Categorize activity as productive or unproductive
   */
  private async categorizeActivityWithAI(appName: string, windowTitle: string): Promise<'productive' | 'unproductive'> {
    // Check base categories first
    const baseCategory = BASE_CATEGORIES[appName.toLowerCase()];
    if (baseCategory) {
      return baseCategory;
    }

    try {
      const provider = ollama("deepseek-r1:1.5b");
      
      const prompt = `Analyze if this computer activity is productive or unproductive.

      Context:
      - Application: ${appName}
      - Window Title: ${windowTitle}

      Guidelines for classification:
      - Productive: Work-related activities, learning, development, professional communication, research, writing, data analysis
      - Unproductive: Entertainment, social media (unless work-related), games, non-work browsing

      Consider:
      1. Is this activity contributing to work, learning, or personal development?
      2. Is this activity primarily for entertainment or leisure?
      3. For ambiguous cases (like browsers), use the window title to determine if it's work-related

      Respond with ONLY ONE of these exact words: "productive" or "unproductive".`;

      const response = await generateText({
        model: provider,
        messages: [{ role: "user", content: prompt }],
      });

      const fullResponse = response.text.trim().toLowerCase();
      const classifications = fullResponse.match(/(productive|unproductive)/g);
      const lastClassification = classifications ? classifications[classifications.length - 1] : null;
      
      return lastClassification === 'productive' ? 'productive' : 'unproductive';
    } catch (error) {
      console.warn('AI categorization failed:', error);
      
      // Fallback heuristic if AI fails
      const productiveKeywords = ['work', 'code', 'develop', 'research', 'study', 'learn', 
                                'write', 'edit', 'doc', 'sheet', 'slide', 'meet', 'chat'];
      
      const combinedText = `${appName.toLowerCase()} ${windowTitle.toLowerCase()}`;
      
      // Check if any productive keywords are present
      for (const keyword of productiveKeywords) {
        if (combinedText.includes(keyword)) {
          return 'productive';
        }
      }
      
      // Default to unproductive if we can't determine
      return 'unproductive';
    }
  }

  /**
   * Force an immediate update (useful for testing)
   */
  async forceUpdate(): Promise<void> {
    await this.processAndUpdateProductivity();
  }
}

// Singleton instance for easy access
let instance: ProductivityTracker | null = null;

/**
 * Initialize the productivity tracker for a specific user
 */
export function initProductivityTracker(userId: string) {
  if (!instance || instance.userId !== userId) {
    instance = new ProductivityTracker(userId);
  }
  return instance;
}

/**
 * Get the current productivity tracker instance
 */
export function getProductivityTracker() {
  return instance;
}