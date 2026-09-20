import React from 'react';
import { cls } from '../../lib/utils';
import { MdStar, MdWidgets } from 'react-icons/md';

/**
 * MobileNav Component.
 * Material Design bottom navigation bar with animated tab indicator pills,
 * Japanese calligraphy badges, and touch-optimized ergonomics.
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
  const navTabs = [
    { id: 'grammar',  labelKey: 'mob_grammar', icon: '文' },
    { id: 'vocab',    labelKey: 'mob_vocab',   icon: '単' },
    { id: 'kanji',    labelKey: 'mob_kanji',   icon: '漢' },
    { id: 'favorite', labelKey: 'mob_fav',     icon: '★', isFav: true },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-xl transition-all duration-300 dark:border-slate-800/80 dark:bg-slate-900/95 lg:hidden shadow-[0_-4px_25px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_25px_rgba(0,0,0,0.4)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-1 py-1.5">
        {navTabs.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cls(
                'group relative flex flex-1 flex-col items-center justify-center py-1 transition-all duration-300 active:scale-95 cursor-pointer',
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
              )}
            >
              <div
                className={cls(
                  'nav-tab-indicator flex h-8 w-12 items-center justify-center rounded-2xl transition-all duration-300',
                  isActive
                    ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 scale-105 shadow-sm'
                    : 'bg-transparent'
                )}
              >
                {item.isFav ? (
                  <MdStar className={cls('h-5 w-5 text-amber-500 fill-amber-400 transition-transform duration-300', isActive ? 'scale-110' : 'scale-100')} />
                ) : (
                  <span className={cls('font-jp text-base font-black transition-transform duration-300', isActive ? 'scale-110' : 'scale-100')}>
                    {item.icon}
                  </span>
                )}
              </div>
              <span className="mt-0.5 text-[10px] tracking-tight transition-colors duration-200">
                {tr(item.labelKey)}
              </span>

              {item.isFav && favCount > 0 && (
                <span className="absolute top-0.5 right-3 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-black text-white shadow-sm">
                  {favCount}
                </span>
              )}

              {isActive && (
                <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
              )}
            </button>
          );
        })}

        {/* Mobile Settings Dial / Drawer Trigger */}
        <button
          onClick={onOpenDrawer}
          className="flex flex-1 flex-col items-center justify-center py-1 text-slate-400 hover:text-blue-600 transition-all duration-300 active:scale-95 dark:text-slate-500 dark:hover:text-blue-400 cursor-pointer"
        >
          <div className="flex h-8 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600/10 to-indigo-600/10 text-blue-600 dark:from-blue-500/20 dark:to-indigo-500/20 dark:text-blue-400">
            <MdWidgets className="h-5 w-5" />
          </div>
          <span className="mt-0.5 text-[10px] font-semibold tracking-tight">
            {tr('mob_menu')}
          </span>
        </button>
      </div>
    </nav>
  );
}
