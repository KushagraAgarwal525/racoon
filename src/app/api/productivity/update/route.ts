import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import firebase from 'firebase-admin';

type ScreenpipeData = {
  userId: string;
  taskId: string;
  productiveTime: number;
  nonProductiveTime: number;
  timestamp: string;
  applicationName?: string;
  categories?: Record<string, number>;
};

export async function POST(request: NextRequest) {
  try {
    const data = await request.json() as ScreenpipeData;
    
    // Validate required fields
    if (!data.userId || !data.taskId || typeof data.productiveTime !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get current date in DD-MM-YYYY format based on UTC (resets every GMT 0)
    const today = new Date();
    const utcDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const day = String(utcDate.getUTCDate()).padStart(2, '0');
    const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
    const year = utcDate.getUTCFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    // Compute current GMT 0 timestamp for lastUpdated field
    const now = new Date();
    const gmtNow = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
      now.getUTCMilliseconds()
    ));

    // Create a reference to the user document
    const userRef = db.doc(`users/${data.userId}`);

    // Transaction to ensure atomic update
    const result = await db.runTransaction(async (transaction) => {
      // Check if this task has already been processed
      const taskRef = db.collection('tasks').doc(data.taskId);
      const taskDoc = await transaction.get(taskRef);

      if (taskDoc.exists) {
        return { success: false, reason: 'Task already processed', updated: false };
      }

      // Read daily and history records for the current UTC date
      const dailyRef = db.collection('daily')
        .where('User', '==', userRef)
        .where('Date', '==', formattedDate)
        .limit(1);
      const dailySnapshot = await transaction.get(dailyRef);

      const historyRef = db.collection('history')
        .where('User', '==', userRef)
        .where('Date', '==', formattedDate)
        .limit(1);
      const historySnapshot = await transaction.get(historyRef);

      // Prepare updates array
      const updates = [];

      // Update or create daily record (fields match sample: categories, productiveTime, totalTime, lastUpdated)
      if (!dailySnapshot.empty) {
        const dailyDocRef = dailySnapshot.docs[0].ref;
        const currentData = dailySnapshot.docs[0].data();
        
        const updateData: any = {
          User: userRef,
          Date: formattedDate,
          productiveTime: (currentData.productiveTime || 0) + data.productiveTime,
          totalTime: (currentData.totalTime || 0) + data.productiveTime + (data.nonProductiveTime || 0),
          lastUpdated: gmtNow
        };
        
        if (data.categories) {
          const currentCategories = currentData.categories || {};
          const updatedCategories: Record<string, number> = { ...currentCategories };
          
          Object.entries(data.categories).forEach(([category, time]) => {
            updatedCategories[category] = (updatedCategories[category] || 0) + time;
          });
          
          updateData.categories = updatedCategories;
        }
        
        updates.push({ ref: dailyDocRef, data: updateData });
      } else {
        // Create a new daily record which resets values at GMT 0
        const newDailyDocRef = db.collection('daily').doc();
        const newDailyData: any = {
          User: userRef,
          Date: formattedDate,
          productiveTime: data.productiveTime,
          totalTime: data.productiveTime + (data.nonProductiveTime || 0),
          lastUpdated: gmtNow
        };
        
        if (data.categories) {
          newDailyData.categories = data.categories;
        }
        
        updates.push({ ref: newDailyDocRef, data: newDailyData });
      }

      // Handle history record (accumulating across days)
      if (!historySnapshot.empty) {
        const historyDocRef = historySnapshot.docs[0].ref;
        const currentData = historySnapshot.docs[0].data();
        
        const updateData: any = {
          User: userRef,
          Date: formattedDate,
          productiveTime: (currentData.productiveTime || 0) + data.productiveTime,
          totalTime: (currentData.totalTime || 0) + data.productiveTime + (data.nonProductiveTime || 0),
          lastUpdated: gmtNow
        };
        
        if (data.categories) {
          const currentCategories = currentData.categories || {};
          const updatedCategories: Record<string, number> = { ...currentCategories };
          
          Object.entries(data.categories).forEach(([category, time]) => {
            updatedCategories[category] = (updatedCategories[category] || 0) + time;
          });
          
          updateData.categories = updatedCategories;
        }
        
        updates.push({ ref: historyDocRef, data: updateData });
      } else {
        const newHistoryDocRef = db.collection('history').doc();
        const newHistoryData: any = {
          User: userRef,
          Date: formattedDate,
          productiveTime: data.productiveTime,
          totalTime: data.productiveTime + (data.nonProductiveTime || 0),
          lastUpdated: gmtNow
        };
        
        if (data.categories) {
          newHistoryData.categories = data.categories;
        }
        
        updates.push({ ref: newHistoryDocRef, data: newHistoryData });
      }

      // Record task to prevent duplicate processing
      const taskData: any = {
        userId: data.userId,
        processedAt: gmtNow,
        application: data.applicationName || 'unknown',
        productiveTime: data.productiveTime,
        nonProductiveTime: data.nonProductiveTime || 0,
        timestamp: data.timestamp
      };
      
      if (data.categories) {
        taskData.categories = data.categories;
      }
      
      updates.push({ ref: taskRef, data: taskData });

      // Apply all updates in transaction
      updates.forEach(update => {
        transaction.set(update.ref, update.data);
      });

      return { success: true, updated: true };
    });

    if (result.success) {
      return NextResponse.json({
        success: true, 
        message: 'Productivity data updated successfully'
      });
    } else {
      return NextResponse.json({
        success: true,
        message: result.reason,
        updated: false
      });
    }
  } catch (error) {
    console.error('Error updating productivity data:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}