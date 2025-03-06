import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { userId, token } = data;
    
    if (!userId || !token) {
      return NextResponse.json(
        { error: 'User ID and token are required' },
        { status: 400 }
      );
    }
    
    // Proxy the request to the Express server
    const serverUrl = 'https://racoon-server-kushagraagarwal-kushagraagarwals-projects.vercel.app/';
    const response = await fetch(`${serverUrl}/api/auth/validate-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, token })
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    
    const responseData = await response.json();
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Error validating session:', error);
    return NextResponse.json(
      { error: 'Failed to validate session' },
      { status: 500 }
    );
  }
}
