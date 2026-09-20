import React, { useState, useMemo } from 'react';
import { cards } from '../../../data/cards';
import { vocab } from '../../../data/vocab';
import { kanji } from '../../../data/kanji';
import { cls } from '../../../lib/utils';
import { EmptyState } from '../../../components/ui/EmptyState';
import { MdSearch, MdStar, MdArrowForward } from 'react-icons/md';

/**
 * FavoritesWorkspace Component.
 * Unified view compiling all starred items across Grammar Bunpou, Kosakata N2, and Kanji N2:
 *  - Sub-filter tabs: All Favorites, Grammar only, Vocab only, Kanji only.
 *  - Search filter by Japanese word, reading, meaning, or category tag.
 *  - Quick unstar action with immediate multi-tenant database synchronization.
 *  - Jump to card in its dedicated study workspace.
 *
 * @param {object} props
 * @param {'EN'|'ID'} props.lang - Active language code.
 * @param {(key: string) => string} props.tr - Translation function.
 * @param {object} props.state - User study state dictionary.
 * @param {(type: 'g'|'v'|'k', index: number, update: object) => void} props.setItemState - State mutator.
 * @param {(msg: string) => void} props.showToast - Toast notification display handler.
 * @param {(tab: string) => void} props.setActiveTab - Tab navigation handler.
 * @returns {JSX.Element} Unified favorites workspace.
 */
export function FavoritesWorkspace({
  lang,
  tr,
  state,
  setItemState,
  showToast,
  setActiveTab
}) {
  const [subFilter, setSubFilter] = useState('all'); // 'all' | 'grammar' | 'vocab' | 'kanji'
  const [search, setSearch] = useState('');

  // Extract all items currently marked as fav: true across all 3 datasets
  const favoriteItems = useMemo(() => {
    const list = [];

    // 1. Grammar Bunpou favorites
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
          tag: c[6] || 'Bunpou',
          state: s
        });
      }
    });

    // 2. Vocabulary favorites
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

  // Filter according to sub-filter chip and search keyword
  const filtered = useMemo(() => {
    return favoriteItems.filter((item) => {
      if (subFilter !== 'all' && item.module !== subFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = (item.word + ' ' + (item.reading || '') + ' ' + item.meaning + ' ' + item.tag).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [favoriteItems, subFilter, search]);

  const removeFav = (typeKey, index) => {
    setItemState(typeKey, index, { fav: false });
    showToast(tr('toast_fav_rem'));
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar: Search + Module Chips */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex flex-1 items-center rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 dark:border-slate-800 dark:bg-slate-900 sm:max-w-xs">
          <MdSearch className="h-5 w-5 text-slate-400 dark:text-slate-500 mr-2 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
            placeholder="Search favorites..."
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder-slate-400 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {[
            { id: 'all', label: 'All' },
            { id: 'grammar', label: 'Grammar' },
            { id: 'vocab', label: 'Vocab' },
            { id: 'kanji', label: 'Kanji' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubFilter(tab.id)}
              className={cls(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer',
                subFilter === tab.id
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
              )}
            >
              {tab.label}
            </button>
          ))}
          <span className="ml-1 text-xs font-bold text-amber-600 dark:text-amber-400">
            {filtered.length} items
          </span>
        </div>
      </div>

      {/* Favorites List Grid */}
      {filtered.length === 0 ? (
        <EmptyState tr={tr} />
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div
              key={`${item.typeKey}_${item.index}`}
              className="group relative flex flex-col justify-between rounded-2xl border border-amber-200/80 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-amber-900/40 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                    {item.tag}
                  </span>
                  <button
                    onClick={() => removeFav(item.typeKey, item.index)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition cursor-pointer active:scale-95"
                    title="Remove from favorites"
                  >
                    <MdStar className="h-4 w-4 fill-amber-400 text-amber-500" />
                  </button>
                </div>

                <div className="mt-2.5">
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {item.word}
                  </div>
                  {item.reading && (
                    <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      {item.reading}
                    </div>
                  )}
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {item.meaning}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {item.module} #{item.index + 1}
                </span>
                <button
                  onClick={() => setActiveTab(item.module)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400 cursor-pointer"
                >
                  <span>Study</span>
                  <MdArrowForward className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
