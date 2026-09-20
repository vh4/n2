import React from 'react';
import { cls } from '../../lib/utils';
import { categoryNames } from '../../data/categories';
import { cards } from '../../data/cards';
import { vocab } from '../../data/vocab';
import { kanji } from '../../data/kanji';
import {
  MdClose,
  MdLightMode,
  MdDarkMode,
  MdLogout,
  MdStar,
  MdTranslate
} from 'react-icons/md';

/**
 * MobileDrawer Component.
 * Material UI-style slide-up bottom sheet drawer modal:
 *  - Smooth backdrop fade (`animate-backdrop-fade`) and slide-up transition (`animate-drawer-slide-up`).
 *  - Grab handle bar for touch ergonomics.
 *  - Material dial cards (`animate-dial-pop`) for fast switching between Bunpou, Vocab, Kanji, and Favorites.
 *  - Language switcher, Dark/Light mode toggle with react-icons.
 *  - Interactive Bunpou Category chip selection.
 *  - User profile details and Sign out action.
 *
 * @param {object} props
 * @param {boolean} props.open - Whether drawer is currently visible.
 * @param {() => void} props.onClose - Drawer close handler.
 * @param {object} props.session - Active user session.
 * @param {string} props.activeTab - Currently active module tab.
 * @param {(tab: string) => void} props.setActiveTab - Module tab change handler.
 * @param {'EN'|'ID'} props.lang - Active language.
 * @param {(lang: 'EN'|'ID') => void} props.handleLang - Language change handler.
 * @param {boolean} props.darkMode - Dark mode flag.
 * @param {() => void} props.handleDark - Theme toggle handler.
 * @param {() => void} props.handleLogout - User logout handler.
 * @param {string} props.category - Active Bunpou category.
 * @param {(cat: string) => void} props.setCategory - Category change handler.
 * @param {{ mastered: number, again: number, fav: number, total: number }} props.stats - Summary study stats.
 * @param {(key: string) => string} props.tr - Translation function.
 * @returns {JSX.Element|null} Rendered Material bottom sheet drawer or null.
 */
export function MobileDrawer({
  open,
  onClose,
  session,
  activeTab,
  setActiveTab,
  lang,
  handleLang,
  darkMode,
  handleDark,
  handleLogout,
  category,
  setCategory,
  stats,
  tr
}) {
  if (!open) return null;

  const mainDialItems = [
    { key: 'grammar', icon: '文', label: tr('mob_grammar'), count: cards.length, color: 'from-blue-500 to-blue-600' },
    { key: 'vocab',   icon: '単', label: tr('mob_vocab'),   count: vocab.length, color: 'from-emerald-500 to-emerald-600' },
    { key: 'kanji',   icon: '漢', label: tr('mob_kanji'),   count: kanji.length, color: 'from-amber-500 to-amber-600' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
      {/* Smooth Backdrop with Fade-In Animation */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-backdrop-fade transition-opacity duration-300"
        aria-hidden="true"
      />

      {/* Slide-Up Bottom Sheet Drawer */}
      <div
        className="relative z-10 w-full rounded-t-[32px] border-t border-slate-200/80 bg-white px-5 pb-8 pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.18)] dark:border-slate-800/80 dark:bg-slate-900 dark:shadow-[0_-12px_40px_rgba(0,0,0,0.6)] animate-drawer-slide-up max-h-[85vh] overflow-y-auto custom-scroll"
        role="dialog"
        aria-modal="true"
      >
        {/* Grab Handle */}
        <div className="mb-3 flex justify-center">
          <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Drawer Header: User Information & Close Button */}
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3.5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md">
              <span className="font-jp text-base font-black text-white">文</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {session?.displayName || 'Student'}
                </span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                  JLPT N2
                </span>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500">
                {tr('drawer_subtitle')}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 active:scale-95 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 cursor-pointer"
            aria-label="Close drawer"
          >
            <MdClose className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Module Navigation Cards */}
        <div className="mb-4">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {tr('drawer_title')}
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {mainDialItems.map((item, idx) => {
              const isSelected = activeTab === item.key;

              return (
                <button
                  key={item.key}
                  style={{ animationDelay: `${idx * 0.04}s` }}
                  onClick={() => {
                    setActiveTab(item.key);
                    onClose();
                  }}
                  className={cls(
                    'animate-dial-pop flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 transition-all duration-200 active:scale-95 cursor-pointer',
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 dark:shadow-blue-600/30'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800'
                  )}
                >
                  <div
                    className={cls(
                      'flex h-10 w-10 items-center justify-center rounded-xl font-jp text-base font-bold shadow-sm',
                      isSelected ? 'bg-white/20 text-white' : `bg-gradient-to-tr ${item.color} text-white`
                    )}
                  >
                    {item.icon}
                  </div>
                  <span className="truncate text-xs font-bold">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Favorites Action Button */}
          <button
            onClick={() => {
              setActiveTab('favorite');
              onClose();
            }}
            className={cls(
              'mt-2.5 flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all duration-200 active:scale-98 cursor-pointer',
              activeTab === 'favorite'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'border border-amber-200/80 bg-amber-50/60 text-amber-700 hover:bg-amber-100/70 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300'
            )}
          >
            <div className="flex items-center gap-2">
              <MdStar className="h-4 w-4 text-amber-500 fill-amber-400" />
              <span>{tr('nav_favorites')}</span>
            </div>
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-300">
              {stats?.fav || 0} {tr('count_cards')}
            </span>
          </button>
        </div>

        {/* Account, Language & Theme Settings */}
        <div className="mb-4 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {tr('drawer_account')} &amp; {tr('drawer_theme')}
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
            {/* Language Selection */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <MdTranslate className="h-4 w-4 text-blue-500" />
                <span>{tr('drawer_language')}</span>
              </span>
              <div className="flex rounded-xl bg-slate-200/70 p-1 dark:bg-slate-900">
                <button
                  onClick={() => handleLang('ID')}
                  className={cls(
                    'rounded-lg px-3 py-1 text-xs font-bold transition-all duration-200 cursor-pointer',
                    lang === 'ID'
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  🇮🇩 ID
                </button>
                <button
                  onClick={() => handleLang('EN')}
                  className={cls(
                    'rounded-lg px-3 py-1 text-xs font-bold transition-all duration-200 cursor-pointer',
                    lang === 'EN'
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  🇬🇧 EN
                </button>
              </div>
            </div>

            <div className="h-px bg-slate-200/70 dark:bg-slate-800" />

            {/* Dark Mode & Logout Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDark}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white py-2 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                {darkMode ? <MdLightMode className="h-4 w-4 text-amber-500" /> : <MdDarkMode className="h-4 w-4 text-indigo-400" />}
                <span>{darkMode ? 'Light' : 'Dark'} Mode</span>
              </button>

              <button
                onClick={() => {
                  handleLogout();
                  onClose();
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-rose-200/80 bg-rose-50/80 py-2 px-3 text-xs font-bold text-rose-600 transition hover:bg-rose-100 active:scale-95 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400 cursor-pointer"
              >
                <MdLogout className="h-4 w-4" />
                <span>{lang === 'EN' ? 'Sign out' : 'Keluar'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bunpou Categories Quick Filter */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {tr('category_label')}
            </span>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
              {Object.keys(categoryNames).length} Categories
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto custom-scroll pr-1">
            {Object.entries(categoryNames).map(([key, name]) => {
              const count = key === 'ALL' ? cards.length : cards.filter((c) => c[6] === key).length;
              const isSelected = category === key && activeTab === 'grammar';

              return (
                <button
                  key={key}
                  onClick={() => {
                    setActiveTab('grammar');
                    setCategory(key);
                    onClose();
                  }}
                  className={cls(
                    'rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 active:scale-95 cursor-pointer',
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'border border-slate-200/80 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300'
                  )}
                >
                  {name} <span className="opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
