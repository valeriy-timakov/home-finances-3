import React, { useEffect, useState, useCallback } from 'react';
import { Spin, message } from 'antd';
import { useTranslations } from 'next-intl';
import styles from './ProductsListboxes.module.css';
import ConfirmationDialog from './ConfirmationDialog';
import { Category } from '../types/Category';

interface Product {
  id: number;
  name: string;
  categoryId: number | null;
}

interface ProductsListboxesProps {
  selectedCategory: Category | null;
  moveWithoutConfirmation?: boolean;
}

export default function ProductsListboxes({ 
  selectedCategory, 
  moveWithoutConfirmation = false 
}: ProductsListboxesProps) {
  const t = useTranslations('CategoriesPage');
  const [productsInCategory, setProductsInCategory] = useState<Product[]>([]);
  const [productsNotInCategory, setProductsNotInCategory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedProduct, setDraggedProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // State for confirmation dialog
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    productId: number;
    productName: string;
    sourceCategoryId: number | null;
    sourceCategoryName: string | null;
    targetCategoryId: number | null;
    targetCategoryName: string | null;
  } | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!selectedCategory) {
      setProductsInCategory([]);
      setProductsNotInCategory([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Fetch products in the selected category
      const inCategoryResponse = await fetch(`/api/products/by-category?categoryId=${selectedCategory.id}`);
      if (!inCategoryResponse.ok) {
        throw new Error(t('errorFetchingProducts'));
      }
      const inCategoryData = await inCategoryResponse.json();
      
      // Fetch products not in the selected category
      const notInCategoryResponse = await fetch(`/api/products/not-in-category?categoryId=${selectedCategory.id}`);
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
  }, [selectedCategory, t]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Fetch all categories to get full paths
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error(t('errorFetchingCategories'));
      }
      const data = await response.json();
      setCategories(data);
    } catch (e: any) {
      console.error('Error fetching categories:', e);
    }
  }, [t]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleDragStart = (product: Product) => (e: React.DragEvent<HTMLDivElement>) => {
    setDraggedProduct(product);
    e.dataTransfer.setData('application/json', JSON.stringify(product));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (targetCategory: Category | null) => async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (!draggedProduct) return;
    
    // If the product is already in the target category, do nothing
    if (draggedProduct.categoryId === targetCategory?.id) return;

    // Get full path string for the target category
    let targetCategoryName = '';
    if (targetCategory) {
      // Build full path from path array and category name
      const pathNames = targetCategory.path.map(cat => cat.name);
      targetCategoryName = [...pathNames, targetCategory.name].join(' / ');
    } else {
      targetCategoryName = t('noCategory');
    }

    // Get source category information
    let sourceCategoryName = '';
    if (draggedProduct.categoryId === null) {
      sourceCategoryName = t('noCategory');
    } else {
      // Find the source category in the categories list
      const sourceCategory = categories.find(cat => cat.id === draggedProduct.categoryId);
      if (sourceCategory) {
        // Build full path from source category
        const pathNames = sourceCategory.path.map(cat => cat.name);
        sourceCategoryName = [...pathNames, sourceCategory.name].join(' / ');
      } else {
        // Fallback if category not found
        sourceCategoryName = `${draggedProduct.categoryId}`;
      }
    }
    
    // Prepare confirmation data
    const confirmData = {
      productId: draggedProduct.id,
      productName: draggedProduct.name,
      sourceCategoryId: draggedProduct.categoryId,
      sourceCategoryName: sourceCategoryName,
      targetCategoryId: targetCategory?.id || null,
      targetCategoryName: targetCategoryName,
    };
    
    if (moveWithoutConfirmation) {
      // Skip confirmation and update directly
      await updateProductCategory(confirmData.productId, confirmData.targetCategoryId);
    } else {
      // Show confirmation dialog
      setConfirmationData(confirmData);
      setIsConfirmationModalVisible(true);
    }
  };

  const updateProductCategory = async (productId: number, categoryId: number | null) => {
    try {
      const response = await fetch('/api/products/update-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          categoryId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(t('errorUpdatingProduct'));
      }
      
      message.success(t('productCategoryUpdated'));
      fetchProducts(); // Refresh the product lists
    } catch (e: any) {
      message.error(e.message || t('errorOccurred'));
    } finally {
      setDraggedProduct(null);
    }
  };

  const handleConfirmMove = async () => {
    if (!confirmationData) return;
    
    await updateProductCategory(confirmationData.productId, confirmationData.targetCategoryId);
    setIsConfirmationModalVisible(false);
    setConfirmationData(null);
  };

  const handleCancelMove = () => {
    setIsConfirmationModalVisible(false);
    setConfirmationData(null);
    setDraggedProduct(null);
  };

  const handleDragEnd = () => {
    setDraggedProduct(null);
  };

  const getConfirmationMessage = () => {
    if (!confirmationData) return '';
    
    if (confirmationData.sourceCategoryId === null) {
      // Adding to a category
      return t.raw('confirmAddToCategory')
        .replace('{productName}', confirmationData.productName)
        .replace('{categoryName}', confirmationData.targetCategoryName || '');
    } else if (confirmationData.targetCategoryId === null) {
      // Removing from a category
      return t.raw('confirmRemoveFromCategory')
        .replace('{productName}', confirmationData.productName)
        .replace('{categoryName}', confirmationData.sourceCategoryName || '');
    } else {
      // Changing category
      return t.raw('confirmChangeCategory')
        .replace('{productName}', confirmationData.productName)
        .replace('{sourceCategory}', confirmationData.sourceCategoryName || '')
        .replace('{targetCategory}', confirmationData.targetCategoryName || '');
    }
  };

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
        <div 
          className={`${styles.listbox} ${styles.dropZone}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop(selectedCategory)}
          data-category-id={selectedCategory?.id}
        >
          {productsInCategory.length === 0 ? (
            <p className={styles.emptyMessage}>{t('noProductsInCategory')}</p>
          ) : (
            productsInCategory.map(product => (
              <div 
                key={product.id} 
                className={`${styles.productItem} ${styles.draggable}`}
                draggable
                onDragStart={handleDragStart(product)}
                onDragEnd={handleDragEnd}
                data-product-id={product.id}
              >
                {product.name}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className={styles.section}>
        <h3>{t('productsNotInCategory')}</h3>
        <div 
          className={`${styles.listbox} ${styles.dropZone}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop(null)}
          data-category-id="null"
        >
          {productsNotInCategory.length === 0 ? (
            <p className={styles.emptyMessage}>{t('noOtherProducts')}</p>
          ) : (
            productsNotInCategory.map(product => (
              <div 
                key={product.id} 
                className={`${styles.productItem} ${styles.draggable}`}
                draggable
                onDragStart={handleDragStart(product)}
                onDragEnd={handleDragEnd}
                data-product-id={product.id}
              >
                {product.name}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationDialog
        title={t('confirm')}
        text={getConfirmationMessage()}
        confirmLabel={t('yes')}
        rejectLabel={t('no')}
        isVisible={isConfirmationModalVisible}
        onConfirm={handleConfirmMove}
        onCancel={handleCancelMove}
      />
    </div>
  );
}
