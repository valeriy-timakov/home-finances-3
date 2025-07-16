import { useSession, signIn, signOut } from "next-auth/react";
import React, { useState } from "react";
import Link from "next/link";

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
              <td>{d.productOrService?.category?.name}</td>
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

export default function Home() {
  const { data: session, status } = useSession();
  const [showTable, setShowTable] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Move login form state to the top level
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLoadExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/transactions");
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

  if (status === "loading") return <div>Завантаження...</div>;

  if (!session) {

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError("");

      try {
        const result = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (result?.error) {
          setLoginError("Невірний email або пароль");
        }
      } catch (error) {
        setLoginError("Помилка при вході. Спробуйте пізніше.");
      }
    };

    return (
      <div style={{ maxWidth: 320, margin: "64px auto", padding: 24, border: "1px solid #eee", borderRadius: 8 }}>
        <h2 style={{ marginBottom: 16 }}>Вхід</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8 }}>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
              required
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8 }}>Пароль</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
              required
            />
          </div>

          {loginError && <div style={{ color: "red", marginBottom: 16 }}>{loginError}</div>}

          <button type="submit" style={{ width: "100%", padding: 8, fontSize: 16, borderRadius: 4, background: "#222", color: "#fff", marginBottom: 16 }}>
            Увійти
          </button>

          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <Link href="/register" style={{ color: "#0070f3", textDecoration: "none" }}>
              Немає акаунту? Зареєструватися
            </Link>
          </div>
        </form>

        <div style={{ textAlign: "center" }}>
          <p style={{ marginBottom: 8 }}>Або</p>
          <button onClick={() => signIn("github")} style={{ width: "100%", padding: 8, fontSize: 16, borderRadius: 4, background: "#24292e", color: "#fff" }}>
            Увійти через GitHub
          </button>
        </div>
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
        <button onClick={handleLoadExpenses} style={{ padding: "8px 16px", background: "#2d7", color: "#fff", border: 0, borderRadius: 4, fontWeight: 600 }}>Витрати</button>
      </div>
      {loading && <div>Завантаження витрат...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      {showTable && <ExpensesTable data={expenses} />}
    </div>
  );
}
