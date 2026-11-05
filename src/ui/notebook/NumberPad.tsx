import { hr } from '@/content/text/hr';
import type { NotebookKey } from '@/room/notebook';
import { keyKind, PAD_ROWS, primaryPress, tokenLabel } from '@/ui/notebook/pad-keys';

interface Props {
  /** Whether the notebook takes keys now; otherwise the keys show as off. */
  writes: boolean;
  onKey(key: NotebookKey): void;
}

/**
 * The on-screen number pad: buttons, never an <input>, so the OS keyboard never opens
 * (rule 8). Each key acts on `pointerdown` and is at least 48 CSS px (notebook.css). The
 * keys are never focused, so a computer's Enter goes only to the notebook's keyboard watch.
 */
export function NumberPad({ writes, onKey }: Props) {
  return (
    <div className="pad">
      {PAD_ROWS.flat().map((key) => (
        <button
          key={key}
          type="button"
          tabIndex={-1}
          className={`pad__key pad__key--${keyKind(key)}`}
          disabled={!writes}
          aria-label={keyName(key)}
          onPointerDown={(event) => primaryPress(event, () => onKey(key))}
        >
          <KeyFace pad={key} />
        </button>
      ))}
    </div>
  );
}

function keyName(key: NotebookKey): string {
  if (key === 'delete') return hr.notebook.delete;
  if (key === 'enter') return hr.notebook.enter;
  return tokenLabel(key);
}

/** Delete and enter are drawn, so they show the same with any font. */
function KeyFace({ pad }: { pad: NotebookKey }) {
  if (pad === 'delete') {
    return (
      <svg className="pad__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 5h11v14H9l-6-7z" />
        <path d="M12 9l5 6M17 9l-5 6" />
      </svg>
    );
  }
  if (pad === 'enter') {
    return (
      <svg className="pad__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 5v7H6" />
        <path d="M10 8l-4 4 4 4" />
      </svg>
    );
  }
  return <>{tokenLabel(pad)}</>;
}
