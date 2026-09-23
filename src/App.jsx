import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { cards } from './data/cards';
import { vocab } from './data/vocab';
import { kanji } from './data/kanji';
import { categoryNames } from './data/categories';
import { getVocabExamples } from './lib/utils';
import { t } from './i18n';
import { getSession, logoutUser, userKey, syncStateToCloud, fetchStateFromCloud } from './auth';
import AuthPage from './AuthPage';

// ── Helpers ───────────────────────────────────────────────────────────────────
const cls = (...args) => args.filter(Boolean).join(' ');
const useT = (lang) => useCallback((key) => (t[key] && t[key][lang]) || key, [lang]);

const PAGE_SIZE = 50;

// Web Speech API Voice Selector Helper for Native Voices (ja-JP, id-ID, en-US)
function getBestVoice(langPrefix) {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const targetLang = langPrefix.toLowerCase().replace('_', '-');
  const targetShort = targetLang.split('-')[0];

  // 1. For English (EN): Prioritize high-quality native US / UK English voices
  if (targetShort === 'en') {
    const preferredEN = voices.find(v => 
      (v.lang || '').toLowerCase().includes('en-us') || 
      (v.lang || '').toLowerCase().includes('en-gb') ||
      v.name.includes('Google US English') ||
      v.name.includes('Samantha') ||
      v.name.includes('Alex') ||
      v.name.includes('Daniel')
    );
    if (preferredEN) return preferredEN;
  }

  // 2. For Indonesian (ID): Prioritize native Indonesian voices
  if (targetShort === 'id') {
    const preferredID = voices.find(v => 
      (v.lang || '').toLowerCase().includes('id') || 
      v.name.includes('Indonesian') ||
      v.name.includes('Damayanti') ||
      v.name.includes('Ardi')
    );
    if (preferredID) return preferredID;
  }

  // 3. For Japanese (JA): Prioritize native Japanese voices
  if (targetShort === 'ja') {
    const preferredJA = voices.find(v => 
      (v.lang || '').toLowerCase().includes('ja') || 
      v.name.includes('Kyoko') ||
      v.name.includes('Otoya') ||
      v.name.includes('Nanami')
    );
    if (preferredJA) return preferredJA;
  }

  // 4. Exact match fallback (e.g. 'id-ID', 'en-US', or 'ja-JP')
  let match = voices.find(v => (v.lang || '').toLowerCase().replace('_', '-') === targetLang);
  if (match) return match;

  // 5. Prefix match fallback (e.g. starts with 'id', 'en', or 'ja')
  match = voices.find(v => (v.lang || '').toLowerCase().replace('_', '-').startsWith(targetShort));
  if (match) return match;

  return null;
}

// Ensure voices are pre-loaded into browser cache
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

// Web Speech API Promise-based Audio TTS helper with natural pacing and explicit native voice binding
function speakAsync(text, langCode) {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window) || !text) {
      setTimeout(resolve, 800);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean text for smooth, natural reading
    const cleanText = text
      .replace(/<[^>]*>/g, '')
      .replace(/[～~]/g, '')
      .replace(/\([^)]*\)/g, '') // remove parentheses like (ていし)
      .trim();

    if (!cleanText) {
      setTimeout(resolve, 500);
      return;
    }

    const u = new SpeechSynthesisUtterance(cleanText);
    u.lang = langCode;
    u.rate = 0.82; // Natural, relaxed human reading pace
    u.pitch = 1.0;

    // Bind explicit native voice engine for Indonesian (id-ID), English (en-US), or Japanese (ja-JP)
    const voice = getBestVoice(langCode);
    if (voice) {
      u.voice = voice;
    }

    let doneCalled = false;
    const done = () => {
      if (!doneCalled) {
        doneCalled = true;
        resolve();
      }
    };

    u.onend = done;
    u.onerror = done;
    setTimeout(done, 8000); // Safety fallback timeout

    window.speechSynthesis.speak(u);
  });
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconMenu = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
  </svg>
);
const IconDial = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l-.06-.06a1.65 1.65 0 003.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);
const IconSearch = () => (
  <svg className="h-4 w-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <circle cx={11} cy={11} r={8} /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
  </svg>
);
const IconStar = ({ filled }) => (
  <svg className={cls('h-4 w-4 flex-shrink-0', filled ? 'fill-amber-400 text-amber-400' : 'fill-none text-slate-300 dark:text-slate-600')} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IconVolume = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path strokeLinecap="round" d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);
const IconChevronLeft = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
  </svg>
);
const IconChevronRight = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
  </svg>
);
const IconMoon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);
const IconSun = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <circle cx={12} cy={12} r={5} />
    <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);
const IconLogout = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);
const IconClose = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({ status, tr }) {
  if (status === 'mastered') return <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{tr('card_mastered')}</span>;
  if (status === 'again') return <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">{tr('card_again')}</span>;
  return <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">{tr('card_not_rated')}</span>;
}

// ── Flashcard ─────────────────────────────────────────────────────────────────
function Flashcard({ front, back, flipped, onClick }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && onClick()}
      className="w-full cursor-pointer select-none outline-none"
      style={{ perspective: '1400px' }}
      aria-label="Flip card"
    >
      <div
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.55s cubic-bezier(0.34, 1.45, 0.64, 1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          position: 'relative',
          minHeight: '300px',
        }}
      >
        <div
          className="absolute inset-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {front}
        </div>
        <div
          className="absolute inset-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {back}
        </div>
      </div>
    </div>
  );
}

// ── Card Actions (audio + star) ───────────────────────────────────────────────
function CardActions({ onSpeak, isFav, onToggleFav }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={e => { e.stopPropagation(); onSpeak(); }}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
        <IconVolume />
      </button>
      <button onClick={e => { e.stopPropagation(); onToggleFav(); }}
        className={cls('flex h-8 w-8 items-center justify-center rounded-lg border transition active:scale-95',
          isFav ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30'
               : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800')}>
        <IconStar filled={isFav} />
      </button>
    </div>
  );
}

// ── Rating Controls ───────────────────────────────────────────────────────────
function RatingControls({ onPrev, onNext, onAgain, onMastered, tr }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={onPrev}
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
        <IconChevronLeft />
      </button>
      <button onClick={onAgain}
        className="flex h-10 flex-1 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 active:scale-95 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
        {tr('rate_again')}
      </button>
      <button onClick={onMastered}
        className="flex h-10 flex-1 items-center justify-center rounded-xl bg-blue-600 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95">
        {tr('rate_mastered')}
      </button>
      <button onClick={onNext}
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
        <IconChevronRight />
      </button>
    </div>
  );
}

// ── Filter Bar ────────────────────────────────────────────────────────────────
function FilterBar({ filter, onFilter, search, onSearch, placeholder, total, countLabel, tr }) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/20 dark:border-slate-700 dark:bg-slate-900 sm:w-72">
        <IconSearch />
        <input value={search} onChange={e => onSearch(e.target.value)} type="search"
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder-slate-400 dark:text-slate-100 dark:placeholder-slate-500" />
        {search && (
          <button onClick={() => onSearch('')} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 hide-scroll">
        {['all', 'unrated', 'again', 'mastered', 'favorite'].map(f => (
          <button key={f} onClick={() => onFilter(f)}
            className={cls('flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition',
              filter === f
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800')}>
            {tr(`filter_${f}`)}
          </button>
        ))}
        <span className="ml-1 flex-shrink-0 text-xs font-semibold text-blue-600 dark:text-blue-400">
          {total} {countLabel}
        </span>
      </div>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPage, lang }) {
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
    else if (i === page - 2 || i === page + 2) pages.push('...');
  }
  const deduped = pages.filter((v, i) => pages[i - 1] !== v);

  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        <IconChevronLeft />
      </button>
      {deduped.map((p, i) =>
        p === '...'
          ? <span key={i} className="px-1 text-xs text-slate-400">…</span>
          : (
            <button key={p} onClick={() => onPage(p)}
              className={cls('flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition',
                p === page
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800')}>
              {p}
            </button>
          )
      )}
      <button onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        <IconChevronRight />
      </button>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ tr, msg }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-12 text-center dark:border-slate-700">
      <div className="text-4xl">⭐</div>
      <div className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">{msg || tr('empty')}</div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl dark:border-slate-600 dark:bg-slate-800 sm:bottom-6">
      {msg}
    </div>
  );
}

// ── MUI Style Bottom Sheet Drawer Modal ───────────────────────────────────────
function MUIBottomDrawer({ open, onClose, session, activeTab, setActiveTab, category, setCategory, filter, setFilter, lang, handleLang, darkMode, handleDark, handleLogout, stats, tr }) {
  if (!open) return null;

  const mainDialItems = [
    { key: 'grammar', icon: '文', label: tr('mob_grammar'), count: cards.length, color: 'from-blue-500 to-blue-600' },
    { key: 'vocab',   icon: '単', label: tr('mob_vocab'),   count: vocab.length, color: 'from-emerald-500 to-emerald-600' },
    { key: 'kanji',   icon: '漢', label: tr('mob_kanji'),   count: kanji.length, color: 'from-amber-500 to-amber-600' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-backdrop-fade transition-opacity duration-300"
      />

      <div className="relative z-10 w-full rounded-t-[32px] border-t border-slate-200/80 bg-white px-4 pb-6 pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.18)] dark:border-slate-800/80 dark:bg-slate-900 dark:shadow-[0_-12px_40px_rgba(0,0,0,0.6)] animate-drawer-slide-up max-h-[85vh] overflow-y-auto hide-scroll sm:px-6">

        <div className="mb-3 flex justify-center">
          <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md">
              <span className="font-jp text-base font-black text-white">文</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">{session?.displayName || 'User'}</span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                  Pro Student
                </span>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500">{tr('drawer_subtitle')}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 active:scale-95 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <IconClose />
          </button>
        </div>

        <div className="mb-4">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {tr('drawer_title')}
          </div>
          
          <div className="grid grid-cols-3 gap-2.5">
            {mainDialItems.map((item, idx) => {
              const isSelected = activeTab === item.key && filter !== 'favorite';

              return (
                <button
                  key={item.key}
                  style={{ animationDelay: `${idx * 0.03}s` }}
                  onClick={() => {
                    setActiveTab(item.key);
                    setFilter('all');
                    onClose();
                  }}
                  className={cls(
                    'animate-dial-pop flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 transition-all duration-200 active:scale-95',
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 dark:shadow-blue-600/30'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800'
                  )}
                >
                  <div className={cls(
                    'flex h-10 w-10 items-center justify-center rounded-xl font-jp text-base font-bold shadow-sm',
                    isSelected ? 'bg-white/20 text-white' : `bg-gradient-to-tr ${item.color} text-white`
                  )}>
                    {item.icon}
                  </div>
                  <span className="truncate text-xs font-bold">{item.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              setActiveTab('favorite');
              setFilter('all');
              onClose();
            }}
            className={cls(
              'mt-2.5 flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all duration-200 active:scale-98',
              activeTab === 'favorite'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'border border-amber-200/80 bg-amber-50/60 text-amber-700 hover:bg-amber-100/70 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300'
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-amber-500 text-sm">★</span>
              <span>{tr('nav_favorites')}</span>
            </div>
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-300">
              {stats.fav} {tr('count_cards')}
            </span>
          </button>
        </div>

        <div className="mb-4 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {tr('drawer_account')} &amp; {tr('drawer_theme')}
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-800/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                🌐 {tr('drawer_language')}
              </span>
              <div className="flex rounded-xl bg-slate-200/70 p-1 dark:bg-slate-900">
                <button
                  onClick={() => handleLang('ID')}
                  className={cls('rounded-lg px-3 py-1 text-xs font-bold transition-all duration-200', lang === 'ID' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 dark:text-slate-400')}
                >
                  🇮🇩 ID
                </button>
                <button
                  onClick={() => handleLang('EN')}
                  className={cls('rounded-lg px-3 py-1 text-xs font-bold transition-all duration-200', lang === 'EN' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 dark:text-slate-400')}
                >
                  🇬🇧 EN
                </button>
              </div>
            </div>

            <div className="h-px bg-slate-200/70 dark:bg-slate-800" />

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDark}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white py-2 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {darkMode ? <IconSun /> : <IconMoon />}
                <span>{darkMode ? 'Light' : 'Dark'} Mode</span>
              </button>

              <button
                onClick={() => { handleLogout(); onClose(); }}
                className="flex items-center justify-center gap-2 rounded-xl border border-rose-200/80 bg-rose-50/80 py-2 px-3 text-xs font-bold text-rose-600 transition hover:bg-rose-100 active:scale-95 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400"
              >
                <IconLogout />
                <span>{lang === 'EN' ? 'Sign out' : 'Keluar'}</span>
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {tr('category_label')}
            </span>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
              {Object.keys(categoryNames).length} Categories
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto hide-scroll pr-0.5">
            {Object.entries(categoryNames).map(([key, name]) => (
              <button
                key={key}
                onClick={() => {
                  setActiveTab('grammar');
                  setCategory(key);
                  onClose();
                }}
                className={cls(
                  'rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 active:scale-95',
                  category === key && activeTab === 'grammar'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'border border-slate-200/80 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300'
                )}
              >
                {name} <span className="opacity-75">({key === 'ALL' ? cards.length : cards.filter(c => c[6] === key).length})</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Unified Favorites Workspace (Collects all starred Grammar, Vocab, and Kanji) ──
function FavoritesWorkspace({ lang, tr, state, setItemState, showToast, setActiveTab }) {
  const [subFilter, setSubFilter] = useState('all'); // 'all' | 'grammar' | 'vocab' | 'kanji'
  const [search, setSearch] = useState('');

  const favoriteItems = useMemo(() => {
    const list = [];
    
    // 1. Grammar favorites
    cards.forEach((c, i) => {
      const s = state[`g_${i}`] || {};
      if (s.fav) {
        list.push({
          module: 'grammar',
          index: i,
          typeKey: 'g',
          word: c[0],
          reading: c[2],
          meaning: lang === 'EN' ? (c[8] || c[1]) : c[1],
          tag: c[6],
          state: s
        });
      }
    });

    // 2. Vocab favorites
    vocab.forEach((v, i) => {
      const s = state[`v_${i}`] || {};
      if (s.fav) {
        list.push({
          module: 'vocab',
          index: i,
          typeKey: 'v',
          word: v[0],
          reading: v[1],
          meaning: lang === 'EN' ? v[2] : v[3],
          tag: tr('card_label_vocab'),
          state: s
        });
      }
    });

    // 3. Kanji favorites
    kanji.forEach((k, i) => {
      const s = state[`k_${i}`] || {};
      if (s.fav) {
        list.push({
          module: 'kanji',
          index: i,
          typeKey: 'k',
          word: k.glyph,
          reading: k.on,
          meaning: lang === 'EN' ? k.meaning_en : k.meaning_id,
          tag: k.theme || tr('card_label_kanji'),
          state: s
        });
      }
    });

    return list;
  }, [state, lang, tr]);

  const filtered = useMemo(() => {
    return favoriteItems.filter(item => {
      if (subFilter !== 'all' && item.module !== subFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = (item.word + ' ' + (item.reading || '') + ' ' + item.meaning + ' ' + item.tag).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [favoriteItems, subFilter, search]);

  const toggleFav = (typeKey, index) => {
    setItemState(typeKey, index, { fav: false });
    showToast(tr('toast_fav_rem'));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-900 sm:w-72">
          <IconSearch />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            type="search"
            placeholder={lang === 'EN' ? 'Search saved items...' : 'Cari item favorit...'}
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder-slate-400 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 hide-scroll">
          {[
            { key: 'all', label: tr('filter_all') },
            { key: 'grammar', label: tr('mob_grammar') },
            { key: 'vocab', label: tr('mob_vocab') },
            { key: 'kanji', label: tr('mob_kanji') },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setSubFilter(f.key)}
              className={cls(
                'flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                subFilter === f.key
                  ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              )}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-1 flex-shrink-0 text-xs font-bold text-amber-600 dark:text-amber-400">
            {filtered.length} {tr('count_cards')}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState tr={tr} msg={lang === 'EN' ? 'No saved favorites found. Tap ★ on any card to save it here!' : 'Belum ada item favorit. Ketuk ★ pada kartu untuk menyimpannya di sini!'} />
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item, idx) => (
            <div
              key={`${item.typeKey}_${item.index}_${idx}`}
              className="group relative rounded-xl border border-amber-200/80 bg-white p-3.5 shadow-sm transition hover:shadow-md dark:border-amber-900/40 dark:bg-slate-900 min-w-0 w-full overflow-hidden"
            >
              <div className="flex items-start justify-between gap-2 min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-jp text-xl font-black text-slate-900 dark:text-white flex-shrink-0">{item.word}</span>
                    <span className={cls(
                      'rounded-md px-1.5 py-0.5 text-[10px] font-extrabold flex-shrink-0',
                      item.module === 'grammar' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                      item.module === 'vocab' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                      'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    )}>
                      {item.tag}
                    </span>
                  </div>
                  {item.reading && <div className="font-jp text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5 truncate">{item.reading}</div>}
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 break-words">{item.meaning}</div>
                </div>

                <button
                  onClick={() => toggleFav(item.typeKey, item.index)}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-amber-300 bg-amber-50 text-amber-500 transition hover:bg-rose-50 hover:text-rose-500 active:scale-95 dark:border-amber-700 dark:bg-amber-950/40"
                  title="Remove from favorites"
                >
                  <IconStar filled />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Grammar Workspace ─────────────────────────────────────────────────────────
function GrammarWorkspace({ lang, tr, filter, onFilter, search, onSearch, state, setItemState, showToast, pos, setPos, category, autoPlay, setAutoPlay }) {
  const [flipped, setFlipped] = useState(false);
  const [page, setPage] = useState(1);
  const [autoStatus, setAutoStatus] = useState('');

  const filtered = useMemo(() => cards.map((_, i) => i).filter(i => {
    const c = cards[i]; const s = state[`g_${i}`] || {};
    const hay = c.join(' ').toLowerCase();
    if (search && !hay.includes(search.toLowerCase())) return false;
    if (filter === 'unrated' && (s.status === 'again' || s.status === 'mastered')) return false;
    if (filter === 'again' && s.status !== 'again') return false;
    if (filter === 'mastered' && s.status !== 'mastered') return false;
    if (filter === 'favorite' && !s.fav) return false;
    if (category !== 'ALL' && c[6] !== category) return false;
    return true;
  }), [search, filter, state, category]);

  useEffect(() => { setPos(0); setPage(1); }, [filter, search, category]);

  const safePos = Math.min(pos, Math.max(0, filtered.length - 1));
  const idx = filtered[safePos] ?? 0;
  const card = cards[idx] || cards[0];
  const st = state[`g_${idx}`] || { status: 'new', fav: false };

  const meaning = lang === 'EN' ? (card[8] || card[1]) : card[1];
  const note    = lang === 'EN' ? (card[9] || card[7]) : card[7];

  const speakJP = () => { if (!('speechSynthesis' in window)) return; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(card[0]); u.lang = 'ja-JP'; u.rate = 0.82; const v = getBestVoice('ja-JP'); if (v) u.voice = v; window.speechSynthesis.speak(u); };
  const rate = (status) => {
    const willLeave =
      filter === 'unrated' ||
      (filter === 'again' && status !== 'again') ||
      (filter === 'mastered' && status !== 'mastered');

    setFlipped(false);
    setItemState('g', idx, { status });
    showToast(status === 'mastered' ? tr('toast_mastered') : tr('toast_again'));

    if (willLeave) {
      if (safePos >= filtered.length - 1) {
        setPos(Math.max(0, filtered.length - 2));
      }
    } else {
      setTimeout(() => {
        setPos((p) => Math.min(filtered.length - 1, p + 1));
      }, 180);
    }
  };
  const toggleFav = () => {
    const n = !st.fav;
    setItemState('g', idx, { fav: n });
    showToast(n ? tr('toast_fav_add') : tr('toast_fav_rem'));
    if (filter === 'favorite' && !n) {
      if (safePos >= filtered.length - 1) {
        setPos(Math.max(0, filtered.length - 2));
      }
    }
  };
  useEffect(() => { setFlipped(false); }, [safePos]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Auto Play Audio Loop Engine (Synchronized 100% with Card Flip + Native Voice)
  useEffect(() => {
    if (!autoPlay) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setAutoStatus('');
      return;
    }

    let isCancelled = false;

    const runAutoPlayLoop = async () => {
      const totalOnPage = pageItems.length;
      const startIndex = pageItems.indexOf(filtered[safePos]);
      const startLoop = startIndex >= 0 ? startIndex : 0;

      showToast(tr('toast_autoplay_start'));

      for (let i = startLoop; i < totalOnPage; i++) {
        if (isCancelled) break;
        const globalIdx = pageItems[i];
        const fi = filtered.indexOf(globalIdx);
        if (fi >= 0) setPos(fi);

        // STEP 1: Turn card to FRONT side (Japanese face) & wait for animation to complete
        setFlipped(false);
        setAutoStatus(`${i + 1}/${totalOnPage} • 🇯🇵 ${lang === 'EN' ? 'Japanese Front...' : 'Bahasa Jepang...'}`);
        await new Promise(r => setTimeout(r, 600)); // Wait 600ms for front face settle
        if (isCancelled) break;

        // STEP 2: Speak Japanese word with native Japanese voice (ja-JP)
        const currentCard = cards[globalIdx];
        const jpText = currentCard[0];
        await speakAsync(jpText, 'ja-JP');

        if (isCancelled) break;
        await new Promise(r => setTimeout(r, 500)); // Wait 500ms after Japanese speech finishes
        if (isCancelled) break;

        // STEP 3: FLIP Card to BACK side (Meaning face) & wait 700ms for 3D flip transition
        setFlipped(true);
        setAutoStatus(`${i + 1}/${totalOnPage} • 🔄 ${lang === 'EN' ? 'Flipping Card...' : 'Membalik Kartu...'}`);
        await new Promise(r => setTimeout(r, 700)); // Wait 700ms so card completes 3D rotation
        if (isCancelled) break;

        // STEP 4: Speak Meaning with native Indonesian (id-ID) or English (en-US) voice
        const cardMeaning = lang === 'EN' ? (currentCard[8] || currentCard[1]) : currentCard[1];
        const meaningLang = lang === 'EN' ? 'en-US' : 'id-ID';
        setAutoStatus(`${i + 1}/${totalOnPage} • ${lang === 'EN' ? '🇬🇧 Speaking English...' : '🇮🇩 Mengucapkan Arti...'}`);
        await speakAsync(cardMeaning, meaningLang);

        if (isCancelled) break;
        await new Promise(r => setTimeout(r, 500)); // Wait 500ms after Meaning speech finishes
        if (isCancelled) break;

        // STEP 5: Pause for 2.2 seconds so user can comfortably absorb
        setAutoStatus(`${i + 1}/${totalOnPage} • ⏳ ${lang === 'EN' ? 'Next card in 2s...' : 'Kartu berikutnya (2d)...'}`);
        await new Promise(r => setTimeout(r, 2200));
        if (isCancelled) break;
      }

      if (!isCancelled) {
        setAutoPlay(false);
        setAutoStatus('');
        showToast(tr('toast_autoplay_end'));
      }
    };

    runAutoPlayLoop();

    return () => {
      isCancelled = true;
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [autoPlay]);

  const front = (
    <div className="flex h-full min-h-[260px] flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{card[6]}</span>
        <CardActions onSpeak={speakJP} isFav={st.fav} onToggleFav={toggleFav} />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
        <div className="font-jp text-4xl font-black text-slate-900 dark:text-white sm:text-5xl select-none">{card[0]}</div>
        <div className="mt-4 flex items-center gap-1.5 rounded-full bg-slate-100/80 px-3 py-1 text-[11px] font-medium text-slate-400 dark:bg-slate-800/80 dark:text-slate-500">
          <span>👆</span>
          <span>{tr('btn_flip')}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <StatusBadge status={st.status} tr={tr} />
        <span className="text-xs font-medium text-slate-400">{safePos + 1} / {filtered.length}</span>
      </div>
    </div>
  );

  const back = (
    <div className="flex h-full min-h-[260px] flex-col justify-between">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-700/60">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">{card[6]}</span>
        <span className={cls('rounded border px-2 py-0.5 text-[10px] font-bold', lang === 'EN' ? 'border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300' : 'border-rose-200 text-rose-700 dark:border-rose-800 dark:text-rose-300')}>{lang === 'EN' ? '🇬🇧 EN' : '🇮🇩 ID'}</span>
      </div>
      <div className="flex-1 space-y-2.5 overflow-y-auto py-3">
        <div>
          <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{tr('back_meaning')}</div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white">{meaning}</div>
        </div>
        <div className="rounded-lg bg-amber-50 p-2.5 dark:bg-amber-900/20">
          <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">{tr('back_formula')}</div>
          <div className="font-jp text-xs font-semibold text-amber-700 dark:text-amber-300">{card[2]}</div>
        </div>
        <div>
          <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{tr('back_example')}</div>
          <div className="font-jp text-sm font-bold text-slate-900 dark:text-white">{card[3]}</div>
          <div className="mt-0.5 text-[11px] italic text-slate-500 dark:text-slate-400">{card[4]}</div>
          <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{card[5]}</div>
        </div>
        {note && <div className="rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">💡 {note}</div>}
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-700/60">
        <StatusBadge status={st.status} tr={tr} />
        <span className="text-xs font-medium text-slate-400">{safePos + 1} / {filtered.length}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Auto Play Live Audio Status Banner */}
      {autoPlay && (
        <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-extrabold text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200 shadow-md animate-pulse">
          <div className="flex items-center gap-2 min-w-0 truncate">
            <span className="text-base">▶️</span>
            <span className="truncate">{autoStatus || 'Auto Playing Page (Audio)...'}</span>
          </div>
          <button
            onClick={() => setAutoPlay(false)}
            className="flex-shrink-0 rounded-lg bg-rose-600 px-3 py-1 text-xs font-extrabold text-white shadow-sm hover:bg-rose-700 active:scale-95 transition"
          >
            {tr('btn_stop_autoplay')}
          </button>
        </div>
      )}

      <FilterBar filter={filter} onFilter={onFilter} search={search} onSearch={onSearch} placeholder={tr('search_grammar')} total={filtered.length} countLabel={tr('count_cards')} tr={tr} />
      <div style={{ minHeight: '316px' }}><Flashcard front={front} back={back} flipped={flipped} onClick={() => setFlipped(f => !f)} /></div>
      <RatingControls onPrev={() => { setFlipped(false); setPos(p => Math.max(0, p - 1)); }} onNext={() => { setFlipped(false); setPos(p => Math.min(filtered.length - 1, p + 1)); }} onAgain={() => rate('again')} onMastered={() => rate('mastered')} tr={tr} />
      <div className="pt-2">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{tr('catalog_grammar')}</h3>
        {filtered.length === 0 ? <EmptyState tr={tr} /> : (
          <>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map(i => {
                const c = cards[i]; const s = state[`g_${i}`] || {};
                const m = lang === 'EN' ? (c[8] || c[1]) : c[1];
                return (
                  <button key={i} onClick={() => { const fi = filtered.indexOf(i); setPos(fi); setFlipped(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={cls('rounded-xl border bg-white p-3.5 text-left shadow-sm transition hover:shadow-md active:scale-[0.99] dark:bg-slate-900 min-w-0 w-full overflow-hidden', s.status === 'mastered' ? 'border-emerald-300 dark:border-emerald-800' : 'border-slate-200 dark:border-slate-700')}>
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="min-w-0 flex-1">
                        <div className="font-jp text-sm font-bold text-slate-900 dark:text-white truncate">{c[0]}</div>
                        <div className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400 break-words">{m}</div>
                      </div>
                      {s.fav && <IconStar filled />}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{c[6]}</span>
                      <StatusBadge status={s.status} tr={tr} />
                    </div>
                  </button>
                );
              })}
            </div>
            <Pagination page={page} totalPages={totalPages} onPage={setPage} lang={lang} />
          </>
        )}
      </div>
    </div>
  );
}

// ── Generic Vocab/Kanji Workspace Factory ─────────────────────────────────────
function CardWorkspace({ lang, tr, filter, onFilter, search, onSearch, state, setItemState, showToast, pos, setPos, type, autoPlay, setAutoPlay }) {
  const [flipped, setFlipped] = useState(false);
  const [page, setPage] = useState(1);
  const [autoStatus, setAutoStatus] = useState('');

  const dataset = type === 'vocab' ? vocab : kanji;
  const typeKey  = type === 'vocab' ? 'v' : 'k';
  const colorClass = type === 'vocab' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                   : 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';

  const filtered = useMemo(() => dataset.map((_, i) => i).filter(i => {
    const item = dataset[i]; const s = state[`${typeKey}_${i}`] || {};
    const hay = type === 'kanji'
      ? (item.glyph + ' ' + item.meaning_en + ' ' + item.meaning_id + ' ' + item.on + ' ' + item.kun).toLowerCase()
      : (item[0] + ' ' + item[1] + ' ' + (item[2] || '') + ' ' + (item[3] || '')).toLowerCase();
    if (search && !hay.includes(search.toLowerCase())) return false;
    if (filter === 'unrated' && (s.status === 'again' || s.status === 'mastered')) return false;
    if (filter === 'again' && s.status !== 'again') return false;
    if (filter === 'mastered' && s.status !== 'mastered') return false;
    if (filter === 'favorite' && !s.fav) return false;
    return true;
  }), [search, filter, state]);

  useEffect(() => { setPos(0); setPage(1); }, [filter, search]);

  const safePos = Math.min(pos, Math.max(0, filtered.length - 1));
  const idx = filtered[safePos] ?? 0;
  const item = dataset[idx] || dataset[0];
  const st = state[`${typeKey}_${idx}`] || { status: 'new', fav: false };

  const getWord  = () => type === 'kanji' ? item.glyph : item[0];
  const getRead  = () => type === 'kanji' ? `音: ${item.on} • 訓: ${item.kun}` : item[1];
  const getMeanEN = () => type === 'kanji' ? item.meaning_en : item[2];
  const getMeanID = () => type === 'kanji' ? item.meaning_id : item[3];
  const getMeaning = () => lang === 'EN' ? getMeanEN() : getMeanID();
  const getLabel = () => tr(`card_label_${type}`);
  const getCatalogLabel = () => tr(`catalog_${type}`);
  const getCount = () => tr(type === 'kanji' ? 'count_kanji' : 'count_vocab');
  const getSearch = () => tr(`search_${type}`);

  const speakJP = () => { if (!('speechSynthesis' in window)) return; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(getWord()); u.lang = 'ja-JP'; u.rate = 0.82; const v = getBestVoice('ja-JP'); if (v) u.voice = v; window.speechSynthesis.speak(u); };
  const rate = (status) => {
    const willLeave =
      filter === 'unrated' ||
      (filter === 'again' && status !== 'again') ||
      (filter === 'mastered' && status !== 'mastered');

    setFlipped(false);
    setItemState(typeKey, idx, { status });
    showToast(status === 'mastered' ? tr('toast_mastered') : tr('toast_again'));

    if (willLeave) {
      if (safePos >= filtered.length - 1) {
        setPos(Math.max(0, filtered.length - 2));
      }
    } else {
      setTimeout(() => {
        setPos((p) => Math.min(filtered.length - 1, p + 1));
      }, 180);
    }
  };
  const toggleFav = () => {
    const n = !st.fav;
    setItemState(typeKey, idx, { fav: n });
    showToast(n ? tr('toast_fav_add') : tr('toast_fav_rem'));
    if (filter === 'favorite' && !n) {
      if (safePos >= filtered.length - 1) {
        setPos(Math.max(0, filtered.length - 2));
      }
    }
  };
  useEffect(() => { setFlipped(false); }, [safePos]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Auto Play Audio Loop Engine for Vocab and Kanji (Synced + Native Voice)
  useEffect(() => {
    if (!autoPlay) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setAutoStatus('');
      return;
    }

    let isCancelled = false;

    const runAutoPlayLoop = async () => {
      const totalOnPage = pageItems.length;
      const startIndex = pageItems.indexOf(filtered[safePos]);
      const startLoop = startIndex >= 0 ? startIndex : 0;

      showToast(tr('toast_autoplay_start'));

      for (let i = startLoop; i < totalOnPage; i++) {
        if (isCancelled) break;
        const globalIdx = pageItems[i];
        const fi = filtered.indexOf(globalIdx);
        if (fi >= 0) setPos(fi);

        const currentItem = dataset[globalIdx];
        const wordJp = type === 'kanji' ? (currentItem.glyph + ', ' + currentItem.on) : currentItem[0];
        const itemMeaning = type === 'kanji'
          ? (lang === 'EN' ? currentItem.meaning_en : currentItem.meaning_id)
          : (lang === 'EN' ? currentItem[2] : currentItem[3]);

        // STEP 1: Turn card to FRONT side (Japanese face) & wait for animation to complete
        setFlipped(false);
        setAutoStatus(`${i + 1}/${totalOnPage} • 🇯🇵 ${lang === 'EN' ? 'Japanese Front...' : 'Bahasa Jepang...'}`);
        await new Promise(r => setTimeout(r, 600)); // Wait 600ms for front face settle
        if (isCancelled) break;

        // STEP 2: Speak Japanese word with native Japanese voice (ja-JP)
        await speakAsync(wordJp, 'ja-JP');

        if (isCancelled) break;
        await new Promise(r => setTimeout(r, 500)); // Wait 500ms after Japanese speech finishes
        if (isCancelled) break;

        // STEP 3: FLIP Card to BACK side (Meaning face) & wait 700ms for 3D flip transition
        setFlipped(true);
        setAutoStatus(`${i + 1}/${totalOnPage} • 🔄 ${lang === 'EN' ? 'Flipping Card...' : 'Membalik Kartu...'}`);
        await new Promise(r => setTimeout(r, 700)); // Wait 700ms so card completes 3D rotation
        if (isCancelled) break;

        // STEP 4: Speak Meaning with native Indonesian (id-ID) or English (en-US) voice
        const meaningLang = lang === 'EN' ? 'en-US' : 'id-ID';
        setAutoStatus(`${i + 1}/${totalOnPage} • ${lang === 'EN' ? '🇬🇧 Speaking English...' : '🇮🇩 Mengucapkan Arti...'}`);
        await speakAsync(itemMeaning, meaningLang);

        if (isCancelled) break;
        await new Promise(r => setTimeout(r, 500)); // Wait 500ms after Meaning speech finishes
        if (isCancelled) break;

        // STEP 5: Pause for 2.2 seconds so user can comfortably absorb
        setAutoStatus(`${i + 1}/${totalOnPage} • ⏳ ${lang === 'EN' ? 'Next card in 2s...' : 'Kartu berikutnya (2d)...'}`);
        await new Promise(r => setTimeout(r, 2200));
        if (isCancelled) break;
      }

      if (!isCancelled) {
        setAutoPlay(false);
        setAutoStatus('');
        showToast(tr('toast_autoplay_end'));
      }
    };

    runAutoPlayLoop();

    return () => {
      isCancelled = true;
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [autoPlay]);

  const front = (
    <div className="flex h-full min-h-[260px] flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className={cls('rounded-md px-2 py-0.5 text-[11px] font-semibold', colorClass)}>
          {type === 'kanji' ? item.theme : getLabel()}
        </span>
        <CardActions onSpeak={speakJP} isFav={st.fav} onToggleFav={toggleFav} />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
        <div className={cls('font-jp font-black text-slate-900 dark:text-white select-none', type === 'kanji' ? 'text-7xl sm:text-8xl' : 'text-5xl sm:text-6xl')}>{getWord()}</div>
        <div className="mt-4 flex items-center gap-1.5 rounded-full bg-slate-100/80 px-3 py-1 text-[11px] font-medium text-slate-400 dark:bg-slate-800/80 dark:text-slate-500">
          <span>👆</span>
          <span>{tr('btn_flip')}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <StatusBadge status={st.status} tr={tr} />
        <span className="text-xs font-medium text-slate-400">{safePos + 1} / {filtered.length}</span>
      </div>
    </div>
  );

  const back = (
    <div className="flex h-full min-h-[260px] flex-col justify-between">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-700/60">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{tr('back_vocab')}</span>
        <span className={cls('rounded border px-2 py-0.5 text-[10px] font-bold', lang === 'EN' ? 'border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300' : 'border-rose-200 text-rose-700 dark:border-rose-800 dark:text-rose-300')}>{lang === 'EN' ? '🇬🇧 EN' : '🇮🇩 ID'}</span>
      </div>
      <div className="flex-1 space-y-2.5 overflow-y-auto py-3">
        <div className="font-jp text-2xl font-bold text-slate-900 dark:text-white">{getWord()}</div>
        <div className="font-jp text-sm font-semibold text-amber-600 dark:text-amber-400">{getRead()}</div>
        <div className="text-base font-semibold text-slate-800 dark:text-slate-100">{getMeaning()}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{lang === 'EN' ? `🇮🇩 ${getMeanID()}` : `🇬🇧 ${getMeanEN()}`}</div>

        {type !== 'kanji' && getVocabExamples(item, lang).map((ex, idx) => (
          <div key={idx} className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-850">
            <div className="mb-1 flex items-center justify-between">
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${
                idx === 0
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200/70 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/50'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/50'
              }`}>
                {tr('back_example')} {idx + 1}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    const u = new SpeechSynthesisUtterance(ex.jp);
                    u.lang = 'ja-JP';
                    u.rate = 0.82;
                    const v = getBestVoice('ja-JP');
                    if (v) u.voice = v;
                    window.speechSynthesis.speak(u);
                  }
                }}
                className="rounded p-1 text-xs text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200 cursor-pointer"
                title="Dengarkan pengucapan kalimat"
              >
                🔊
              </button>
            </div>
            <div className="font-jp text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">{ex.jp}</div>
            {ex.ro && <div className="mt-0.5 text-[11px] italic text-slate-500 dark:text-slate-400 leading-snug">{ex.ro}</div>}
            {ex.meaning && <div className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-200 leading-snug">{ex.meaning}</div>}
            {ex.subMeaning && <div className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">{ex.subMeaning}</div>}
          </div>
        ))}

        {type === 'kanji' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800">
                <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{tr('onyomi')}</div>
                <div className="font-jp font-bold text-amber-600 dark:text-amber-400">{item.on}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800">
                <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{tr('kunyomi')}</div>
                <div className="font-jp font-bold text-emerald-600 dark:text-emerald-400">{item.kun}</div>
              </div>
            </div>
            {item.examples && (
              <div>
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{tr('back_compounds')}</div>
                <div className="space-y-1.5">
                  {item.examples.split(';').map((ex, i) => {
                    const p = ex.trim().split('/');
                    return <div key={i} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                      <span className="font-jp font-bold text-slate-900 dark:text-white">{p[0]}</span>
                      <span className="font-jp ml-1.5 text-xs text-amber-600 dark:text-amber-400">({p[1]})</span>
                      <span className="ml-1.5 text-xs text-slate-500 dark:text-slate-400">— {p[2]}</span>
                    </div>;
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-700/60">
        <StatusBadge status={st.status} tr={tr} />
        <span className="text-xs font-medium text-slate-400">{safePos + 1} / {filtered.length}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Auto Play Live Audio Status Banner */}
      {autoPlay && (
        <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-extrabold text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200 shadow-md animate-pulse">
          <div className="flex items-center gap-2 min-w-0 truncate">
            <span className="text-base">▶️</span>
            <span className="truncate">{autoStatus || 'Auto Playing Page (Audio)...'}</span>
          </div>
          <button
            onClick={() => setAutoPlay(false)}
            className="flex-shrink-0 rounded-lg bg-rose-600 px-3 py-1 text-xs font-extrabold text-white shadow-sm hover:bg-rose-700 active:scale-95 transition"
          >
            {tr('btn_stop_autoplay')}
          </button>
        </div>
      )}

      <FilterBar filter={filter} onFilter={onFilter} search={search} onSearch={onSearch} placeholder={getSearch()} total={filtered.length} countLabel={getCount()} tr={tr} />
      <div style={{ minHeight: '316px' }}><Flashcard front={front} back={back} flipped={flipped} onClick={() => setFlipped(f => !f)} /></div>
      <RatingControls onPrev={() => { setFlipped(false); setPos(p => Math.max(0, p - 1)); }} onNext={() => { setFlipped(false); setPos(p => Math.min(filtered.length - 1, p + 1)); }} onAgain={() => rate('again')} onMastered={() => rate('mastered')} tr={tr} />
      <div className="pt-2">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{getCatalogLabel()}</h3>
        {filtered.length === 0 ? <EmptyState tr={tr} /> : (
          <>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map(i => {
                const it = dataset[i]; const s = state[`${typeKey}_${i}`] || {};
                const word = type === 'kanji' ? it.glyph : it[0];
                const read = type === 'kanji' ? `${it.on}` : it[1];
                const meaning2 = type === 'kanji' ? (lang === 'EN' ? it.meaning_en : it.meaning_id) : (lang === 'EN' ? it[2] : it[3]);
                return (
                  <button key={i} onClick={() => { const fi = filtered.indexOf(i); setPos(fi); setFlipped(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={cls('rounded-xl border bg-white p-3.5 text-left shadow-sm transition hover:shadow-md active:scale-[0.99] dark:bg-slate-900 min-w-0 w-full overflow-hidden', s.status === 'mastered' ? 'border-emerald-300 dark:border-emerald-800' : 'border-slate-200 dark:border-slate-700')}>
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="min-w-0 flex-1">
                        {type === 'kanji'
                          ? <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-jp text-2xl font-black text-slate-900 dark:text-white flex-shrink-0">{word}</span>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 break-words">{meaning2}</div>
                                <div className="font-jp text-[11px] font-semibold text-amber-600 dark:text-amber-400 truncate mt-0.5">{read}</div>
                              </div>
                            </div>
                          : <>
                              <div className="font-jp text-base font-bold text-slate-900 dark:text-white truncate">{word}</div>
                              <div className="font-jp text-xs font-semibold text-amber-600 dark:text-amber-400 truncate">{read}</div>
                              <div className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400 break-words">{meaning2}</div>
                            </>
                        }
                      </div>
                      {s.fav && <IconStar filled />}
                    </div>
                  </button>
                );
              })}
            </div>
            <Pagination page={page} totalPages={totalPages} onPage={setPage} lang={lang} />
          </>
        )}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(() => getSession());
  const [lang, setLang] = useState(() => localStorage.getItem('n2Lang') || 'ID');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('n2Theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [activeTab, setActiveTab] = useState('grammar');
  const [filter, setFilter] = useState('all');
  const [search, setSearch]   = useState('');
  const [category, setCategory] = useState('ALL');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [autoPlay, setAutoPlay] = useState(false);

  const [gPos, setGPos] = useState(0);
  const [vPos, setVPos] = useState(0);
  const [kPos, setKPos] = useState(0);

  // Per-user isolated state key (Multi-tenant namespace per UID)
  const stateKey = session ? userKey(session.uid, 'state') : 'n2State_guest';
  const [state, setState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(stateKey) || '{}'); }
    catch { return {}; }
  });

  // Isolated cloud load on user session change
  useEffect(() => {
    try { setState(JSON.parse(localStorage.getItem(stateKey) || '{}')); }
    catch { setState({}); }

    if (session?.uid) {
      fetchStateFromCloud(session.uid).then(cloudState => {
        if (cloudState && typeof cloudState === 'object') {
          setState(cloudState);
          try { localStorage.setItem(stateKey, JSON.stringify(cloudState)); } catch {}
        }
      });
    }
  }, [stateKey, session?.uid]);

  const tr = useT(lang);

  // Cloud sync status: 'idle' | 'saving' | 'saved' | 'error'
  const [cloudSync, setCloudSync] = useState('idle');
  const syncStatusTimer = useRef(null);

  // ── setItemState: Immediately sync to localStorage AND cloud on every action ──
  // This ensures cross-device real-time updates (rate, favorite, etc.)
  const setItemState = useCallback((type, index, update) => {
    setState(prev => {
      const key = `${type}_${index}`;
      const newItemState = { ...(prev[key] || { status: 'new', fav: false }), ...update };
      
      let newFullState;
      if (newItemState.status === 'new' && !newItemState.fav) {
        newFullState = { ...prev };
        delete newFullState[key];
      } else {
        newFullState = { ...prev, [key]: newItemState };
      }

      // 1. Always persist immediately to localStorage (instant, no latency)
      try {
        localStorage.setItem(stateKey, JSON.stringify(newFullState));
      } catch {}

      // 2. Immediately sync to cloud (real-time cross-device)
      if (session?.uid) {
        if (syncStatusTimer.current) clearTimeout(syncStatusTimer.current);
        setCloudSync('saving');
        syncStateToCloud(session.uid, newFullState)
          .then(() => {
            setCloudSync('saved');
            syncStatusTimer.current = setTimeout(() => setCloudSync('idle'), 2500);
          })
          .catch(() => {
            setCloudSync('error');
            syncStatusTimer.current = setTimeout(() => setCloudSync('idle'), 3000);
          });
      }

      return newFullState;
    });
  }, [stateKey, session?.uid]);

  // ── Fallback: sync to localStorage on ANY state change (catches non-action changes) ──
  useEffect(() => {
    try { localStorage.setItem(stateKey, JSON.stringify(state)); } catch {}
  }, [state, stateKey]);

  // ── Save-on-unload safety net: sync before browser tab closes ──
  useEffect(() => {
    const handleUnload = () => {
      if (session?.uid) syncStateToCloud(session.uid, state);
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [session?.uid, state]);

  // ── 15-second cross-device polling + tab focus/visibility listener ──
  useEffect(() => {
    if (!session?.uid) return;
    const syncFromCloud = async () => {
      try {
        const cloudState = await fetchStateFromCloud(session.uid);
        if (cloudState && typeof cloudState === 'object') {
          setState(prev => {
            const hasDiff = JSON.stringify(prev) !== JSON.stringify(cloudState);
            if (!hasDiff) return prev; // No change → skip re-render
            try { localStorage.setItem(stateKey, JSON.stringify(cloudState)); } catch {}
            return cloudState;
          });
        }
      } catch {}
    };

    const interval = setInterval(syncFromCloud, 15000); // Poll every 15 seconds
    const onFocus = () => { syncFromCloud(); };
    window.addEventListener('focus', onFocus);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') syncFromCloud();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [session?.uid, stateKey]);

  useEffect(() => { localStorage.setItem('n2Lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('n2Theme', darkMode ? 'dark' : 'light'); document.documentElement.classList.toggle('dark', darkMode); }, [darkMode]);

  const showToast = useCallback((msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 2200); }, []);

  const stats = useMemo(() => {

    let mastered = 0, again = 0, fav = 0;
    Object.entries(state).forEach(([key, s]) => {
      if (s.status === 'mastered') mastered++;
      if (s.status === 'again') again++;
      if (s.fav) fav++;
    });
    const totalCount = cards.length + vocab.length + kanji.length;
    return { mastered, again, fav, total: totalCount, pct: Math.round((mastered / Math.max(1, totalCount)) * 100) };
  }, [state]);

  useEffect(() => { setFilter('all'); setSearch(''); setGPos(0); setVPos(0); setKPos(0); setAutoPlay(false); }, [activeTab]);
  useEffect(() => { setGPos(0); setAutoPlay(false); }, [category]);

  const handleLang = (l) => { setLang(l); showToast(l === 'ID' ? tr('toast_lang_id') : tr('toast_lang_en')); };
  const handleDark = () => { setDarkMode(d => { const nd = !d; showToast(nd ? tr('toast_dark') : tr('toast_light')); return nd; }); };
  const handleStart = () => { setFilter('all'); setSearch(''); showToast(tr('toast_start')); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleShuffle = () => {
    const lens = { grammar: cards.length, vocab: vocab.length, kanji: kanji.length };
    const setters = { grammar: setGPos, vocab: setVPos, kanji: setKPos };
    setters[activeTab]?.(Math.floor(Math.random() * (lens[activeTab] || 1)));
    showToast(tr('toast_shuffle'));
  };

  const handleToggleAutoPlay = () => {
    setAutoPlay(a => {
      const next = !a;
      if (next) showToast(tr('toast_autoplay_start'));
      else if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      return next;
    });
  };

  const handleLogout = () => { logoutUser(); setSession(null); setState({}); showToast(lang === 'EN' ? 'Signed out.' : 'Berhasil keluar.'); };

  // Keyboard nav
  useEffect(() => {
    const handler = e => {
      if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) return;
      const setters = { grammar: [setGPos, cards.length], vocab: [setVPos, vocab.length], kanji: [setKPos, kanji.length] };
      const [setter, len] = setters[activeTab] || [];
      if (!setter) return;
      if (e.key === 'ArrowRight') setter(p => Math.min(len - 1, p + 1));
      if (e.key === 'ArrowLeft')  setter(p => Math.max(0, p - 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTab]);

  const tabTitle = {
    grammar: tr('title_grammar'),
    vocab: tr('title_vocab'),
    kanji: tr('title_kanji'),
    favorite: tr('nav_favorites')
  }[activeTab];

  const tabDesc = {
    grammar: tr('desc_grammar'),
    vocab: tr('desc_vocab'),
    kanji: tr('desc_kanji'),
    favorite: lang === 'EN' ? 'All your saved & starred items across Grammar, Vocab, and Kanji.' : 'Semua item Favorit yang Anda simpan dari Grammar, Kosakata, dan Kanji.'
  }[activeTab];

  const navItems = [
    { key: 'grammar', icon: '文', label: tr('mob_grammar') },
    { key: 'vocab',   icon: '単', label: tr('mob_vocab') },
    { key: 'kanji',   icon: '漢', label: tr('mob_kanji') },
    { key: 'favorite',icon: '★', label: tr('mob_fav') },
  ];

  const navLabels = {
    grammar: tr('mob_grammar'),
    vocab: tr('mob_vocab'),
    kanji: tr('mob_kanji'),
    favorite: tr('mob_fav')
  };

  // Show auth page if not logged in
  if (!session) {
    return (
      <>
        <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-slate-200 bg-white/95 p-1 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
            <button onClick={() => handleLang('ID')} className={cls('rounded-lg px-2.5 py-1 text-xs font-bold transition', lang === 'ID' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-500 dark:text-slate-400')}>🇮🇩</button>
            <button onClick={() => handleLang('EN')} className={cls('rounded-lg px-2.5 py-1 text-xs font-bold transition', lang === 'EN' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-500 dark:text-slate-400')}>🇬🇧</button>
          </div>
          <button onClick={handleDark} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/95 text-slate-600 backdrop-blur transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-300">
            {darkMode ? <IconSun /> : <IconMoon />}
          </button>
        </div>
        <AuthPage onLogin={(user) => setSession(user)} lang={lang} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">

      {/* ── Native Mobile App Header (iOS/Android Native Style with Breadcrumb Trail & Quick Nav Bar) ── */}
      <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl transition-all duration-200 dark:border-slate-800/80 dark:bg-slate-900/90 sm:hidden">
        {/* Top Bar: Brand + Breadcrumb Trail + Lang + Menu Dial */}
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-100/80 dark:border-slate-800/60">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-sm">
              <span className="font-jp text-xs font-black text-white">文</span>
            </div>

            {/* Breadcrumb Trail Component */}
            <nav className="flex items-center gap-1.5 text-xs font-medium min-w-0 truncate">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate">N2 Lab</span>
              <span className="text-slate-300 dark:text-slate-600 font-bold">›</span>
              <span className="font-extrabold text-blue-600 dark:text-blue-400 truncate">
                {navLabels[activeTab]}
              </span>
              {category !== 'ALL' && activeTab === 'grammar' && (
                <>
                  <span className="text-slate-300 dark:text-slate-600 font-bold">›</span>
                  <span className="truncate rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-extrabold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {categoryNames[category] || category}
                  </span>
                </>
              )}
            </nav>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => handleLang(lang === 'ID' ? 'EN' : 'ID')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-700 transition active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {lang === 'ID' ? '🇮🇩 ID' : '🇬🇧 EN'}
            </button>
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition active:scale-95 dark:bg-blue-900/40 dark:text-blue-400"
              title="Open Menu"
            >
              <IconDial />
            </button>
          </div>
        </div>

        {/* Bottom Bar: Native Mobile Category Pills (Grammar, Vocab, Kanji, Saved) */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-1.5 hide-scroll">
          {navItems.map(item => {
            const isSelected = activeTab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => {
                  setActiveTab(item.key);
                  setFilter('all');
                }}
                className={cls(
                  'flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all duration-200 active:scale-95',
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                )}
              >
                <span className="font-jp text-xs">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── App Header (Desktop View with Breadcrumb Trail) ── */}
      <header className="sticky top-0 z-40 hidden border-b border-slate-200/80 bg-white/80 backdrop-blur-xl transition-all duration-200 dark:border-slate-800/80 dark:bg-slate-900/80 sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6">

          {/* Left Logo + Desktop Sidebar Toggle + Breadcrumb Trail */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              title="Toggle Sidebar"
            >
              <IconMenu />
            </button>

            {/* Brand Title + Breadcrumbs */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20">
                <span className="font-jp text-sm font-black text-white">文</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">N2 Study Lab</span>
                  <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-extrabold text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                    Pro
                  </span>
                </div>
                {/* Desktop Breadcrumb Trail */}
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  <span>Home</span>
                  <span>›</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {navLabels[activeTab]}
                  </span>
                  {category !== 'ALL' && activeTab === 'grammar' && (
                    <>
                      <span>›</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {categoryNames[category] || category}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">

            {/* Language Switcher */}
            <div className="flex items-center rounded-xl border border-slate-200/80 bg-slate-100/70 p-0.5 dark:border-slate-700/80 dark:bg-slate-800/80">
              <button
                onClick={() => handleLang('ID')}
                className={cls('rounded-lg px-2.5 py-1 text-xs font-bold transition-all duration-200', lang === 'ID' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200')}
              >
                🇮🇩 ID
              </button>
              <button
                onClick={() => handleLang('EN')}
                className={cls('rounded-lg px-2.5 py-1 text-xs font-bold transition-all duration-200', lang === 'EN' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200')}
              >
                🇬🇧 EN
              </button>
            </div>

            {/* Desktop Quick Menu Dial Button to open Bottom Drawer */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <IconDial />
              <span>{tr('drawer_title')}</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={handleDark}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {darkMode ? <IconSun /> : <IconMoon />}
            </button>

            {/* Cloud Sync Status Badge */}
            {session?.uid && cloudSync !== 'idle' && (
              <div className={cls(
                'flex items-center gap-1 rounded-xl border px-2.5 py-1 text-[11px] font-bold transition-all',
                cloudSync === 'saving' ? 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-400' :
                cloudSync === 'saved'  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                         'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400'
              )}>
                {cloudSync === 'saving' ? '☁️' : cloudSync === 'saved' ? '✓' : '⚠️'}
                <span className="hidden sm:inline">
                  {cloudSync === 'saving' ? (lang === 'EN' ? 'Saving...' : 'Menyimpan...') :
                   cloudSync === 'saved'  ? (lang === 'EN' ? 'Saved' : 'Tersimpan') :
                                            (lang === 'EN' ? 'Sync error' : 'Error sync')}
                </span>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title={lang === 'EN' ? 'Sign out' : 'Keluar'}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
            >
              <IconLogout />
            </button>

          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="mx-auto flex max-w-7xl">

        {/* ── Sidebar ── */}
        {sidebarOpen && (
          <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-64 flex-shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:block">
            <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{tr('menu_label')}</div>
            <nav className="space-y-0.5">
              {[
                { key: 'grammar', icon: '文', label: tr('nav_grammar'), count: cards.length },
                { key: 'vocab',   icon: '単', label: tr('nav_vocab'),   count: vocab.length },
                { key: 'kanji',   icon: '漢', label: tr('nav_kanji'),   count: kanji.length },
              ].map(item => (
                <button key={item.key} onClick={() => { setActiveTab(item.key); setFilter('all'); }}
                  className={cls('sidebar-item flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-medium transition',
                    activeTab === item.key ? 'active' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800')}>
                  <span className="flex items-center gap-2.5">
                    <span className="font-jp text-sm font-bold text-blue-600 dark:text-blue-400">{item.icon}</span>
                    <span>{item.label}</span>
                  </span>
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">{item.count}</span>
                </button>
              ))}
              <button onClick={() => { setActiveTab('favorite'); setFilter('all'); }}
                className={cls('sidebar-item flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-medium transition',
                  activeTab === 'favorite' ? 'active' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800')}>
                <span className="flex items-center gap-2.5"><span className="text-amber-500">★</span><span>{tr('nav_favorites')}</span></span>
                <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">{stats.fav}</span>
              </button>
            </nav>

            {/* Learning Map */}
            <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
              <div className="mb-2 flex items-center justify-between px-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{tr('category_label')}</span>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{tr('learning_map')}</span>
              </div>
              <div className="max-h-52 space-y-0.5 overflow-y-auto pr-1 hide-scroll">
                {Object.entries(categoryNames).map(([key, name]) => (
                  <button key={key} onClick={() => { setActiveTab('grammar'); setCategory(key); }}
                    className={cls('flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition',
                      category === key && activeTab === 'grammar'
                        ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800')}>
                    <span className="truncate">{name}</span>
                    <span className="ml-2 flex-shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {key === 'ALL' ? cards.length : cards.filter(c => c[6] === key).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Progress */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/60">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{tr('progress_label')}</div>
              <div className="mt-2 flex items-end justify-between">
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.pct}%</span>
                <span className="text-[11px] text-slate-500">{stats.mastered} / {stats.total}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${stats.pct}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[10px]">
                {[['emerald', stats.mastered, tr('known_label')], ['rose', stats.again, tr('review_label')], ['amber', stats.fav, tr('fav_label')]].map(([c, v, l]) => (
                  <div key={c} className="rounded-lg border border-slate-200 bg-white p-1.5 dark:border-slate-700 dark:bg-slate-900">
                    <div className={`font-bold text-${c}-600 dark:text-${c}-400`}>{v}</div>
                    <div className="text-slate-500 dark:text-slate-400">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* ── Main ── */}
        <main className="min-w-0 flex-1 px-3 pb-28 pt-4 sm:px-6 sm:pb-12 sm:pt-5">
          {/* Workspace banner */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">{tabTitle}</div>
                <p className="mt-0.5 max-w-xl text-xs text-slate-500 dark:text-slate-400">{tabDesc}</p>
              </div>
              {activeTab !== 'favorite' && (
                <div className="flex flex-wrap items-center gap-2">
                  {/* Auto Play Audio Button */}
                  <button
                    onClick={handleToggleAutoPlay}
                    className={cls(
                      'rounded-xl px-3.5 py-2 text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1.5',
                      autoPlay
                        ? 'bg-rose-600 text-white hover:bg-rose-700 animate-pulse shadow-rose-500/20'
                        : 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20'
                    )}
                  >
                    {autoPlay ? tr('btn_stop_autoplay') : tr('btn_autoplay')}
                  </button>

                  <button onClick={handleStart} className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95">{tr('btn_start')}</button>
                  <button onClick={handleShuffle} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">{tr('btn_shuffle')}</button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5">
            {activeTab === 'grammar'  && <GrammarWorkspace lang={lang} tr={tr} filter={filter} onFilter={setFilter} search={search} onSearch={setSearch} state={state} setItemState={setItemState} showToast={showToast} pos={gPos} setPos={setGPos} category={category} autoPlay={autoPlay} setAutoPlay={setAutoPlay} />}
            {activeTab === 'vocab'    && <CardWorkspace type="vocab"   lang={lang} tr={tr} filter={filter} onFilter={setFilter} search={search} onSearch={setSearch} state={state} setItemState={setItemState} showToast={showToast} pos={vPos} setPos={setVPos} autoPlay={autoPlay} setAutoPlay={setAutoPlay} />}
            {activeTab === 'kanji'    && <CardWorkspace type="kanji"   lang={lang} tr={tr} filter={filter} onFilter={setFilter} search={search} onSearch={setSearch} state={state} setItemState={setItemState} showToast={showToast} pos={kPos} setPos={setKPos} autoPlay={autoPlay} setAutoPlay={setAutoPlay} />}
            {activeTab === 'favorite' && <FavoritesWorkspace lang={lang} tr={tr} state={state} setItemState={setItemState} showToast={showToast} setActiveTab={setActiveTab} />}
          </div>
        </main>
      </div>

      {/* ── Ultra Modern Animated Bottom Navigation Bar ── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 backdrop-blur-xl transition-all duration-300 dark:border-slate-800/80 dark:bg-slate-900/90 sm:hidden shadow-[0_-4px_25px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_25px_rgba(0,0,0,0.4)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around px-1 py-1.5">
          {navItems.map(item => {
            const isActive = activeTab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => {
                  setActiveTab(item.key);
                  setFilter('all');
                }}
                className={cls(
                  'group relative flex flex-1 flex-col items-center justify-center py-1 transition-all duration-300 active:scale-95',
                  isActive ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                )}
              >
                <div
                  className={cls(
                    'nav-tab-indicator flex h-8 w-12 items-center justify-center rounded-2xl transition-all duration-300',
                    isActive
                      ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 scale-105 shadow-sm'
                      : 'bg-transparent'
                  )}
                >
                  <span className={cls('font-jp text-base transition-transform duration-300', isActive ? 'scale-110' : 'scale-100')}>
                    {item.icon}
                  </span>
                </div>
                <span className="mt-0.5 text-[10px] tracking-tight transition-colors duration-200">
                  {item.label}
                </span>

                {isActive && (
                  <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                )}
              </button>
            );
          })}

          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-1 flex-col items-center justify-center py-1 text-slate-400 hover:text-blue-600 transition-all duration-300 active:scale-95 dark:text-slate-500 dark:hover:text-blue-400"
          >
            <div className="flex h-8 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600/10 to-indigo-600/10 text-blue-600 dark:from-blue-500/20 dark:to-indigo-500/20 dark:text-blue-400">
              <IconDial />
            </div>
            <span className="mt-0.5 text-[10px] font-semibold tracking-tight">{tr('mob_menu')}</span>
          </button>
        </div>
      </nav>

      {/* ── MUI Style Bottom Sheet Drawer Modal ── */}
      <MUIBottomDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        session={session}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        category={category}
        setCategory={setCategory}
        filter={filter}
        setFilter={setFilter}
        lang={lang}
        handleLang={handleLang}
        darkMode={darkMode}
        handleDark={handleDark}
        handleLogout={handleLogout}
        stats={stats}
        tr={tr}
      />

      <Toast msg={toastMsg} />
    </div>
  );
}
