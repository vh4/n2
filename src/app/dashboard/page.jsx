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
import { AuthPage } from '../../features/auth/components/AuthPage';
import { cls } from '../../lib/utils';
import { MdPlayArrow, MdStop, MdRestartAlt, MdShuffle, MdLightMode, MdDarkMode } from 'react-icons/md';

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
  const { session, isLoading, login, logout } = useAuth();
  const [authTimedOut, setAuthTimedOut] = useState(false);

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

  // Safety timeout: prevent hanging in infinite loading state if session check is delayed
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthTimedOut(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

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

  // Route guard: if auth check finishes and no session exists, redirect to /login immediately
  useEffect(() => {
    if (!isLoading && !session) {
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      }
    }
  }, [isLoading, session]);

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

  const handleStart = () => {
    setFilter('all');
    setSearch('');
    if (activeTab === 'grammar') setGPos(0);
    else if (activeTab === 'vocab') setVPos(0);
    else if (activeTab === 'kanji') setKPos(0);
    showToast(tr('toast_start'));
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleShuffle = () => {
    const lens = { grammar: cards.length, vocab: vocab.length, kanji: kanji.length };
    const setters = { grammar: setGPos, vocab: setVPos, kanji: setKPos };
    if (setters[activeTab]) {
      setters[activeTab](Math.floor(Math.random() * (lens[activeTab] || 1)));
    }
    showToast(tr('toast_shuffle'));
  };

  const handleToggleAutoPlay = () => {
    setAutoPlay((prev) => {
      const next = !prev;
      if (next) {
        showToast(tr('toast_autoplay_start'));
      } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  };

  const tabTitle = {
    grammar: tr('title_grammar'),
    vocab: tr('title_vocab'),
    kanji: tr('title_kanji'),
    favorite: tr('nav_favorites')
  }[activeTab] || tr('title_grammar');

  const tabDesc = {
    grammar: tr('desc_grammar'),
    vocab: tr('desc_vocab'),
    kanji: tr('desc_kanji'),
    favorite: lang === 'EN'
      ? 'All your saved & starred items across Grammar, Vocab, and Kanji.'
      : 'Semua item Favorit yang Anda simpan dari Grammar, Kosakata, dan Kanji.'
  }[activeTab] || '';

  // 1. While actively restoring session state on mount (capped by timeout)
  if (isLoading && !authTimedOut) {
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

  // 2. If unauthenticated, render AuthPage directly with quick controls so user is NEVER stuck loading
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
        <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-slate-200 bg-white/95 p-1 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
            <button
              onClick={() => handleLang('ID')}
              className={cls(
                'rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer',
                lang === 'ID' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm' : 'text-slate-500 dark:text-slate-400'
              )}
            >
              🇮🇩 ID
            </button>
            <button
              onClick={() => handleLang('EN')}
              className={cls(
                'rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer',
                lang === 'EN' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm' : 'text-slate-500 dark:text-slate-400'
              )}
            >
              🇬🇧 EN
            </button>
          </div>
          <button
            onClick={handleDark}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/95 text-slate-600 backdrop-blur transition hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-300 cursor-pointer"
          >
            {darkMode ? <MdLightMode className="h-4 w-4 text-amber-500" /> : <MdDarkMode className="h-4 w-4 text-slate-400" />}
          </button>
        </div>

        <AuthPage
          initialMode="login"
          useLinks={true}
          onLogin={async (user) => {
            const res = await login(user);
            if (res?.ok || user) {
              window.location.href = '/dashboard';
            }
          }}
          lang={lang}
        />
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
          {/* Workspace Banner with Material Header Actions & AutoPlay */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90 sm:p-5 mb-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-base font-black text-slate-900 dark:text-white sm:text-lg">
                  {tabTitle}
                </h1>
                <p className="mt-0.5 max-w-xl text-xs text-slate-500 dark:text-slate-400">
                  {tabDesc}
                </p>
              </div>
              {activeTab !== 'favorite' && (
                <div className="flex flex-wrap items-center gap-2">
                  {/* Auto Play Audio Button */}
                  <button
                    onClick={handleToggleAutoPlay}
                    className={cls(
                      'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer',
                      autoPlay
                        ? 'bg-rose-600 text-white hover:bg-rose-700 animate-pulse shadow-rose-500/20'
                        : 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20'
                    )}
                  >
                    {autoPlay ? <MdStop className="h-4 w-4" /> : <MdPlayArrow className="h-4 w-4" />}
                    <span>{autoPlay ? tr('btn_stop_autoplay') : tr('btn_autoplay')}</span>
                  </button>

                  {/* Start / Reset Button */}
                  <button
                    onClick={handleStart}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 cursor-pointer"
                  >
                    <MdRestartAlt className="h-4 w-4" />
                    <span>{tr('btn_start')}</span>
                  </button>

                  {/* Shuffle Button */}
                  <button
                    onClick={handleShuffle}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <MdShuffle className="h-4 w-4" />
                    <span>{tr('btn_shuffle')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

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
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setFilter('all');
          setSearch('');
        }}
        lang={lang}
        handleLang={handleLang}
        darkMode={darkMode}
        handleDark={handleDark}
        handleLogout={handleLogout}
        category={category}
        setCategory={setCategory}
        stats={stats}
        tr={tr}
      />

      {/* Toast Notification */}
      <Toast message={toastMsg} />
    </div>
  );
}
