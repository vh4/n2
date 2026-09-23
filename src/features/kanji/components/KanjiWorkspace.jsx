import React, { useState, useEffect, useMemo } from 'react';
import { kanji } from '../../../data/kanji';
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
 * KanjiWorkspace Component.
 * Interactive study and catalog workspace for 380+ JLPT N2 Kanji characters:
 *  - Flashcard front: High-contrast Kanji glyph, Onyomi (音読み), Kunyomi (訓読み), and theme.
 *  - Flashcard back: Full Onyomi/Kunyomi readings, stroke count, definition in EN & ID, and compound words.
 *  - Speech Synthesis: Natural voice pronunciation of kanji character and readings.
 *  - Full state persistence (ratings & favorites) under `k_${index}`.
 *
 * @param {object} props
 * @param {'EN'|'ID'} props.lang - Active language code ('EN' or 'ID').
 * @param {(key: string) => string} props.tr - Translation function.
 * @param {string} props.filter - 'all' | 'again' | 'mastered' | 'favorite'.
 * @param {(f: string) => void} props.onFilter - Filter change callback.
 * @param {string} props.search - Active search keyword.
 * @param {(q: string) => void} props.onSearch - Search query callback.
 * @param {object} props.state - User study state dictionary.
 * @param {(type: 'g'|'v'|'k', index: number, update: object) => void} props.setItemState - State mutator.
 * @param {(msg: string) => void} props.showToast - Toast message callback.
 * @param {number} props.pos - Active flashcard index.
 * @param {React.Dispatch<React.SetStateAction<number>>} props.setPos - Position setter.
 * @param {boolean} props.autoPlay - Auto play active flag.
 * @param {(val: boolean) => void} props.setAutoPlay - Auto play toggle.
 * @param {boolean} props.isLoaded - True when authoritative cloud state has been fetched.
 * @returns {JSX.Element} Kanji workspace screen.
 */
export function KanjiWorkspace({
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
  autoPlay,
  setAutoPlay,
  isLoaded = true
}) {
  const [flipped, setFlipped] = useState(false);
  const [page, setPage] = useState(1);
  const [autoStatus, setAutoStatus] = useState('');

  // Filter items matching search and rating state
  const filtered = useMemo(() => {
    return kanji.map((_, i) => i).filter((i) => {
      const item = kanji[i];
      const s = state[`k_${i}`] || {};
      const hay = (item.glyph + ' ' + item.meaning_en + ' ' + item.meaning_id + ' ' + item.on + ' ' + item.kun).toLowerCase();

      if (search && !hay.includes(search.toLowerCase())) return false;
      if (filter === 'unrated' && (s.status === 'again' || s.status === 'mastered')) return false;
      if (filter === 'again' && s.status !== 'again') return false;
      if (filter === 'mastered' && s.status !== 'mastered') return false;
      if (filter === 'favorite' && !s.fav) return false;
      return true;
    });
  }, [search, filter, state]);

  // Reset active position to card 0 and page to 1 whenever filters change
  useEffect(() => {
    setPos(0);
    setPage(1);
  }, [filter, search]);

  const safePos = Math.min(pos, Math.max(0, filtered.length - 1));
  const idx = filtered[safePos] ?? 0;
  const item = kanji[idx] || kanji[0];
  const st = state[`k_${idx}`] || { status: 'new', fav: false };

  const getWord = () => item.glyph;
  const getRead = () => `音: ${item.on} • 訓: ${item.kun}`;
  const getMeanEN = () => item.meaning_en;
  const getMeanID = () => item.meaning_id;
  const getMeaning = () => (lang === 'EN' ? getMeanEN() : getMeanID());

  const rate = (status) => {
    const willLeave =
      filter === 'unrated' ||
      (filter === 'again' && status !== 'again') ||
      (filter === 'mastered' && status !== 'mastered');

    setFlipped(false);
    setItemState('k', idx, { status });
    showToast(status === 'mastered' ? tr('toast_mastered') : tr('toast_again'));

    if (willLeave) {
      // The card leaves the filtered list. Next card shifts naturally into safePos.
      // If safePos was at or beyond the last card, clamp pos to the new last card.
      if (safePos >= filtered.length - 1) {
        setPos(Math.max(0, filtered.length - 2));
      }
    } else {
      // The card remains in the filtered list. Advance forward.
      setTimeout(() => {
        setPos((p) => Math.min(filtered.length - 1, p + 1));
      }, 180);
    }
  };

  const toggleFav = () => {
    const nextFav = !st.fav;
    setItemState('k', idx, { fav: nextFav });
    showToast(nextFav ? tr('toast_fav_add') : tr('toast_fav_rem'));
    if (filter === 'favorite' && !nextFav) {
      if (safePos >= filtered.length - 1) {
        setPos(Math.max(0, filtered.length - 2));
      }
    }
  };

  const speakJP = (e) => {
    if (e) e.stopPropagation();
    speakJapanese(`${item.glyph}, ${item.on}`);
  };

  // Pagination for catalog table
  const PAGE_SIZE = 12;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Auto Play Audio Loop Engine
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

        const currentItem = kanji[filtered[i]] || kanji[0];
        const currentMeaning = lang === 'EN' ? currentItem.meaning_en : currentItem.meaning_id;

        // Step 1: Speak Kanji Glyph & Onyomi
        setAutoStatus(`${i + 1}/${totalOnPage} • 🇯🇵 Speaking Kanji...`);
        await speakAsync(`${currentItem.glyph}, ${currentItem.on}`, 'ja-JP');
        if (isCancelled) break;

        await new Promise((r) => setTimeout(r, 600));
        if (isCancelled) break;

        // Step 2: Flip Card to Back
        setFlipped(true);
        await new Promise((r) => setTimeout(r, 700));
        if (isCancelled) break;

        // Step 3: Speak Meaning in Selected Language
        const meaningLang = lang === 'EN' ? 'en-US' : 'id-ID';
        setAutoStatus(`${i + 1}/${totalOnPage} • ${lang === 'EN' ? '🇬🇧 Speaking English...' : '🇮🇩 Mengucapkan Arti...'}`);
        await speakAsync(currentMeaning, meaningLang);
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
        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          {item.theme || tr('card_label_kanji')}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={speakJP}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 cursor-pointer shadow-sm"
            title="Pronounce Kanji"
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
        <div className="text-7xl sm:text-8xl font-black text-slate-900 dark:text-white">
          {getWord()}
        </div>
        <div className="mt-2 text-base font-semibold text-amber-600 dark:text-amber-400">
          {getRead()}
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
        <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          {item.theme || 'Kanji N2'}
        </span>
        <span className={cls('rounded border px-2 py-0.5 text-[10px] font-bold', lang === 'EN' ? 'border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300' : 'border-rose-200 text-rose-700 dark:border-rose-800 dark:text-rose-300')}>
          {lang === 'EN' ? '🇬🇧 EN' : '🇮🇩 ID'}
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto py-3">
        <div className="flex items-center justify-between">
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {getWord()}
          </div>
          <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {item.strokes} {tr('back_strokes')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-850">
            <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {tr('onyomi')}
            </div>
            <div className="font-bold text-amber-600 dark:text-amber-400">
              {item.on}
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-850">
            <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {tr('kunyomi')}
            </div>
            <div className="font-bold text-blue-600 dark:text-blue-400">
              {item.kun}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {tr('back_meaning')}
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            {getMeaning()}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'EN' ? `🇮🇩 ${getMeanID()}` : `🇬🇧 ${getMeanEN()}`}
          </div>
        </div>

        {item.compounds && item.compounds.length > 0 && (
          <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-850 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {tr('back_compounds')}
            </div>
            {item.compounds.map((cmp, ci) => (
              <div key={ci} className="text-xs text-slate-700 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white">{cmp[0]}</span> ({cmp[1]}): {lang === 'EN' ? (cmp[2] || cmp[3]) : cmp[3]}
              </div>
            ))}
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
   * Prevents confusing "0 items" in Dikuasai / Belum Ingat / Favorit during initial load.
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
      {/* Auto Play Banner */}
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
        placeholder={tr('search_kanji')}
        total={filtered.length}
        countLabel={tr('count_kanji')}
        tr={tr}
      />

      {/* 3D Flip Flashcard */}
      <Flashcard
        front={frontContent}
        back={backContent}
        flipped={flipped}
        onClick={() => setFlipped(!flipped)}
      />

      {/* Rating & Advance Buttons */}
      <RatingControls
        onPrev={() => { setFlipped(false); setPos((p) => Math.max(0, p - 1)); }}
        onNext={() => { setFlipped(false); setPos((p) => Math.min(filtered.length - 1, p + 1)); }}
        onAgain={() => rate('again')}
        onMastered={() => rate('mastered')}
        tr={tr}
      />

      {/* Kanji Catalog Table */}
      <div className="pt-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {tr('catalog_kanji')}
        </h3>

        {filtered.length === 0 ? (
          <EmptyState tr={tr} />
        ) : (
          <>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((i) => {
                const k = kanji[i];
                const s = state[`k_${i}`] || {};
                const m = lang === 'EN' ? k.meaning_en : k.meaning_id;
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
                        <div className="text-2xl font-black text-slate-900 dark:text-white truncate">
                          {k.glyph}
                        </div>
                        <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                          音: {k.on} • 訓: {k.kun}
                        </div>
                        <div className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                          {m}
                        </div>
                      </div>
                      {s.fav && <MdStar className="h-4 w-4 text-amber-500 fill-amber-400 flex-shrink-0" />}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        {k.theme || 'Kanji'}
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
