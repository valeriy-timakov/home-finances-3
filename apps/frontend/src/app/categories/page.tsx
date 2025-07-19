'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import CategoryTree from '../../components/CategoryTree';

export default function CategoriesPage() {
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
      fetch('/api/categories', { credentials: 'include' })
        .then(res => {
          if (!res.ok) {
            return Promise.reject('Помилка завантаження категорій');
          }
          return res.json();
        })
        .then(setCategories)
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
      <h2>Категорії</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <CategoryTree data={categories} />
    </div>
  );
}
