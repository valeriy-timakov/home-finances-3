import React from 'react';

export default function AccountsTable({ data }: { data: any[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
      <thead>
        <tr>
          <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Найменування рахунку</th>
          <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Опис</th>
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
