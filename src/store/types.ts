// The store's shapes (architecture, State Management). One store holds the whole game;
// every change goes through dispatch, which calls the pure root reducer with ctx.

import type { FirstUseId, RoomState, ToolId } from '@/room/types';
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
 * The part of the architecture's `save` slice (`SaveV1`) that epic 1 needs. It is held in
 * memory only, until saving arrives in epic 2 and writes it to the device.
 */
export interface SaveState {
  progress: {
    /** Tools earned at the end of rooms (room 3 earns Balance). */
    tools: ToolId[];
    /** Controls he has met, so each wiggles only the first time (Pattern 2, First use). */
    firstUse: FirstUseId[];
  };
}

/**
 * The game's state. The architecture's four slices are `save`, `room`, `fight` and `ui`;
 * `fight` joins in epic 3.
 */
export interface GameState {
  save: SaveState;
  room: RoomState | null;
  ui: UiState;
}

export type Reduce = (
  state: GameState,
  action: Action,
  ctx: Ctx,
) => { state: GameState; events: DomainEvent[] };
