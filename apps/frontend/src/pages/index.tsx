import { useSession, signIn, signOut } from "next-auth/react";
import React, { useState } from "react";
import Link from "next/link";
import ExpensesTable from '../components/ExpensesTable';
import AccountsTable from '../components/AccountsTable';
import CategoryTree from '../components/CategoryTree';

export default function Home() {
  const { data: session, status } = useSession();
  const [identifier, setIdentifier] = useState(""); // username or email
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

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
    <div>
      <p>Ви увійшли як {session.user?.name || session.user?.email || "Користувач"}</p>
      <button onClick={() => signOut({ callbackUrl: '/' })}>Вийти</button>
    </div>
  );
}
