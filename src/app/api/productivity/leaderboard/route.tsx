import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || undefined;
    
    // Get top 10 users for today
    const snapshot = await db.collection('daily')
      .orderBy('productiveTime', 'desc')
      .limit(10)
      .get();
    
    // Transform to the format we need
    const leaderboard = await Promise.all(snapshot.docs.map(async (doc, index) => {
      const data = doc.data();
      
      // Default values
      let displayName = `User ${index + 1}`;
      let photoURL = '';
      let userDocId = '';
      
      try {
        // Check if we have a reference to a user document
        if (data.User && typeof data.User.path === 'string') {
          // Extract the user document ID from the reference path
          // Format: "users/USER_ID"
          const pathParts = data.User.path.split('/');
          userDocId = pathParts[pathParts.length - 1];
          
          console.log(`Found user reference with ID: ${userDocId}`);
          
          // Get user details from users collection using the reference
          const userDoc = await db.collection('users').doc(userDocId).get();
          
          if (userDoc.exists) {
            const userData = userDoc.data();
            console.log(`User data for ${userDocId}:`, userData);
            
            if (userData?.displayName) {
              displayName = userData.displayName;
            }
            
            if (userData?.photoURL) {
              photoURL = userData.photoURL;
            }
          } else {
            console.log(`No user document found for referenced ID: ${userDocId}`);
          }
        } else if (data.userId) {
          // Fallback to direct userId if it exists
          userDocId = data.userId;
          console.log(`Using direct userId: ${userDocId}`);
          
          const userDoc = await db.collection('users').doc(userDocId).get();
          
          if (userDoc.exists) {
            const userData = userDoc.data();
            displayName = userData?.displayName || displayName;
            photoURL = userData?.photoURL || '';
          }
        } else {
          console.log(`No user reference or ID found in daily record:`, data);
        }
      } catch (error) {
        console.error(`Error fetching user details:`, error);
      }
      
      return {
        userId: userDocId || `unknown-${index}`,
        displayName,
        photoURL,
        productiveTime: data.productiveTime || 0,
        totalTime: data.totalTime || 0,
      };
    }));
    
    // If userId is provided, get user's rank if not in top 10
    let userRank = null;
    if (userId && !leaderboard.some(entry => entry.userId === userId)) {
      // Get all records to calculate rank
      const allRecords = await db.collection('daily')
        .orderBy('productiveTime', 'desc')
        .get();
      
      // Find user's position and data
      const userIndex = allRecords.docs.findIndex((doc) => {
        const data = doc.data();
        
        // Check if we have a reference to a user document
        if (data.User && typeof data.User.path === 'string') {
          // Extract the user document ID from the reference path
          const pathParts = data.User.path.split('/');
          const refUserId = pathParts[pathParts.length - 1];
          return refUserId === userId;
        }
        
        // Fallback to direct userId if it exists
        return data.userId === userId;
      });
      
      if (userIndex !== -1) {
        const userData = allRecords.docs[userIndex].data();
        
        // Get user details
        let displayName = 'You';
        let photoURL = '';
        
        try {
          const userDoc = await db.collection('users').doc(userId).get();
          if (userDoc.exists) {
            const userDetails = userDoc.data();
            if (userDetails?.displayName) {
              displayName = userDetails.displayName;
            }
            
            if (userDetails?.photoURL) {
              photoURL = userDetails.photoURL;
            }
          }
        } catch (error) {
          console.error(`Error fetching user rank details for ${userId}:`, error);
        }
        
        userRank = {
          userId,
          displayName,
          photoURL,
          productiveTime: userData.productiveTime || 0,
          totalTime: userData.totalTime || 0,
          rank: userIndex + 1
        };
      }
    }
    
    return NextResponse.json({ 
      leaderboard,
      userRank
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}