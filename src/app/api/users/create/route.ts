import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const userData = await request.json();
    
    // Proxy the request to the Express server
    const serverUrl = 'https://racoon-server-kushagraagarwal-kushagraagarwals-projects.vercel.app/';
    const response = await fetch(`${serverUrl}/api/users/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    // Return the same response
    const responseData = await response.json();
    return NextResponse.json(responseData, { status: response.status });
    
  } catch (error) {
    console.error('Error proxying user creation request:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}