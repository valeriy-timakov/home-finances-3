import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL;

if (!API_URL) {
  throw new Error('Environment variable API_URL is not defined');
}

async function handler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const token = (session as any)?.sessionToken;

  // Видаляємо '/api/proxy' з початку шляху, щоб отримати чистий шлях до API бекенду
  const path = req.nextUrl.pathname.replace(/^\/api(\/proxy)?/, '');
  const backendUrl = `${API_URL}${path}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  // Видаляємо заголовок host, щоб уникнути проблем з DNS/SSL на бекенді
  headers.delete('host');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(backendUrl, {
      method: req.method,
      headers,
      body: req.body,
      // Важливо для обробки потоків даних
      duplex: 'half',
    });

    // Просто передаємо відповідь від бекенду назад клієнту
    return response;

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { message: 'Error proxying to backend' },
      { status: 500 },
    );
  }
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as DELETE,
  handler as PATCH,
};
