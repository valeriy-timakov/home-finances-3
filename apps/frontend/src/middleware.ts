import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

// Створюємо middleware з необхідними налаштуваннями
const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'uk'],
  // Used when no locale matches
  defaultLocale: 'uk',
  localePrefix: 'always',
  localeDetection: true,
});

// Обгортаємо middleware для логування
export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log(`Middleware обробляє запит: ${request.url}, pathname: ${pathname}`);
  
  // Додаткове логування для відстеження шляхів та параметрів
  console.log('Segments:', pathname.split('/'));
  console.log('Search params:', request.nextUrl.searchParams.toString());
  
  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
