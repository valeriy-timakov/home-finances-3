import React from 'react';
import {useTranslations} from 'next-intl';

export default function AccountsTable({ data }: { data: any[] }) {
  const t = useTranslations('AccountsTable');

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
      <thead>
        <tr>
          <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>{t('accountName')}</th>
          <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>{t('description')}</th>
        </tr>
      </thead>
      <tbody>
        {data.map((acc: any) => (
          <tr key={acc.id}>
            <td>{acc.name}</td>
            <td>{acc.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
