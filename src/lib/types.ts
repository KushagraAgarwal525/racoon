import type { Settings as ScreenpipeAppSettings } from "@screenpipe/js";

export interface WorkLog {
  title: string;
  description: string;
  tags: string[];
  startTime: string;
  endTime: string;
}

export interface Contact {
  name: string;
  company?: string;
  lastInteraction: string;
  sentiment: number;
  topics: string[];
  nextSteps: string[];
}

export interface Intelligence {
  contacts: Contact[];
  insights: {
    followUps: string[];
    opportunities: string[];
  };
}

export interface Settings {
  prompt: string;
  vaultPath: string;
  logTimeWindow: number;
  logPageSize: number;
  logModel: string;
  analysisModel: string;
  analysisTimeWindow: number;
  deduplicationEnabled: boolean;
  screenpipeAppSettings: ScreenpipeAppSettings;
}

export interface ActivityEntry {
  appName: string;
  windowName: string;
  duration: number;  // in milliseconds
  category: 'productive' | 'unproductive';
  startTime: string;
  endTime: string;
}

export interface DailyProductivityReport {
  date: string;
  totalTime: number;  // total tracked time in milliseconds
  productiveTime: number;  // time spent on productive activities
  unproductiveTime: number;  // time spent on unproductive activities
  productivityScore: number;  // percentage of productive time (0-100)
  activities: ActivityEntry[];
  topApps: {
    appName: string;
    duration: number;
    category: 'productive' | 'unproductive';
  }[];
}
