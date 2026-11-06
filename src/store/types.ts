// The store's shapes (architecture, State Management). One store holds the whole game;
// every change goes through dispatch, which calls the pure root reducer with ctx.

import type { RoomState } from '@/room/types';
import type { Action } from '@/store/actions';
import type { DomainEvent } from '@/store/events';
import type { QualityState } from '@/store/quality';

/** A source of uniform numbers in [0, 1). */
export interface Rng {
  next(): number;
}

/** Time and randomness, handed to reducers so they stay pure. */
export interface Ctx {
  now: number;
  rng: Rng;
}

/** Screens are a field in the store, with no router. More join with the map in epic 2. */
export type Screen = 'room';

export interface UiState {
  screen: Screen;
  /** On a phone, whether the notebook is pushed aside off the scale. The tablet ignores it. */
  notebookAside: boolean;
  /**
   * The quality setting, in memory only: until epic 2 saves the test's pick in
   * `save.settings.quality`, the test runs on every launch. A forced setting never persists.
   */
  quality: QualityState;
}

/**
 * The game's state. The architecture's four slices are `save`, `room`, `fight` and `ui`;
 * `save` joins in epic 2 and `fight` in epic 3.
 */
export interface GameState {
  room: RoomState | null;
  ui: UiState;
}

export type Reduce = (
  state: GameState,
  action: Action,
  ctx: Ctx,
) => { state: GameState; events: DomainEvent[] };
