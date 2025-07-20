'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import CategoryTree from '../../../components/CategoryTree';
import {useTranslations} from 'next-intl';

export default function CategoriesPage() {
  const t = useTranslations('CategoriesPage');
  const { data: session, status } = useSession();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/');
    }

    if (status === 'authenticated') {
      setLoading(true);
      fetch('/api/categories')
        .then(res => {
          if (!res.ok) {
            return Promise.reject(t('loadingError'));
          }
          return res.json();
        })
        .then(setCategories)
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
      <CategoryTree data={categories} />
    </div>
  );
}
