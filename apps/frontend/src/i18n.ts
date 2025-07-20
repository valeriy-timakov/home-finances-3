import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

// Can be imported from a shared config
const locales = ['en', 'uk'];

export default getRequestConfig(async ({locale}) => {
  console.log('getRequestConfig locale:', locale);

  // Fallback to default locale when not provided or invalid
  if (!locale || !locales.includes(locale as any)) {
    console.warn('Unknown or missing locale, falling back to uk');
    locale = 'uk' as any;
  }

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
    locale
  };
});
