import React from 'react';
import { cls } from '../../lib/utils';
import { categoryNames } from '../../data/categories';
import { cards } from '../../data/cards';
import { vocab } from '../../data/vocab';
import { kanji } from '../../data/kanji';
import { MdStar } from 'react-icons/md';

/**
 * Sidebar Component.
 * Desktop collapsible navigation sidebar:
 *  - Pinned sticky layout `h-[calc(100vh-57px)]` ensuring footer progress never gets cut off.
 *  - Primary learning modules (Grammar, Vocab, Kanji, Favorites).
 *  - Fully flexible, scrollable Grammar Bunpou category filters with sleek custom scrollbar.
 *  - Pinned Study Progress & Mastery Card docked at the bottom.
 *
 * @param {object} props
 * @param {string} props.activeTab - Currently active tab ('grammar'|'vocab'|'kanji'|'favorite').
 * @param {(tab: string) => void} props.setActiveTab - Tab change handler.
 * @param {string} props.category - Active Bunpou category filter.
 * @param {(cat: string) => void} props.setCategory - Category change handler.
 * @param {Array<string>} props.categories - List of all available Bunpou categories.
 * @param {{ mastered: number, again: number, fav: number, total: number }} props.stats - Summary study progress stats.
 * @param {(key: string) => string} props.tr - Translation function.
 * @returns {JSX.Element} Desktop navigation sidebar.
 */
export function Sidebar({
  activeTab,
  setActiveTab,
  category,
  setCategory,
  stats,
  tr
}) {
  const navTabs = [
    { id: 'grammar', icon: '文', labelKey: 'nav_grammar', count: cards.length, color: 'text-blue-600 dark:text-blue-400' },
    { id: 'vocab',   icon: '単', labelKey: 'nav_vocab',   count: vocab.length, color: 'text-emerald-600 dark:text-emerald-400' },
    { id: 'kanji',   icon: '漢', labelKey: 'nav_kanji',   count: kanji.length, color: 'text-amber-600 dark:text-amber-400' },
  ];

  const percentMastered = stats.total > 0
    ? Math.round((stats.mastered / stats.total) * 100)
    : 0;

  return (
    <aside className="hidden lg:flex sticky top-[57px] h-[calc(100vh-57px)] w-72 flex-shrink-0 flex-col justify-between border-r border-slate-200/80 bg-white/80 p-4 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/80 z-20">
      {/* Top Section: Modules & Flexible Scrollable Categories */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden space-y-4">
        {/* Navigation Modules */}
        <div className="flex-shrink-0">
          <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {tr('menu_label')}
          </div>
          <nav className="space-y-1">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cls(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition cursor-pointer',
                    isActive
                      ? 'bg-blue-50 font-bold text-blue-700 shadow-sm dark:bg-blue-900/40 dark:text-blue-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={cls('font-jp text-sm font-black', tab.color)}>{tab.icon}</span>
                    <span>{tr(tab.labelKey)}</span>
                  </div>
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {tab.count}
                  </span>
                </button>
              );
            })}

            {/* Favorites module */}
            <button
              onClick={() => setActiveTab('favorite')}
              className={cls(
                'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition cursor-pointer',
                activeTab === 'favorite'
                  ? 'bg-amber-50 font-bold text-amber-700 shadow-sm dark:bg-amber-950/40 dark:text-amber-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
              )}
            >
              <div className="flex items-center gap-2.5">
                <MdStar className="h-4 w-4 text-amber-500 fill-amber-400" />
                <span>{tr('nav_favorites')}</span>
              </div>
              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                {stats.fav}
              </span>
            </button>
          </nav>
        </div>

        {/* Grammar Categories (Takes remaining vertical space and scrolls smoothly) */}
        {activeTab === 'grammar' && (
          <div className="flex flex-col flex-1 min-h-0 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
            <div className="mb-2 flex items-center justify-between px-2 flex-shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {tr('category_label')}
              </span>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                {tr('learning_map')}
              </span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 space-y-0.5 custom-scroll">
              {Object.entries(categoryNames).map(([key, name]) => {
                const count = key === 'ALL' ? cards.length : cards.filter((c) => c[6] === key).length;
                const isSelected = category === key;

                return (
                  <button
                    key={key}
                    onClick={() => setCategory(key)}
                    className={cls(
                      'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition cursor-pointer',
                      isSelected
                        ? 'bg-blue-50 font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    )}
                  >
                    <span className="truncate">{name}</span>
                    <span className="ml-2 flex-shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Pinned Study Progress & Mastery Card (Always docked at bottom of sidebar) */}
      <div className="mt-auto flex-shrink-0 pt-3">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-slate-800/80 dark:bg-slate-950/60 shadow-sm">
          <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>{tr('progress_label')}</span>
            <span className="text-blue-600 dark:text-blue-400 font-extrabold">{percentMastered}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${percentMastered}%` }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span>{stats.mastered} {tr('known_label')}</span>
            <span>{stats.again} {tr('review_label')}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
