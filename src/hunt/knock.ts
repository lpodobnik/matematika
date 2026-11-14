// Knock (GDD, Scene types; architecture, Pattern 7): he works out the door by writing. The lit
// doors are derived from his active lines, never stored, so striking a line is only recomputing,
// and undo needs no history. The notebook doesn't judge a line before the door: the door does.
// After a wrong door the scene's `mode` is `working`, and each line has to be true, which stops
// him changing the answer until a door opens.

import type { ObjectState } from '@/hunt/objects';
import type { Rational } from '@/math/rational';
import { parseStatement, resultOf, type Statement } from '@/math/statement';
import {
  fillLine,
  isSToken,
  readLine,
  readTokens,
  type SLineToken,
  type SToken,
} from '@/math/statement-tokens';
import { isTrue, lineValue, type TruthContext } from '@/math/truth';

export type Side = 'odd' | 'even';

export interface DoorRow {
  /** A street has two sides, which he crosses between; a lift has floors, from 0. */
  kind: 'street' | 'lift';
  from: number;
  to: number;
}

/** What one clue asks for. It stays in the notebook, so he never has to remember it. */
export type KnockClue =
  | { id: string; kind: 'side'; side: Side; say: string }
  /** A sum the notebook has already started: his result ends it. */
  | { id: string; kind: 'sum'; start: string; answer: number; say: string; structure: string }
  /** A belonging the notebook has already started, with a blank for his number. */
  | { id: string; kind: 'member'; start: string; answer: number; say: string; structure: string }
  /** A range or a list, written from the clue's own numbers. */
  | {
      id: string;
      kind: 'limit';
      numbers: readonly number[];
      canonical: string;
      say: string;
      structure: string;
    };

export interface KnockSpec {
  kind: 'knock';
  /** What the scene is, in a line. */
  intro: string;
  row: DoorRow;
  startSide: Side | null;
  clues: readonly KnockClue[];
  door: number;
  /** What a door says when he knocks there on an idea that's known to happen. */
  wrongDoors: readonly { door: number; say: string }[];
  /** Grumpy neighbours for any other wrong door. */
  grumpy: readonly string[];
  /** What opens up at the right door. */
  opened: string;
  /** A worked example with other numbers: the last help. */
  example: readonly string[];
  /** Keys beyond the digits, in a Knock: all the signs he's been taught so far. */
  keys: readonly SToken[];
  /** The `?` hint: the first press, then the exact next move. */
  hint: { step: string; move: string };
  context?: TruthContext;
  /** What stands above the doors, such as a chart to read. */
  picture?: ObjectState;
  /** The little one has wandered off: the neighbours grumble where it would shake (Act 2). */
  lost?: boolean;
  /**
   * A clue that's a trap (Knot 2): it isn't needed, its line can be struck like any other, and
   * following it leads to the door that holds a polite notice.
   */
  forged?: string;
}

export interface KnockLine {
  tokens: SToken[];
  clue: string | null;
  struck: boolean;
}

export interface KnockState {
  side: Side | null;
  lines: KnockLine[];
  /** What he's typing: the started part of the line isn't in it. */
  draft: SToken[];
  /** The clue his line goes with. */
  clue: string | null;
  mode: 'clues' | 'working';
  wrongTries: number;
  /** 0 to 3: rises with each wrong door and each idle minute. Not worth saving. */
  help: number;
  /** Counts shakes, so that each one plays. */
  shakes: number;
  /** The clue the little one points at. */
  pointAt: string | null;
  /** His last line lit a door, but across the road: he's told to cross, and the line stays. */
  across: boolean;
  /** A false working line: it stays in the draft, with a wobble. */
  bounced: boolean;
  /** What a wrong door shows, until he has read it. */
  shown: { door: number; say: string } | null;
  /** The line the little one has marked, after the second wrong door. */
  marked: number | null;
  /** He followed the forged note to its trap, and it's struck for him. */
  forgedGone: boolean;
  /** He has struck a line, or a line has been struck: no first-try parts. */
  anyStruck: boolean;
  hintLevel: number;
  /** The first Knock's guide: its opening words, then the asked move. Null once it's over. */
  guide: 'intro' | 'on' | null;
  /** He took the exact next move from `?`: no first-try parts, and nothing says so. */
  exactTaken: boolean;
  opened: boolean;
}

export function newKnock(spec: KnockSpec, guided = false): KnockState {
  return {
    side: spec.startSide,
    lines: [],
    draft: [],
    clue: firstClue(spec, []),
    mode: 'clues',
    wrongTries: 0,
    help: 0,
    shakes: 0,
    pointAt: null,
    across: false,
    bounced: false,
    shown: null,
    marked: null,
    forgedGone: false,
    anyStruck: false,
    hintLevel: 0,
    guide: guided ? 'intro' : null,
    exactTaken: false,
    opened: false,
  };
}

/** The row's doors on this side, in order. */
export function doorsOf(row: DoorRow, side: Side | null): number[] {
  const doors: number[] = [];
  for (let door = row.from; door <= row.to; door++) {
    if (row.kind === 'street' && side !== null) {
      if ((door % 2 === 0) !== (side === 'even')) continue;
    }
    doors.push(door);
  }
  return doors;
}

function statementOf(tokens: readonly SToken[]): Statement | null {
  const parsed = parseStatement(tokens);
  return parsed.ok ? parsed.statement : null;
}

/** Which doors a line leaves; null if it says nothing about doors, such as working. */
function lineKeeps(statement: Statement): ((door: number) => boolean) | null {
  switch (statement.k) {
    case 'sum': {
      const result = resultOf(statement);
      return result === null ? null : (door) => door === result;
    }
    case 'member':
      return (door) => door === statement.value;
    case 'list':
      return (door) => statement.values.includes(door);
    case 'not':
      return (door) => door !== statement.value;
    case 'range':
      return (door) =>
        isTrue(statement, {
          vars: { x: door },
        });
    default:
      return null;
  }
}

const active = (lines: readonly KnockLine[]) => lines.filter((line) => !line.struck);

/** The doors his active lines leave lit on this side. Derived, so undo is free. */
export function litDoors(
  row: DoorRow,
  side: Side | null,
  lines: readonly Pick<KnockLine, 'tokens' | 'struck'>[],
): number[] {
  const keeps = lines
    .filter((line) => !line.struck)
    .flatMap((line) => {
      const statement = statementOf(line.tokens);
      const keep = statement && lineKeeps(statement);
      return keep ? [keep] : [];
    });
  return doorsOf(row, side).filter((door) => keeps.every((keep) => keep(door)));
}

/** Whether his active lines have used this clue. */
function clueUsed(clue: KnockClue, state: Pick<KnockState, 'side' | 'lines'>): boolean {
  if (clue.kind === 'side') return state.side === clue.side;
  return active(state.lines).some((line) => {
    if (line.clue !== clue.id) return false;
    const statement = statementOf(line.tokens);
    return statement !== null && lineKeeps(statement) !== null;
  });
}

/** The clues he hasn't used yet, in order. */
export function cluesLeft(
  spec: KnockSpec,
  state: Pick<KnockState, 'side' | 'lines'>,
): readonly KnockClue[] {
  return spec.clues.filter((clue) => clue.id !== spec.forged && !clueUsed(clue, state));
}

/** The first clue he can write a line for. */
function firstClue(spec: KnockSpec, lines: readonly KnockLine[]): string | null {
  const writable = spec.clues.filter((clue) => clue.kind !== 'side' && clue.id !== spec.forged);
  const next = writable.find((clue) => !clueUsed(clue, { side: null, lines: [...lines] }));
  return next?.id ?? null;
}

/** The value of his last active working line for this clue, if it's waiting to be finished. */
function goingOn(
  spec: KnockSpec,
  lines: readonly KnockLine[],
  clue: string | null,
): Rational | null {
  const own = active(lines).filter((line) => line.clue === clue);
  const last = own[own.length - 1];
  if (!last) return null;
  const statement = statementOf(last.tokens);
  if (!statement || lineKeeps(statement) !== null) return null;
  return lineValue(statement, { ...spec.context, previous: previousOf(spec, own.slice(0, -1)) });
}

function previousOf(spec: KnockSpec, lines: readonly KnockLine[]): Rational | null {
  let previous: Rational | null = null;
  for (const line of lines) {
    const statement = statementOf(line.tokens);
    if (statement) previous = lineValue(statement, { ...spec.context, previous });
  }
  return previous;
}

/** What's already written on his line: the clue's start, or `=` going on from the line before. */
export function lineStart(spec: KnockSpec, state: KnockState): SLineToken[] {
  const clue = spec.clues.find((candidate) => candidate.id === state.clue);
  if (!clue || clue.kind === 'side' || clue.kind === 'limit') return [];
  if (goingOn(spec, state.lines, clue.id) !== null) return ['='];
  return readLine(clue.start) ?? [];
}

/** He's typing. */
export function knockType(state: KnockState, token: SToken, maxTokens: number): KnockState {
  if (state.opened || state.shown || state.draft.length >= maxTokens) return state;
  return { ...state, draft: [...state.draft, token], bounced: false, pointAt: null, across: false };
}

export function knockDelete(state: KnockState): KnockState {
  if (state.opened || state.shown || state.draft.length === 0) return state;
  return { ...state, draft: state.draft.slice(0, -1), bounced: false };
}

const shake = (state: KnockState, spec: KnockSpec): KnockState => ({
  ...state,
  shakes: state.shakes + 1,
  bounced: false,
  across: false,
  pointAt: cluesLeft(spec, state)[0]?.id ?? state.clue,
});

/** Whether a limit line uses the clue's own numbers, and nothing else. */
function usesNumbers(statement: Statement, numbers: readonly number[]): boolean {
  switch (statement.k) {
    case 'range':
      return [statement.low?.value, statement.high?.value]
        .filter((value) => value !== undefined)
        .every((value) => numbers.includes(value));
    case 'not':
      return numbers.includes(statement.value);
    case 'list':
      return statement.values.every((value) => numbers.includes(value));
    default:
      return false;
  }
}

/**
 * Which side a line is judged on: the side he stands on once it's the side a clue names, and both
 * sides before that, so that a right answer isn't struck for being across the road.
 */
function sideToJudge(spec: KnockSpec, state: KnockState): Side | null {
  const sideClue = spec.clues.find((clue) => clue.kind === 'side');
  return sideClue?.kind === 'side' && state.side === sideClue.side ? state.side : null;
}

/** Whether a line says what this clue asks, in the form it asks. */
function lineFits(clue: KnockClue, statement: Statement, tokens: readonly SToken[]): boolean {
  if (clue.kind === 'side') return false;
  if (clue.kind === 'limit') return usesNumbers(statement, clue.numbers);
  if (clue.kind === 'member') return statement.k === 'member';
  if (statement.k !== 'sum') return false;
  if (statement.continues) return true;
  const start = readLine(clue.start) ?? [];
  return start.every((token, i) => token === tokens[i]);
}

/** Enter: his line goes in, and acts on the row. */
export function knockEnter(spec: KnockSpec, state: KnockState): KnockState {
  if (state.opened || state.shown) return state;
  const start = lineStart(spec, state);
  const tokens = fillLine(start, state.draft);
  if (state.draft.length === 0) return shake(state, spec);
  const statement = statementOf(tokens);
  if (!statement) return shake(state, spec);
  // A line goes with the clue it fits, whichever clue he happens to be on.
  const clue = [
    spec.clues.find((candidate) => candidate.id === state.clue),
    ...cluesLeft(spec, state),
    ...spec.clues,
  ].find((candidate) => candidate && lineFits(candidate, statement, tokens));
  if (!clue) return shake(state, spec);
  const own = active(state.lines).filter((line) => line.clue === clue.id);
  const context = { ...spec.context, previous: previousOf(spec, own) };
  const keep = lineKeeps(statement);
  // Working on the way to a result has to be true, or it's nothing to go on from.
  if (keep === null && !isTrue(statement, context)) {
    return state.mode === 'working'
      ? { ...state, bounced: true, shakes: state.shakes + 1 }
      : shake(state, spec);
  }
  if (state.mode === 'working' && !isTrue(statement, context)) {
    return { ...state, bounced: true, shakes: state.shakes + 1 };
  }
  const line: KnockLine = { tokens, clue: clue.id, struck: false };
  const lines = [...state.lines, line];
  // A line that leaves no door: the same shake, and it's struck through. Until he stands on the
  // side a clue names, a door across the road is still a door: the line stays, and he's told to
  // cross.
  if (keep !== null && litDoors(spec.row, sideToJudge(spec, state), lines).length === 0) {
    return {
      ...shake(state, spec),
      lines: [...state.lines, { ...line, struck: true }],
      draft: [],
      anyStruck: true,
    };
  }
  const nextClue = keep === null ? clue.id : (firstClue(spec, lines) ?? clue.id);
  const across =
    keep !== null && state.side !== null && litDoors(spec.row, state.side, lines).length === 0;
  return {
    ...state,
    across,
    lines,
    draft: [],
    clue: nextClue,
    bounced: false,
    pointAt: null,
    // The row will scroll to what's lit.
  };
}

/** Tapping a line strikes it through, and tapping again restores it. */
export function knockStrike(spec: KnockSpec, state: KnockState, index: number): KnockState {
  const line = state.lines[index];
  if (!line || state.opened || state.shown) return state;
  const lines = state.lines.map((other, i) =>
    i === index ? { ...other, struck: !other.struck } : other,
  );
  if (line.struck && litDoors(spec.row, sideToJudge(spec, state), lines).length === 0) {
    return shake(state, spec);
  }
  return {
    ...state,
    lines,
    draft: [],
    anyStruck: state.anyStruck || !line.struck,
    clue: line.struck ? (firstClue(spec, lines) ?? state.clue) : (line.clue ?? state.clue),
    marked: state.marked === index ? null : state.marked,
    pointAt: null,
    across: false,
  };
}

/** He picks which clue his next line goes with. */
export function knockPickClue(spec: KnockSpec, state: KnockState, id: string): KnockState {
  const clue = spec.clues.find((candidate) => candidate.id === id);
  if (!clue || clue.kind === 'side' || state.opened || state.shown) return state;
  return { ...state, clue: id, draft: [], bounced: false, pointAt: null, across: false };
}

/** The control that crosses the road. */
export function knockCross(spec: KnockSpec, state: KnockState): KnockState {
  if (spec.row.kind !== 'street' || state.side === null || state.opened || state.shown) {
    return state;
  }
  return { ...state, side: state.side === 'odd' ? 'even' : 'odd', pointAt: null, across: false };
}

/**
 * A tap on a door. The little one knocks only when one door is lit and no clue is left unused.
 * Anywhere else he gets the shake, and it points at the next clue.
 */
export function knockDoor(spec: KnockSpec, state: KnockState, door: number): KnockState {
  if (state.opened || state.shown) return state;
  const lit = litDoors(spec.row, state.side, state.lines);
  if (lit.length !== 1 || lit[0] !== door || cluesLeft(spec, state).length > 0) {
    return writeDoor(spec, state, door, lit) ?? shake(state, spec);
  }
  if (door === spec.door) {
    return { ...state, opened: true, pointAt: null, bounced: false, guide: null };
  }
  const wrongTries = state.wrongTries + 1;
  const known = spec.wrongDoors.find((wrong) => wrong.door === door);
  const say = known?.say ?? spec.grumpy[(wrongTries - 1) % spec.grumpy.length] ?? '';
  // What named that door is struck through, and from now on the sum is worked line by line.
  const named = state.lines.map((line) => {
    const statement = statementOf(line.tokens);
    const names = statement !== null && lineNames(statement);
    return !line.struck && names ? { ...line, struck: true } : line;
  });
  // With only ranges, nothing names the door: the last line he wrote is what led here.
  if (!named.some((line, i) => line.struck && !state.lines[i]?.struck)) {
    for (let i = named.length - 1; i >= 0; i--) {
      const line = named[i];
      const statement = line && !line.struck ? statementOf(line.tokens) : null;
      if (line && statement && lineKeeps(statement) !== null) {
        named[i] = { ...line, struck: true };
        break;
      }
    }
  }
  const struckNow = named.flatMap((line, i) => (line.struck && !state.lines[i]?.struck ? [i] : []));
  return {
    ...state,
    lines: named,
    mode: 'working',
    wrongTries,
    help: Math.max(state.help, Math.min(3, wrongTries)),
    shown: { door, say },
    marked: wrongTries >= 2 ? (struckNow[0] ?? state.marked) : state.marked,
    // The forged note's trap: the note is struck for him.
    forgedGone: state.forgedGone || spec.wrongDoors.some((wrong) => wrong.door === door),
    anyStruck: true,
    clue: named[struckNow[0] ?? -1]?.clue ?? state.clue,
    draft: [],
  };
}

/**
 * A tap on a lit door before it's the only one: the clue's line is written with that door's number,
 * as if he had typed it, so the notebook still holds what he claims. If that leaves just this door,
 * and no clue unused, the little one knocks.
 */
function writeDoor(
  spec: KnockSpec,
  state: KnockState,
  door: number,
  lit: readonly number[],
): KnockState | null {
  const clue = spec.clues.find((candidate) => candidate.id === state.clue);
  if (!lit.includes(door) || !clue || clue.kind === 'side' || clue.kind === 'limit') return null;
  const written = knockEnter(spec, { ...state, draft: digitsOf(door), bounced: false });
  if (written.lines.length === state.lines.length) return written;
  const now = litDoors(spec.row, written.side, written.lines);
  const alone = now.length === 1 && now[0] === door && cluesLeft(spec, written).length === 0;
  return alone ? knockDoor(spec, written, door) : written;
}

/** Whether a line names one door. */
function lineNames(statement: Statement): boolean {
  return statement.k === 'member' || (statement.k === 'sum' && resultOf(statement) !== null);
}

/** He has read what the wrong door showed. */
export function knockDismiss(state: KnockState): KnockState {
  return state.shown ? { ...state, shown: null } : state;
}

/** A minute with nothing done: help rises, for nothing. */
export function knockIdle(state: KnockState): KnockState {
  if (state.opened || state.help >= 3) return state;
  return { ...state, help: state.help + 1 };
}

/** `?`: the first press names the step, the second the exact next move. */
export function knockHint(state: KnockState): KnockState {
  if (state.opened) return state;
  const hintLevel = Math.min(2, state.hintLevel + 1);
  return { ...state, hintLevel, exactTaken: state.exactTaken || hintLevel === 2 };
}

export type KnockGuideStep =
  | { kind: 'intro' }
  | { kind: 'cross' }
  | { kind: 'line'; clue: string; first: boolean }
  | { kind: 'door'; door: number };

/** What the guide asks for now: derived, so that it can't get out of step. */
export function knockGuide(spec: KnockSpec, state: KnockState): KnockGuideStep | null {
  if (state.guide === null || state.opened || state.shown) return null;
  if (state.guide === 'intro') return { kind: 'intro' };
  const left = cluesLeft(spec, state);
  const next = left[0];
  if (next?.kind === 'side') return { kind: 'cross' };
  if (next) {
    const written = spec.clues.filter((clue) => clue.kind !== 'side');
    return { kind: 'line', clue: next.id, first: left.length === written.length };
  }
  return { kind: 'door', door: litDoors(spec.row, state.side, state.lines)[0] ?? spec.door };
}

/** Whether the door earns its parts: no line struck, and no exact move taken. */
export function knockEarns(state: KnockState): boolean {
  return state.opened && !state.anyStruck && !state.exactTaken;
}

/** A saved scene back from the save, or null if it no longer fits its spec. */
export function knockFrom(spec: KnockSpec, value: unknown): KnockState | null {
  if (typeof value !== 'object' || value === null) return null;
  const saved = value as Partial<KnockState>;
  if (!Array.isArray(saved.lines) || !Array.isArray(saved.draft)) return null;
  const clueIds = new Set(spec.clues.map((clue) => clue.id));
  const lines: KnockLine[] = [];
  for (const line of saved.lines as Partial<KnockLine>[]) {
    if (!Array.isArray(line.tokens) || !line.tokens.every(isSToken)) return null;
    if (line.clue !== null && !clueIds.has(line.clue as string)) return null;
    lines.push({ tokens: line.tokens, clue: line.clue ?? null, struck: line.struck === true });
  }
  if (!saved.draft.every(isSToken)) return null;
  const fresh = newKnock(spec);
  return {
    ...fresh,
    side: saved.side === 'odd' || saved.side === 'even' ? saved.side : fresh.side,
    lines,
    draft: saved.draft,
    clue: typeof saved.clue === 'string' && clueIds.has(saved.clue) ? saved.clue : fresh.clue,
    mode: saved.mode === 'working' ? 'working' : 'clues',
    wrongTries: typeof saved.wrongTries === 'number' ? saved.wrongTries : 0,
    shown: null,
    marked: typeof saved.marked === 'number' ? saved.marked : null,
    forgedGone: saved.forgedGone === true,
    anyStruck: saved.anyStruck === true,
    hintLevel: typeof saved.hintLevel === 'number' ? saved.hintLevel : 0,
    guide: saved.guide === 'intro' || saved.guide === 'on' ? saved.guide : null,
    exactTaken: saved.exactTaken === true,
    opened: saved.opened === true,
  };
}

/** A clue's canonical line, for the tests that prove a lead (hunt/solve.ts). */
export function canonicalLine(clue: KnockClue): SToken[] | null {
  if (clue.kind === 'side') return null;
  if (clue.kind === 'limit') return readTokens(clue.canonical);
  const start = readLine(clue.start);
  return start && fillLine(start, digitsOf(clue.answer));
}

/** What he types for a clue's canonical line: the clue has already started the rest. */
export function lineValueOfClue(clue: KnockClue): SToken[] {
  if (clue.kind === 'side') return [];
  if (clue.kind === 'limit') return readTokens(clue.canonical) ?? [];
  return digitsOf(clue.answer);
}

export function digitsOf(value: number): SToken[] {
  return String(value).split('') as SToken[];
}
