// Part 2's lines as data (architecture, Pattern 5): a small language of its own, used only by
// leads, so that rooms keep refusing all of it. Parsing never throws: a line that doesn't read
// comes back as a refusal, as `parse` does for rooms.

import { isSDigit, type SToken } from '@/math/statement-tokens';

/** He can write up to 15 digits: they fit a safe integer. Longer numbers are only read. */
export const maxStatementDigits = 15;
const maxPowerDigits = 2;

export type SExpr =
  | { k: 'num'; v: number }
  | { k: 'var'; name: 'x' | 'n' }
  | { k: 'add' | 'sub' | 'mul' | 'div'; l: SExpr; r: SExpr }
  | { k: 'pow'; base: number; exp: number }
  | { k: 'group'; kind: 'round' | 'square' | 'curly'; e: SExpr };

export interface Bound {
  value: number;
  /** `<` rather than `≤`. */
  strict: boolean;
}

export type Statement =
  /** A chain of equal sides. `continues` starts with `=`: the line before is its first side. */
  | { k: 'sum'; continues: boolean; sides: SExpr[] }
  | { k: 'range'; low?: Bound; high?: Bound }
  | { k: 'not'; value: number }
  | { k: 'member'; value: number; set: 'N' | 'N0'; negated: boolean }
  | { k: 'list'; values: number[] }
  | { k: 'approx'; left: number; right: number }
  | { k: 'remainder'; dividend: number; divisor: number; quotient: number; rest: number }
  | { k: 'point'; label: string; value: number }
  | { k: 'mean'; sides: SExpr[] };

export type StatementRefusal = 'empty' | 'shape' | 'too-long' | 'bracket';

export type StatementResult =
  | { ok: true; statement: Statement }
  | { ok: false; reason: StatementRefusal };

const refused = (reason: StatementRefusal): StatementResult => ({ ok: false, reason });

const closes = { '(': ')', '[': ']', '{': '}' } as const;
const kinds = { '(': 'round', '[': 'square', '{': 'curly' } as const;
type Opener = keyof typeof closes;
const isOpener = (token: SToken | undefined): token is Opener =>
  token === '(' || token === '[' || token === '{';

class Stop extends Error {
  constructor(readonly reason: StatementRefusal) {
    super(reason);
  }
}

/** Reads one number's digits; null if the next token isn't a digit. */
function readNumber(tokens: readonly SToken[], at: { i: number }, max: number): number | null {
  let digits = '';
  while (isSDigit(tokens[at.i])) {
    digits += tokens[at.i];
    at.i += 1;
  }
  if (digits === '') return null;
  if (digits.length > max) throw new Stop('too-long');
  return Number(digits);
}

function readAtom(tokens: readonly SToken[], at: { i: number }): SExpr {
  const token = tokens[at.i];
  if (isOpener(token)) {
    at.i += 1;
    const e = readSum(tokens, at);
    if (tokens[at.i] !== closes[token]) throw new Stop('bracket');
    at.i += 1;
    return { k: 'group', kind: kinds[token], e };
  }
  if (token === 'x' || token === 'n') {
    at.i += 1;
    return { k: 'var', name: token };
  }
  const value = readNumber(tokens, at, maxStatementDigits);
  if (value === null) throw new Stop('shape');
  if (tokens[at.i] === '^') {
    at.i += 1;
    const exp = readNumber(tokens, at, maxPowerDigits);
    if (exp === null) throw new Stop('shape');
    return { k: 'pow', base: value, exp };
  }
  return { k: 'num', v: value };
}

function readProduct(tokens: readonly SToken[], at: { i: number }): SExpr {
  let left = readAtom(tokens, at);
  for (;;) {
    const token = tokens[at.i];
    if (token !== '·' && token !== ':') return left;
    at.i += 1;
    left = { k: token === '·' ? 'mul' : 'div', l: left, r: readAtom(tokens, at) };
  }
}

function readSum(tokens: readonly SToken[], at: { i: number }): SExpr {
  let left = readProduct(tokens, at);
  for (;;) {
    const token = tokens[at.i];
    if (token !== '+' && token !== '−') return left;
    at.i += 1;
    left = { k: token === '+' ? 'add' : 'sub', l: left, r: readProduct(tokens, at) };
  }
}

/** The sides of a chain, from `at` to the end: `a = b = c`. */
function readSides(tokens: readonly SToken[], at: { i: number }): SExpr[] {
  const sides = [readSum(tokens, at)];
  while (tokens[at.i] === '=') {
    at.i += 1;
    sides.push(readSum(tokens, at));
  }
  if (at.i !== tokens.length) throw new Stop('shape');
  return sides;
}

/** `a` alone, whole, or null if the tokens aren't just one number. */
function wholeNumber(tokens: readonly SToken[]): number | null {
  const at = { i: 0 };
  const value = readNumber(tokens, at, maxStatementDigits);
  return value !== null && at.i === tokens.length ? value : null;
}

function readList(tokens: readonly SToken[]): Statement | null {
  if (tokens[0] !== '{' || tokens[tokens.length - 1] !== '}') return null;
  const at = { i: 1 };
  const values: number[] = [];
  for (;;) {
    const value = readNumber(tokens, at, maxStatementDigits);
    if (value === null) return null;
    values.push(value);
    if (tokens[at.i] === '}' && at.i === tokens.length - 1) return { k: 'list', values };
    if (tokens[at.i] !== ',') return null;
    at.i += 1;
  }
}

const lessOps: ReadonlySet<string> = new Set(['<', '≤']);
const moreOps: ReadonlySet<string> = new Set(['>', '≥']);
const isComparison = (token: SToken) => lessOps.has(token) || moreOps.has(token) || token === '≠';

/** `230 < x < 240`, `x ≥ 3`, `x ≠ 5`: x alone between comparisons. */
function readRange(tokens: readonly SToken[]): Statement | null {
  const at = tokens.indexOf('x');
  if (at < 0 || tokens.lastIndexOf('x') !== at) return null;
  const before = tokens.slice(0, at);
  const after = tokens.slice(at + 1);
  const op = before[before.length - 1];
  const next = after[0];
  if (op !== undefined && !isComparison(op)) return null;
  if (next !== undefined && !isComparison(next)) return null;
  if (op === undefined && next === undefined) return null;
  const left = op === undefined ? null : wholeNumber(before.slice(0, -1));
  const right = next === undefined ? null : wholeNumber(after.slice(1));
  if (op !== undefined && left === null) return null;
  if (next !== undefined && right === null) return null;
  // ≠ stands only as `x ≠ 5`.
  if (op === '≠') return null;
  if (next === '≠') {
    return op === undefined && right !== null ? { k: 'not', value: right } : null;
  }
  const range: { low?: Bound; high?: Bound } = {};
  if (op !== undefined && left !== null) {
    const bound = { value: left, strict: op === '<' || op === '>' };
    if (lessOps.has(op)) range.low = bound;
    else range.high = bound;
  }
  if (next !== undefined && right !== null) {
    const bound = { value: right, strict: next === '<' || next === '>' };
    if (lessOps.has(next)) {
      if (range.high) return null;
      range.high = bound;
    } else {
      if (range.low) return null;
      range.low = bound;
    }
  }
  return { k: 'range', ...range };
}

function readMember(tokens: readonly SToken[]): Statement | null {
  if (tokens.length < 3) return null;
  const set = tokens[tokens.length - 1];
  const sign = tokens[tokens.length - 2];
  if ((set !== 'N' && set !== 'N₀') || (sign !== '∈' && sign !== '∉')) return null;
  const value = wholeNumber(tokens.slice(0, -2));
  if (value === null) return null;
  return { k: 'member', value, set: set === 'N' ? 'N' : 'N0', negated: sign === '∉' };
}

function readApprox(tokens: readonly SToken[]): Statement | null {
  const at = tokens.indexOf('≈');
  if (at < 0) return null;
  const left = wholeNumber(tokens.slice(0, at));
  const right = wholeNumber(tokens.slice(at + 1));
  return left !== null && right !== null ? { k: 'approx', left, right } : null;
}

/** `100 : 7 = 14 ost. 2` */
function readRemainder(tokens: readonly SToken[]): Statement | null {
  const rem = tokens.indexOf('ost.');
  if (rem < 0) return null;
  const equal = tokens.indexOf('=');
  const div = tokens.indexOf(':');
  if (div < 0 || equal < div || rem < equal) return null;
  const dividend = wholeNumber(tokens.slice(0, div));
  const divisor = wholeNumber(tokens.slice(div + 1, equal));
  const quotient = wholeNumber(tokens.slice(equal + 1, rem));
  const rest = wholeNumber(tokens.slice(rem + 1));
  if (dividend === null || divisor === null || quotient === null || rest === null) return null;
  return { k: 'remainder', dividend, divisor, quotient, rest };
}

function readPoint(tokens: readonly SToken[]): Statement | null {
  const label = tokens[0];
  if ((label !== 'A' && label !== 'B' && label !== 'C' && label !== 'D') || tokens[1] !== '=') {
    return null;
  }
  const value = wholeNumber(tokens.slice(2));
  return value === null ? null : { k: 'point', label, value };
}

/** A line of tokens as a statement, or why not. Never throws. */
export function parseStatement(tokens: readonly SToken[]): StatementResult {
  if (tokens.length === 0) return refused('empty');
  try {
    const shaped =
      readList(tokens) ??
      readMember(tokens) ??
      readApprox(tokens) ??
      readRemainder(tokens) ??
      readPoint(tokens);
    if (shaped) return { ok: true, statement: shaped };
    if (tokens[0] === 'x̄') {
      if (tokens[1] !== '=') return refused('shape');
      return { ok: true, statement: { k: 'mean', sides: readSides(tokens, { i: 2 }) } };
    }
    const hasComparison = tokens.some(isComparison);
    if (hasComparison) {
      const range = readRange(tokens);
      return range ? { ok: true, statement: range } : refused('shape');
    }
    const continues = tokens[0] === '=';
    const sides = readSides(tokens, { i: continues ? 1 : 0 });
    // A bare number, or a sum with no result, says nothing.
    if (!continues && sides.length < 2) return refused('shape');
    return { ok: true, statement: { k: 'sum', continues, sides } };
  } catch (stop) {
    if (stop instanceof Stop) return refused(stop.reason);
    throw stop;
  }
}

/** The bare number a line ends in, if it does: the door it names. */
export function resultOf(statement: Statement): number | null {
  if (statement.k !== 'sum' && statement.k !== 'mean') return null;
  const last = statement.sides[statement.sides.length - 1];
  return last?.k === 'num' ? last.v : null;
}
