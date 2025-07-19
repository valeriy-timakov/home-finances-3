import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AccountsTable from '../components/AccountsTable';

export default function AccountsPage() {
  const { data: session, status } = useSession();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      setLoading(true);
      fetch('/api/accounts', { credentials: 'include' })
        .then(res => res.ok ? res.json() : Promise.reject('Помилка завантаження'))
        .then(setAccounts)
        .catch(e => setError(typeof e === 'string' ? e : e.message))
        .finally(() => setLoading(false));
    }
  }, [status]);

  if (status === 'loading') return <div>Завантаження...</div>;
  if (!session) {
    router.replace('/');
    return null;
  }

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      <h2>Рахунки</h2>
      {loading && <div>Завантаження...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <AccountsTable data={accounts} />
    </div>
  );
}
