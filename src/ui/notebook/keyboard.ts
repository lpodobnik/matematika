// A computer's keyboard works like the pad (GDD, Controls and Input; architecture,
// Consistency Rules: Physical keyboard): 0–9, x or X, +, - → −, * → ·, / → :, :, =,
// brackets, Backspace and Enter. The notebook is never an <input>, so the keys are read
// from the window; a field such as the name dialog (epic 2) keeps its own keys.

import { tokenFromChar } from '@/math/tokens';
import type { NotebookKey } from '@/room/notebook';

/** The parts of a KeyboardEvent this reads. */
export interface KeyLike {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  isComposing?: boolean;
  target?: EventTarget | null;
}

/**
 * The notebook key a keyboard key stands for, or null. Shortcuts with Ctrl, Cmd or Alt are
 * left to the browser; AltGr (Ctrl and Alt together on Windows) still types its character.
 */
export function keyFromKeyboard(event: KeyLike): NotebookKey | null {
  if (event.isComposing || event.metaKey) return null;
  if (event.ctrlKey !== event.altKey) return null;
  if (event.key === 'Enter') return 'enter';
  if (event.key === 'Backspace' || event.key === 'Delete') return 'delete';
  // Named keys (Shift, ArrowLeft, F5…) are longer than one character.
  if ([...event.key].length !== 1) return null;
  return tokenFromChar(event.key);
}

/** Whether the key is going into a text field, which keeps its own keys. */
function inTextField(target: EventTarget | null | undefined): boolean {
  const element = target as { tagName?: unknown; isContentEditable?: unknown } | null | undefined;
  if (!element) return false;
  if (element.isContentEditable === true) return true;
  return (
    element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT'
  );
}

type KeyTarget = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;

/**
 * Listens for keys on `target` (the window) and sends each notebook key, preventing the
 * browser's own use of it (Backspace, `/` for quick find). Returns the function that stops.
 */
export function watchKeyboard(target: KeyTarget, send: (key: NotebookKey) => void): () => void {
  const onKeyDown = (event: Event) => {
    const keyEvent = event as Event & KeyLike;
    if (event.defaultPrevented || inTextField(keyEvent.target)) return;
    const key = keyFromKeyboard(keyEvent);
    if (key === null) return;
    event.preventDefault();
    send(key);
  };
  target.addEventListener('keydown', onKeyDown);
  return () => target.removeEventListener('keydown', onKeyDown);
}
