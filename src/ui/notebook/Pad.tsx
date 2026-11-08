import '@/ui/notebook/notebook.css';
import type { ReactNode } from 'react';
import { type KeyKind, primaryPress } from '@/ui/notebook/pad-keys';

export interface PadKey<K extends string> {
  key: K;
  kind: KeyKind;
  label: string;
  face: ReactNode;
  disabled?: boolean;
  pulse?: boolean;
}

/**
 * The on-screen pad: buttons, never an <input>, so the OS keyboard never opens (rule 8). Each key
 * acts on `pointerdown` and is at least 48 CSS px (notebook.css). The keys are never focused, so
 * a computer's Enter goes only to the keyboard watch.
 */
export function Pad<K extends string>({
  keys,
  onKey,
}: {
  keys: readonly PadKey<K>[];
  onKey(key: K): void;
}) {
  return (
    <div className="pad">
      {keys.map(({ key, kind, label, face, disabled, pulse }) => (
        <button
          key={key}
          type="button"
          tabIndex={-1}
          className={`pad__key pad__key--${kind}`}
          data-key={key}
          disabled={disabled}
          data-pulse={pulse || undefined}
          aria-label={label}
          onPointerDown={(event) => primaryPress(event, () => onKey(key))}
        >
          {face}
        </button>
      ))}
    </div>
  );
}
