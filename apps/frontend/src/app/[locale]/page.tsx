'use client';


import { useSession, signIn } from "next-auth/react";
import React, { useState } from "react";
import Link from "next/link";
import { redirect, useParams } from 'next/navigation';
import {useTranslations} from 'next-intl';

export default function Home() {
  console.log('Rendering Home page');

  const t = useTranslations('LoginPage');
  const { data: session, status } = useSession();
  const params = useParams();
  const locale = params.locale as string;
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  if (status === "loading") {
    return <div>{t('loading')}</div>; // Or a spinner component
  }

  if (session) {
    // Користувач вже залогінений, перенаправляємо на сторінку транзакцій
    redirect(`/${locale}/transactions`);
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
      setLoginError(t('loginError'));
    } else if (result?.ok) {
      // Успішний вхід, next-auth автоматично оновить сесію
      // `useSession` хук побачить зміни і компонент перерендериться
      // Після чого спрацює redirect вище
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: "64px auto", padding: 24, border: "1px solid #eee", borderRadius: 8 }}>
      <h2 style={{ marginBottom: 16 }}>{t('title')}</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>{t('usernameOrEmailLabel')}</label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            required
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>{t('passwordLabel')}</label>
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
          {t('signInButton')}
        </button>
        <div style={{ textAlign: 'center' }}>
          <Link href="/register" style={{ color: '#0070f3', textDecoration: 'none' }}>
            {t('registerLink')}
          </Link>
        </div>
      </form>
    </div>
  );
}
