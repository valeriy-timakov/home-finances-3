import { useSession, signIn, signOut } from "next-auth/react";
import React, { useState } from "react";
import Link from "next/link";
import { Tree } from 'antd';
import 'antd/dist/reset.css';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("uk-UA");
}

function ExpensesTable({ data }: { data: any[] }) {
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
        {data.map((tr) =>
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

function AccountsTable({ data }: { data: any[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
      <thead>
        <tr>
          <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Найменування рахунку</th>
          <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Опис</th>
        </tr>
      </thead>
      <tbody>
        {data.map((acc) => (
          <tr key={acc.id}>
            <td>{acc.name}</td>
            <td>{acc.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CategoryTree({ data }: { data: any[] }) {
  // Преобразуем у формат для Ant Tree
  const convert = (nodes: any[]): any[] =>
    nodes.map((n) => ({
      title: n.name,
      key: n.id,
      children: n.children ? convert(n.children) : [],
    }));
  return <Tree treeData={convert(data)} defaultExpandAll />;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [showTable, setShowTable] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState(""); // username or email
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [view, setView] = useState<'transactions' | 'accounts' | 'categories'>('transactions');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const handleLoadExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/transactions", { credentials: 'include' });
      if (!res.ok) throw new Error("Помилка завантаження");
      const data = await res.json();
      setExpenses(data);
      setShowTable(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/accounts', { credentials: 'include' });
      if (!res.ok) throw new Error('Помилка завантаження');
      const data = await res.json();
      setAccounts(data);
      setView('accounts');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/categories', { credentials: 'include' });
      if (!res.ok) throw new Error('Помилка завантаження');
      const data = await res.json();
      setCategories(data);
      setView('categories');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return <div>Завантаження...</div>;

  if (!session) {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError("");

      try {
        const result = await signIn("credentials", {
          email: identifier, // поле email використовується і для username, і для email
          password,
          redirect: false,
        });
        if (result?.error) {
          setLoginError(result.error);
        }
      } catch (err: any) {
        setLoginError(err.message);
      }
    };

    return (
      <div style={{ maxWidth: 360, margin: "64px auto", padding: 24, border: "1px solid #eee", borderRadius: 8 }}>
        <h2 style={{ marginBottom: 16 }}>Вхід</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>Ім'я користувача або Email</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              required
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              required
            />
          </div>
          {loginError && <div style={{ color: 'red', marginBottom: 16 }}>{loginError}</div>}
          <button
            type="submit"
            style={{ width: '100%', padding: 8, fontSize: 16, borderRadius: 4, background: '#222', color: '#fff', marginBottom: 16 }}
          >
            Увійти
          </button>
          <div style={{ textAlign: 'center' }}>
            <Link href="/register" style={{ color: '#0070f3', textDecoration: 'none' }}>
              Зареєструватися
            </Link>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <span style={{ marginRight: 16 }}>Вітаю, {session.user?.email}</span>
          <button onClick={() => signOut()} style={{ border: 0, background: "#eee", padding: "4px 12px", borderRadius: 4 }}>Вийти</button>
        </div>
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => { setView('transactions'); handleLoadExpenses(); }} style={{ marginRight: 8 }}>Транзакції</button>
          <button onClick={handleLoadAccounts} style={{ marginRight: 8 }}>Рахунки</button>
          <button onClick={handleLoadCategories}>Категорії</button>
        </div>
      </div>
      {loading && <div>Завантаження...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      {view === 'transactions' && <ExpensesTable data={expenses} />}
      {view === 'accounts' && <AccountsTable data={accounts} />}
      {view === 'categories' && <CategoryTree data={categories} />}
    </div>
  );
}
