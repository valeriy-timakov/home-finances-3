import React, { useState, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { TransactionDto } from '../types/transactions';
import MultiSelectDropdown from './MultiSelectDropdown';

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
  category: string[]; // Category IDs as strings
  account: string;
  counterparty: string;
  productName: string[];
};

type ExpensesTableProps = {
  data: TransactionDto[];
  onFilterChange?: (filters: FilterState) => void;
  loading?: boolean;
  currentFilters: FilterState;
};

export default function ExpensesTable({ data, onFilterChange, loading = false, currentFilters }: ExpensesTableProps) {
  const t = useTranslations('ExpensesTable');
  const locale = useLocale();
  
  // Extract unique values for filter dropdowns
  const uniqueCategories = useMemo(() => {
    const categories = new Map<string, { id: number, name: string }>();
    data.forEach(transaction => {
      transaction.details?.forEach(detail => {
        const category = detail.productOrService?.category;
        if (category && category.id && category.name) {
          categories.set(category.id.toString(), { id: category.id, name: category.name });
        }
      });
    });
    return Array.from(categories.values()).sort((a, b) => a.name.localeCompare(b.name));
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
  
  const uniqueProductNames = useMemo(() => {
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
      updatedFilters = { ...currentFilters, [name]: selectedOptions };
    } else {
      updatedFilters = { ...currentFilters, [name]: value };
    }
    
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  };
  
  // Handle multi-select dropdown changes
  const handleMultiSelectChange = (name: string, selectedValues: string[]) => {
    const updatedFilters = { ...currentFilters, [name]: selectedValues };
    
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
        {/* Account filter */}
        <div>
          <label htmlFor="account" className="block text-sm font-medium text-gray-700">
            {t('account')}
          </label>
          <select
            id="account"
            name="account"
            value={currentFilters.account}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">{t('all')}</option>
            {uniqueAccounts.map((account) => (
              <option key={account} value={account}>
                {account}
              </option>
            ))}
          </select>
        </div>
        {/* Counterparty filter */}
        <div>
          <label htmlFor="counterparty" className="block text-sm font-medium text-gray-700">
            {t('counterparty')}
          </label>
          <select
            id="counterparty"
            name="counterparty"
            value={currentFilters.counterparty}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">{t('all')}</option>
            {uniqueCounterparties.map((counterparty) => (
              <option key={counterparty} value={counterparty}>
                {counterparty}
              </option>
            ))}
          </select>
        </div>
        {/* Category filter - multi-select dropdown */}
        <div>
          <MultiSelectDropdown
            id="category"
            name="category"
            options={uniqueCategories.map(category => ({
              value: category.id.toString(),
              label: category.name
            }))}
            selectedValues={currentFilters.category}
            onChange={handleMultiSelectChange}
            label={t('category')}
          />
        </div>
        {/* Product name filter - multi-select dropdown */}
        <div>
          <MultiSelectDropdown
            id="productName"
            name="productName"
            options={uniqueProductNames.map(name => ({
              value: name,
              label: name
            }))}
            selectedValues={currentFilters.productName}
            onChange={handleMultiSelectChange}
            label={t('productName')}
          />
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
