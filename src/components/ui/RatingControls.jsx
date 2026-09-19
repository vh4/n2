import { useEffect } from 'react';

/**
 * RatingControls Component.
 * Action bar providing rapid study controls:
 *  - Previous Card (ArrowLeft)
 *  - Next Card (ArrowRight)
 *  - "Need Review" / "Belum Ingat" (Key '1'): Marks card as 'again' and auto-advances.
 *  - "Mastered" / "Dikuasai" (Key '2'): Marks card as 'mastered' and auto-advances.
 *
 * @param {object} props
 * @param {() => void} props.onPrev - Handler to navigate to previous card.
 * @param {() => void} props.onNext - Handler to navigate to next card.
 * @param {() => void} props.onAgain - Handler to rate as 'again' (Need review).
 * @param {() => void} props.onMastered - Handler to rate as 'mastered' (Got it).
 * @param {(key: string) => string} props.tr - Translation function.
 * @returns {JSX.Element} Bottom rating action bar.
 */
export function RatingControls({ onPrev, onNext, onAgain, onMastered, tr }) {
  // Global keyboard shortcuts (1 = again, 2 = mastered, Left = prev, Right = next)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore key events when typing into search or form inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.key === '1') {
        e.preventDefault();
        onAgain();
      } else if (e.key === '2') {
        e.preventDefault();
        onMastered();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrev, onNext, onAgain, onMastered]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
      <div className="flex items-center gap-1.5">
        <button
          onClick={onPrev}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          title="Previous card (Left Arrow)"
          aria-label="Previous card"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button
          onClick={onNext}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          title="Next card (Right Arrow)"
          aria-label="Next card"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        <button
          onClick={onAgain}
          className="flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs sm:text-sm font-bold text-rose-700 shadow-sm transition hover:bg-rose-100 active:scale-95 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/60"
        >
          {tr('rate_again')}
        </button>
        <button
          onClick={onMastered}
          className="flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs sm:text-sm font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-100 active:scale-95 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
        >
          {tr('rate_mastered')}
        </button>
      </div>
    </div>
  );
}
