// What a tap on the fight screen does (story 3.1): tap a die to pick it up, tap a slot to
// put it there. Tapping the held die again puts it down; tapping a filled slot with nothing
// held takes its die back. Pure, so the screen's glue is tested without a browser.

import type { FightAction, Slot } from '@/fight/types';

export interface Tap {
  /** The die held after the tap, or null. */
  held: number | null;
  /** The action the tap sends, if any. */
  action: FightAction | null;
}

/** A tap on a die: picks it up, or puts it down if it was the one held. */
export function tapDie(held: number | null, die: number): Tap {
  return { held: held === die ? null : die, action: null };
}

/** A tap on a slot: the held die goes there; with none held, a filled slot gives its die back. */
export function tapSlot(
  held: number | null,
  slot: Slot,
  slots: Readonly<Record<Slot, number | null>>,
): Tap {
  if (held !== null) return { held: null, action: { type: 'fight/place', die: held, slot } };
  if (slots[slot] !== null) return { held: null, action: { type: 'fight/unplace', slot } };
  return { held: null, action: null };
}
