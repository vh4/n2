/**
 * Toast Component.
 * Floating notification pill providing non-blocking feedback to user interactions
 * (e.g. "Marked as Mastered", "Added to Favorites", "Auto Play Started").
 *
 * @param {object} props
 * @param {string} props.message - Notification message text.
 * @returns {JSX.Element|null} Animated floating toast banner or null if message is empty.
 */
export function Toast({ message }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 transform transition-all duration-300 sm:bottom-8">
      <div className="flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-2 text-xs font-semibold text-white shadow-xl backdrop-blur dark:bg-white/90 dark:text-slate-900">
        <span>✨</span>
        <span>{message}</span>
      </div>
    </div>
  );
}
