// The game's clock (architecture, Pattern 2): `clock/tick` about once a second, so the pure
// reducers see time pass through ctx.now without a timer of their own. It ends a stage's
// lock or a room's restart that the machine never reports done; from epic 2 it also
// drives the hints after 60 s without acting.

import type { Action } from '@/store/actions';

export const clockTickMs = 1000;

/** The part of `window` the clock uses. */
export interface Timers<Id> {
  setInterval(handler: () => void, ms: number): Id;
  clearInterval(id: Id): void;
}

/** Starts ticking; returns the function that stops. */
export function startClock<Id>(
  timers: Timers<Id>,
  dispatch: (action: Action) => void,
  everyMs: number = clockTickMs,
): () => void {
  const id = timers.setInterval(() => dispatch({ type: 'clock/tick' }), everyMs);
  return () => timers.clearInterval(id);
}
