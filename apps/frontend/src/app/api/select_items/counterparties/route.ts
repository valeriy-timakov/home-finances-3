import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL;

if (!API_URL) {
  throw new Error('Environment variable API_URL is not defined');
}

export async function GET(req: NextRequest) {
  console.log('API route /api/select_items/counterparties called');
  
  const session = await getServerSession(authOptions);
  console.log('Session exists:', !!session);
  const token = (session as any)?.sessionToken;
  console.log('Token exists:', !!token);

  if (!token) {
    console.error('No token available in session');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const backendUrl = new URL(`${API_URL}/accounts/counterparties/select-items`);
  
  console.log('Fetching counterparty select items from API URL:', backendUrl.toString());

  try {
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`);
    console.log('Authorization header set');

    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers,
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      return NextResponse.json(
        { error: 'Error fetching counterparty data from backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Received counterparty data from backend:', Array.isArray(data) ? `${data.length} items` : 'not an array');

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching counterparty data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch counterparty data' },
      { status: 500 }
    );
  }
}
