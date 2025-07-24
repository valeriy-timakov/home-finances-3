'use client';

import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import LocaleSwitcher from './LocaleSwitcher';
import ThemeSwitcher from './ui/ThemeSwitcher';

function UserIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="block">
      <circle cx="16" cy="16" r="16" fill="#E0E7EF" />
      <circle cx="16" cy="13" r="6" fill="#8AA4C8" />
      <ellipse cx="16" cy="24" rx="9" ry="5" fill="#B7C7DD" />
    </svg>
  );
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  const t = useTranslations('ClientLayout');
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  if (status === 'loading') {
    return <div>{t('loading')}</div>;
  }

  if (!session) {
    return (
      <main className="max-w-[900px] mx-auto my-10 p-6">{children}</main>
    );
  }

  const username = session.user?.name || session.user?.email || t('defaultUsername');

  return (
    <div className="min-h-screen bg-main">
      <header className="flex items-center justify-between px-8 py-3 bg-paper border-b border-border sticky top-0 z-10">
        <nav className="flex items-center gap-6">
          <Link
            href="/transactions"
            className="font-medium text-primary hover:text-primary-dark no-underline"
          >
            {t('transactionsLink')}
          </Link>
          <Link
            href="/accounts"
            className="font-medium text-primary hover:text-primary-dark no-underline"
          >
            {t('accountsLink')}
          </Link>
          <Link
            href="/categories"
            className="font-medium text-primary hover:text-primary-dark no-underline"
          >
            {t('categoriesLink')}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <LocaleSwitcher />
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-1 rounded-md"
              aria-label="User menu"
            >
              <UserIcon size={28} />
              <span className="font-medium">{username}</span>
            </button>
            {menuOpen && (
              <div className="absolute top-11 right-0 bg-paper border border-border rounded-lg shadow-lg z-20 min-w-[120px] p-2">
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full bg-transparent border-none py-2 px-2 text-left cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {t('signOutButton')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-[900px] mx-auto my-10 p-6">{children}</main>
    </div>
  );
}
