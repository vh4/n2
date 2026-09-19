import { cls } from '../../lib/utils';

/**
 * Sidebar Component.
 * Desktop collapsible navigation drawer:
 *  - Primary learning modules (Grammar, Vocab, Kanji, Favorites).
 *  - Grammar Bunpou category filters (ALL, Waktu, Sebab, Syarat, dll).
 *  - Progress mastery visual bar.
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
  categories,
  stats,
  tr
}) {
  const navTabs = [
    { id: 'grammar', icon: '📖', labelKey: 'nav_grammar' },
    { id: 'vocab',   icon: '📇', labelKey: 'nav_vocab' },
    { id: 'kanji',   icon: '🈸', labelKey: 'nav_kanji' },
    { id: 'favorite',icon: '⭐', labelKey: 'nav_favorites' },
  ];

  const percentMastered = stats.total > 0
    ? Math.round((stats.mastered / stats.total) * 100)
    : 0;

  return (
    <aside className="hidden lg:flex w-72 flex-col justify-between border-r border-slate-200/80 bg-white/70 p-4 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/70">
      <div className="space-y-6">
        {/* Navigation Modules */}
        <div>
          <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
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
                    'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition',
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-500'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{tab.icon}</span>
                    <span>{tr(tab.labelKey)}</span>
                  </div>
                  {tab.id === 'favorite' && stats.fav > 0 && (
                    <span
                      className={cls(
                        'rounded-full px-2 py-0.5 text-[10px] font-extrabold',
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      )}
                    >
                      {stats.fav}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Grammar Categories (Visible when Grammar tab is active) */}
        {activeTab === 'grammar' && categories && categories.length > 0 && (
          <div>
            <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {tr('category_label')}
            </div>
            <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
              <button
                onClick={() => setCategory('ALL')}
                className={cls(
                  'flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                  category === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                )}
              >
                <span>All Categories</span>
              </button>
              {categories.map((cat) => {
                const isCatActive = category === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={cls(
                      'flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                      isCatActive
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    )}
                  >
                    <span className="truncate">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Progress & Mastery Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-slate-800/80 dark:bg-slate-950/50">
        <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>{tr('progress_label')}</span>
          <span className="text-blue-600 dark:text-blue-400">{percentMastered}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-850">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${percentMastered}%` }}
          />
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>{stats.mastered} {tr('mastered_label')}</span>
          <span>{stats.again} {tr('review_label')}</span>
        </div>
      </div>
    </aside>
  );
}
