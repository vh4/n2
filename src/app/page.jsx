'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../features/auth/hooks/useAuth';

/**
 * Root Landing & Navigation Dispatcher.
 *
 * Checks active authentication session:
 *  - If user is logged in -> routes directly to `/dashboard`.
 *  - If user is unauthenticated -> routes to `/login`.
 *
 * @returns {JSX.Element} Branded initial loading screen during route transition.
 */
export default function RootPage() {
  const router = useRouter();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (session) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [session, isLoading, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/20">
        <span className="font-jp text-2xl font-black text-white">文</span>
      </div>
      <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
        Memuat JLPT N2 Studio...
      </p>
    </div>
  );
}
