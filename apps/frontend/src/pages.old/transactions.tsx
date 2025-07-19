import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import ExpensesTable from '../components/ExpensesTable';

export default function TransactionsPage() {
  const { data: session, status } = useSession();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      setLoading(true);
      fetch('/api/transactions', { credentials: 'include' })
        .then(res => res.ok ? res.json() : Promise.reject('Помилка завантаження'))
        .then(setExpenses)
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
      <h2>Транзакції</h2>
      {loading && <div>Завантаження...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <ExpensesTable data={expenses} />
    </div>
  );
}
