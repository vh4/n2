'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useStudyState } from '../features/study/hooks/useStudyState';
import { useTranslation } from '../lib/i18n/useTranslation';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileNav } from '../components/layout/MobileNav';
import { MobileDrawer } from '../components/layout/MobileDrawer';
import { Toast } from '../components/ui/Toast';
import { AuthPage } from '../features/auth/components/AuthPage';
import { GrammarWorkspace } from '../features/grammar/components/GrammarWorkspace';
import { VocabWorkspace } from '../features/vocab/components/VocabWorkspace';
import { KanjiWorkspace } from '../features/kanji/components/KanjiWorkspace';
import { FavoritesWorkspace } from '../features/favorites/components/FavoritesWorkspace';
import { cards } from '../data/cards';
import { vocab } from '../data/vocab';
import { kanji } from '../data/kanji';

/**
 * N2StudioApp — Main Client Component.
 *
 * Clean Architecture orchestrator combining:
 *  - Authentication (`useAuth`) with automatic multi-tenant partitioning.
 *  - Study State (`useStudyState`) with Smart Delta merging and cross-device sync.
 *  - Internationalization (`useTranslation`) with real-time bilingual switching (EN / ID).
 *  - 4 specialized workspaces (Grammar, Vocab, Kanji, Favorites).
 *
 * @returns {JSX.Element} The full JLPT N2 Japanese Mastery Studio interface.
 */
export default function N2StudioApp() {
  // Authentication & tenant session state
  const { session, login, logout } = useAuth();

  // Multi-tenant isolated study state
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

  // If user is not authenticated, render the AuthPage screen
  if (!session) {
    return (
      <>
        {/* Floating Quick Language & Theme Controls on Auth Screen */}
        <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-slate-200 bg-white/95 p-1 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
            <button
              onClick={() => handleLang('ID')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                lang === 'ID'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              🇮🇩
            </button>
            <button
              onClick={() => handleLang('EN')}
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
            onClick={handleDark}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/95 text-slate-600 backdrop-blur transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-300"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <AuthPage onLogin={login} lang={lang} />
      </>
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
        handleLogout={logout}
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
        handleLogout={logout}
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
