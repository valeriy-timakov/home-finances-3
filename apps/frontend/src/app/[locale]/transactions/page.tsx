'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import ExpensesTable from '../../../components/ExpensesTable';
import { FilterState } from '../../../components/ExpensesTable';
import { TransactionDto } from '../../../types/transactions';

export default function TransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations('TransactionsPage');
  const locale = useLocale();
  const searchParams = useSearchParams();
  
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [hashParams, setHashParams] = useState<URLSearchParams | null>(null);

  // Function to fetch transactions with filters
  const fetchTransactions = useCallback(async (filters: FilterState) => {
    console.log('fetchTransactions called with filters:', filters);
    console.log('Session status:', status);
    console.log('Session token:', session?.sessionToken ? 'exists' : 'missing');
    
    if (!session) {
      console.error('No session available, cannot fetch transactions');
      return;
    }
    
    setLoading(true);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
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
      
      // Fetch data from API
      const apiUrl = `/api/transactions${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('Fetching from:', apiUrl);
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      console.log('Received transactions data:', data);
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [session, status]);

  // Initialize hashParams from window.location.hash on client side
  useEffect(() => {
    console.log('Initial useEffect running');
    console.log('Authentication status:', status);
    
    // This runs only on client side
    const hash = window.location.hash.substring(1); // Remove the # character
    console.log('Initial hash value:', hash);
    setHashParams(new URLSearchParams(hash));
    
    // If there's no hash on initial load, fetch all transactions
    if (!hash && status === 'authenticated') {
      console.log('No hash and authenticated, fetching all transactions');
      fetchTransactions({
        dateFrom: '',
        dateTo: '',
        searchText: '',
        category: [],
        account: '',
        counterparty: '',
        productName: [],
      });
    }
  }, [status, fetchTransactions]);

  // Parse filter values from hash parameters
  const currentFilters: FilterState = {
    dateFrom: hashParams?.get('startDate') || '',
    dateTo: hashParams?.get('endDate') || '',
    searchText: hashParams?.get('searchText') || '',
    category: hashParams?.getAll('categoryIds') || [],
    account: hashParams?.get('accountId') || '',
    counterparty: hashParams?.get('counterpartyId') || '',
    productName: hashParams?.getAll('productNames') || [],
  };

  // Function to update hash with filter parameters
  const updateHashWithFilters = useCallback((filters: FilterState) => {
    console.log('updateHashWithFilters called with:', filters);
    const params = new URLSearchParams();
    
    // Add filter parameters to hash
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
    
    // Update hash without refreshing the page
    window.location.hash = params.toString();
    setHashParams(params);
  }, []);

  // Listen for hash changes
  useEffect(() => {
    console.log('Setting up hash change listener');
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      console.log('Hash changed to:', hash);
      const newParams = new URLSearchParams(hash);
      setHashParams(newParams);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch data when hash parameters change
  useEffect(() => {
    console.log('Hash params changed useEffect running');
    console.log('Current hashParams:', hashParams ? Object.fromEntries(hashParams.entries()) : null);
    console.log('Authentication status:', status);
    
    if (status === 'authenticated' && hashParams) {
      console.log('Authenticated and hashParams exist, fetching transactions');
      const filters: FilterState = {
        dateFrom: hashParams.get('startDate') || '',
        dateTo: hashParams.get('endDate') || '',
        searchText: hashParams.get('searchText') || '',
        category: hashParams.getAll('categoryIds') || [],
        account: hashParams.get('accountId') || '',
        counterparty: hashParams.get('counterpartyId') || '',
        productName: hashParams.getAll('productNames') || [],
      };
      console.log('Filters from hash:', filters);
      fetchTransactions(filters);
    }
  }, [status, fetchTransactions, hashParams]);

  // Handle authentication redirect
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/login`);
    }
  }, [status, locale, router]);

  // Handle filter changes from the ExpensesTable component
  const handleFilterChange = useCallback((filters: FilterState) => {
    console.log('handleFilterChange called with:', filters);
    updateHashWithFilters(filters);
  }, [updateHashWithFilters]);

  if (status === 'loading' || loading) {
    return <div>{t('loading')}</div>;
  }

  if (status === 'authenticated') {
    return (
      <div>
        <h1>{t('title')}</h1>
        <ExpensesTable 
          data={transactions} 
          onFilterChange={handleFilterChange} 
          loading={loading}
          currentFilters={currentFilters}
        />
      </div>
    );
  }

  return null;
}
