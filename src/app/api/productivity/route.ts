import { NextResponse } from "next/server";
import { pipe } from "@screenpipe/js";
import { ActivityEntry, DailyProductivityReport } from "@/lib/types";
import { generateText, generateObject } from "ai";
import { ollama } from "ollama-ai-provider";

// Base categories for certain apps that don't need AI analysis
const BASE_CATEGORIES: Record<string, 'productive' | 'neutral' | 'unproductive'> = {
  'vscode': 'productive',
  'netflix': 'unproductive',
};

async function categorizeActivityWithAI(appName: string, windowTitle: string): Promise<'productive' | 'neutral' | 'unproductive'> {
  // Check base categories first
  const baseCategory = BASE_CATEGORIES[appName.toLowerCase()];
  if (baseCategory) {
    return baseCategory;
  }

  const provider = ollama("deepseek-r1:1.5b");
  
  const prompt = `Analyze if this computer activity is productive, unproductive, or neutral.

Context:
- Application: ${appName}
- Window Title: ${windowTitle}

Guidelines for classification:
- Productive: Work-related, learning, development, professional communication
- Unproductive: Entertainment, social media (unless work-related), games
- Neutral: Email, general browsing, mixed-use applications

Respond with ONLY ONE of these exact words: "productive", "unproductive", or "neutral".`;

  try {
    const response = await generateText({
      model: provider,
      messages: [{ role: "user", content: prompt }],
    });

    const classification = response.text.trim().toLowerCase();
    
    if (classification === 'productive' || classification === 'unproductive' || classification === 'neutral') {
      return classification;
    }
    
    // Default to neutral if AI response is not one of the expected values
    return 'neutral';
  } catch (error) {
    console.warn('AI categorization failed:', error);
    return 'neutral';
  }
}

function aggregateActivities(activities: ActivityEntry[]): DailyProductivityReport {
  const totalTime = activities.reduce((sum, activity) => sum + activity.duration, 0);
  const productiveTime = activities
    .filter(activity => activity.category === 'productive')
    .reduce((sum, activity) => sum + activity.duration, 0);
  const unproductiveTime = activities
    .filter(activity => activity.category === 'unproductive')
    .reduce((sum, activity) => sum + activity.duration, 0);
  const neutralTime = totalTime - productiveTime - unproductiveTime;

  // Calculate productivity score (0-100)
  const productivityScore = Math.round((productiveTime / totalTime) * 100);

  // Aggregate app usage
  const appUsage = new Map<string, { duration: number; category: 'productive' | 'neutral' | 'unproductive' }>();
  activities.forEach(activity => {
    const existing = appUsage.get(activity.appName) || { duration: 0, category: activity.category };
    existing.duration += activity.duration;
    appUsage.set(activity.appName, existing);
  });

  // Sort apps by duration
  const topApps = Array.from(appUsage.entries())
    .map(([appName, { duration, category }]) => ({ appName, duration, category }))
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10);

  return {
    date: new Date().toISOString().split('T')[0],
    totalTime,
    productiveTime,
    unproductiveTime,
    neutralTime,
    productivityScore,
    activities,
    topApps,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    // Get start and end of the requested date
    const startTime = new Date(date);
    startTime.setHours(0, 0, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(23, 59, 59, 999);

    // Query Screenpipe for the day's activity data
    const screenData = await pipe.queryScreenpipe({
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      limit: 1000,  // Increased limit to get more data points
      contentType: 'all',
    });

    if (!screenData || screenData.data.length === 0) {
      return NextResponse.json({ message: "No activity detected for the specified date" });
    }

    // Process the screen data into activity entries
    const activities: ActivityEntry[] = [];
    
    for (const item of screenData.data) {
      let appName = 'unknown';
      let windowName = '';
      let timestamp = new Date().toISOString();

      if ('type' in item && item.type === 'OCR') {
        const content = item.content;
        if (typeof content === 'object' && content !== null) {
          appName = String(content.appName || 'unknown');
          windowName = String(content.windowName || '');
          timestamp = String(content.timestamp || new Date().toISOString());
        }
      }

      const category = await categorizeActivityWithAI(appName, windowName);
      
      activities.push({
        appName,
        windowName,
        duration: 300000, // Each entry represents 5 minutes (300,000 ms)
        category,
        startTime: timestamp,
        endTime: timestamp,
      });
    }

    // Generate the productivity report
    const report = aggregateActivities(activities);

    return NextResponse.json({
      message: "Productivity analysis completed successfully",
      report,
    });
  } catch (error) {
    console.error("Error in productivity analysis:", error);
    return NextResponse.json(
      { error: `Failed to analyze productivity: ${error}` },
      { status: 500 }
    );
  }
} 