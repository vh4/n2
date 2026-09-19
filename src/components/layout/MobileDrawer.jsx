import { cls } from '../../lib/utils';

/**
 * MobileDrawer Component.
 * Slide-up mobile modal drawer providing:
 *  - Theme switcher (Dark / Light).
 *  - Language switcher (ID / EN).
 *  - Grammar categories selector.
 *  - User profile details and logout button.
 *
 * @param {object} props
 * @param {boolean} props.open - Whether drawer is currently visible.
 * @param {() => void} props.onClose - Drawer close handler.
 * @param {object} props.session - Active user session.
 * @param {'EN'|'ID'} props.lang - Active language.
 * @param {(lang: 'EN'|'ID') => void} props.handleLang - Language change handler.
 * @param {boolean} props.darkMode - Dark mode flag.
 * @param {() => void} props.handleDark - Theme toggle handler.
 * @param {() => void} props.handleLogout - User logout handler.
 * @param {string} props.category - Active Bunpou category.
 * @param {(cat: string) => void} props.setCategory - Category change handler.
 * @param {Array<string>} props.categories - Available Bunpou categories.
 * @param {(key: string) => string} props.tr - Translation function.
 * @returns {JSX.Element|null} Rendered mobile drawer or null.
 */
export function MobileDrawer({
  open,
  onClose,
  session,
  lang,
  handleLang,
  darkMode,
  handleDark,
  handleLogout,
  category,
  setCategory,
  categories,
  tr
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm transition-opacity lg:hidden">
      <div
        className="w-full max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {tr('drawer_title')}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {tr('drawer_subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 py-4">
          {/* Theme & Language Quick Controls */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                {tr('drawer_theme')}
              </span>
              <button
                onClick={handleDark}
                className="mt-2 flex w-full items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-white"
              >
                <span>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
                <span>{darkMode ? '🌙' : '☀️'}</span>
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                {tr('drawer_language')}
              </span>
              <div className="mt-2 flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  onClick={() => handleLang('ID')}
                  className={cls(
                    'flex-1 rounded-lg py-1.5 text-xs font-bold transition',
                    lang === 'ID'
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500'
                  )}
                >
                  🇮🇩 ID
                </button>
                <button
                  onClick={() => handleLang('EN')}
                  className={cls(
                    'flex-1 rounded-lg py-1.5 text-xs font-bold transition',
                    lang === 'EN'
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500'
                  )}
                >
                  🇬🇧 EN
                </button>
              </div>
            </div>
          </div>

          {/* Bunpou Categories Filter */}
          {categories && categories.length > 0 && (
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {tr('category_label')}
              </span>
              <div className="mt-2 flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                <button
                  onClick={() => { setCategory('ALL'); onClose(); }}
                  className={cls(
                    'rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                    category === 'ALL'
                      ? 'bg-blue-600 text-white dark:bg-blue-500'
                      : 'border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                  )}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setCategory(cat); onClose(); }}
                    className={cls(
                      'rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                      category === cat
                        ? 'bg-blue-600 text-white dark:bg-blue-500'
                        : 'border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* User Account & Logout */}
          {session && (
            <div className="rounded-2xl border border-slate-200 p-3.5 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {session.displayName || session.uid}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Logged in as @{session.uid}
                  </p>
                </div>
                <button
                  onClick={() => { handleLogout(); onClose(); }}
                  className="rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 transition hover:bg-rose-100"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
