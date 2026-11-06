// The one Zustand store (architecture, State Management). Components read with selectors
// (`useGame(s => s.room?.stage.dialX)`) and write only through `dispatch`. Dispatch runs
// the pure root reducer with a fresh ctx, stores the result, then hands the domain events
// to the effects.

import { useStore } from 'zustand';
import { createStore, type StoreApi } from 'zustand/vanilla';
import type { Action } from '@/store/actions';
import { effects as defaultEffects, type Effect, runEffects } from '@/store/effects';
import { reduce as defaultReduce, initialGameState } from '@/store/reducer';
import type { Ctx, GameState, Reduce } from '@/store/types';

export interface GameStore extends GameState {
  dispatch(action: Action): void;
}

export interface GameStoreOptions {
  reduce?: Reduce;
  effects?: readonly Effect[];
  /** Time and randomness for each dispatch; tests pass a fixed one. */
  makeCtx?: () => Ctx;
  initialState?: GameState;
}

function realCtx(): Ctx {
  return { now: Date.now(), rng: { next: Math.random } };
}

function stateOf(store: GameStore): GameState {
  return { save: store.save, room: store.room, ui: store.ui };
}

export function createGameStore(options: GameStoreOptions = {}): StoreApi<GameStore> {
  const {
    reduce = defaultReduce,
    effects = defaultEffects,
    makeCtx = realCtx,
    initialState = initialGameState(),
  } = options;
  return createStore<GameStore>()((set, get) => ({
    ...initialState,
    dispatch(action) {
      const { state, events } = reduce(stateOf(get()), action, makeCtx());
      set(state);
      runEffects(events, state, effects);
    },
  }));
}

/** The game's store. */
export const gameStore = createGameStore();

/** Reads the game's store with a selector; re-renders only when the selected value changes. */
export function useGame<T>(selector: (store: GameStore) => T): T {
  return useStore(gameStore, selector);
}
