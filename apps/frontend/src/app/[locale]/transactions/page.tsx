'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import TransactionsTable from '../../../components/TransactionsTable';
import { FilterState } from '../../../components/TransactionsTable';
import { TransactionDto } from '../../../types/transactions';
import { SelectItem } from '../../../types/select-items';

export default function TransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations('TransactionsPage');
  const locale = useLocale();
  const searchParams = useSearchParams();
  
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [hashParams, setHashParams] = useState<URLSearchParams | null>(null);
  const [productOptions, setProductOptions] = useState<SelectItem[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<SelectItem[]>([]);
  const [accountOptions, setAccountOptions] = useState<SelectItem[]>([]);
  const [counterpartyOptions, setCounterpartyOptions] = useState<SelectItem[]>([]);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(false);

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
      
      // Handle account filter (now array of IDs)
      if (filters.account && filters.account.length > 0) {
        // Use the first account ID for now (API currently supports only one)
        params.append('accountId', filters.account[0]);
      }
      
      // Handle counterparty filter (now array of IDs)
      if (filters.counterparty && filters.counterparty.length > 0) {
        // Use the first counterparty ID for now (API currently supports only one)
        params.append('counterpartyId', filters.counterparty[0]);
      }
      
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
        account: [],
        counterparty: [],
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
    account: hashParams?.getAll('accountId') || [],
    counterparty: hashParams?.getAll('counterpartyId') || [],
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
    
    // Handle account filter (now array of IDs)
    if (filters.account && filters.account.length > 0) {
      filters.account.forEach(acc => params.append('accountId', acc));
    }
    
    // Handle counterparty filter (now array of IDs)
    if (filters.counterparty && filters.counterparty.length > 0) {
      filters.counterparty.forEach(cp => params.append('counterpartyId', cp));
    }
    
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
        account: hashParams.getAll('accountId') || [],
        counterparty: hashParams.getAll('counterpartyId') || [],
        productName: hashParams.getAll('productNames') || [],
      };
      console.log('Filters from hash:', filters);
      fetchTransactions(filters);
    }
  }, [status, fetchTransactions, hashParams]);

  // Fetch filter options (products, categories, accounts, counterparties) on page load
  useEffect(() => {
    if (status === 'authenticated') {
      const fetchFilterOptions = async () => {
        setFilterOptionsLoading(true);
        try {
          // Fetch product options
          const productResponse = await fetch('/api/select_items/products');
          if (productResponse.ok) {
            const productData = await productResponse.json();
            setProductOptions(productData);
            console.log('Loaded product options:', productData.length);
          } else {
            console.error('Failed to fetch product options');
          }
          
          // Fetch category options
          const categoryResponse = await fetch('/api/select_items/categories');
          if (categoryResponse.ok) {
            const categoryData = await categoryResponse.json();
            setCategoryOptions(categoryData);
            console.log('Loaded category options:', categoryData.length);
          } else {
            console.error('Failed to fetch category options');
          }

          // Fetch account options
          const accountResponse = await fetch('/api/select_items/accounts');
          if (accountResponse.ok) {
            const accountData = await accountResponse.json();
            setAccountOptions(accountData);
            console.log('Loaded account options:', accountData.length);
          } else {
            console.error('Failed to fetch account options');
          }
          
          // Fetch counterparty options
          const counterpartyResponse = await fetch('/api/select_items/counterparties');
          if (counterpartyResponse.ok) {
            const counterpartyData = await counterpartyResponse.json();
            setCounterpartyOptions(counterpartyData);
            console.log('Loaded counterparty options:', counterpartyData.length);
          } else {
            console.error('Failed to fetch counterparty options');
          }
        } catch (error) {
          console.error('Error fetching filter options:', error);
        } finally {
          setFilterOptionsLoading(false);
        }
      };
      
      fetchFilterOptions();
    }
  }, [status]);

  // Handle filter changes
  const handleFilterChange = (filters: FilterState) => {
    console.log('Filter changed:', filters);
    updateHashWithFilters(filters);
    fetchTransactions(filters);
  };

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/api/auth/signin');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
      <TransactionsTable 
        data={transactions} 
        onFilterChange={handleFilterChange} 
        loading={loading} 
        currentFilters={currentFilters} 
        productOptions={productOptions}
        categoryOptions={categoryOptions}
        accountOptions={accountOptions}
        counterpartyOptions={counterpartyOptions}
        filterOptionsLoading={filterOptionsLoading}
      />
    </div>
  );
}
