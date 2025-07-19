'use client';

import { useSession, signIn } from "next-auth/react";
import React, { useState } from "react";
import Link from "next/link";
import { redirect } from 'next/navigation';

export default function Home() {
  const { data: session, status } = useSession();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  if (status === "loading") {
    return <div>Завантаження...</div>; // Or a spinner component
  }

  if (session) {
    // Користувач вже залогінений, перенаправляємо на сторінку транзакцій
    redirect('/transactions');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const result = await signIn("credentials", {
      email: identifier,
      password,
      redirect: false,
    });
    if (result?.error) {
      setLoginError('Невірний логін або пароль');
    } else if (result?.ok) {
      // Успішний вхід, next-auth автоматично оновить сесію
      // `useSession` хук побачить зміни і компонент перерендериться
      // Після чого спрацює redirect вище
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
