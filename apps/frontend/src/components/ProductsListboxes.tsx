import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { useTranslations } from 'next-intl';
import styles from './ProductsListboxes.module.css';

interface Product {
  id: number;
  name: string;
  categoryId: number | null;
}

interface ProductsListboxesProps {
  selectedCategoryId: number | null;
}

export default function ProductsListboxes({ selectedCategoryId }: ProductsListboxesProps) {
  const t = useTranslations('CategoriesPage');
  const [productsInCategory, setProductsInCategory] = useState<Product[]>([]);
  const [productsNotInCategory, setProductsNotInCategory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      if (selectedCategoryId === null) {
        setProductsInCategory([]);
        setProductsNotInCategory([]);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Fetch products in the selected category
        const inCategoryResponse = await fetch(`/api/products/by-category?categoryId=${selectedCategoryId}`);
        if (!inCategoryResponse.ok) {
          throw new Error(t('errorFetchingProducts'));
        }
        const inCategoryData = await inCategoryResponse.json();
        
        // Fetch products not in the selected category
        const notInCategoryResponse = await fetch(`/api/products/not-in-category?categoryId=${selectedCategoryId}`);
        if (!notInCategoryResponse.ok) {
          throw new Error(t('errorFetchingProducts'));
        }
        const notInCategoryData = await notInCategoryResponse.json();
        
        setProductsInCategory(inCategoryData);
        setProductsNotInCategory(notInCategoryData);
      } catch (e: any) {
        setError(e.message || t('errorOccurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategoryId, t]);

  if (loading) {
    return <Spin />;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h3>{t('productsInCategory')}</h3>
        <div className={styles.listbox}>
          {productsInCategory.length === 0 ? (
            <p className={styles.emptyMessage}>{t('noProductsInCategory')}</p>
          ) : (
            productsInCategory.map(product => (
              <div key={product.id} className={styles.productItem}>
                {product.name}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className={styles.section}>
        <h3>{t('productsNotInCategory')}</h3>
        <div className={styles.listbox}>
          {productsNotInCategory.length === 0 ? (
            <p className={styles.emptyMessage}>{t('noOtherProducts')}</p>
          ) : (
            productsNotInCategory.map(product => (
              <div key={product.id} className={styles.productItem}>
                {product.name}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
