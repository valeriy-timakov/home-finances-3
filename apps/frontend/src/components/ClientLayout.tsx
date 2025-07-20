'use client';

import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';

function UserIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
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
    return <main style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>{children}</main>;
  }

  const username = session?.user?.name || session?.user?.email || t('defaultUsername');

  return (
    <div>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 32px', background: '#f7fafd', borderBottom: '1px solid #e0e0e0',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/transactions" style={{ fontWeight: 500, color: '#222', textDecoration: 'none' }}>{t('transactionsLink')}</Link>
          <Link href="/accounts" style={{ fontWeight: 500, color: '#222', textDecoration: 'none' }}>{t('accountsLink')}</Link>
          <Link href="/categories" style={{ fontWeight: 500, color: '#222', textDecoration: 'none' }}>{t('categoriesLink')}</Link>
        </nav>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6 }}
            aria-label="User menu"
          >
            <UserIcon size={28} />
            <span style={{ fontWeight: 500 }}>{username}</span>
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', top: 44, right: 0, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.10)', zIndex: 100, minWidth: 120, padding: 8
            }}>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                style={{ width: '100%', background: 'none', border: 'none', padding: 8, textAlign: 'left', cursor: 'pointer', borderRadius: 4 }}
              >
                {t('signOutButton')}
              </button>
            </div>
          )}
        </div>
      </header>
      <main style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>{children}</main>
    </div>
  );
}
