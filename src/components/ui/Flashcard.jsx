import { cls } from '../../lib/utils';

/**
 * Flashcard Component.
 * Implements a realistic 3D perspective flip card:
 *  - Front face displays the Japanese word/grammar/kanji with reading and meaning.
 *  - Back face displays complete formula, example sentences, and explanations.
 *  - Clicking or tapping the card toggles the 180-degree rotation.
 *
 * @param {object} props
 * @param {React.ReactNode} props.front - JSX content rendered on the front side.
 * @param {React.ReactNode} props.back - JSX content rendered on the back side.
 * @param {boolean} props.flipped - Whether the card is currently flipped to the back.
 * @param {() => void} props.onClick - Flip toggle event handler.
 * @returns {JSX.Element} Interactive 3D flip card.
 */
export function Flashcard({ front, back, flipped, onClick }) {
  return (
    <div
      className="relative w-full cursor-pointer select-none"
      style={{ perspective: '1200px', minHeight: '320px' }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label="Flashcard. Tap to flip."
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div
        className={cls(
          'relative h-full w-full rounded-2xl border transition-transform duration-500 [transform-style:preserve-3d]',
          'bg-white shadow-md hover:shadow-lg dark:bg-slate-900 dark:border-slate-800',
          flipped ? '[transform:rotateY(180deg)]' : ''
        )}
        style={{ minHeight: '320px' }}
      >
        {/* Front Face */}
        <div
          className="absolute inset-0 flex flex-col justify-between p-6 [backface-visibility:hidden]"
        >
          {front}
        </div>

        {/* Back Face */}
        <div
          className="absolute inset-0 flex flex-col justify-between p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]"
        >
          {back}
        </div>
      </div>
    </div>
  );
}
