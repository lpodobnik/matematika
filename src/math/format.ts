// The only place equations and numbers become text (architecture, Consistency Rules:
// Notation): · (U+00B7) for times, : for division, − (U+2212) for minus, `3x` without a
// dot, and U+202F (narrow no-break space) between thousands from 1 000. Whatever this
// writes, `parse` reads back to the same tree.

import { assert } from '@/lib/assert';
import type { Equation, Expr } from '@/math/expr';

export const thousandsSeparator = '\u202f';

const signs = { add: '+', sub: '−', mul: '·', div: ':' } as const;

/** A whole number in school notation: `5905` → `5 905`, `999` → `999`. */
export function formatNumber(value: number | bigint): string {
  assert(typeof value === 'bigint' || Number.isSafeInteger(value), `not a whole number: ${value}`);
  const big = BigInt(value);
  const digits = (big < 0n ? -big : big).toString();
  // Groups of three from the right: 5905 → 5, 905.
  const grouped = digits.replace(/\B(?=(\d{3})+$)/g, thousandsSeparator);
  return big < 0n ? `−${grouped}` : grouped;
}

type CoefficientTerm = { k: 'mul'; l: { k: 'num'; v: number }; r: { k: 'x' } };

// A number written straight before x (`3x`) reads as one factor, like a number or x.
function isCoefficientTerm(expr: Expr): expr is CoefficientTerm {
  return expr.k === 'mul' && expr.l.k === 'num' && expr.r.k === 'x';
}

function precedence(expr: Expr): number {
  if (expr.k === 'num' || expr.k === 'x' || isCoefficientTerm(expr)) return 3;
  return expr.k === 'mul' || expr.k === 'div' ? 2 : 1;
}

function bracketed(expr: Expr, needed: boolean): string {
  return needed ? `(${formatExpr(expr)})` : formatExpr(expr);
}

/**
 * One side in school notation. Brackets appear only where the tree needs them: around a
 * looser operation, and around an equal one on the right, since + − · : group from the
 * left (`20 − (5 + 3)`, `2 · (x + 3)`).
 */
export function formatExpr(expr: Expr): string {
  if (expr.k === 'num') return formatNumber(expr.v);
  if (expr.k === 'x') return 'x';
  if (isCoefficientTerm(expr)) return `${formatNumber(expr.l.v)}x`;
  const own = precedence(expr);
  const left = bracketed(expr.l, precedence(expr.l) < own);
  const right = bracketed(expr.r, precedence(expr.r) <= own);
  return `${left} ${signs[expr.k]} ${right}`;
}

/** `2x + 7 = 25`, `5 905 − 27x = 316`. */
export function formatEquation(equation: Equation): string {
  return `${formatExpr(equation.left)} = ${formatExpr(equation.right)}`;
}
