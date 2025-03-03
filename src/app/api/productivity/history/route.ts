import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params
    console.log("Fetching productivity history");
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const daysParam = searchParams.get('days');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Number of days to fetch (default: 7)
    const days = daysParam ? parseInt(daysParam, 10) : 7;
    
    // Generate past dates in DD-MM-YYYY format
    const dates = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      dates.push(`${day}-${month}-${year}`);
    }
    
    console.log("Looking for dates:", dates);
    
    // Create a map of date -> data for quick lookup
    const dateMap: Record<string, { productiveTime: number, totalTime: number }> = {};
    
    // Initialize with default values for all dates
    dates.forEach(date => {
      dateMap[date] = { productiveTime: 0, totalTime: 0 };
    });
    
    // Create a reference to the user document
    const userRef = db.doc(`users/${userId}`);
    
    // Query the history collection for this user and these dates
    // Note: Using "Date" with capital D to match the field name in Firestore
    const snapshot = await db.collection('history')
      .where('User', '==', userRef)
      .where('Date', 'in', dates)
      .get();
    
    console.log(`Found ${snapshot.size} history records for user ${userId}`);
    
    // Process the results
    for (const doc of snapshot.docs) {
      const data = doc.data();
      console.log("Document data:", data);
      
      // Use "Date" with capital D to match the field name in Firestore
      const date = data.Date;
      
      if (date && dates.includes(date)) {
        console.log(`Found data for date ${date}: productive=${data.productiveTime}, total=${data.totalTime}`);
        dateMap[date] = {
          productiveTime: data.productiveTime || 0,
          totalTime: data.totalTime || 0
        };
      } else {
        console.log(`Date not recognized: ${date}`);
      }
    }
    
    // Fallback to check for records using userId field
    if (snapshot.empty) {
      console.log("No records found with User reference, trying userId field");
      const fallbackSnapshot = await db.collection('history')
        .where('userId', '==', userId)
        .where('Date', 'in', dates)
        .get();
      
      console.log(`Fallback found ${fallbackSnapshot.size} records`);
        
      for (const doc of fallbackSnapshot.docs) {
        const data = doc.data();
        const date = data.Date;
        
        if (date && dates.includes(date)) {
          dateMap[date] = {
            productiveTime: data.productiveTime || 0,
            totalTime: data.totalTime || 0
          };
        }
      }
    }
    
    // Convert the map to an array of objects
    const history = dates.map(date => ({
      date,
      productiveTime: dateMap[date].productiveTime,
      totalTime: dateMap[date].totalTime
    }));
    
    // Sort by date (most recent first)
    history.sort((a, b) => {
      const dateA = a.date.split('-').reverse().join('-');
      const dateB = b.date.split('-').reverse().join('-');
      return dateA > dateB ? -1 : 1;
    });
    
    console.log("Returning history:", history);
    
    return NextResponse.json({
      history
    });
    
  } catch (error) {
    console.error('Error fetching productivity history:', error);
    return NextResponse.json({ error: 'Failed to fetch productivity history' }, { status: 500 });
  }
}