import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const API_URL = process.env.API_URL;

if (!API_URL) {
  throw new Error('Environment variable API_URL is not defined');
}

export async function POST(request: NextRequest) {
  try {
    console.log('API route /api/products/update-category called');
    
    // Get the session to retrieve the token
    const session = await getServerSession(authOptions);
    console.log('Session exists:', !!session);
    const token = (session as any)?.sessionToken;
    console.log('Token exists:', !!token);

    if (!token) {
      console.error('No token available in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { productId, categoryId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Log the request details for debugging
    console.log(`Updating product ${productId} to category ${categoryId}`);

    // Forward the request to the backend API with the bearer token
    const response = await fetch(`${API_URL}/products/update-category`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, categoryId }),
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Error updating product category: ${errorData}`);
      return NextResponse.json(
        { error: 'Failed to update product category' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in update-category API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
