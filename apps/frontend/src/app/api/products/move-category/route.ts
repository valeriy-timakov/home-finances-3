import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const API_URL = process.env.API_URL;

if (!API_URL) {
  throw new Error('Environment variable API_URL is not defined');
}

export async function POST(request: NextRequest) {
  try {
    console.log('API route /api/products/move-category called');
    
    const session = await getServerSession(authOptions);
    console.log('Session exists:', !!session);
    const token = (session as any)?.sessionToken;
    console.log('Token exists:', !!token);

    if (!token) {
      console.error('No token available in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate request body
    if (!body.sourceCategoryId) {
      return NextResponse.json(
        { message: 'Source category ID is required' },
        { status: 400 }
      );
    }
    
    console.log('Moving products from category:', body.sourceCategoryId, 'to category:', body.targetCategoryId);
    
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', `Bearer ${token}`);
    console.log('Authorization header set');
    
    const response = await fetch(`${API_URL}/products/move-category`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sourceCategoryId: body.sourceCategoryId,
        targetCategoryId: body.targetCategoryId,
      }),
    });
    
    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      return NextResponse.json(
        { error: 'Error moving products between categories' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('Products moved successfully:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error moving products:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
