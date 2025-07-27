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

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/categories');
      if (!res.ok) {
        throw new Error(t('loadingError'));
      }
      const data = await res.json();
      setCategories(data);
    } catch (e: any) {
      setError(e.message || t('errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/');
    }

    if (status === 'authenticated') {
      fetchCategories();
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
      <CategoryTree 
        data={categories} 
        onCategoriesChange={fetchCategories} 
      />
    </div>
  );
}
