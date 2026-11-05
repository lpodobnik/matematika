// An expression as a·x + b with exact fractions, and exact solving (architecture
// Pattern 1). Results are typed: a side that isn't linear, or divides by zero, is an
// expected outcome of what the child wrote, never a thrown error. When a line has both,
// division by zero wins, wherever it is: the checker's rule 1 makes it `incomplete`
// before it asks whether the line is linear.

import type { Equation, Expr } from '@/math/expr';
import * as q from '@/math/rational';

export type LinearResult =
  | { kind: 'linear'; a: q.Rational; b: q.Rational }
  | { kind: 'nonlinear' } // x · x, 18 : x
  | { kind: 'division-by-zero' }; // 18 : 0

const nonlinear: LinearResult = { kind: 'nonlinear' };
const divisionByZero: LinearResult = { kind: 'division-by-zero' };

function linear(a: q.Rational, b: q.Rational): LinearResult {
  return { kind: 'linear', a, b };
}

/**
 * The side as a·x + b. A product is nonlinear only if both factors hold x with a
 * coefficient other than 0, and a division only if the divisor does; so `0 · x` and
 * `(x − x) · x` are 0, but `x · x` and `18 : x` are nonlinear. Division by zero wins
 * over nonlinear: `x · x + 18 : 0` and `x · x : 0` are division by zero.
 */
export function toLinear(expr: Expr): LinearResult {
  if (expr.k === 'num') return linear(q.zero, q.rational(expr.v));
  if (expr.k === 'x') return linear(q.one, q.zero);
  const l = toLinear(expr.l);
  const r = toLinear(expr.r);
  // A divisor that is exactly 0 divides by zero, whatever the dividend is.
  if (expr.k === 'div' && r.kind === 'linear' && q.isZero(r.a) && q.isZero(r.b)) {
    return divisionByZero;
  }
  if (l.kind === 'division-by-zero' || r.kind === 'division-by-zero') return divisionByZero;
  if (l.kind !== 'linear' || r.kind !== 'linear') return nonlinear;
  switch (expr.k) {
    case 'add':
      return linear(q.add(l.a, r.a), q.add(l.b, r.b));
    case 'sub':
      return linear(q.sub(l.a, r.a), q.sub(l.b, r.b));
    case 'mul':
      if (!q.isZero(l.a) && !q.isZero(r.a)) return nonlinear;
      return linear(q.add(q.mul(l.a, r.b), q.mul(r.a, l.b)), q.mul(l.b, r.b));
    case 'div':
      if (!q.isZero(r.a)) return nonlinear;
      return linear(q.div(l.a, r.b), q.div(l.b, r.b));
  }
}

/** The value of a·x + b at x. */
export function valueAt(side: { a: q.Rational; b: q.Rational }, x: q.Rational): q.Rational {
  return q.add(q.mul(side.a, x), side.b);
}

export type Solution =
  | { kind: 'one'; x: q.Rational }
  | { kind: 'none' } // x + 1 = x + 2
  | { kind: 'every' } // 2x = 2x
  | { kind: 'nonlinear' }
  | { kind: 'division-by-zero' };

/**
 * Solves the equation exactly. A side that isn't linear, or divides by zero, says so;
 * division by zero on either side wins over a nonlinear side (`x · x = 18 : 0`).
 */
export function solve(equation: Equation): Solution {
  const left = toLinear(equation.left);
  const right = toLinear(equation.right);
  if (left.kind === 'division-by-zero' || right.kind === 'division-by-zero') {
    return { kind: 'division-by-zero' };
  }
  if (left.kind !== 'linear' || right.kind !== 'linear') return { kind: 'nonlinear' };
  // a·x + b = c·x + d  ⇔  (a − c)·x = d − b
  const coefficient = q.sub(left.a, right.a);
  const constant = q.sub(right.b, left.b);
  if (!q.isZero(coefficient)) return { kind: 'one', x: q.div(constant, coefficient) };
  return q.isZero(constant) ? { kind: 'every' } : { kind: 'none' };
}
