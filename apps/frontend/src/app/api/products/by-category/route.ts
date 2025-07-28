import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL;

if (!API_URL) {
  throw new Error('Environment variable API_URL is not defined');
}

export async function GET(req: NextRequest) {
  console.log('API route /api/products/by-category called');
  
  const session = await getServerSession(authOptions);
  console.log('Session exists:', !!session);
  const token = (session as any)?.sessionToken;
  console.log('Token exists:', !!token);

  if (!token) {
    console.error('No token available in session');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('categoryId');
  
  const backendUrl = new URL(`${API_URL}/products/by-category`);
  if (categoryId) {
    backendUrl.searchParams.append('categoryId', categoryId);
  }
  
  console.log('Fetching products by category from API URL:', backendUrl.toString());

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
        { error: 'Error fetching product data from backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Received product data from backend:', Array.isArray(data) ? `${data.length} items` : 'not an array');
    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Error connecting to backend' },
      { status: 500 }
    );
  }
}
