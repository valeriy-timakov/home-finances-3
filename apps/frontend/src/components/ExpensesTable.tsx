import React, { useState, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { TransactionDto } from '../types/transactions';

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

type FilterState = {
  dateFrom: string;
  dateTo: string;
  searchText: string;
  category: string[];
  account: string;
  counterparty: string;
  productName: string[];
};

type ExpensesTableProps = {
  data: TransactionDto[];
  onFilterChange?: (filters: FilterState) => void;
  loading?: boolean;
};

export default function ExpensesTable({ data, onFilterChange, loading = false }: ExpensesTableProps) {
  const t = useTranslations('ExpensesTable');
  const locale = useLocale();
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    searchText: '',
    category: [],
    account: '',
    counterparty: '',
    productName: [],
  });
  
  // Extract unique values for filter dropdowns
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    data.forEach(transaction => {
      transaction.details?.forEach(detail => {
        const category = detail.productOrService?.category?.name;
        if (category) categories.add(category);
      });
    });
    return Array.from(categories).sort();
  }, [data]);
  
  const uniqueAccounts = useMemo(() => {
    const accounts = new Set<string>();
    data.forEach(transaction => {
      accounts.add(transaction.account.name);
    });
    return Array.from(accounts).sort();
  }, [data]);
  
  const uniqueCounterparties = useMemo(() => {
    const counterparties = new Set<string>();
    data.forEach(transaction => {
      counterparties.add(transaction.counterparty.name);
    });
    return Array.from(counterparties).sort();
  }, [data]);
  
  const uniqueProducts = useMemo(() => {
    const products = new Set<string>();
    data.forEach(transaction => {
      transaction.details?.forEach(detail => {
        const productName = detail.productOrService?.name;
        if (productName) products.add(productName);
      });
    });
    return Array.from(products).sort();
  }, [data]);
  
  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    let updatedFilters: FilterState;
    
    // Handle multi-select for category and productName
    if (name === 'category' || name === 'productName') {
      const select = e.target as HTMLSelectElement;
      const selectedOptions = Array.from(select.selectedOptions).map(option => option.value);
      updatedFilters = { ...filters, [name]: selectedOptions };
    } else {
      updatedFilters = { ...filters, [name]: value };
    }
    
    setFilters(updatedFilters);
    
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

  return (
    <div className="w-full">
      {/* Filter controls */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('dateRange')}</label>
          <div className="flex gap-2">
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1 text-sm w-full"
              placeholder={t('from')}
            />
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1 text-sm w-full"
              placeholder={t('to')}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">{t('transactionName')}</label>
          <input
            type="text"
            name="searchText"
            value={filters.searchText}
            onChange={handleFilterChange}
            className="border rounded px-2 py-1 text-sm w-full"
            placeholder={t('searchPlaceholder')}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">{t('category')}</label>
          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="border rounded px-2 py-1 text-sm w-full"
            multiple
            size={4}
          >
            {uniqueCategories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">{t('account')}</label>
          <select
            name="account"
            value={filters.account}
            onChange={handleFilterChange}
            className="border rounded px-2 py-1 text-sm w-full"
          >
            <option value="">{t('all')}</option>
            {uniqueAccounts.map(account => (
              <option key={account} value={account}>
                {account}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">{t('counterparty')}</label>
          <select
            name="counterparty"
            value={filters.counterparty}
            onChange={handleFilterChange}
            className="border rounded px-2 py-1 text-sm w-full"
          >
            <option value="">{t('all')}</option>
            {uniqueCounterparties.map(counterparty => (
              <option key={counterparty} value={counterparty}>
                {counterparty}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">{t('productName')}</label>
          <select
            name="productName"
            value={filters.productName}
            onChange={handleFilterChange}
            className="border rounded px-2 py-1 text-sm w-full"
            multiple
            size={4}
          >
            {uniqueProducts.map(product => (
              <option key={product} value={product}>
                {product}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto w-full">
        <table className="w-full border-collapse mt-6">
          <thead>
            <tr>
              <th className="border-b border-border py-3 px-4 text-left font-medium text-secondary">{t('date')}</th>
              <th className="border-b border-border py-3 px-4 text-left font-medium text-secondary">{t('product')}</th>
              <th className="border-b border-border py-3 px-4 text-left font-medium text-secondary">{t('category')}</th>
              <th className="border-b border-border py-3 px-4 text-left font-medium text-secondary">{t('quantity')}</th>
              <th className="border-b border-border py-3 px-4 text-left font-medium text-secondary">{t('price')}</th>
              <th className="border-b border-border py-3 px-4 text-left font-medium text-secondary">{t('amount')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((transaction: TransactionDto) => (
              <React.Fragment key={transaction.id}>
                {/* Transaction row */}
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <td className="py-3 px-4 border-b border-border font-medium">
                    {formatDate(transaction.date, locale)}
                  </td>
                  <td className="py-3 px-4 border-b border-border font-medium" colSpan={4}>
                    <div className="flex gap-2">
                      <span>{transaction.name}</span>
                      <span className="text-gray-500">|</span>
                      <span>{transaction.account.name}</span>
                      <span className="text-gray-500">|</span>
                      <span>{transaction.counterparty.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 border-b border-border font-medium">
                    {formatCurrency(transaction.amount, transaction.account.currency, locale)}
                  </td>
                </tr>
                
                {/* Detail rows */}
                {transaction.details?.map((detail, idx) => (
                  <tr key={`${transaction.id}-detail-${detail.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-4 border-b border-border">
                      {/* Empty cell for indentation */}
                    </td>
                    <td className="py-3 px-4 border-b border-border">
                      {detail.productOrService?.name}
                    </td>
                    <td className="py-3 px-4 border-b border-border">
                      {detail.productOrService?.category?.categoryPath ?? detail.productOrService?.category?.name}
                    </td>
                    <td className="py-3 px-4 border-b border-border">
                      {detail.quantity} {detail.productOrService?.unit?.shortName || ""}
                    </td>
                    <td className="py-3 px-4 border-b border-border">
                      {formatCurrency(detail.pricePerUnit, transaction.account.currency, locale)}
                    </td>
                    <td className="py-3 px-4 border-b border-border">
                      {formatCurrency(detail.quantity * detail.pricePerUnit, transaction.account.currency, locale)}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
