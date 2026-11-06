// The store's shapes (architecture, State Management). One store holds the whole game;
// every change goes through dispatch, which calls the pure root reducer with ctx.

import type { Economy } from '@/economy/types';
import type { HintState } from '@/room/hint';
import type { FirstUseId, RoomId, RoomState, ToolId } from '@/room/types';
import type { Character, Settings } from '@/save/schema';
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

/**
 * Screens are a field in the store, with no router. `loading` shows from launch until the
 * save is read and the assets are loaded (story 2.1). `continued` is the placeholder "to be
 * continued" screen after the last room (story 1.13); the map replaces it in epic 2.
 */
export type Screen = 'loading' | 'room' | 'continued';

/**
 * How many copies of the scene the scene area draws side by side: 3 only for the tablet
 * profile, which the dev panel sets up (story 1.13; NFR1's three-machine room).
 */
export type SceneCopies = 1 | 3;

export interface UiState {
  screen: Screen;
  /** While loading: how much of the assets has loaded, 0–1 (story 2.1). */
  loaded: number;
  /** On a phone, whether the notebook is pushed aside off the scale. The tablet ignores it. */
  notebookAside: boolean;
  /**
   * The quality setting. The test's pick is saved in `save.settings.quality` (story 2.1), and
   * a launch with a saved pick starts with it and doesn't run the test again. A forced
   * setting never persists.
   */
  quality: QualityState;
  /** The dev panel only: 3 draws the scene three times side by side, for the tablet profile. */
  copies: SceneCopies;
  /**
   * Story 1.16: the hint button's presses in the stage in play, or null; an action of his
   * ends them (room/hint.ts). In memory only: hints are never recorded.
   */
  hint: HintState | null;
}

/**
 * The architecture's `save` slice: everything kept on the device (story 2.1; save/schema.ts,
 * `SaveV1`). The room in progress is kept too, read off `room` as it is written
 * (store/persist.ts). Every change to this slice is written (`SaveChanged`).
 */
export interface SaveState {
  /** ISO 8601: the first launch, set as the game starts; null before. */
  createdAt: string | null;
  /** His apprentice's name and look (story 2.4); empty until then. */
  character: Character;
  progress: {
    /** Rooms whose restart has begun, in the order he finished them. */
    roomsDone: RoomId[];
    /** Tools earned at the end of rooms (room 3 earns Balance). */
    tools: ToolId[];
    /** Controls he has met, so each wiggles only the first time (Pattern 2, First use). */
    firstUse: FirstUseId[];
  };
  /**
   * Parts, upgrades and piles (`createEconomy()`). From story 1.14 a right prediction pays
   * into it, once per stage (economy/predictions.ts); fights spend it from epic 3.
   */
  economy: Economy;
  /** Muted (audio comes in epic 6), and the frame-time test's quality pick. */
  settings: Settings;
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
