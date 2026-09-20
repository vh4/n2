import React from 'react';
import { cls } from '../../lib/utils';
import { MdSearch, MdClose, MdStar } from 'react-icons/md';

/**
 * FilterBar Component.
 * Search bar and filter chip selector:
 *  - Real-time search input with clear button and MdSearch icon.
 *  - Filter chips: 'all' (Semua), 'unrated' (Belum Dinilai), 'again' (Belum Ingat), 'mastered' (Dikuasai), 'favorite' (★ Favorit).
 *  - Dynamic total matched items counter badge.
 *
 * @param {object} props
 * @param {'all'|'unrated'|'again'|'mastered'|'favorite'} props.filter - Current active filter.
 * @param {(filter: string) => void} props.onFilter - Callback when user clicks a filter chip.
 * @param {string} props.search - Current search input query.
 * @param {(query: string) => void} props.onSearch - Callback when search input changes.
 * @param {string} props.placeholder - Input placeholder text.
 * @param {number} props.total - Number of items currently matched.
 * @param {string} props.countLabel - Plural label for items (cards, vocab, kanji).
 * @param {(key: string) => string} props.tr - Translation function.
 * @returns {JSX.Element} Filter & search controls.
 */
export function FilterBar({
  filter,
  onFilter,
  search,
  onSearch,
  placeholder,
  total,
  countLabel,
  tr
}) {
  const filterKeys = ['all', 'unrated', 'again', 'mastered', 'favorite'];

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
      {/* Search Input Box */}
      <div className="relative flex flex-1 items-center rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900">
        <MdSearch className="h-5 w-5 text-slate-400 dark:text-slate-500 mr-2 flex-shrink-0" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          type="search"
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder-slate-400 dark:text-slate-100 dark:placeholder-slate-500"
        />
        {search && (
          <button
            onClick={() => onSearch('')}
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 ml-1.5 cursor-pointer"
            title="Clear search"
          >
            <MdClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
        {filterKeys.map((f) => {
          const isActive = filter === f;
          return (
            <button
              key={f}
              onClick={() => onFilter(f)}
              className={cls(
                'flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-1',
                isActive
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              )}
            >
              {f === 'favorite' && <MdStar className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />}
              <span>{tr(`filter_${f}`)}</span>
            </button>
          );
        })}

        <span className="ml-1 flex-shrink-0 text-xs font-bold text-blue-600 dark:text-blue-400">
          {total} {countLabel}
        </span>
      </div>
    </div>
  );
}
