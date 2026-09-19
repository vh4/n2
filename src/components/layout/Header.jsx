import { cls } from '../../lib/utils';

/**
 * Header Component.
 * Top navigation bar providing:
 *  - App branding with Japanese Kanji badge.
 *  - Cloud sync status indicator badge.
 *  - Real-time study counters (Mastered, Need Review, Favorites).
 *  - Language switcher (ID / EN) and Dark mode toggle.
 *  - User profile menu and logout action.
 *
 * @param {object} props
 * @param {object} props.session - Active user session.
 * @param {'EN'|'ID'} props.lang - Active language code.
 * @param {(lang: 'EN'|'ID') => void} props.handleLang - Language switch handler.
 * @param {boolean} props.darkMode - Theme mode flag.
 * @param {() => void} props.handleDark - Theme toggle handler.
 * @param {() => void} props.handleLogout - User logout handler.
 * @param {string} props.cloudSync - 'idle' | 'saving' | 'saved' | 'error'.
 * @param {{ mastered: number, again: number, fav: number }} props.stats - Summary study stats.
 * @param {() => void} props.onOpenDrawer - Opens mobile quick menu drawer.
 * @param {(key: string) => string} props.tr - Translation function.
 * @returns {JSX.Element} Top application header bar.
 */
export function Header({
  session,
  lang,
  handleLang,
  darkMode,
  handleDark,
  handleLogout,
  cloudSync,
  stats,
  onOpenDrawer,
  tr
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl transition-all dark:border-slate-800/80 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Brand Logo & Studio Subtitle */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md">
            <span className="font-bold text-base text-white">文</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white sm:text-base">
                JLPT N2 Studio
              </span>
              <span className="hidden rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 sm:inline-block">
                {tr('enterprise')}
              </span>
            </div>
            <p className="hidden text-[11px] text-slate-400 dark:text-slate-500 sm:block">
              {tr('subtitle')}
            </p>
          </div>
        </div>

        {/* Real-Time Sync Indicator & Quick Counters */}
        <div className="hidden md:flex items-center gap-3">
          {cloudSync !== 'idle' && (
            <div
              className={cls(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition',
                cloudSync === 'saving' && 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse',
                cloudSync === 'saved' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
                cloudSync === 'error' && 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
              <span>
                {cloudSync === 'saving' ? 'Syncing...' : cloudSync === 'saved' ? 'Synced' : 'Sync Error'}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
            <div className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400" title="Mastered items">
              <span>✓</span>
              <span>{stats.mastered}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-400" title="Need review items">
              <span>↻</span>
              <span>{stats.again}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400" title="Starred favorites">
              <span>★</span>
              <span>{stats.fav}</span>
            </div>
          </div>
        </div>

        {/* Action Controls: Lang Switcher, Theme Switcher, User Menu */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => handleLang('ID')}
              className={cls(
                'rounded-lg px-2 py-1 text-xs font-bold transition',
                lang === 'ID'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              )}
              title="Bahasa Indonesia"
            >
              🇮🇩 ID
            </button>
            <button
              onClick={() => handleLang('EN')}
              className={cls(
                'rounded-lg px-2 py-1 text-xs font-bold transition',
                lang === 'EN'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              )}
              title="English"
            >
              🇬🇧 EN
            </button>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={handleDark}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Toggle theme (Dark / Light)"
            aria-label="Toggle theme"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* Mobile Drawer Dial Toggle */}
          <button
            onClick={onOpenDrawer}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:hidden"
            aria-label="Open menu drawer"
          >
            ⚙️
          </button>

          {/* Desktop User Badge & Logout Button */}
          {session && (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {session.displayName || session.uid}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
