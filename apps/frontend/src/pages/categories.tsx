import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import CategoryTree from '../components/CategoryTree';

export default function CategoriesPage() {
  const { data: session, status } = useSession();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      setLoading(true);
      fetch('/api/categories', { credentials: 'include' })
        .then(res => res.ok ? res.json() : Promise.reject('Помилка завантаження'))
        .then(setCategories)
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
      <h2>Категорії</h2>
      {loading && <div>Завантаження...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <CategoryTree data={categories} />
    </div>
  );
}
