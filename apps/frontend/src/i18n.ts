import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

// Can be imported from a shared config
export const locales = ['en', 'uk'] as const;
export const defaultLocale = 'uk';

export default getRequestConfig(async ({locale}) => {
  console.log('getRequestConfig param locale:', locale);
  const resolvedLocale = (locale ?? defaultLocale) as (typeof locales)[number];
  console.log('getRequestConfig locale:', resolvedLocale);

  // Validate locale
  if (!locales.includes(resolvedLocale as any)) notFound();

  return {
    locale: resolvedLocale,
    messages: (await import(`../messages/${resolvedLocale}.json`)).default
  };
});
