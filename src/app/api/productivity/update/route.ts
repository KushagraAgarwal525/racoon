import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import firebase from 'firebase-admin';

type ScreenpipeData = {
  userId: string;
  taskId: string;  // Unique identifier for this task/session
  productiveTime: number;  // in minutes
  nonProductiveTime: number;  // in minutes
  timestamp: string;  // ISO string
  applicationName?: string;  // Optional: the app being used
  categories?: Record<string, number>;  // Optional: time spent in different categories
};

export async function POST(request: NextRequest) {
  try {
    const data = await request.json() as ScreenpipeData;
    
    // Validate required fields
    if (!data.userId || !data.taskId || typeof data.productiveTime !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get current date in DD-MM-YYYY format
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    // Create a reference to the user document
    const userRef = db.doc(`users/${data.userId}`);

    // Transaction to ensure atomic update
    const result = await db.runTransaction(async (transaction) => {
      // Check if this task has already been processed by looking for it in the 'tasks' collection
      const taskRef = db.collection('tasks').doc(data.taskId);
      const taskDoc = await transaction.get(taskRef);

      if (taskDoc.exists) {
        // Task already processed
        return { success: false, reason: 'Task already processed', updated: false };
      }

      // Read daily and history records
      const dailyRef = db.collection('daily').where('User', '==', userRef).limit(1);
      const dailySnapshot = await transaction.get(dailyRef);

      const historyRef = db.collection('history')
        .where('User', '==', userRef)
        .where('Date', '==', formattedDate)
        .limit(1);
      const historySnapshot = await transaction.get(historyRef);

      // Prepare updates
      const updates = [];

      // Update or create daily record
      if (!dailySnapshot.empty) {
        // Update existing daily record
        const dailyDocRef = dailySnapshot.docs[0].ref;
        const currentData = dailySnapshot.docs[0].data();
        
        // Update base fields
        const updateData: any = {
          User: userRef,  // Ensure the user reference is maintained
          productiveTime: (currentData.productiveTime || 0) + data.productiveTime,
          totalTime: (currentData.totalTime || 0) + data.productiveTime + (data.nonProductiveTime || 0),
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Update category data if provided
        if (data.categories) {
          const currentCategories = currentData.categories || {};
          const updatedCategories: Record<string, number> = { ...currentCategories };
          
          // Merge categories
          Object.entries(data.categories).forEach(([category, time]) => {
            updatedCategories[category] = (updatedCategories[category] || 0) + time;
          });
          
          updateData.categories = updatedCategories;
        }
        
        updates.push({ ref: dailyDocRef, data: updateData });
      } else {
        // Create a new daily record
        const newDailyDocRef = db.collection('daily').doc();
        const newDailyData: any = {
          User: userRef,  // Ensure the user reference is maintained
          Date: formattedDate,
          productiveTime: data.productiveTime,
          totalTime: data.productiveTime + (data.nonProductiveTime || 0),
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Add categories if available
        if (data.categories) {
          newDailyData.categories = data.categories;
        }
        
        updates.push({ ref: newDailyDocRef, data: newDailyData });
      }

      // Update or create history record
      if (!historySnapshot.empty) {
        // Update existing history record
        const historyDocRef = historySnapshot.docs[0].ref;
        const currentData = historySnapshot.docs[0].data();
        
        // Update base fields
        const updateData: any = {
          User: userRef,  // Ensure the user reference is maintained
          Date: formattedDate,  // Ensure the date is maintained as a string
          productiveTime: (currentData.productiveTime || 0) + data.productiveTime,
          totalTime: (currentData.totalTime || 0) + data.productiveTime + (data.nonProductiveTime || 0),
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Update category data if provided
        if (data.categories) {
          const currentCategories = currentData.categories || {};
          const updatedCategories: Record<string, number> = { ...currentCategories };
          
          // Merge categories
          Object.entries(data.categories).forEach(([category, time]) => {
            updatedCategories[category] = (updatedCategories[category] || 0) + time;
          });
          
          updateData.categories = updatedCategories;
        }
        
        updates.push({ ref: historyDocRef, data: updateData });
      } else {
        // Create a new history record
        const newHistoryDocRef = db.collection('history').doc();
        const newHistoryData: any = {
          User: userRef,  // Ensure the user reference is maintained
          Date: formattedDate,  // Ensure the date is maintained as a string
          productiveTime: data.productiveTime,
          totalTime: data.productiveTime + (data.nonProductiveTime || 0),
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Add categories if available
        if (data.categories) {
          newHistoryData.categories = data.categories;
        }
        
        updates.push({ ref: newHistoryDocRef, data: newHistoryData });
      }

      // Record this task to prevent duplicate processing
      const taskData: any = {
        userId: data.userId,
        processedAt: firebase.firestore.FieldValue.serverTimestamp(),
        application: data.applicationName || 'unknown',
        productiveTime: data.productiveTime,
        nonProductiveTime: data.nonProductiveTime || 0,
        timestamp: data.timestamp
      };
      
      // Store categories if available
      if (data.categories) {
        taskData.categories = data.categories;
      }
      
      updates.push({ ref: taskRef, data: taskData });

      // Perform all updates
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
      // Task already processed, return 200 but indicate no changes
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