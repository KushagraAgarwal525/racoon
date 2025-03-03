import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    
    // Validate required fields
    if (!userData.userId || !userData.displayName) {
      return NextResponse.json({ 
        error: 'User ID and display name are required' 
      }, { status: 400 });
    }
    
    // Create or update user in database
    await db.collection('users').doc(userData.userId).set({
      displayName: userData.displayName,
      email: userData.email || null,
      photoURL: userData.photoURL || null,
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Add any other default user properties here
      settings: {
        theme: 'light',
        notifications: true,
      }
    }, { merge: true });
    
    return NextResponse.json({ 
      success: true,
      message: 'User created successfully'
    });
    
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ 
      error: 'Failed to create user'
    }, { status: 500 });
  }
}