import { cls } from '../../lib/utils';

/**
 * Pagination Component.
 * Accessible page navigation bar:
 *  - Calculates visible window around active page with ellipsis (`...`).
 *  - Disables previous/next buttons at boundaries.
 *
 * @param {object} props
 * @param {number} props.page - Current active page number (1-indexed).
 * @param {number} props.totalPages - Total number of pages.
 * @param {(page: number) => void} props.onPage - Handler to change page.
 * @returns {JSX.Element|null} Rendered pagination controls.
 */
export function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (i === page - 2 || i === page + 2) {
      pages.push('...');
    }
  }

  // Deduplicate consecutive ellipsis
  const deduped = pages.filter((v, i) => pages[i - 1] !== v);

  return (
    <div className="flex items-center justify-center gap-1.5 pt-4">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        aria-label="Previous Page"
      >
        ‹
      </button>

      {deduped.map((p, idx) => {
        if (p === '...') {
          return (
            <span key={`dots-${idx}`} className="px-1 text-xs text-slate-400">
              …
            </span>
          );
        }

        const isCurrent = p === page;
        return (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={cls(
              'h-8 min-w-[32px] rounded-lg px-2 text-xs font-semibold transition',
              isCurrent
                ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-500'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            )}
            aria-current={isCurrent ? 'page' : undefined}
          >
            {p}
          </button>
        );
      })}

      <button
        onClick={() => onPage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        aria-label="Next Page"
      >
        ›
      </button>
    </div>
  );
}
