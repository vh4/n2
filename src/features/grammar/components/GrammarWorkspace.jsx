import React, { useState, useEffect, useMemo } from 'react';
import { cards } from '../../../data/cards';
import { cls } from '../../../lib/utils';
import { speakJapanese, speakAsync, stopSpeech } from '../../../services/speech/speech.service';
import { Flashcard } from '../../../components/ui/Flashcard';
import { RatingControls } from '../../../components/ui/RatingControls';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { FilterBar } from '../../../components/ui/FilterBar';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/ui/EmptyState';
import { MdVolumeUp, MdStar, MdStarBorder } from 'react-icons/md';

/**
 * GrammarWorkspace Component.
 * Interactive study and catalog workspace for 235 JLPT N2 Grammar (Bunpou) patterns:
 *  - Flashcard front: Grammar formula pattern and meaning.
 *  - Flashcard back: Full sentence formation formula, example sentences in Kanji, Romaji, and translation.
 *  - Auto Play engine: Sequentially loops through cards, speaks Japanese, flips, and speaks meaning in ID or EN.
 *  - Interactive rating: Rate as 'mastered' or 'again', toggle 'favorite'.
 *  - Catalog view: Filterable and searchable paginated grid.
 *
 * @param {object} props
 * @param {'EN'|'ID'} props.lang - Active language code.
 * @param {(key: string) => string} props.tr - Translation function.
 * @param {string} props.filter - 'all' | 'again' | 'mastered' | 'favorite'.
 * @param {(f: string) => void} props.onFilter - Filter change callback.
 * @param {string} props.search - Active search keyword.
 * @param {(q: string) => void} props.onSearch - Search query callback.
 * @param {object} props.state - Active user study state dictionary.
 * @param {(type: 'g'|'v'|'k', index: number, update: object) => void} props.setItemState - State mutator.
 * @param {(msg: string) => void} props.showToast - Toast notification display handler.
 * @param {number} props.pos - Active flashcard index within filtered list.
 * @param {React.Dispatch<React.SetStateAction<number>>} props.setPos - Position setter.
 * @param {string} props.category - Active Bunpou category.
 * @param {boolean} props.autoPlay - Auto Play active flag.
 * @param {boolean} props.isLoaded - True when authoritative cloud state has been fetched.
 * @returns {JSX.Element} Grammar study workspace.
 */
export function GrammarWorkspace({
  lang,
  tr,
  filter,
  onFilter,
  search,
  onSearch,
  state,
  setItemState,
  showToast,
  pos,
  setPos,
  category,
  autoPlay,
  setAutoPlay,
  isLoaded = true
}) {
  const [flipped, setFlipped] = useState(false);
  const [page, setPage] = useState(1);
  const [autoStatus, setAutoStatus] = useState('');

  // Filter items according to search query, rating filter, and Bunpou category
  const filtered = useMemo(() => {
    return cards.map((_, i) => i).filter((i) => {
      const c = cards[i];
      const s = state[`g_${i}`] || {};
      const hay = c.join(' ').toLowerCase();

      if (search && !hay.includes(search.toLowerCase())) return false;
      if (filter === 'again' && s.status !== 'again') return false;
      if (filter === 'mastered' && s.status !== 'mastered') return false;
      if (filter === 'favorite' && !s.fav) return false;
      if (category !== 'ALL' && c[6] !== category) return false;
      return true;
    });
  }, [search, filter, state, category]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [filtered.length, filter, search, category]);

  const safePos = Math.min(pos, Math.max(0, filtered.length - 1));
  const idx = filtered[safePos] ?? 0;
  const card = cards[idx] || cards[0];
  const st = state[`g_${idx}`] || { status: 'new', fav: false };

  const meaning = lang === 'EN' ? (card[8] || card[1]) : card[1];
  const note = lang === 'EN' ? (card[9] || card[7]) : card[7];

  const rate = (status) => {
    setItemState('g', idx, { status });
    showToast(status === 'mastered' ? tr('toast_mastered') : tr('toast_again'));
    setFlipped(false);
    setTimeout(() => setPos((p) => Math.min(filtered.length - 1, p + 1)), 180);
  };

  const toggleFav = () => {
    const nextFav = !st.fav;
    setItemState('g', idx, { fav: nextFav });
    showToast(nextFav ? tr('toast_fav_add') : tr('toast_fav_rem'));
  };

  const speakJP = (e) => {
    if (e) e.stopPropagation();
    speakJapanese(card[0]);
  };

  // Pagination for catalog table
  const PAGE_SIZE = 12;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Auto Play Audio Loop
  useEffect(() => {
    if (!autoPlay) {
      stopSpeech();
      setAutoStatus('');
      return;
    }

    let isCancelled = false;

    const runLoop = async () => {
      showToast(tr('toast_autoplay_start'));
      const startIdx = safePos;
      const totalOnPage = filtered.length;

      for (let i = startIdx; i < totalOnPage; i++) {
        if (isCancelled) break;

        setPos(i);
        setFlipped(false);

        const currentCard = cards[filtered[i]] || cards[0];

        // Step 1: Speak Japanese
        setAutoStatus(`${i + 1}/${totalOnPage} • 🇯🇵 Speaking Japanese...`);
        await speakAsync(currentCard[0], 'ja-JP');
        if (isCancelled) break;

        await new Promise((r) => setTimeout(r, 600));
        if (isCancelled) break;

        // Step 2: Flip Card to Back
        setFlipped(true);
        await new Promise((r) => setTimeout(r, 700));
        if (isCancelled) break;

        // Step 3: Speak Meaning in Indonesian or English
        const cardMeaning = lang === 'EN' ? (currentCard[8] || currentCard[1]) : currentCard[1];
        const meaningLang = lang === 'EN' ? 'en-US' : 'id-ID';
        setAutoStatus(`${i + 1}/${totalOnPage} • ${lang === 'EN' ? '🇬🇧 Speaking English...' : '🇮🇩 Mengucapkan Arti...'}`);
        await speakAsync(cardMeaning, meaningLang);
        if (isCancelled) break;

        // Step 4: Pause before next card
        setAutoStatus(`${i + 1}/${totalOnPage} • ⏳ Next card in 2s...`);
        await new Promise((r) => setTimeout(r, 2000));
        if (isCancelled) break;
      }

      if (!isCancelled) {
        setAutoPlay(false);
        setAutoStatus('');
        showToast(tr('toast_autoplay_end'));
      }
    };

    runLoop();

    return () => {
      isCancelled = true;
      stopSpeech();
    };
  }, [autoPlay]);

  const frontContent = (
    <div className="flex h-full min-h-[260px] flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
          {card[6]}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={speakJP}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 cursor-pointer shadow-sm"
            title="Pronounce Japanese"
          >
            <MdVolumeUp className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toggleFav(); }}
            className={cls(
              'flex h-8 w-8 items-center justify-center rounded-xl border transition active:scale-95 cursor-pointer shadow-sm',
              st.fav
                ? 'border-amber-300 bg-amber-50 text-amber-500 dark:border-amber-800 dark:bg-amber-950/50'
                : 'border-slate-200 bg-white text-slate-400 hover:text-amber-500 dark:border-slate-800 dark:bg-slate-800'
            )}
            title="Star Favorite"
          >
            {st.fav ? (
              <MdStar className="h-4 w-4 fill-amber-400 text-amber-400" />
            ) : (
              <MdStarBorder className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-4 text-center">
        <div className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white">
          {card[0]}
        </div>
        <div className="mt-3 max-w-xs text-sm font-medium text-slate-500 dark:text-slate-400">
          {meaning}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <StatusBadge status={st.status} tr={tr} />
        <span className="text-xs font-medium text-slate-400">
          {safePos + 1} / {filtered.length}
        </span>
      </div>
    </div>
  );

  const backContent = (
    <div className="flex h-full min-h-[260px] flex-col justify-between">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          {card[6]}
        </span>
        <span className={cls('rounded border px-2 py-0.5 text-[10px] font-bold', lang === 'EN' ? 'border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300' : 'border-rose-200 text-rose-700 dark:border-rose-800 dark:text-rose-300')}>
          {lang === 'EN' ? '🇬🇧 EN' : '🇮🇩 ID'}
        </span>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto py-3">
        <div>
          <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {tr('back_meaning')}
          </div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            {meaning}
          </div>
        </div>

        <div className="rounded-lg bg-amber-50 p-2.5 dark:bg-amber-950/30">
          <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            {tr('back_formula')}
          </div>
          <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">
            {card[2]}
          </div>
        </div>

        <div>
          <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {tr('back_example')}
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            {card[3]}
          </div>
          <div className="mt-0.5 text-[11px] italic text-slate-500 dark:text-slate-400">
            {card[4]}
          </div>
          <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
            {card[5]}
          </div>
        </div>

        {note && (
          <div className="rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-500 dark:bg-slate-850 dark:text-slate-400">
            💡 {note}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
        <StatusBadge status={st.status} tr={tr} />
        <span className="text-xs font-medium text-slate-400">
          {safePos + 1} / {filtered.length}
        </span>
      </div>
    </div>
  );

  /**
   * Skeleton loader shown while cloud state is being fetched.
   * Only shown on filtered views (again/mastered/favorite) where an empty list
   * would be confusing before the authoritative data arrives.
   */
  if (!isLoaded && filter !== 'all') {
    return (
      <div className="space-y-4">
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Auto Play Live Banner */}
      {autoPlay && (
        <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-extrabold text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200 shadow-md animate-pulse">
          <div className="flex items-center gap-2 truncate">
            <MdVolumeUp className="h-4 w-4 text-amber-600 animate-bounce flex-shrink-0" />
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

      {/* Filter and Search Bar */}
      <FilterBar
        filter={filter}
        onFilter={onFilter}
        search={search}
        onSearch={onSearch}
        placeholder={tr('search_grammar')}
        total={filtered.length}
        countLabel={tr('count_cards')}
        tr={tr}
      />

      {/* 3D Flip Flashcard */}
      <Flashcard
        front={frontContent}
        back={backContent}
        flipped={flipped}
        onClick={() => setFlipped(!flipped)}
      />

      {/* Rating & Card Advance Buttons */}
      <RatingControls
        onPrev={() => { setFlipped(false); setPos((p) => Math.max(0, p - 1)); }}
        onNext={() => { setFlipped(false); setPos((p) => Math.min(filtered.length - 1, p + 1)); }}
        onAgain={() => rate('again')}
        onMastered={() => rate('mastered')}
        tr={tr}
      />

      {/* Grammar Catalog Table */}
      <div className="pt-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {tr('catalog_grammar')}
        </h3>

        {filtered.length === 0 ? (
          <EmptyState tr={tr} />
        ) : (
          <>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((i) => {
                const c = cards[i];
                const s = state[`g_${i}`] || {};
                const m = lang === 'EN' ? (c[8] || c[1]) : c[1];
                return (
                  <button
                    key={i}
                    onClick={() => {
                      const fi = filtered.indexOf(i);
                      setPos(fi);
                      setFlipped(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={cls(
                      'rounded-xl border bg-white p-3.5 text-left shadow-sm transition hover:shadow-md active:scale-[0.99] dark:bg-slate-900 min-w-0 w-full overflow-hidden',
                      s.status === 'mastered'
                        ? 'border-emerald-300 dark:border-emerald-800'
                        : 'border-slate-200 dark:border-slate-800'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {c[0]}
                        </div>
                        <div className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                          {m}
                        </div>
                      </div>
                      {s.fav && <MdStar className="h-4 w-4 text-amber-500 fill-amber-400 flex-shrink-0" />}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {c[6]}
                      </span>
                      <StatusBadge status={s.status} tr={tr} />
                    </div>
                  </button>
                );
              })}
            </div>

            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
