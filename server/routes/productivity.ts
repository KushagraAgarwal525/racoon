import express from 'express';
import { db } from '../lib/firebase-admin';

const router = express.Router();

type ScreenpipeData = {
    userId: string;
    taskId: string;
    timestamp: string;
    totalTime: number; // in minutes
    productiveTime: number; // in minutes
    categories?: Record<string, number>;
};

router.post('/update', async (req, res) => {
  try {
    console.log(req.body);
    const data = req.body as ScreenpipeData;
    
    // Validate required fields
    if (!data.userId || !data.taskId || typeof data.productiveTime !== 'number') {
      return res.status(400).json({ error: 'Missing required fields' });
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
            totalTime: (currentData.totalTime || 0) + data.totalTime,
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
            console.log("empty")
          // Create a new daily record which resets values at GMT 0
          const newDailyDocRef = db.collection('daily').doc();
          const newDailyData: any = {
            User: userRef,
            Date: formattedDate,
            productiveTime: data.productiveTime,
            totalTime: data.totalTime,
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
            totalTime: (currentData.totalTime || 0) + data.totalTime,
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
            totalTime: data.totalTime,
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
            application: data.categories || 'unknown',
            productiveTime: data.productiveTime,
            totalTime: data.totalTime,
            timestamp: data.timestamp
        };
        
        updates.push({ ref: taskRef, data: taskData });

        // Apply all updates to Firestore
        for (const update of updates) {
          transaction.set(update.ref, update.data, { merge: true });
        }
        
        return { success: true, updated: true };
    });

    if (result.success) {
      return res.json({
        success: true, 
        message: 'Productivity data updated successfully'
      });
    } else {
      return res.json({
        success: true,
        message: result.reason || "Productivity data not updated",
        updated: false
      });
    }
  } catch (error) {
    console.error('Error updating productivity data:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/history', async (req, res) => {
    try {
        const { userId, days } = req.query;
        
        if (!userId) {
            return res.status(400).json({ error: 'Missing required userId parameter' });
        }

        // Default to 7 days if not specified
        const daysToFetch = days ? parseInt(days as string) : 7;
        
        if (isNaN(daysToFetch) || daysToFetch <= 0) {
            return res.status(400).json({ error: 'Invalid days parameter, must be a positive number' });
        }

        // Create a reference to the user document
        const userRef = db.doc(`users/${userId}`);

        // Generate an array of formatted dates for the last N days
        const dates = [];
        for (let i = 0; i < daysToFetch; i++) {
            const date = new Date();
            date.setUTCDate(date.getUTCDate() - i);
            const day = String(date.getUTCDate()).padStart(2, '0');
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const year = date.getUTCFullYear();
            dates.push(`${day}-${month}-${year}`);
        }

        // Query history collection for the specified dates
        const historyRef = db.collection('history')
            .where('User', '==', userRef)
            .where('Date', 'in', dates);
        
        const snapshot = await historyRef.get();
        
        const historyData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                date: data.Date,
                productiveTime: data.productiveTime || 0,
                totalTime: data.totalTime || 0,
                categories: data.categories || {},
                lastUpdated: data.lastUpdated ? data.lastUpdated.toDate() : null
            };
        });

        // Fill in missing dates with zero values
        const result = dates.map(date => {
            const existingData = historyData.find(item => item.date === date);
            if (existingData) {
                return existingData;
            }
            return {
                date,
                productiveTime: 0,
                totalTime: 0,
                categories: {},
                lastUpdated: null
            };
        });

        return res.json({
            success: true,
            history: result
        });
    } catch (error) {
        console.error('Error fetching productivity history:', error);
        return res.status(500).json({ 
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});



router.get('/leaderboard', async (req, res) => {
    try {
        // Get current date in DD-MM-YYYY format based on UTC
        const today = new Date();
        const utcDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        const day = String(utcDate.getUTCDate()).padStart(2, '0');
        const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
        const year = utcDate.getUTCFullYear();
        const formattedDate = `${day}-${month}-${year}`;

        // Option 1: First get all documents for today's date, then sort in memory
        // This avoids the need for a composite index
        const dailyRef = db.collection('daily')
            .where('Date', '==', formattedDate);
        
        const snapshot = await dailyRef.get();
        
        // Sort documents by productiveTime in descending order and take top 10
        const sortedDocs = snapshot.docs
            .sort((a, b) => (b.data().productiveTime || 0) - (a.data().productiveTime || 0))
            .slice(0, 10);
        const leaderboardData = await Promise.all(sortedDocs.map(async doc => {
            const data = doc.data();
            
            // Get user details
            let username = 'Anonymous';
            let email = '';
            
            if (data.User) {
                try {
                    const userDoc = await data.User.get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        username = userData.name || userData.displayName || 'Anonymous';
                        email = userData.email || '';
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            }
            
            return {
                username,
                email,
                productiveTime: data.productiveTime || 0,
                totalTime: data.totalTime || 0,
            };
        }));

        return res.json({
            success: true,
            date: formattedDate,
            leaderboard: leaderboardData
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return res.status(500).json({ 
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;


























