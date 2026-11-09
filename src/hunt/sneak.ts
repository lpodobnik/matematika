// Sneak (GDD, Scene types; architecture, Pattern 7): nothing moves until he moves. Each tap moves
// him one stop or waits, and then each patrol takes one step along its drawn route. Being caught
// costs nothing but the walk. On a line board the exit is a stop with no label: he works it out
// from the labelled ones and writes it, and only then does it light.

import { parseStatement } from '@/math/statement';
import {
  fillLine,
  isSToken,
  readLine,
  type SLineToken,
  type SToken,
} from '@/math/statement-tokens';

export interface SneakPatrol {
  /** The stops it walks, over and over; -1 is round the corner, off the line. */
  route: readonly number[];
}

/** A number line's stops: what each is worth, and which carry a label. */
export interface SneakLine {
  first: number;
  step: number;
  labelled: readonly number[];
  /** The stops it asks for, one after another: a wrong stop means asking for a different one. */
  asks: readonly { at: number; label: 'A' | 'B' | 'C' | 'D' }[];
}

export interface SneakBoard {
  stops: number;
  start: number;
  /** Where a plain board ends. Null on a line board, whose exit he writes. */
  exit: number | null;
  patrols: readonly SneakPatrol[];
  line: SneakLine | null;
}

export interface SneakSpec {
  kind: 'sneak';
  intro: string;
  boards: readonly SneakBoard[];
  /** The notices a patrol prints, in turn. */
  caught: readonly string[];
  /** What a wrong stop holds. */
  empty: string;
  /** What he finds at the right stop. */
  found: string;
  opened: string;
  /** A worked example with other numbers: the last help. */
  example: readonly string[];
  hint: { step: string; move: string };
}

export interface SneakState {
  board: number;
  at: number;
  tick: number;
  /** Which of the board's asks he's on. */
  ask: number;
  draft: SToken[];
  /** The stop his line has lit. */
  lit: number | null;
  /** A patrol's notice, what a stop held, or that the board is done: until he's read it. */
  notice: string | null;
  /** The board is done, and reading the notice moves on. */
  boardDone: boolean;
  timesCaught: number;
  wrongStops: number;
  shakes: number;
  help: number;
  hintLevel: number;
  exactTaken: boolean;
  guide: 'intro' | 'on' | null;
  opened: boolean;
}

export function newSneak(guided = false): SneakState {
  return {
    board: 0,
    at: -1,
    tick: 0,
    ask: 0,
    draft: [],
    lit: null,
    notice: null,
    boardDone: false,
    timesCaught: 0,
    wrongStops: 0,
    shakes: 0,
    help: 0,
    hintLevel: 0,
    exactTaken: false,
    guide: guided ? 'intro' : null,
    opened: false,
  };
}

/** Where a patrol stands at this tick. */
export function patrolAt(patrol: SneakPatrol, tick: number): number {
  return patrol.route[tick % patrol.route.length] ?? 0;
}

/** Where he stands: -1 means not yet placed, so that a state is valid for any board. */
export function standing(board: SneakBoard, state: SneakState): number {
  return state.at < 0 ? board.start : state.at;
}

/** What a stop is worth on a line board. */
export function stopValue(line: SneakLine, stop: number): number {
  return line.first + stop * line.step;
}

/** The stop his line goes for, or null: the label and `=` are already written. */
export function lineStartOf(board: SneakBoard, state: SneakState): SLineToken[] {
  const ask = board.line?.asks[state.ask % (board.line?.asks.length ?? 1)];
  return ask ? (readLine(`${ask.label} =`) ?? []) : [];
}

/** Which stop he has to reach now: the lit one, or the board's exit. */
export function targetStop(board: SneakBoard, state: SneakState): number | null {
  return board.line ? state.lit : board.exit;
}

/** Enter: his line lights the stop it claims, right or not. Anything else gets a shake. */
export function sneakEnter(spec: SneakSpec, state: SneakState): SneakState {
  const board = spec.boards[state.board];
  if (!board?.line || state.notice || state.opened || state.lit !== null) return state;
  const shake = { ...state, shakes: state.shakes + 1 };
  if (state.draft.length === 0) return shake;
  const parsed = parseStatement(fillLine(lineStartOf(board, state), state.draft));
  if (!parsed.ok || parsed.statement.k !== 'point') return shake;
  const stop = (parsed.statement.value - board.line.first) / board.line.step;
  if (!Number.isInteger(stop) || stop < 0 || stop >= board.stops) return shake;
  return { ...state, lit: stop, draft: [] };
}

export function sneakType(spec: SneakSpec, state: SneakState, token: SToken): SneakState {
  const board = spec.boards[state.board];
  if (!board?.line || state.notice || state.opened || state.lit !== null) return state;
  if (state.draft.length >= 16) return state;
  return { ...state, draft: [...state.draft, token] };
}

export function sneakDelete(state: SneakState): SneakState {
  if (state.notice || state.opened || state.draft.length === 0) return state;
  return { ...state, draft: state.draft.slice(0, -1) };
}

/** The next stop to ask for: never the one he has just found empty. */
function nextAsk(line: SneakLine, ask: number, emptyAt: number): number {
  let next = ask + 1;
  while (line.asks[next % line.asks.length]?.at === emptyAt && next < ask + line.asks.length) {
    next += 1;
  }
  return next;
}

/** Arriving where he was heading: the right stop ends the board; a wrong one is empty. */
function arrive(spec: SneakSpec, board: SneakBoard, state: SneakState): SneakState {
  const target = targetStop(board, state);
  if (target === null || state.at !== target) return state;
  const ask = board.line?.asks[state.ask % board.line.asks.length];
  if (board.line && ask && ask.at !== target) {
    return {
      ...state,
      notice: spec.empty,
      lit: null,
      ask: nextAsk(board.line, state.ask, target),
      wrongStops: state.wrongStops + 1,
      help: Math.max(state.help, Math.min(3, state.wrongStops + 1)),
    };
  }
  return { ...state, notice: spec.found, boardDone: true };
}

/** One move: forward, back, or waiting. Then each patrol takes its step. */
export function sneakStep(spec: SneakSpec, state: SneakState, by: -1 | 0 | 1): SneakState {
  const board = spec.boards[state.board];
  if (!board || state.notice || state.opened) return state;
  const at = standing(board, state) + by;
  if (at < 0 || at >= board.stops) return state;
  const tick = state.tick + 1;
  const caught = board.patrols.some((patrol) => patrolAt(patrol, tick) === at);
  if (caught) {
    return {
      ...state,
      at: board.start,
      tick: 0,
      timesCaught: state.timesCaught + 1,
      notice: spec.caught[state.timesCaught % spec.caught.length] ?? '',
    };
  }
  return arrive(spec, board, { ...state, at, tick });
}

/** He has read the notice. A finished board gives way to the next, or the scene ends. */
export function sneakDismiss(spec: SneakSpec, state: SneakState): SneakState {
  if (!state.notice) return state;
  if (!state.boardDone) return { ...state, notice: null };
  const next = state.board + 1;
  if (next >= spec.boards.length) return { ...state, notice: null, opened: true, guide: null };
  return {
    ...state,
    // One board is enough to have learnt it.
    guide: null,
    board: next,
    at: -1,
    tick: 0,
    ask: 0,
    lit: null,
    draft: [],
    notice: null,
    boardDone: false,
  };
}

export function sneakIdle(state: SneakState): SneakState {
  return state.opened || state.help >= 3 ? state : { ...state, help: state.help + 1 };
}

export function sneakHint(state: SneakState): SneakState {
  if (state.opened) return state;
  const hintLevel = Math.min(2, state.hintLevel + 1);
  return { ...state, hintLevel, exactTaken: state.exactTaken || hintLevel === 2 };
}

/** A right stop on the first try earns its parts; being caught costs nothing. */
export function sneakEarns(state: SneakState): boolean {
  return state.opened && state.wrongStops === 0 && !state.exactTaken;
}

const routeLength = (patrols: readonly SneakPatrol[]) =>
  patrols.reduce((length, patrol) => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    return (length * patrol.route.length) / gcd(length, patrol.route.length);
  }, 1);

/**
 * The moves from here to a stop, safest and shortest: null if there's no way. A search over where
 * he is and where the patrols are, so a board that can't be solved never reaches him.
 */
export function routeTo(
  board: SneakBoard,
  from: { at: number; tick: number },
  target: number,
): (-1 | 0 | 1)[] | null {
  const period = routeLength(board.patrols);
  const key = (at: number, tick: number) => `${at}:${tick % period}`;
  const seen = new Set([key(from.at, from.tick)]);
  const queue: { at: number; tick: number; moves: (-1 | 0 | 1)[] }[] = [{ ...from, moves: [] }];
  for (let head = 0; head < queue.length; head++) {
    const here = queue[head];
    if (!here) break;
    if (here.at === target) return here.moves;
    for (const by of [1, -1, 0] as const) {
      const at = here.at + by;
      if (at < 0 || at >= board.stops) continue;
      const tick = here.tick + 1;
      if (board.patrols.some((patrol) => patrolAt(patrol, tick) === at)) continue;
      if (seen.has(key(at, tick))) continue;
      seen.add(key(at, tick));
      queue.push({ at, tick, moves: [...here.moves, by] });
    }
  }
  return null;
}

/** The next safe move towards where he's heading, for help. Null if he has nowhere yet. */
export function nextSafeMove(board: SneakBoard, state: SneakState): -1 | 0 | 1 | null {
  const target = targetStop(board, state);
  if (target === null) return null;
  return routeTo(board, { at: standing(board, state), tick: state.tick }, target)?.[0] ?? null;
}

/** The problems with a scene: every board can be solved, from its start, whatever is asked. */
export function proveSneak(spec: SneakSpec): string[] {
  const problems: string[] = [];
  for (const [i, board] of spec.boards.entries()) {
    const targets = board.line ? board.line.asks.map((ask) => ask.at) : [board.exit];
    for (const target of targets) {
      if (target === null) {
        problems.push(`board ${i} has nowhere to go`);
      } else if (!routeTo(board, { at: board.start, tick: 0 }, target)) {
        problems.push(`board ${i}: stop ${target} can't be reached`);
      }
    }
    if (board.line) {
      for (const ask of board.line.asks) {
        if (board.line.labelled.includes(ask.at)) problems.push(`board ${i} asks for a label`);
        if (ask.at === board.start) problems.push(`board ${i} asks for where he starts`);
      }
      if (board.line.labelled.length < 2)
        problems.push(`board ${i} has too few labels to work from`);
    }
    for (const patrol of board.patrols) {
      if (patrol.route.some((stop) => stop < -1 || stop >= board.stops)) {
        problems.push(`board ${i}: a patrol walks off the line`);
      }
      if (patrol.route.includes(board.start)) {
        problems.push(`board ${i}: a patrol walks over the start`);
      }
    }
  }
  if (spec.caught.length === 0) problems.push('no notice for being caught');
  return problems;
}

/** A saved scene back from the save, or null if it no longer fits. */
export function sneakFrom(spec: SneakSpec, value: unknown): SneakState | null {
  if (typeof value !== 'object' || value === null) return null;
  const saved = value as Partial<SneakState>;
  if (typeof saved.board !== 'number' || saved.board < 0 || saved.board >= spec.boards.length) {
    return null;
  }
  if (!Array.isArray(saved.draft) || !saved.draft.every(isSToken)) return null;
  return {
    ...newSneak(),
    board: saved.board,
    at: typeof saved.at === 'number' ? saved.at : -1,
    tick: typeof saved.tick === 'number' ? saved.tick : 0,
    ask: typeof saved.ask === 'number' ? saved.ask : 0,
    draft: saved.draft,
    lit: typeof saved.lit === 'number' ? saved.lit : null,
    notice: typeof saved.notice === 'string' ? saved.notice : null,
    boardDone: saved.boardDone === true,
    timesCaught: typeof saved.timesCaught === 'number' ? saved.timesCaught : 0,
    wrongStops: typeof saved.wrongStops === 'number' ? saved.wrongStops : 0,
    hintLevel: typeof saved.hintLevel === 'number' ? saved.hintLevel : 0,
    exactTaken: saved.exactTaken === true,
    guide: saved.guide === 'intro' || saved.guide === 'on' ? saved.guide : null,
    opened: saved.opened === true,
  };
}
