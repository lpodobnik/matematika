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
  /** What one step is worth: 1 unless it says. */
  step?: number;
  /** The numbers that carry a label; every number does, unless it says. */
  labelled?: readonly number[];
  /** A stop named with a letter, whose worth he has to work out. */
  point?: { at: number; label: string };
}

/** Places: how many of each, from the biggest down. */
export interface PlacesState {
  kind: 'places';
  /** What each place is called, from the biggest down. */
  names: readonly string[];
  counts: readonly number[];
}

export type ObjectState = PairsState | LineState | PlacesState;

export type ObjectMove =
  | { kind: 'pairs-add' }
  | { kind: 'pairs-remove' }
  | { kind: 'line-mark'; at: number }
  | { kind: 'places-add'; place: number }
  | { kind: 'places-remove'; place: number };

export type ObjectGoal =
  | { kind: 'pairs-count'; count: number }
  | { kind: 'line-mark'; at: number }
  | { kind: 'places-counts'; counts: readonly number[] };

/** What the move does; a move that doesn't fit the object does nothing. */
export function applyMove(state: ObjectState, move: ObjectMove): ObjectState {
  if (state.kind === 'places') {
    if (move.kind !== 'places-add' && move.kind !== 'places-remove') return state;
    const count = state.counts[move.place];
    if (count === undefined) return state;
    const next = move.kind === 'places-add' ? count + 1 : count - 1;
    // Ten of a thing is one of the next: he has to say so himself, so it stops at 9.
    if (next < 0 || next > 9) return state;
    return { ...state, counts: state.counts.map((c, i) => (i === move.place ? next : c)) };
  }
  if (state.kind === 'pairs') {
    if (move.kind === 'pairs-add' && state.count < state.max) {
      return { ...state, count: state.count + 1 };
    }
    if (move.kind === 'pairs-remove' && state.count > 0) {
      return { ...state, count: state.count - 1 };
    }
    return state;
  }
  if (move.kind === 'line-mark' && lineStops(state).includes(move.at)) {
    return { ...state, marked: move.at };
  }
  return state;
}

/** What each stop on a line is worth. */
export function lineStops(line: LineState): number[] {
  const step = line.step ?? 1;
  const stops: number[] = [];
  for (let value = line.from; value <= line.to; value += step) stops.push(value);
  return stops;
}

export function goalMet(state: ObjectState, goal: ObjectGoal): boolean {
  if (goal.kind === 'places-counts') {
    return state.kind === 'places' && goal.counts.every((count, i) => state.counts[i] === count);
  }
  if (goal.kind === 'pairs-count') return state.kind === 'pairs' && state.count === goal.count;
  return state.kind === 'line' && state.marked === goal.at;
}

/** How the lamps stand: whole pairs, and whether one is left over. */
export function pairsOf(count: number): { pairs: number; left: number } {
  return { pairs: Math.floor(count / 2), left: count % 2 };
}
