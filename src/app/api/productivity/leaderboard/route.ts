import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Proxy the request to the Express server
    const serverUrl = 'https://racoon-server-kushagraagarwal-kushagraagarwals-projects.vercel.app/';
    const response = await fetch(`${serverUrl}/api/productivity/leaderboard`);
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
