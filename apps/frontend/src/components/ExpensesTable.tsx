import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { TransactionDto } from '../types/transactions';

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(locale);
}

function formatCurrency(amount: number, currency: { symbol: string, partFraction: number } | undefined, locale: string): string {
  if (!currency) {
    console.error('Currency is undefined:', currency);
    return `${amount.toLocaleString(locale)}`;
  }
  
  // Convert from smallest unit (e.g., cents) to main unit (e.g., dollars)
  const mainAmount = amount / currency.partFraction;
  return `${currency.symbol}${mainAmount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export default function ExpensesTable({ data }: { data: TransactionDto[] }) {
  const t = useTranslations('ExpensesTable');
  const locale = useLocale();

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 24 }}>
      <thead>
        <tr>
          <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>{t('date')}</th>
          <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>{t('productService')}</th>
          <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>{t('category')}</th>
          <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>{t('expenses')}</th>
          <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>{t('price')}</th>
          <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>{t('quantity')}</th>
        </tr>
      </thead>
      <tbody>
        {data.map((tr: any) =>
          tr.details.map((d: any, idx: number) => (
            <tr key={tr.id + "-" + d.id}>
              {idx === 0 && (
                <td rowSpan={tr.details.length}>{formatDate(tr.date, locale)}</td>
              )}
              <td>{d.productOrService?.name}</td>
              <td>{d.productOrService?.category?.categoryPath ?? d.productOrService?.category?.name}</td>
              <td>
                {formatCurrency(
                  d.quantity * d.pricePerUnit,
                  tr.account.currency,
                  locale
                )}
              </td>
              <td>
                {formatCurrency(d.pricePerUnit, tr.account.currency, locale)}
              </td>
              <td>
                {d.quantity} {d.productOrService?.unit?.shortName || ""}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
