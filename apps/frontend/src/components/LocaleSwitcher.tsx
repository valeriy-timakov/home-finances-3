"use client";

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import React from 'react';
import { locales } from '../i18n';

export default function LocaleSwitcher() {
  const t = useTranslations('LocaleSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  // Remove the current locale from pathname
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}\//, '/');
  
  // Pick the next locale in the list (simple toggle for two locales)
  const currentIndex = locales.indexOf(locale as (typeof locales)[number]);
  const nextLocale = locales[(currentIndex + 1) % locales.length];

  const handleClick = () => {
    // Navigate to the same path but with the next locale
    router.push(`/${nextLocale}${pathWithoutLocale}`);
  };

  return (
    <button
      onClick={handleClick}
      style={{ 
        background: 'none', 
        border: '1px solid #e0e0e0', 
        cursor: 'pointer', 
        padding: '4px 8px', 
        borderRadius: 6,
        fontSize: 14,
        fontWeight: 500
      }}
      aria-label={t('changeLocale')}
    >
      {nextLocale.toUpperCase()}
    </button>
  );
}
