// What changed between two lines, for the pans to act out and the play log to record, and
// whether a line makes progress (architecture Pattern 1: `moves.ts`, Progress, Balance
// moves). Both work on any two lines; the checker calls them only for correct ones.

import { type Equation, type Expr, hasX, sameExpr } from '@/math/expr';
import { toLinear } from '@/math/linear';
import * as q from '@/math/rational';

export type Side = 'left' | 'right';

/** One piece's worth of an equation side (architecture, Data Architecture). */
export type Term =
  | { kind: 'num'; value: number; sign: 1 | -1 } // weight or float
  | { kind: 'x'; coef: number; sign: 1 | -1; divisor?: number }; // x-gears, springs, divider

export type Move =
  | { kind: 'add-both'; term: Term } // same piece on or off both pans
  | { kind: 'split-both'; parts: number } // the splitter
  | { kind: 'move-across'; term: Term } // 2x + 7 = 25 → 2x = 25 − 7: the weight leaves, a float appears opposite
  | { kind: 'evaluate'; side: Side } // 25 − 7 → 18: pieces merge
  | { kind: 'swap' }
  | { kind: 'compound' } // skipped steps: pieces morph in one go
  | { kind: 'none' };

export type MoveKind = Move['kind'];

/**
 * The complexity tuple (terms on the x side, 1 if x's coefficient isn't 1 else 0,
 * operators on the number side), compared lexicographically. Terms are counted as
 * written, along the chain of + and −, so `2x + 7 − 7` has three; a bracketed group on
 * the right is one term, as in `expr.ts`. A line with x on both sides (outside the MVP,
 * but he can write one) counts the terms of both sides, with the coefficient flag set and
 * no number side. A line with no x has no x side.
 */
export type ProgressTuple = readonly [terms: number, coefficient: 0 | 1, operators: number];

function terms(expr: Expr): number {
  return expr.k === 'add' || expr.k === 'sub' ? terms(expr.l) + 1 : 1;
}

function operators(expr: Expr): number {
  return expr.k === 'num' || expr.k === 'x' ? 0 : 1 + operators(expr.l) + operators(expr.r);
}

export function complexity(equation: Equation): ProgressTuple {
  const { left, right } = equation;
  const [leftX, rightX] = [hasX(left), hasX(right)];
  if (leftX && rightX) return [terms(left) + terms(right), 1, 0];
  if (!leftX && !rightX) return [0, 0, operators(left) + operators(right)];
  const [xSide, numberSide] = leftX ? [left, right] : [right, left];
  const linear = toLinear(xSide);
  const unit = linear.kind === 'linear' && q.equals(linear.a, q.one);
  return [terms(xSide), unit ? 0 : 1, operators(numberSide)];
}

/** -1, 0 or 1, lexicographically. */
export function compareComplexity(a: ProgressTuple, b: ProgressTuple): -1 | 0 | 1 {
  for (let i = 0; i < 3; i += 1) {
    const [x, y] = [a[i] ?? 0, b[i] ?? 0];
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

/** A line makes progress if its tuple is smaller than the previous committed line's. */
export function makesProgress(previous: Equation, next: Equation): boolean {
  return compareComplexity(complexity(next), complexity(previous)) < 0;
}

interface Lin {
  a: q.Rational;
  b: q.Rational;
}

function lin(expr: Expr): Lin | null {
  const result = toLinear(expr);
  return result.kind === 'linear' ? { a: result.a, b: result.b } : null;
}

function sameLin(m: Lin, n: Lin): boolean {
  return q.equals(m.a, n.a) && q.equals(m.b, n.b);
}

function minus(m: Lin, n: Lin): Lin {
  return { a: q.sub(m.a, n.a), b: q.sub(m.b, n.b) };
}

function isZeroLin(m: Lin): boolean {
  return q.isZero(m.a) && q.isZero(m.b);
}

function safeWhole(value: bigint): number | null {
  const magnitude = value < 0n ? -value : value;
  return magnitude <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(magnitude) : null;
}

/** The piece a change of `delta` is: a whole number, or x-gears (with a divider). */
function termOf(delta: Lin): Term | null {
  if (q.isZero(delta.a) && !q.isZero(delta.b)) {
    const value = q.isInteger(delta.b) ? safeWhole(delta.b.n) : null;
    return value === null ? null : { kind: 'num', value, sign: delta.b.n > 0n ? 1 : -1 };
  }
  if (!q.isZero(delta.a) && q.isZero(delta.b)) {
    const coef = safeWhole(delta.a.n);
    const divisor = safeWhole(delta.a.d);
    if (coef === null || divisor === null) return null;
    const sign = delta.a.n > 0n ? 1 : -1;
    return divisor > 1 ? { kind: 'x', coef, sign, divisor } : { kind: 'x', coef, sign };
  }
  return null;
}

function flip(term: Term): Term {
  return { ...term, sign: term.sign === 1 ? -1 : 1 };
}

/** `side` is `before` with `delta` written after it: `25` → `25 − 7` for −7. */
function appends(side: Expr, before: Expr, delta: Lin): boolean {
  if (side.k !== 'add' && side.k !== 'sub') return false;
  if (!sameExpr(side.l, before)) return false;
  const written = lin(side.r);
  if (written === null) return false;
  const signed = side.k === 'add' ? written : minus({ a: q.zero, b: q.zero }, written);
  return sameLin(signed, delta);
}

/** The whole number n ≥ 2 with every part of `before` equal to n times `after`, if any. */
function splitParts(before: readonly q.Rational[], after: readonly q.Rational[]): number | null {
  const index = before.findIndex((value) => !q.isZero(value));
  const [b, a] = [before[index], after[index]];
  if (b === undefined || a === undefined || q.isZero(a)) return null;
  const ratio = q.div(b, a);
  if (!q.isInteger(ratio) || ratio.n < 2n) return null;
  if (!before.every((value, i) => q.equals(value, q.mul(after[i] ?? q.zero, ratio)))) return null;
  return safeWhole(ratio.n);
}

/**
 * Classifies the change from `previous` to `next`, in this order: nothing (up to
 * commuted terms), swapped sides, one side evaluated, the same piece on or off both pans
 * (`move-across` when one side loses a term and the other shows it written out with the
 * opposite sign), both pans split into equal parts, and otherwise `compound`. Multiplying
 * both sides is `compound`: the architecture's moves have no such kind, and no pan move
 * does it.
 */
export function classifyMove(previous: Equation, next: Equation): Move {
  const sameLeft = sameExpr(previous.left, next.left);
  const sameRight = sameExpr(previous.right, next.right);
  if (sameLeft && sameRight) return { kind: 'none' };
  if (sameExpr(previous.left, next.right) && sameExpr(previous.right, next.left)) {
    return { kind: 'swap' };
  }

  const [pl, pr, nl, nr] = [previous.left, previous.right, next.left, next.right].map(lin);
  if (!pl || !pr || !nl || !nr) return { kind: 'compound' };

  if (sameLeft && sameLin(pr, nr)) return { kind: 'evaluate', side: 'right' };
  if (sameRight && sameLin(pl, nl)) return { kind: 'evaluate', side: 'left' };

  const delta = minus(nl, pl);
  if (!isZeroLin(delta) && sameLin(delta, minus(nr, pr))) {
    const term = termOf(delta);
    if (term === null) return { kind: 'compound' };
    // Moved across: one side shows the change written out after it, and the other side
    // lost a term. The move's term is the piece that left, as it was on its pan.
    const leftGave = terms(next.left) < terms(previous.left);
    const rightGave = terms(next.right) < terms(previous.right);
    if (leftGave && appends(next.right, previous.right, delta)) {
      return { kind: 'move-across', term: flip(term) };
    }
    if (rightGave && appends(next.left, previous.left, delta)) {
      return { kind: 'move-across', term: flip(term) };
    }
    return { kind: 'add-both', term };
  }

  const parts = splitParts([pl.a, pl.b, pr.a, pr.b], [nl.a, nl.b, nr.a, nr.b]);
  if (parts !== null) return { kind: 'split-both', parts };

  return { kind: 'compound' };
}
