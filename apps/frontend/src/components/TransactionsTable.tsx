import React, { useState, useMemo, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { TransactionDto } from '../types/transactions';
import { SelectItem } from '../types/select-items';
import { UniversalSelectDropdown } from './UniversalSelectDropdown';

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(locale);
}

function formatCurrency(amount: number, currency: { symbol: string, partFraction: number } | undefined, locale: string): string {
  if (!currency) {
    console.error('Currency is undefined:', currency);
    return `[?${amount.toLocaleString(locale)}?]`;
  }
  
  // Convert from smallest unit (e.g., cents) to main unit (e.g., dollars)
  const mainAmount = amount / currency.partFraction;
  return `${mainAmount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}${currency.symbol}`;
}

// Determine transaction type based on criteria
function getTransactionType(transaction: TransactionDto, t: any): string {
  if (transaction.transferLinkedTransactionId) {
    return t('transactionType.transfer');
  } else if (transaction.amount < 0) {
    return t('transactionType.expense');
  } else {
    return t('transactionType.income');
  }
}

type FilterState = {
  dateFrom: string;
  dateTo: string;
  searchText: string;
  category: string[]; // Category IDs as strings
  account: string[];  // Account IDs as strings
  counterparty: string[]; // Counterparty IDs as strings
  productName: string[];
  minAmount: string;
  maxAmount: string;
};

// Export FilterState type for use in other components
export type { FilterState };

type TransactionsTableProps = {
  data: TransactionDto[];
  onFilterChange?: (filters: FilterState) => void;
  loading?: boolean;
  currentFilters: FilterState;
  accountOptions: SelectItem[];
  counterpartyOptions: SelectItem[];
  filterOptionsLoading?: boolean;
};

export default function TransactionsTable({ 
  data, 
  onFilterChange, 
  loading = false, 
  currentFilters,
  accountOptions,
  counterpartyOptions,
  filterOptionsLoading = false
}: TransactionsTableProps) {
  const t = useTranslations('TransactionsTable');
  const locale = useLocale();
  
  // Local state for amount filters
  const [tempMinAmount, setTempMinAmount] = useState(currentFilters.minAmount);
  const [tempMaxAmount, setTempMaxAmount] = useState(currentFilters.maxAmount);
  
  // Update local state when currentFilters change (e.g., from URL)
  useEffect(() => {
    setTempMinAmount(currentFilters.minAmount);
    setTempMaxAmount(currentFilters.maxAmount);
  }, [currentFilters.minAmount, currentFilters.maxAmount]);
  
  // Handle filter changes for most inputs (immediate update)
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Skip immediate update for amount filters
    if (name === 'minAmount' || name === 'maxAmount') {
      return;
    }
    
    const updatedFilters = { ...currentFilters, [name]: value };
    
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  };
  
  // Handle amount input changes (update local state only)
  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'minAmount') {
      setTempMinAmount(value);
    } else if (name === 'maxAmount') {
      setTempMaxAmount(value);
    }
  };
  
  // Handle amount input blur (update filters when editing is complete)
  const handleAmountInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    const updatedFilters = { ...currentFilters };
    
    if (name === 'minAmount') {
      updatedFilters.minAmount = tempMinAmount;
    } else if (name === 'maxAmount') {
      updatedFilters.maxAmount = tempMaxAmount;
    }
    
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  };
  
  // Handle amount input key press (update on Enter key)
  const handleAmountInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const { name } = e.currentTarget;
      const updatedFilters = { ...currentFilters };
      
      if (name === 'minAmount') {
        updatedFilters.minAmount = tempMinAmount;
      } else if (name === 'maxAmount') {
        updatedFilters.maxAmount = tempMaxAmount;
      }
      
      if (onFilterChange) {
        onFilterChange(updatedFilters);
      }
    }
  };
  
  // Handle clearing min amount filter
  const handleClearMinAmount = () => {
    // Clear local state
    setTempMinAmount('');
    
    // Update filters
    const updatedFilters = { 
      ...currentFilters,
      minAmount: ''
    };
    
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  };
  
  // Handle clearing max amount filter
  const handleClearMaxAmount = () => {
    // Clear local state
    setTempMaxAmount('');
    
    // Update filters
    const updatedFilters = { 
      ...currentFilters,
      maxAmount: ''
    };
    
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  };
  
  // Handle account change
  const handleAccountChange = (selectedIds: number[]) => {
    const updatedFilters = { 
      ...currentFilters, 
      account: selectedIds.map(id => id.toString()) 
    };
    
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  };

  // Handle counterparty change
  const handleCounterpartyChange = (selectedIds: number[]) => {
    const updatedFilters = { 
      ...currentFilters, 
      counterparty: selectedIds.map(id => id.toString()) 
    };
    
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  };

  // Apply filters to data
  const filteredData = useMemo(() => {
    // No longer filtering data on the frontend
    // Just return the data as is, since filtering is now done on the backend
    return data;
  }, [data]);

  // Convert string IDs back to numbers for the dropdowns
  const selectedAccountIds = currentFilters.account
    .map(id => parseInt(id))
    .filter(id => !isNaN(id));

  const selectedCounterpartyIds = currentFilters.counterparty
    .map(id => parseInt(id))
    .filter(id => !isNaN(id));

  return (
    <div className="w-full">
      {/* Filter controls */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Date filters */}
        <div>
          <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700">
            {t('dateFrom')}
          </label>
          <input
            type="date"
            id="dateFrom"
            name="dateFrom"
            value={currentFilters.dateFrom}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700">
            {t('dateTo')}
          </label>
          <input
            type="date"
            id="dateTo"
            name="dateTo"
            value={currentFilters.dateTo}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        {/* Search text filter */}
        <div>
          <label htmlFor="searchText" className="block text-sm font-medium text-gray-700">
            {t('search')}
          </label>
          <input
            type="text"
            id="searchText"
            name="searchText"
            value={currentFilters.searchText}
            onChange={handleFilterChange}
            placeholder={t('searchPlaceholder')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        {/* Amount filters */}
        <div>
          <label htmlFor="minAmount" className="block text-sm font-medium text-gray-700">
            {t('minAmount')}
          </label>
          <div className="relative">
            <input
              type="number"
              id="minAmount"
              name="minAmount"
              value={tempMinAmount}
              onChange={handleAmountInputChange}
              onBlur={handleAmountInputBlur}
              onKeyPress={handleAmountInputKeyPress}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {tempMinAmount && (
              <button
                type="button"
                onClick={handleClearMinAmount}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                style={{ top: '4px' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div>
          <label htmlFor="maxAmount" className="block text-sm font-medium text-gray-700">
            {t('maxAmount')}
          </label>
          <div className="relative">
            <input
              type="number"
              id="maxAmount"
              name="maxAmount"
              value={tempMaxAmount}
              onChange={handleAmountInputChange}
              onBlur={handleAmountInputBlur}
              onKeyPress={handleAmountInputKeyPress}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {tempMaxAmount && (
              <button
                type="button"
                onClick={handleClearMaxAmount}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                style={{ top: '4px' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        {/* Account filter - universal select dropdown */}
        <div>
          <label htmlFor="account" className="block text-sm font-medium text-gray-700">
            {t('account')}
          </label>
          <UniversalSelectDropdown
            items={accountOptions}
            selectedIds={selectedAccountIds}
            onChange={handleAccountChange}
            placeholder={t('all')}
            disabled={filterOptionsLoading}
            className="mt-1"
          />
        </div>
        {/* Counterparty filter - universal select dropdown */}
        <div>
          <label htmlFor="counterparty" className="block text-sm font-medium text-gray-700">
            {t('counterparty')}
          </label>
          <UniversalSelectDropdown
            items={counterpartyOptions}
            selectedIds={selectedCounterpartyIds}
            onChange={handleCounterpartyChange}
            placeholder={t('all')}
            disabled={filterOptionsLoading}
            className="mt-1"
          />
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto w-full">
        <table className="w-full border-collapse mt-6">
          <thead>
            <tr>
              <th className="border-b border-border py-3 px-4 text-left font-medium text-secondary">{t('date')}</th>
              <th className="border-b border-border py-3 px-4 text-left font-medium text-secondary">{t('type')}</th>
              <th className="border-b border-border py-3 px-4 text-left font-medium text-secondary">{t('name')}</th>
              <th className="border-b border-border py-3 px-4 text-left font-medium text-secondary">{t('account')}</th>
              <th className="border-b border-border py-3 px-4 text-left font-medium text-secondary">{t('counterparty')}</th>
              <th className="border-b border-border py-3 px-4 text-left font-medium text-secondary">{t('description')}</th>
              <th className="border-b border-border py-3 px-4 text-left font-medium text-secondary">{t('amount')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((transaction: TransactionDto) => (
              <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="py-3 px-4 border-b border-border">
                  {formatDate(transaction.date, locale)}
                </td>
                <td className="py-3 px-4 border-b border-border">
                  {getTransactionType(transaction, t)}
                </td>
                <td className="py-3 px-4 border-b border-border">
                  {transaction.name}
                </td>
                <td className="py-3 px-4 border-b border-border">
                  {transaction.account.name}
                </td>
                <td className="py-3 px-4 border-b border-border">
                  {transaction.counterparty?.name || ''}
                </td>
                <td className="py-3 px-4 border-b border-border">
                  {transaction.description || ''}
                </td>
                <td className="py-3 px-4 border-b border-border">
                  {formatCurrency(transaction.amount, transaction.account.currency, locale)}
                </td>
              </tr>
            ))}
            
            {/* Loading state */}
            {loading && (
              <tr>
                <td colSpan={7} className="py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                  </div>
                </td>
              </tr>
            )}
            
            {/* Empty state */}
            {!loading && filteredData.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-center text-gray-500">
                  {t('noTransactions')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
