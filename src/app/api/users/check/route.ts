import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // Proxy the request to the Express server
    const serverUrl = 'https://racoon-server-kushagraagarwal-kushagraagarwals-projects.vercel.app';
    const url = new URL(`${serverUrl}/api/users/check`);
    
    if (userId) url.searchParams.set('userId', userId);
    
    const response = await fetch(url.toString());
    const data = await response.json();
    
    // Return the same response
    return NextResponse.json(data, { status: response.status });
    
  } catch (error) {
    console.error('Error proxying user check request:', error);
    return NextResponse.json({ error: 'Failed to check user' }, { status: 500 });
  }
}