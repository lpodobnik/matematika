// The pieces on the pans, derived from the equation (architecture, Entity Creation; GDD,
// Piece kit). Nothing is instantiated by hand: each side of the equation becomes a list of
// pieces, and the scale draws the list.
//
//   + n          a weight of n              + kx      k x-gears (one large gear above 12)
//   − n          a float of n               − kx      k springs (one large spring above 12)
//   x : n        an x-gear on a divider of n (the GDD's "reducer")
//   2 · 9, 18 : 2, (3 + 4)   one weight of its value, or one float if subtracted
//   (x + 4), 2 · (x + 3)     acted out from its toLinear form: gears, then a weight
//
// A weight and a float of the same number on one pan cancel and vanish, as do a gear and
// a spring (on dividers of the same size). The pieces are only a picture of the equation:
// the tilt comes from the sides' exact values, never from the pieces.

import { tuning } from '@/config/tuning';
import { assert } from '@/lib/assert';
import { div, type Equation, type Expr, maxNumber, mul, num, xVar } from '@/math/expr';
import { formatExpr, formatNumber } from '@/math/format';
import { toLinear } from '@/math/linear';
import * as q from '@/math/rational';
import type { Side } from '@/room/types';

export type NumberPiece = {
  key: string;
  kind: 'weight' | 'float';
  /** Always above 0: a float of 6 lifts the pan by 6. */
  value: q.Rational;
};

export type XPiece = {
  key: string;
  kind: 'gear' | 'spring';
  /** How many x it stands for: 1 for a small gear, above tuning.maxSmallGears for a large one. */
  count: bigint;
  /** The divider under it (`x : 3` has 3), or null for none. */
  divisor: bigint | null;
};

export type Piece = NumberPiece | XPiece;
export type PieceKind = Piece['kind'];

/** A weight or a float (rather than a gear or a spring). */
export function isNumberPiece<T extends Piece>(piece: T): piece is Extract<T, NumberPiece> {
  return piece.kind === 'weight' || piece.kind === 'float';
}

export interface PanPieces {
  left: Piece[];
  right: Piece[];
}

/** One term's worth of pieces before cancellation; `count` and `divisor` as in XPiece. */
type Part =
  | { kind: 'weight' | 'float'; value: q.Rational }
  | { kind: 'gear' | 'spring'; count: bigint; divisor: bigint | null };

interface SignedTerm {
  sign: 1 | -1;
  expr: Expr;
}

// The terms of a side: its chain of + and −, flattened along the left spine the way the
// parser builds it. A bracketed group on the right of a sign stays one term.
function signedTerms(expr: Expr, out: SignedTerm[] = []): SignedTerm[] {
  if (expr.k === 'add' || expr.k === 'sub') {
    signedTerms(expr.l, out);
    out.push({ sign: expr.k === 'add' ? 1 : -1, expr: expr.r });
  } else {
    out.push({ sign: 1, expr });
  }
  return out;
}

function abs(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function termParts({ sign, expr }: SignedTerm): Part[] {
  const linear = toLinear(expr);
  // The pans only ever hold a stage equation or a judged line, and the checker refuses
  // lines that aren't linear or divide by zero before they reach the pans.
  assert(linear.kind === 'linear', 'the pans hold only linear equations');
  const a = sign === 1 ? linear.a : q.neg(linear.a);
  const b = sign === 1 ? linear.b : q.neg(linear.b);
  const parts: Part[] = [];
  if (!q.isZero(a)) {
    parts.push({
      kind: a.n > 0n ? 'gear' : 'spring',
      count: abs(a.n),
      divisor: a.d === 1n ? null : a.d,
    });
  }
  if (!q.isZero(b)) {
    parts.push({ kind: b.n > 0n ? 'weight' : 'float', value: b.n > 0n ? b : q.neg(b) });
  }
  return parts;
}

type XPart = Extract<Part, { kind: 'gear' | 'spring' }>;

function isXPart(part: Part): part is XPart {
  return part.kind === 'gear' || part.kind === 'spring';
}

function smaller(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

// A weight and a float of the same number vanish together, one pair at a time.
function cancelNumbers(parts: Part[]): Part[] {
  const gone = new Set<number>();
  for (const [i, float] of parts.entries()) {
    if (float.kind !== 'float') continue;
    const match = parts.findIndex(
      (weight, j) =>
        weight.kind === 'weight' && !gone.has(j) && q.equals(weight.value, float.value),
    );
    if (match === -1) continue;
    gone.add(i);
    gone.add(match);
  }
  return parts.filter((_, i) => !gone.has(i));
}

function totalCount(parts: XPart[]): bigint {
  return parts.reduce((sum, part) => sum + part.count, 0n);
}

function takeCount(parts: XPart[], amount: bigint): void {
  let left = amount;
  for (const part of parts) {
    const taken = smaller(part.count, left);
    part.count -= taken;
    left -= taken;
  }
}

// A gear and a spring on dividers of the same size vanish together, one x at a time,
// taken from the first parts of each kind.
function cancelXs(parts: Part[]): Part[] {
  const copies = parts.map((part) => ({ ...part }));
  const xs = copies.filter(isXPart);
  for (const divisor of new Set(xs.map((part) => part.divisor))) {
    const gears = xs.filter((part) => part.kind === 'gear' && part.divisor === divisor);
    const springs = xs.filter((part) => part.kind === 'spring' && part.divisor === divisor);
    const amount = smaller(totalCount(gears), totalCount(springs));
    takeCount(gears, amount);
    takeCount(springs, amount);
  }
  return copies.filter((part) => !isXPart(part) || part.count > 0n);
}

/** The pieces of one side, with keys `${side}-${kind}-${index}` (architecture, Entity Creation). */
export function sidePieces(expr: Expr, side: Side): Piece[] {
  const parts = cancelXs(cancelNumbers(signedTerms(expr).flatMap(termParts)));
  const next: Record<PieceKind, number> = { weight: 0, float: 0, gear: 0, spring: 0 };
  const key = (kind: PieceKind) => {
    const index = next[kind];
    next[kind] = index + 1;
    return `${side}-${kind}-${index}`;
  };
  const maxSmall = BigInt(tuning.maxSmallGears);
  return parts.flatMap((part): Piece[] => {
    if (!isXPart(part)) return [{ key: key(part.kind), kind: part.kind, value: part.value }];
    const { kind, count, divisor } = part;
    if (count > maxSmall) return [{ key: key(kind), kind, count, divisor }];
    return Array.from({ length: Number(count) }, () => ({
      key: key(kind),
      kind,
      count: 1n,
      divisor,
    }));
  });
}

/** The pieces on both pans. */
export function panPieces(equation: Equation): PanPieces {
  return { left: sidePieces(equation.left, 'left'), right: sidePieces(equation.right, 'right') };
}

/**
 * The number a weight or float shows: `18` for a whole number, otherwise the reduced
 * fraction as a division (`9 : 2`), which only a wrong line acted out can produce. A
 * fraction too big for a number literal shows its nearest whole number.
 */
export function numberLabel(value: q.Rational): string {
  const n = abs(value.n);
  if (value.d === 1n) return formatNumber(n);
  const limit = BigInt(maxNumber);
  if (n <= limit && value.d <= limit) return formatExpr(div(num(Number(n)), num(Number(value.d))));
  return formatNumber((2n * n + value.d) / (2n * value.d));
}

/** What a large gear or spring shows: its count of x, as `27x`. */
export function countLabel(count: bigint): string {
  return count <= BigInt(maxNumber)
    ? formatExpr(mul(num(Number(count)), xVar()))
    : formatNumber(count);
}
