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

/** Rows and columns: counted either way, the same many. */
export interface GridState {
  kind: 'grid';
  rows: number;
  columns: number;
}

/** Things packed in groups: what doesn't make a group is the remainder. */
export interface PackingState {
  kind: 'packing';
  items: number;
  /** How many go in a group. */
  per: number;
}

/** A sum as bundles: `2 + 3 · 4` is 2 and three bundles of 4. */
export interface BundlesState {
  kind: 'bundles';
  loose: number;
  bundles: number;
  size: number;
}

/** Stacks to level: the total never changes. */
export interface StacksState {
  kind: 'stacks';
  stacks: readonly number[];
  /** The stack he has lifted a crate from. */
  held: number | null;
}

/** A chart, built by counting. */
export interface BarsState {
  kind: 'bars';
  bars: readonly { label: string; value: number }[];
  /** What one mark on the axis is worth. */
  step: number;
}

export type ObjectState =
  | PairsState
  | LineState
  | PlacesState
  | GridState
  | PackingState
  | BundlesState
  | StacksState
  | BarsState;

export type ObjectMove =
  | { kind: 'pairs-add' }
  | { kind: 'pairs-remove' }
  | { kind: 'line-mark'; at: number }
  | { kind: 'places-add'; place: number }
  | { kind: 'places-remove'; place: number }
  | { kind: 'grid-rows'; by: -1 | 1 }
  | { kind: 'grid-columns'; by: -1 | 1 }
  | { kind: 'grid-turn' }
  | { kind: 'packing-per'; by: -1 | 1 }
  | { kind: 'stacks-tap'; stack: number };

export type ObjectGoal =
  | { kind: 'pairs-count'; count: number }
  | { kind: 'line-mark'; at: number }
  | { kind: 'places-counts'; counts: readonly number[] }
  | { kind: 'grid-size'; rows: number; columns: number }
  | { kind: 'packing-per'; per: number }
  | { kind: 'stacks-level' };

/** What the move does; a move that doesn't fit the object does nothing. */
export function applyMove(state: ObjectState, move: ObjectMove): ObjectState {
  if (state.kind === 'grid') {
    if (move.kind === 'grid-turn') return { ...state, rows: state.columns, columns: state.rows };
    if (move.kind === 'grid-rows') {
      const rows = state.rows + move.by;
      return rows < 0 || rows > 10 ? state : { ...state, rows };
    }
    if (move.kind === 'grid-columns') {
      const columns = state.columns + move.by;
      return columns < 0 || columns > 10 ? state : { ...state, columns };
    }
    return state;
  }
  if (state.kind === 'packing') {
    if (move.kind !== 'packing-per') return state;
    const per = state.per + move.by;
    return per < 1 || per > 12 ? state : { ...state, per };
  }
  if (state.kind === 'stacks') {
    if (move.kind !== 'stacks-tap') return state;
    if (state.held === null) {
      return (state.stacks[move.stack] ?? 0) > 0 ? { ...state, held: move.stack } : state;
    }
    if (state.held === move.stack) return { ...state, held: null };
    return {
      ...state,
      held: null,
      stacks: state.stacks.map((count, i) =>
        i === state.held ? count - 1 : i === move.stack ? count + 1 : count,
      ),
    };
  }
  if (state.kind === 'bundles' || state.kind === 'bars') return state;
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
  if (goal.kind === 'grid-size') {
    return state.kind === 'grid' && state.rows === goal.rows && state.columns === goal.columns;
  }
  if (goal.kind === 'packing-per') return state.kind === 'packing' && state.per === goal.per;
  if (goal.kind === 'stacks-level') {
    return state.kind === 'stacks' && new Set(state.stacks).size === 1;
  }
  return state.kind === 'line' && state.marked === goal.at;
}

/** How the lamps stand: whole pairs, and whether one is left over. */
export function pairsOf(count: number): { pairs: number; left: number } {
  return { pairs: Math.floor(count / 2), left: count % 2 };
}
