// The number pad's keys as data (GDD, Controls and Input: digits, x, +, −, ·, :, =,
// brackets, delete and enter), and what each one dispatches. Laid out like a calculator:
// 7 8 9 on top, 0 at the bottom, the operators down the right.

import { formatTokens } from '@/math/format';
import type { Token } from '@/math/tokens';
import type { NotebookKey } from '@/room/notebook';
import type { Action } from '@/store/actions';

export const PAD_ROWS: readonly (readonly NotebookKey[])[] = [
  ['7', '8', '9', '(', ')'],
  ['4', '5', '6', '·', ':'],
  ['1', '2', '3', '+', '−'],
  ['0', 'x', '=', 'delete', 'enter'],
];

/** The action a key sends: a token is typed at the end of the draft. */
export function keyAction(key: NotebookKey): Action {
  if (key === 'delete') return { type: 'notebook/delete' };
  if (key === 'enter') return { type: 'notebook/enter' };
  return { type: 'notebook/type', token: key };
}

/** A token key's face, in school notation (only `math/format.ts` writes notation). */
export function tokenLabel(token: Token): string {
  return formatTokens([token]);
}

/** What kind of key it is, for its look: digits, x, operators, brackets, delete, enter. */
export type KeyKind = 'digit' | 'x' | 'operator' | 'bracket' | 'delete' | 'enter';

export function keyKind(key: NotebookKey): KeyKind {
  if (key === 'delete' || key === 'enter' || key === 'x') return key;
  if (key === '(' || key === ')') return 'bracket';
  if (/^[0-9]$/.test(key)) return 'digit';
  return 'operator';
}

/** The parts of a `pointerdown` a press reads (Pointer Events, rule 8). */
export interface Press {
  button: number;
  preventDefault(): void;
}

/**
 * Handles a key's or the handle's `pointerdown`: it acts as the finger lands, so typing
 * keeps up with him; a mouse's main button only. Default handling is prevented, so no text
 * is selected and no mouse events follow.
 */
export function primaryPress(event: Press, act: () => void): void {
  if (event.button !== 0) return;
  event.preventDefault();
  act();
}
