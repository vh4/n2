import { cls } from '../../lib/utils';

/**
 * MobileNav Component.
 * Fixed bottom navigation bar optimized for iOS and Android mobile touch ergonomics.
 *
 * @param {object} props
 * @param {string} props.activeTab - Currently active tab ('grammar'|'vocab'|'kanji'|'favorite').
 * @param {(tab: string) => void} props.setActiveTab - Tab change handler.
 * @param {() => void} props.onOpenDrawer - Opens mobile quick settings drawer.
 * @param {number} props.favCount - Count of favorite items.
 * @param {(key: string) => string} props.tr - Translation function.
 * @returns {JSX.Element} Mobile bottom tab bar.
 */
export function MobileNav({
  activeTab,
  setActiveTab,
  onOpenDrawer,
  favCount,
  tr
}) {
  const tabs = [
    { id: 'grammar',  labelKey: 'mob_grammar', icon: '📖' },
    { id: 'vocab',    labelKey: 'mob_vocab',   icon: '📇' },
    { id: 'kanji',    labelKey: 'mob_kanji',   icon: '🈸' },
    { id: 'favorite', labelKey: 'mob_fav',     icon: '⭐', badge: favCount },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/95 pb-safe backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/95 lg:hidden">
      <div className="flex items-center justify-around px-2 py-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cls(
                'relative flex flex-col items-center justify-center rounded-xl px-3 py-1 text-[11px] font-semibold transition active:scale-95',
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              )}
            >
              <span className="text-lg leading-none mb-0.5">{tab.icon}</span>
              <span>{tr(tab.labelKey)}</span>
              {tab.badge > 0 && (
                <span className="absolute top-0 right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-black text-white">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Mobile Settings Dial Button */}
        <button
          onClick={onOpenDrawer}
          className="flex flex-col items-center justify-center rounded-xl px-3 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition active:scale-95"
        >
          <span className="text-lg leading-none mb-0.5">⚙️</span>
          <span>{tr('mob_menu')}</span>
        </button>
      </div>
    </nav>
  );
}
