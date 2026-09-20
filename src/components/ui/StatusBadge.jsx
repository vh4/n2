import React from 'react';
import { cls } from '../../lib/utils';
import { MdCheck, MdRefresh } from 'react-icons/md';

/**
 * StatusBadge Component.
 * Visual indicator of a card's current mastery level:
 *  - 'mastered': Green badge (✓ Dikuasai / ✓ Mastered)
 *  - 'again': Rose badge (↻ Perlu Ulang / ↻ Review)
 *  - 'new' or unrated: Slate neutral badge (Belum dinilai / Not rated yet)
 *
 * @param {object} props
 * @param {'mastered'|'again'|'new'|undefined} props.status - The rating status of the card.
 * @param {(key: string) => string} props.tr - The translation function.
 * @returns {JSX.Element} Rendered status pill badge.
 */
export function StatusBadge({ status, tr }) {
  if (status === 'mastered') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        <MdCheck className="h-3 w-3" />
        <span>{tr('card_mastered')}</span>
      </span>
    );
  }

  if (status === 'again') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
        <MdRefresh className="h-3 w-3" />
        <span>{tr('card_again')}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
      <span>{tr('card_not_rated')}</span>
    </span>
  );
}
