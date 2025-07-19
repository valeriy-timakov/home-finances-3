'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import AccountsTable from '../../components/AccountsTable';

export default function AccountsPage() {
  const { data: session, status } = useSession();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/');
    }

    if (status === 'authenticated') {
      setLoading(true);
      fetch('/api/accounts')
        .then(res => {
          if (!res.ok) {
            return Promise.reject('Помилка завантаження рахунків');
          }
          return res.json();
        })
        .then(setAccounts)
        .catch(e => setError(e.message || 'Сталася помилка'))
        .finally(() => setLoading(false));
    }
  }, [status]);

  if (status === 'loading' || loading) {
    return <div>Завантаження...</div>;
  }

  if (!session) {
    return null; // redirect in useEffect will handle this
  }

  return (
    <div>
      <h2>Рахунки</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <AccountsTable data={accounts} />
    </div>
  );
}
