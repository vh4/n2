/**
 * EmptyState Component.
 * Friendly placeholder screen rendered when a search query or filter returns 0 results.
 *
 * @param {object} props
 * @param {(key: string) => string} props.tr - Translation function.
 * @returns {JSX.Element} Empty state illustration and message.
 */
export function EmptyState({ tr }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-12 text-center dark:border-slate-800">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-800 mb-3">
        🔍
      </div>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        {tr('empty')}
      </p>
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 max-w-xs">
        Try adjusting your filter chips or search keyword.
      </p>
    </div>
  );
}
