// The one-offs (GDD, Scene types; architecture, Pattern 7): small models, each used by one lead.
// Load the carts, Level the load, Bracket locks, the facade's windows and the loop's lamps.

import { toText } from '@/math/rational';
import { parseStatement } from '@/math/statement';
import { fillLine, isSToken, readLine, readTokens, type SToken } from '@/math/statement-tokens';
import { exprValue, isTrue } from '@/math/truth';

/** What's common: a line to write at the end of a round, with fading. */
export interface RoundLine {
  say: string;
  start: string;
  accepts: readonly string[];
  keys: readonly SToken[];
}

interface Common {
  help: number;
  hintLevel: number;
  exactTaken: boolean;
  guide: 'intro' | 'on' | null;
  opened: boolean;
  draft: SToken[];
  bounced: boolean;
  refused: boolean;
  /** What's just been said, until he's read it. */
  notice: string | null;
  /** He tried something that went wrong: no first-try parts. */
  slips: number;
}

function common(guided: boolean): Common {
  return {
    help: 0,
    hintLevel: 0,
    exactTaken: false,
    guide: guided ? 'intro' : null,
    opened: false,
    draft: [],
    bounced: false,
    refused: false,
    notice: null,
    slips: 0,
  };
}

/** A round's line: what it says happens to the line typed. */
function judge(line: RoundLine, draft: readonly SToken[]): 'right' | 'false' | 'refused' {
  const tokens = fillLine(readLine(line.start) ?? [], draft);
  const same = line.accepts.some((text) => {
    const accepted = readTokens(text);
    return (
      accepted !== null &&
      accepted.length === tokens.length &&
      accepted.every((token, i) => token === tokens[i])
    );
  });
  if (same) return 'right';
  const parsed = parseStatement(tokens);
  return parsed.ok && !isTrue(parsed.statement) ? 'false' : 'refused';
}

function commonFrom<T extends Common>(saved: Partial<T>): Common | null {
  if (!Array.isArray(saved.draft) || !saved.draft.every(isSToken)) return null;
  return {
    ...common(false),
    draft: saved.draft,
    slips: typeof saved.slips === 'number' ? saved.slips : 0,
    hintLevel: typeof saved.hintLevel === 'number' ? saved.hintLevel : 0,
    exactTaken: saved.exactTaken === true,
    guide: saved.guide === 'intro' || saved.guide === 'on' ? saved.guide : null,
    opened: saved.opened === true,
  };
}

/** Shared moves: typing and reading. */
export function oneOffType<T extends Common>(state: T, token: SToken): T {
  if (state.opened || state.notice || state.draft.length >= 40) return state;
  return { ...state, draft: [...state.draft, token], bounced: false, refused: false };
}

export function oneOffDelete<T extends Common>(state: T): T {
  if (state.draft.length === 0) return state;
  return { ...state, draft: state.draft.slice(0, -1), bounced: false, refused: false };
}

export function oneOffIdle<T extends Common>(state: T): T {
  return state.opened || state.help >= 3 ? state : { ...state, help: state.help + 1 };
}

export function oneOffHint<T extends Common>(state: T): T {
  if (state.opened) return state;
  const hintLevel = Math.min(2, state.hintLevel + 1);
  return { ...state, hintLevel, exactTaken: state.exactTaken || hintLevel === 2 };
}

export function oneOffEarns<T extends Common>(state: T): boolean {
  return state.opened && state.slips === 0 && !state.exactTaken;
}

/* ------------------------------ Load the carts ------------------------------ */

export type CartsRound =
  /** Share the crates onto this many carts: how many on each? */
  | { kind: 'share'; crates: number; carts: number; bundle: number; line: RoundLine; say: string }
  /** Load them in loads of this size: how many carts? */
  | { kind: 'loads'; crates: number; per: number; bundle: number; line: RoundLine; say: string }
  /** Share among 0 carts: the crates stay on the ground for good. */
  | { kind: 'no-carts'; crates: number; result: string; say: string }
  /** Share 0 crates among some carts: each gets 0. */
  | { kind: 'no-crates'; carts: number; line: RoundLine; say: string };

export interface CartsSpec {
  kind: 'carts';
  intro: string;
  rounds: readonly CartsRound[];
  /** What happens to uneven carts. */
  tipped: string;
  /** What's left on the ground when he sends the carts off. */
  left: string;
  opened: string;
  example: readonly string[];
  hint: { step: string; move: string };
}

export interface CartsState extends Common {
  round: number;
  /** What's on each cart, in crates. */
  loads: number[];
  phase: 'load' | 'write';
}

function cartsFor(round: CartsRound | undefined): number[] {
  if (!round) return [];
  if (round.kind === 'share') return Array.from({ length: round.carts }, () => 0);
  if (round.kind === 'loads') return [0];
  if (round.kind === 'no-crates') return Array.from({ length: round.carts }, () => 0);
  return [];
}

export function newCarts(spec: CartsSpec, guided = false): CartsState {
  return {
    ...common(guided),
    round: 0,
    loads: cartsFor(spec.rounds[0]),
    phase: 'load',
  };
}

/** What's still on the ground. */
export function cartsGround(round: CartsRound | undefined, loads: readonly number[]): number {
  if (!round || round.kind === 'no-crates') return 0;
  return round.crates - loads.reduce((sum, load) => sum + load, 0);
}

/** A bundle onto a cart. In loads, a full cart gets another behind it. */
export function cartsLoad(spec: CartsSpec, state: CartsState, cart: number): CartsState {
  const round = spec.rounds[state.round];
  if (!round || state.phase !== 'load' || state.notice || state.opened) return state;
  if (round.kind !== 'share' && round.kind !== 'loads') return state;
  if (cart < 0 || cart >= state.loads.length) return state;
  if (cartsGround(round, state.loads) < round.bundle) return state;
  const loads = state.loads.map((load, i) => (i === cart ? load + round.bundle : load));
  if (round.kind === 'loads') {
    if ((loads[cart] ?? 0) > round.per) return state;
    const room = loads.some((load) => load < round.per);
    if (!room && cartsGround(round, loads) > 0) loads.push(0);
  }
  return { ...state, loads };
}

/** A bundle back off a cart, to fix it. */
export function cartsUnload(spec: CartsSpec, state: CartsState, cart: number): CartsState {
  const round = spec.rounds[state.round];
  if (!round || state.phase !== 'load' || state.notice || state.opened) return state;
  if (round.kind !== 'share' && round.kind !== 'loads') return state;
  if ((state.loads[cart] ?? 0) < round.bundle) return state;
  return {
    ...state,
    loads: state.loads.map((load, i) => (i === cart ? load - round.bundle : load)),
  };
}

function cartsNext(spec: CartsSpec, state: CartsState): CartsState {
  const round = state.round + 1;
  if (round >= spec.rounds.length) return { ...state, opened: true, guide: null, phase: 'load' };
  return {
    ...state,
    round,
    loads: cartsFor(spec.rounds[round]),
    phase: 'load',
    draft: [],
    bounced: false,
    refused: false,
  };
}

/** He sends them off. Uneven carts tip; anything left on the ground stays there. */
export function cartsGo(spec: CartsSpec, state: CartsState): CartsState {
  const round = spec.rounds[state.round];
  if (!round || state.phase !== 'load' || state.notice || state.opened) return state;
  if (round.kind === 'no-carts') return { ...state, notice: round.result };
  if (round.kind === 'no-crates') return { ...state, phase: 'write' };
  if (cartsGround(round, state.loads) > 0) {
    return { ...state, notice: spec.left, slips: state.slips + 1 };
  }
  const uneven = round.kind === 'share' && new Set(state.loads).size > 1;
  if (uneven) return { ...state, notice: spec.tipped, slips: state.slips + 1 };
  return { ...state, phase: 'write' };
}

export function cartsDismiss(spec: CartsSpec, state: CartsState): CartsState {
  if (!state.notice) return state;
  const round = spec.rounds[state.round];
  const read = { ...state, notice: null };
  return round?.kind === 'no-carts' ? cartsNext(spec, read) : read;
}

export function cartsEnter(spec: CartsSpec, state: CartsState): CartsState {
  const round = spec.rounds[state.round];
  if (!round || state.phase !== 'write' || round.kind === 'no-carts') return state;
  const verdict = judge(round.line, state.draft);
  if (verdict === 'right') return cartsNext(spec, state);
  return { ...state, bounced: verdict === 'false', refused: verdict === 'refused' };
}

export function proveCarts(spec: CartsSpec): string[] {
  const problems: string[] = [];
  for (const [i, round] of spec.rounds.entries()) {
    if (round.kind === 'share' && round.crates % (round.carts * round.bundle) !== 0) {
      problems.push(`round ${i} can't be shared evenly`);
    }
    if (round.kind === 'loads' && round.crates % round.per !== 0) {
      problems.push(`round ${i} doesn't divide into loads`);
    }
    if (round.kind !== 'no-carts') problems.push(...proveLines([round.line]));
  }
  if (!spec.rounds.some((round) => round.kind === 'no-carts')) problems.push('no sharing among 0');
  return problems;
}

/* ------------------------------ Level the load ------------------------------ */

export interface LevelRound {
  stacks: readonly number[];
  line: RoundLine;
}

export interface LevelSpec {
  kind: 'level';
  intro: string;
  rounds: readonly LevelRound[];
  /** Said when the bar balances. */
  level: string;
  opened: string;
  example: readonly string[];
  hint: { step: string; move: string };
}

export interface LevelState extends Common {
  round: number;
  stacks: number[];
  /** The stack he's lifted a crate from. */
  held: number | null;
  phase: 'level' | 'write';
}

export function newLevel(spec: LevelSpec, guided = false): LevelState {
  return {
    ...common(guided),
    round: 0,
    stacks: [...(spec.rounds[0]?.stacks ?? [])],
    held: null,
    phase: 'level',
  };
}

/** How far the bar tilts: positive when the right is heavier. */
export function levelTilt(stacks: readonly number[]): number {
  const middle = (stacks.length - 1) / 2;
  return stacks.reduce((tilt, stack, i) => tilt + stack * (i - middle), 0);
}

/** A tap on a stack: lifts a crate from it, or puts the one he holds on it. */
export function levelTap(spec: LevelSpec, state: LevelState, stack: number): LevelState {
  if (state.phase !== 'level' || state.opened || state.notice) return state;
  if (stack < 0 || stack >= state.stacks.length) return state;
  if (state.held === null)
    return (state.stacks[stack] ?? 0) > 0 ? { ...state, held: stack } : state;
  if (state.held === stack) return { ...state, held: null };
  const stacks = state.stacks.map((count, i) =>
    i === state.held ? count - 1 : i === stack ? count + 1 : count,
  );
  const even = new Set(stacks).size === 1;
  return {
    ...state,
    stacks,
    held: null,
    phase: even ? 'write' : 'level',
    notice: even ? spec.level : null,
  };
}

export function levelDismiss(state: LevelState): LevelState {
  return state.notice ? { ...state, notice: null } : state;
}

export function levelEnter(spec: LevelSpec, state: LevelState): LevelState {
  const round = spec.rounds[state.round];
  if (!round || state.phase !== 'write' || state.notice) return state;
  const verdict = judge(round.line, state.draft);
  if (verdict !== 'right') {
    return { ...state, bounced: verdict === 'false', refused: verdict === 'refused' };
  }
  const next = state.round + 1;
  if (next >= spec.rounds.length) return { ...state, opened: true, guide: null, draft: [] };
  return {
    ...state,
    round: next,
    stacks: [...(spec.rounds[next]?.stacks ?? [])],
    held: null,
    phase: 'level',
    draft: [],
    bounced: false,
    refused: false,
  };
}

export function proveLevel(spec: LevelSpec): string[] {
  const problems: string[] = [];
  for (const [i, round] of spec.rounds.entries()) {
    if (round.stacks.length < 2 || round.stacks.length > 6)
      problems.push(`round ${i}: 2 to 6 stacks`);
    const total = round.stacks.reduce((sum, stack) => sum + stack, 0);
    if (total % round.stacks.length !== 0) problems.push(`round ${i} can't level`);
    if (new Set(round.stacks).size === 1) problems.push(`round ${i} is level already`);
    problems.push(...proveLines([round.line]));
  }
  return problems;
}

/* ------------------------------ Bracket locks ------------------------------ */

export interface LockSpec {
  /** A sum with no brackets: `3 + 4 · 3 + 3`. */
  strip: string;
  target: number;
}

export interface LocksSpec {
  kind: 'locks';
  intro: string;
  locks: readonly LockSpec[];
  /** Said when the lock stays shut, with the result it got. */
  shut: (result: string) => string;
  opened: string;
  example: readonly string[];
  hint: { step: string; move: string };
}

export interface LocksState extends Common {
  lock: number;
  /** Where he's put the opening bracket, counted in the strip's numbers. */
  from: number | null;
  /** The last placement's result, kept so that he can see what it did. */
  tried: string | null;
}

export function newLocks(guided = false): LocksState {
  return { ...common(guided), lock: 0, from: null, tried: null };
}

/** The strip's numbers and signs in turn. */
function stripParts(strip: string): string[] {
  return strip.split(' ').filter((part) => part !== '');
}

/** The numbers of a strip, in order: what a tap picks. */
export function stripNumbers(strip: string): string[] {
  return stripParts(strip).filter((part) => /^\d+$/.test(part));
}

/** The strip with brackets from one number through another, as a line. */
export function withBrackets(strip: string, from: number, to: number): string {
  let number = -1;
  return stripParts(strip)
    .map((part) => {
      if (!/^\d+$/.test(part)) return part;
      number += 1;
      if (number === from) return `(${part}`;
      if (number === to) return `${part})`;
      return part;
    })
    .join(' ');
}

/** What a sum comes to, or null. */
export function sumResult(line: string): string | null {
  const tokens = readTokens(`${line} = 0`);
  const parsed = tokens && parseStatement(tokens);
  if (!parsed?.ok || parsed.statement.k !== 'sum') return null;
  const side = parsed.statement.sides[0];
  const value = side ? exprValue(side) : null;
  return value ? toText(value) : null;
}

/** A tap on a number: the first opens a bracket, the second closes it and tries the lock. */
export function locksTap(spec: LocksSpec, state: LocksState, number: number): LocksState {
  const lock = spec.locks[state.lock];
  if (!lock || state.opened || state.notice) return state;
  if (state.from === null) return { ...state, from: number, tried: null };
  if (number <= state.from) return { ...state, from: number === state.from ? null : number };
  const line = withBrackets(lock.strip, state.from, number);
  const result = sumResult(line);
  if (result === String(lock.target)) {
    const next = state.lock + 1;
    if (next >= spec.locks.length) return { ...state, opened: true, guide: null, from: null };
    return { ...state, lock: next, from: null, tried: null };
  }
  return {
    ...state,
    from: null,
    tried: line,
    notice: spec.shut(result ?? '?'),
    slips: state.slips + 1,
  };
}

export function locksDismiss(state: LocksState): LocksState {
  return state.notice ? { ...state, notice: null } : state;
}

/** Whether a lock can be opened with one pair of brackets, and not without. */
export function proveLocks(spec: LocksSpec): string[] {
  const problems: string[] = [];
  for (const lock of spec.locks) {
    const count = stripNumbers(lock.strip).length;
    let found = false;
    for (let from = 0; from < count; from++) {
      for (let to = from + 1; to < count; to++) {
        if (sumResult(withBrackets(lock.strip, from, to)) === String(lock.target)) found = true;
      }
    }
    if (!found) problems.push(`"${lock.strip}" can't reach ${lock.target}`);
    if (sumResult(lock.strip) === String(lock.target)) {
      problems.push(`"${lock.strip}" needs no brackets`);
    }
  }
  return problems;
}

/* ------------------------------ The facade's windows ------------------------------ */

export interface WindowsRound {
  rows: number;
  columns: number;
  /** The window it has to reach, counted along the rows. */
  target: number;
  say: string;
}

export interface WindowsSpec {
  kind: 'windows';
  intro: string;
  rounds: readonly WindowsRound[];
  /** A sleepy resident at a wrong window. */
  sleepy: readonly string[];
  /** It reached the window. */
  reached: string;
  opened: string;
  example: readonly string[];
  hint: { step: string; move: string };
}

export interface WindowsState extends Common {
  round: number;
  /** Turned to the other side: the same count reads the other way. */
  turned: boolean;
  /** The number on the window he's just tapped. */
  shown: number | null;
}

export function newWindows(guided = false): WindowsState {
  return { ...common(guided), round: 0, turned: false, shown: null };
}

export function windowsTurn(state: WindowsState): WindowsState {
  if (state.opened || state.notice) return state;
  return { ...state, turned: !state.turned };
}

/** The number on a window, at a row and column, as he's looking at it. */
export function windowNumber(
  round: WindowsRound,
  turned: boolean,
  row: number,
  col: number,
): number {
  const across = turned ? round.rows : round.columns;
  return row * across + col + 1;
}

/** He throws the hook at a window. */
export function windowsThrow(spec: WindowsSpec, state: WindowsState, number: number): WindowsState {
  const round = spec.rounds[state.round];
  if (!round || state.opened || state.notice) return state;
  if (number === round.target) {
    return { ...state, shown: number, notice: spec.reached };
  }
  return {
    ...state,
    shown: number,
    slips: state.slips + 1,
    notice: spec.sleepy[state.slips % spec.sleepy.length] ?? '',
    help: Math.min(3, state.help + 1),
  };
}

export function windowsDismiss(spec: WindowsSpec, state: WindowsState): WindowsState {
  if (!state.notice) return state;
  const round = spec.rounds[state.round];
  const reached = round && state.shown === round.target;
  if (!reached) return { ...state, notice: null, shown: null };
  const next = state.round + 1;
  if (next >= spec.rounds.length) {
    return { ...state, notice: null, shown: null, opened: true, guide: null };
  }
  return { ...state, notice: null, shown: null, round: next, turned: false };
}

export function proveWindows(spec: WindowsSpec): string[] {
  const problems: string[] = [];
  for (const [i, round] of spec.rounds.entries()) {
    if (round.target < 1 || round.target > round.rows * round.columns) {
      problems.push(`round ${i}: the window isn't there`);
    }
  }
  if (spec.sleepy.length === 0) problems.push('nobody sleepy');
  return problems;
}

/* ------------------------------ The loop's lamps ------------------------------ */

export interface LoopBoard {
  /** Lamps on the loop, numbered from 0, where the patrol starts. */
  lamps: number;
  /** How many steps until the bell: a wrong try gets the next. */
  bells: readonly number[];
}

export interface LoopSpec {
  kind: 'loop';
  intro: string;
  boards: readonly LoopBoard[];
  /** It sleeps at the lamp he's waiting at. */
  taken: string;
  /** It sleeps somewhere else: where it really stopped. */
  missed: (lamp: number) => string;
  /** The notebook starts each line with the bell's division. */
  keys: readonly SToken[];
  opened: string;
  example: readonly string[];
  hint: { step: string; move: string };
}

export interface LoopState extends Common {
  board: number;
  bell: number;
  /** The lamp his line pins, then where it really stopped. */
  pinned: number | null;
  stopped: number | null;
  /** He has the key. */
  got: boolean;
}

export function newLoop(guided = false): LoopState {
  return { ...common(guided), board: 0, bell: 0, pinned: null, stopped: null, got: false };
}

/** The steps of the bell he's on. */
export function loopSteps(board: LoopBoard, state: LoopState): number {
  return board.bells[state.bell % board.bells.length] ?? 0;
}

/** The line the notebook starts: the division, for him to finish. */
export function loopStart(board: LoopBoard, state: LoopState): string {
  return `${loopSteps(board, state)} : ${board.lamps} =`;
}

/** His division pins a lamp, and time then runs by itself. */
export function loopEnter(spec: LoopSpec, state: LoopState): LoopState {
  const board = spec.boards[state.board];
  if (!board || state.opened || state.notice) return state;
  const tokens = fillLine(readLine(loopStart(board, state)) ?? [], state.draft);
  const parsed = parseStatement(tokens);
  if (!parsed.ok || parsed.statement.k !== 'remainder') {
    return { ...state, refused: true, bounced: false };
  }
  const steps = loopSteps(board, state);
  const really = steps % board.lamps;
  const { rest } = parsed.statement;
  if (rest >= board.lamps) return { ...state, bounced: true, refused: false };
  const right = rest === really && isTrue(parsed.statement);
  return {
    ...state,
    pinned: rest,
    stopped: really,
    got: right,
    draft: [],
    bounced: false,
    refused: false,
    slips: right ? state.slips : state.slips + 1,
    help: right ? state.help : Math.min(3, state.help + 1),
    notice: right ? spec.taken : spec.missed(really),
  };
}

export function loopDismiss(spec: LoopSpec, state: LoopState): LoopState {
  if (!state.notice) return state;
  if (!state.got) {
    return { ...state, notice: null, pinned: null, stopped: null, bell: state.bell + 1 };
  }
  const next = state.board + 1;
  if (next >= spec.boards.length) {
    return { ...state, notice: null, opened: true, guide: null };
  }
  return { ...state, notice: null, board: next, bell: 0, pinned: null, stopped: null, got: false };
}

export function proveLoop(spec: LoopSpec): string[] {
  const problems: string[] = [];
  for (const [i, board] of spec.boards.entries()) {
    if (board.bells.length < 2) problems.push(`board ${i} has no bell for a next try`);
    const ends = new Set(board.bells.map((steps) => steps % board.lamps));
    if (ends.size !== board.bells.length) problems.push(`board ${i}: two bells stop at one lamp`);
  }
  return problems;
}

/* ------------------------------ Lines, proved ------------------------------ */

function proveLines(lines: readonly RoundLine[]): string[] {
  const problems: string[] = [];
  for (const line of lines) {
    for (const text of line.accepts) {
      const tokens = readTokens(text);
      const parsed = tokens && parseStatement(tokens);
      if (!parsed?.ok || !isTrue(parsed.statement)) problems.push(`"${text}" isn't true`);
    }
  }
  return problems;
}

/* ------------------------------ Back from the save ------------------------------ */

export function cartsFrom(spec: CartsSpec, value: unknown): CartsState | null {
  if (typeof value !== 'object' || value === null) return null;
  const saved = value as Partial<CartsState>;
  const base = commonFrom(saved);
  if (!base || typeof saved.round !== 'number' || saved.round >= spec.rounds.length) return null;
  if (!Array.isArray(saved.loads)) return null;
  return {
    ...base,
    round: saved.round,
    loads: saved.loads,
    phase: saved.phase === 'write' ? 'write' : 'load',
  };
}

export function levelFrom(spec: LevelSpec, value: unknown): LevelState | null {
  if (typeof value !== 'object' || value === null) return null;
  const saved = value as Partial<LevelState>;
  const base = commonFrom(saved);
  if (!base || typeof saved.round !== 'number' || saved.round >= spec.rounds.length) return null;
  if (!Array.isArray(saved.stacks)) return null;
  return {
    ...base,
    round: saved.round,
    stacks: saved.stacks,
    held: null,
    phase: saved.phase === 'write' ? 'write' : 'level',
  };
}

export function locksFrom(spec: LocksSpec, value: unknown): LocksState | null {
  if (typeof value !== 'object' || value === null) return null;
  const saved = value as Partial<LocksState>;
  const base = commonFrom(saved);
  if (!base || typeof saved.lock !== 'number' || saved.lock >= spec.locks.length) return null;
  return { ...base, lock: saved.lock, from: null, tried: null };
}

export function windowsFrom(spec: WindowsSpec, value: unknown): WindowsState | null {
  if (typeof value !== 'object' || value === null) return null;
  const saved = value as Partial<WindowsState>;
  const base = commonFrom(saved);
  if (!base || typeof saved.round !== 'number' || saved.round >= spec.rounds.length) return null;
  return { ...base, round: saved.round, turned: saved.turned === true, shown: null };
}

export function loopFrom(spec: LoopSpec, value: unknown): LoopState | null {
  if (typeof value !== 'object' || value === null) return null;
  const saved = value as Partial<LoopState>;
  const base = commonFrom(saved);
  if (!base || typeof saved.board !== 'number' || saved.board >= spec.boards.length) return null;
  return {
    ...base,
    board: saved.board,
    bell: typeof saved.bell === 'number' ? saved.bell : 0,
    pinned: null,
    stopped: null,
    got: false,
  };
}
