'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useStudyState } from '../../features/study/hooks/useStudyState';
import { useTranslation } from '../../lib/i18n/useTranslation';
import { Header } from '../../components/layout/Header';
import { Sidebar } from '../../components/layout/Sidebar';
import { MobileNav } from '../../components/layout/MobileNav';
import { MobileDrawer } from '../../components/layout/MobileDrawer';
import { Toast } from '../../components/ui/Toast';
import { GrammarWorkspace } from '../../features/grammar/components/GrammarWorkspace';
import { VocabWorkspace } from '../../features/vocab/components/VocabWorkspace';
import { KanjiWorkspace } from '../../features/kanji/components/KanjiWorkspace';
import { FavoritesWorkspace } from '../../features/favorites/components/FavoritesWorkspace';
import { cards } from '../../data/cards';
import { vocab } from '../../data/vocab';
import { kanji } from '../../data/kanji';

/**
 * DashboardPage — Main Japanese Mastery Studio Viewport.
 *
 * Dedicated authenticated route at `/dashboard` featuring:
 *  - Multi-tenant isolated study state with smart delta merging.
 *  - 4 specialized workspaces (Grammar, Vocab, Kanji, Favorites).
 *  - Real-time bilingual switching (EN / ID).
 *  - Cross-device cloud sync and audio pronunciation.
 *
 * @returns {JSX.Element} Authenticated study workspace dashboard.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { session, isLoading, logout } = useAuth();

  // Multi-tenant isolated study state scoped to active session tenant
  const { state, setItemState, cloudSync } = useStudyState(session);

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

  // Active workspace & filters
  const [activeTab, setActiveTab] = useState('grammar'); // 'grammar' | 'vocab' | 'kanji' | 'favorite'
  const [filter, setFilter] = useState('all');           // 'all' | 'again' | 'mastered' | 'favorite'
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [autoPlay, setAutoPlay] = useState(false);

  // Position indexes for each card deck
  const [gPos, setGPos] = useState(0);
  const [vPos, setVPos] = useState(0);
  const [kPos, setKPos] = useState(0);

  const tr = useTranslation(lang);

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

  // Route guard: if auth check finishes and no session exists, forward to /login
  useEffect(() => {
    if (!isLoading && !session) {
      router.replace('/login');
    }
  }, [isLoading, session, router]);

  // Extract unique Grammar Bunpou categories
  const categories = useMemo(() => {
    const cats = new Set();
    cards.forEach((c) => {
      if (c[6]) cats.add(c[6]);
    });
    return Array.from(cats);
  }, []);

  // Compute aggregated study progress statistics across all 3 modules
  const stats = useMemo(() => {
    let mastered = 0;
    let again = 0;
    let fav = 0;

    Object.values(state).forEach((v) => {
      if (v?.status === 'mastered') mastered++;
      if (v?.status === 'again') again++;
      if (v?.fav) fav++;
    });

    const total = cards.length + vocab.length + kanji.length;
    return { mastered, again, fav, total };
  }, [state]);

  /**
   * Displays an animated toast notification and auto-dismisses after 2.8 seconds.
   *
   * @param {string} msg - Message to display.
   */
  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? '' : cur));
    }, 2800);
  }, []);

  const handleLang = (newLang) => {
    setLang(newLang);
    showToast(newLang === 'ID' ? tr('toast_lang_id') : tr('toast_lang_en'));
  };

  const handleDark = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    showToast(nextDark ? tr('toast_dark') : tr('toast_light'));
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // While restoring session state or redirecting, show a smooth branded loading skeleton
  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/20">
          <span className="font-jp text-2xl font-black text-white">文</span>
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Memuat sesi belajar...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      {/* Top Application Header */}
      <Header
        session={session}
        lang={lang}
        handleLang={handleLang}
        darkMode={darkMode}
        handleDark={handleDark}
        handleLogout={handleLogout}
        cloudSync={cloudSync}
        stats={stats}
        onOpenDrawer={() => setDrawerOpen(true)}
        tr={tr}
      />

      {/* Main Studio Body: Sidebar + Active Workspace */}
      <div className="mx-auto flex max-w-7xl">
        {/* Desktop Collapsible Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setFilter('all');
            setSearch('');
          }}
          category={category}
          setCategory={setCategory}
          categories={categories}
          stats={stats}
          tr={tr}
        />

        {/* Dynamic Feature Workspace Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {activeTab === 'grammar' && (
            <GrammarWorkspace
              lang={lang}
              tr={tr}
              filter={filter}
              onFilter={setFilter}
              search={search}
              onSearch={setSearch}
              state={state}
              setItemState={setItemState}
              showToast={showToast}
              pos={gPos}
              setPos={setGPos}
              category={category}
              autoPlay={autoPlay}
              setAutoPlay={setAutoPlay}
            />
          )}

          {activeTab === 'vocab' && (
            <VocabWorkspace
              lang={lang}
              tr={tr}
              filter={filter}
              onFilter={setFilter}
              search={search}
              onSearch={setSearch}
              state={state}
              setItemState={setItemState}
              showToast={showToast}
              pos={vPos}
              setPos={setVPos}
              autoPlay={autoPlay}
              setAutoPlay={setAutoPlay}
            />
          )}

          {activeTab === 'kanji' && (
            <KanjiWorkspace
              lang={lang}
              tr={tr}
              filter={filter}
              onFilter={setFilter}
              search={search}
              onSearch={setSearch}
              state={state}
              setItemState={setItemState}
              showToast={showToast}
              pos={kPos}
              setPos={setKPos}
              autoPlay={autoPlay}
              setAutoPlay={setAutoPlay}
            />
          )}

          {activeTab === 'favorite' && (
            <FavoritesWorkspace
              lang={lang}
              tr={tr}
              state={state}
              setItemState={setItemState}
              showToast={showToast}
              setActiveTab={setActiveTab}
            />
          )}
        </main>
      </div>

      {/* Mobile Touch Bottom Navigation Bar */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setFilter('all');
          setSearch('');
        }}
        onOpenDrawer={() => setDrawerOpen(true)}
        favCount={stats.fav}
        tr={tr}
      />

      {/* Mobile Slide-Up Settings Drawer */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        session={session}
        lang={lang}
        handleLang={handleLang}
        darkMode={darkMode}
        handleDark={handleDark}
        handleLogout={handleLogout}
        category={category}
        setCategory={setCategory}
        categories={categories}
        tr={tr}
      />

      {/* Toast Notification */}
      <Toast message={toastMsg} />
    </div>
  );
}
