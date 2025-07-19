import React from 'react';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("uk-UA");
}

export default function ExpensesTable({ data }: { data: any[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 24 }}>
      <thead>
        <tr>
          <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Дата операції</th>
          <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Назва продукту/послуги</th>
          <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Категорія</th>
          <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Витрати</th>
          <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Ціна</th>
          <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Кількість</th>
        </tr>
      </thead>
      <tbody>
        {data.map((tr: any) =>
          tr.details.map((d: any, idx: number) => (
            <tr key={tr.id + "-" + d.id}>
              {idx === 0 && (
                <td rowSpan={tr.details.length}>{formatDate(tr.date)}</td>
              )}
              <td>{d.productOrService?.name}</td>
              <td>{d.productOrService?.category?.categoryPath ?? d.productOrService?.category?.name}</td>
              <td>{(d.quantity * d.pricePerUnit).toLocaleString("uk-UA")}</td>
              <td>{d.pricePerUnit}</td>
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
