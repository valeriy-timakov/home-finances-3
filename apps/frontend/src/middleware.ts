import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

// Available locales
const locales = ['en', 'uk'] as const;
const defaultLocale = 'uk';

// Function to detect the locale from the Accept-Language header
function getLocale(request: NextRequest): string {
  const headers = { 'accept-language': request.headers.get('accept-language') || '' };
  console.log(`Locale header: ${request.headers.get('accept-language')}`);
  const languages = new Negotiator({ headers }).languages();
  console.log(`Language from header: ${languages}`);
  
  try {
    return match(languages, Array.from(locales), defaultLocale);
  } catch (e) {
    return defaultLocale;
  }
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`Middleware processing request: ${request.url}, pathname: ${pathname}`);

  // Check if the pathname is missing a locale
  const pathnameIsMissingLocale = locales.every(
    (locale) => 
      !pathname.startsWith(`/${locale}/`) && 
      pathname !== `/${locale}`
  );

  // Redirect to the detected locale if it's missing
  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);
    console.log(`Detected locale: ${locale}, redirecting to: /${locale}${pathname}`);
    
    // Create new URL with locale
    const url = new URL(`/${locale}${pathname}`, request.url);
    // Preserve query parameters
    if (request.nextUrl.search) {
      url.search = request.nextUrl.search;
    }
    
    return NextResponse.redirect(url);
  }

  // Let next-intl handle the request if locale is present
  return createIntlMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'always',
    localeDetection: true,
  })(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
