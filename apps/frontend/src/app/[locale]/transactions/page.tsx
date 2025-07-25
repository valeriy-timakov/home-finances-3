'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter, useSearchParams } from 'next/navigation';
import ExpensesTable from '../../../components/ExpensesTable';
import { useLocale, useTranslations } from 'next-intl';
import { TransactionDto } from '../../../types/transactions';

// Define the filter state type
type FilterState = {
  dateFrom: string;
  dateTo: string;
  searchText: string;
  category: string[];
  account: string;
  counterparty: string;
  productName: string[];
};

export default function TransactionsPage() {
  const t = useTranslations('TransactionsPage');
  const { data: session, status } = useSession();
  const [expenses, setExpenses] = useState<TransactionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get current filters from URL parameters - this will update on URL change
  const currentFilters: FilterState = {
    dateFrom: searchParams.get('startDate') || '',
    dateTo: searchParams.get('endDate') || '',
    searchText: searchParams.get('searchText') || '',
    account: searchParams.get('accountId') || '',
    counterparty: searchParams.get('counterpartyId') || '',
    category: searchParams.getAll('categoryIds'),
    productName: searchParams.getAll('productNames'),
  };
  
  // Function to update URL with filter parameters
  const updateUrlWithFilters = useCallback((filters: FilterState) => {
    const params = new URLSearchParams();
    
    // Add filter parameters to URL
    if (filters.dateFrom) params.append('startDate', filters.dateFrom);
    if (filters.dateTo) params.append('endDate', filters.dateTo);
    if (filters.searchText) params.append('searchText', filters.searchText);
    if (filters.account) params.append('accountId', filters.account);
    if (filters.counterparty) params.append('counterpartyId', filters.counterparty);
    
    // Add multiple values for category and productName
    if (filters.category && filters.category.length > 0) {
      filters.category.forEach(cat => params.append('categoryIds', cat));
    }
    
    if (filters.productName && filters.productName.length > 0) {
      filters.productName.forEach(prod => params.append('productNames', prod));
    }
    
    // Update URL without refreshing the page
    const url = `?${params.toString()}`;
    router.replace(url, { scroll: false });
  }, [router]);
  
  // Function to fetch transactions with filters
  const fetchTransactions = useCallback(async (filters: FilterState) => {
    if (status !== 'authenticated') return;
    
    setLoading(true);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      // Date filters
      if (filters.dateFrom) params.append('startDate', filters.dateFrom);
      if (filters.dateTo) params.append('endDate', filters.dateTo);
      
      // Text search
      if (filters.searchText) params.append('searchText', filters.searchText);
      
      // Account filter
      if (filters.account) params.append('accountId', filters.account);
      
      // Counterparty filter
      if (filters.counterparty) params.append('counterpartyId', filters.counterparty);
      
      // Category filters (multiple)
      if (filters.category && filters.category.length > 0) {
        filters.category.forEach(cat => params.append('categoryIds', cat));
      }
      
      // Product name filters (multiple)
      if (filters.productName && filters.productName.length > 0) {
        filters.productName.forEach(prod => params.append('productNames', prod));
      }
      
      // Construct the URL with query parameters
      const url = `/api/transactions${params.toString() ? `?${params.toString()}` : ''}`;
      
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(t('loadingError'));
      }
      
      const data = await res.json();
      console.log('API Response:', JSON.stringify(data, null, 2));
      setExpenses(data);
    } catch (e: any) {
      setError(e.message || t('errorOccurred'));
    } finally {
      setLoading(false);
    }
  }, [status, t]);

  // Fetch data when URL parameters change
  useEffect(() => {
    if (status === 'authenticated') {
      fetchTransactions(currentFilters);
    }
  }, [status, fetchTransactions, searchParams]);

  // Handle authentication redirect
  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect(`/${locale}`);
    }
  }, [status, locale]);

  // Handle filter changes
  const handleFilterChange = (filters: FilterState) => {
    // Update URL with new filters
    updateUrlWithFilters(filters);
    // Fetching will happen automatically when URL changes via the effect
  };

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
      <ExpensesTable 
        data={expenses} 
        onFilterChange={handleFilterChange}
        loading={loading}
        currentFilters={currentFilters}
      />
    </div>
  );
}
