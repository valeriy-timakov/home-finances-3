'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import ExpensesTable from '../../../components/ExpensesTable';
import {useLocale, useTranslations} from 'next-intl';

export default function TransactionsPage() {
  const t = useTranslations('TransactionsPage');
  const { data: session, status } = useSession();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const locale = useLocale();

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect(`/${locale}`);
    }

    if (status === 'authenticated') {
      setLoading(true);
      fetch('/api/transactions')
        .then(res => {
          if (!res.ok) {
            return Promise.reject(t('loadingError'));
          }
          return res.json();
        })
        .then(setExpenses)
        .catch(e => setError(e.message || t('errorOccurred')))
        .finally(() => setLoading(false));
    }
  }, [status, t]);

  if (status === 'loading' || loading) {
    return <div>{t('loading')}</div>;
  }

  if (!session) {
    return null; // redirect in useEffect will handle this
  }

  return (
    <div>
      <h2>{t('title')}</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <ExpensesTable data={expenses} />
    </div>
  );
}
