import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL;

if (!API_URL) {
  throw new Error('Environment variable API_URL is not defined');
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const token = (session as any)?.sessionToken;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all query parameters
  const searchParams = req.nextUrl.searchParams;
  
  // Build the backend URL with all query parameters
  const backendUrl = new URL(`${API_URL}/transactions`);
  
  // Copy all search parameters from the request to the backend URL
  searchParams.forEach((value, key) => {
    backendUrl.searchParams.append(key, value);
  });

  try {
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      return NextResponse.json(
        { error: 'Error fetching data from backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Error connecting to backend' },
      { status: 500 }
    );
  }
}
