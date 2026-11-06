// A written line of the old logbook (room 7, story 2.10): someone else's line he can tap to
// put on the scale, in the Clockmaker's hand. While the mistake pin is offered, each line
// carries a flag he taps to say "this one is wrong", and the flagged line a confirm button.
// The planted line, once found, is struck through. Buttons act on release and are at least
// 48 CSS px; the flag and confirm read to a screen reader.

import { hr } from '@/content/text/hr';

interface Props {
  number: number;
  text: string;
  /** On the scale now. */
  shown: boolean;
  /** The planted line, found: struck through. */
  struck?: boolean;
  /** The mistake pin is offered: the flag shows, and whether it is on this line. */
  flag: 'none' | 'offered' | 'here';
  /** Confirming the pin here does something now. */
  confirmable?: boolean;
  onShow(number: number): void;
  onFlag(number: number): void;
  onConfirm(): void;
}

export function LogbookLine({
  number,
  text,
  shown,
  struck = false,
  flag,
  confirmable = false,
  onShow,
  onFlag,
  onConfirm,
}: Props) {
  const className = ['line', 'line--written', 'line--logbook', struck && 'line--struck']
    .filter(Boolean)
    .join(' ');
  return (
    <li className={className} data-shown={shown}>
      <button
        type="button"
        tabIndex={-1}
        className="line__tap"
        aria-pressed={shown}
        disabled={struck}
        onClick={() => onShow(number)}
      >
        {text}
      </button>
      {flag !== 'none' && !struck && (
        <button
          type="button"
          tabIndex={-1}
          className="line__flag"
          aria-pressed={flag === 'here'}
          aria-label={`${hr.logbook.flag}: ${text}`}
          onClick={() => onFlag(number)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 21 V4 M6 4 H18 L15 8.5 L18 13 H6" />
          </svg>
        </button>
      )}
      {flag === 'here' && confirmable && (
        <button type="button" tabIndex={-1} className="line__confirm" onClick={onConfirm}>
          {hr.pin.confirm}
        </button>
      )}
    </li>
  );
}
