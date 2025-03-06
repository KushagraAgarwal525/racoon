import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const days = searchParams.get('days') || '7';
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Proxy the request to the Express server
    const serverUrl = 'https://racoon-server-kushagraagarwal-kushagraagarwals-projects.vercel.app/';
    const response = await fetch(
      `${serverUrl}/api/productivity/history?userId=${userId}&days=${days}`
    );
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error fetching productivity history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch productivity history' },
      { status: 500 }
    );
  }
}