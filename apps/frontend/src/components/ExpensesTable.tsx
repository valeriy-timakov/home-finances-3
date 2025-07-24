import React from 'react';
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

export default function ExpensesTable({ data }: { data: TransactionDto[] }) {
  const t = useTranslations('ExpensesTable');
  const locale = useLocale();

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full border-collapse mt-6">
        <thead>
          <tr>
            <th className="border-b border-border py-3 px-4 text-left font-medium text-secondary">{t('date')}</th>
            <th className="border-b border-border py-3 px-4 text-left font-medium text-secondary">{t('productService')}</th>
            <th className="border-b border-border py-3 px-4 text-left font-medium text-secondary">{t('category')}</th>
            <th className="border-b border-border py-3 px-4 text-left font-medium text-secondary">{t('expenses')}</th>
            <th className="border-b border-border py-3 px-4 text-left font-medium text-secondary">{t('price')}</th>
            <th className="border-b border-border py-3 px-4 text-left font-medium text-secondary">{t('quantity')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((tr: any) =>
            tr.details.map((d: any, idx: number) => (
              <tr key={tr.id + "-" + d.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                {idx === 0 && (
                  <td rowSpan={tr.details.length} className="py-3 px-4 border-b border-border">
                    {formatDate(tr.date, locale)}
                  </td>
                )}
                <td className="py-3 px-4 border-b border-border">{d.productOrService?.name}</td>
                <td className="py-3 px-4 border-b border-border">{d.productOrService?.category?.categoryPath ?? d.productOrService?.category?.name}</td>
                <td className="py-3 px-4 border-b border-border">
                  {formatCurrency(
                    d.quantity * d.pricePerUnit,
                    tr.account.currency,
                    locale
                  )}
                </td>
                <td className="py-3 px-4 border-b border-border">
                  {formatCurrency(d.pricePerUnit, tr.account.currency, locale)}
                </td>
                <td className="py-3 px-4 border-b border-border">
                  {d.quantity} {d.productOrService?.unit?.shortName || ""}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
