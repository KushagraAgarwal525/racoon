import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get current date for the response
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;
    
    let productiveTime = 0;
    let totalTime = 0;
    
    // Query for documents where User reference matches our user ID
    const userRefPath = `users/${userId}`;
    const userRefSnapshot = await db.collection('daily')
      .where('User', '==', db.doc(userRefPath))
      .limit(1) // We only need one document
      .get();
    
    if (!userRefSnapshot.empty) {
      // Found document with User reference
      const data = userRefSnapshot.docs[0].data();
      productiveTime = data.productiveTime || 0;
      totalTime = data.totalTime || 0;
    } else {
      // Try fallback to userId field if no User reference found
      const userIdSnapshot = await db.collection('daily')
        .where('userId', '==', userId)
        .limit(1)
        .get();
        
      if (!userIdSnapshot.empty) {
        const data = userIdSnapshot.docs[0].data();
        productiveTime = data.productiveTime || 0;
        totalTime = data.totalTime || 0;
      }
    }
    
    return NextResponse.json({
      date: formattedDate,
      productiveTime,
      totalTime
    });
    
  } catch (error) {
    console.error('Error fetching today\'s productivity:', error);
    return NextResponse.json({ error: 'Failed to fetch productivity data' }, { status: 500 });
  }
}