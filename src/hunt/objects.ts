// The things he moves before he has to use an idea (GDD, Teaching; story 8.6). Pure models, so
// that try steps and fixes have goals that can be tested; `ui/hunt/objects/` draws them.

/** Lamps standing in twos: what's left over decides even or odd. */
export interface PairsState {
  kind: 'pairs';
  count: number;
  /** How many he can have. */
  max: number;
}

/** A number line, or the floors of a lift. */
export interface LineState {
  kind: 'line';
  from: number;
  to: number;
  /** The numbers shown lit, such as what belongs to N. */
  lit: readonly number[];
  /** The number he has picked. */
  marked: number | null;
}

export type ObjectState = PairsState | LineState;

export type ObjectMove =
  | { kind: 'pairs-add' }
  | { kind: 'pairs-remove' }
  | { kind: 'line-mark'; at: number };

export type ObjectGoal = { kind: 'pairs-count'; count: number } | { kind: 'line-mark'; at: number };

/** What the move does; a move that doesn't fit the object does nothing. */
export function applyMove(state: ObjectState, move: ObjectMove): ObjectState {
  if (state.kind === 'pairs') {
    if (move.kind === 'pairs-add' && state.count < state.max) {
      return { ...state, count: state.count + 1 };
    }
    if (move.kind === 'pairs-remove' && state.count > 0) {
      return { ...state, count: state.count - 1 };
    }
    return state;
  }
  if (move.kind === 'line-mark' && move.at >= state.from && move.at <= state.to) {
    return { ...state, marked: move.at };
  }
  return state;
}

export function goalMet(state: ObjectState, goal: ObjectGoal): boolean {
  if (goal.kind === 'pairs-count') return state.kind === 'pairs' && state.count === goal.count;
  return state.kind === 'line' && state.marked === goal.at;
}

/** How the lamps stand: whole pairs, and whether one is left over. */
export function pairsOf(count: number): { pairs: number; left: number } {
  return { pairs: Math.floor(count / 2), left: count % 2 };
}
