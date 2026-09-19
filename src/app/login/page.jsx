'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { AuthPage } from '../../features/auth/components/AuthPage';

/**
 * Dedicated /login page for JLPT N2 Japanese Mastery Studio.
 *
 * Provides:
 *  - User Sign In interface with username and password.
 *  - Floating bilingual language switcher (ID / EN) and dark mode toggle.
 *  - Redirects to `/dashboard` upon successful authentication.
 *
 * @returns {JSX.Element} The Login page component.
 */
export default function LoginPage() {
  const router = useRouter();
  const { session, login } = useAuth();

  // Language settings: 'ID' | 'EN' (stored in localStorage)
  const [lang, setLang] = useState(() => {
    if (typeof window === 'undefined') return 'ID';
    return localStorage.getItem('n2Lang') || 'ID';
  });

  // Dark mode settings: boolean (defaults to true)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('n2Theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Persist language and theme preferences
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('n2Lang', lang);
  }, [lang]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('n2Theme', darkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // If already authenticated, redirect to /dashboard
  useEffect(() => {
    if (session) {
      router.replace('/dashboard');
    }
  }, [session, router]);

  const handleLoginSuccess = async (user) => {
    await login(user);
    // Hard navigate to ensure server-side middleware and cookies sync cleanly
    window.location.href = '/dashboard';
  };

  return (
    <>
      {/* Floating Quick Language & Theme Controls on Auth Screen */}
      <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
        <div className="flex items-center rounded-xl border border-slate-200 bg-white/95 p-1 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <button
            onClick={() => setLang('ID')}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
              lang === 'ID'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            🇮🇩
          </button>
          <button
            onClick={() => setLang('EN')}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
              lang === 'EN'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            🇬🇧
          </button>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/95 text-slate-600 backdrop-blur transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-300"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      <AuthPage
        initialMode="login"
        useLinks={true}
        onLogin={handleLoginSuccess}
        lang={lang}
      />
    </>
  );
}
