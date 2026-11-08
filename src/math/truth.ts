// Whether a line of part 2 is true (architecture, Pattern 5, Judging). Rooms are judged by exact
// solution; leads by truth. `check()` plays no part in it.

import type { Rational } from '@/math/rational';
import * as q from '@/math/rational';
import type { SExpr, Statement } from '@/math/statement';

export interface TruthContext {
  /** What x and n stand for in this scene, where it says. */
  vars?: { x?: number; n?: number };
  /** What each labelled point on a line is. */
  points?: Readonly<Record<string, number>>;
  /** The mean this scene's data has. */
  mean?: number;
  /** The list this scene's clues leave. */
  list?: readonly number[];
  /** The value of the line before, for a line that starts with `=`. */
  previous?: Rational | null;
}

/** An expression's exact value; null where it divides by 0 or has a letter with no value. */
export function exprValue(expr: SExpr, context: TruthContext = {}): Rational | null {
  switch (expr.k) {
    case 'num':
      return q.rational(expr.v);
    case 'var': {
      const value = context.vars?.[expr.name];
      return value === undefined ? null : q.rational(value);
    }
    case 'pow':
      return q.pow(q.rational(expr.base), expr.exp);
    case 'group':
      return exprValue(expr.e, context);
    default: {
      const left = exprValue(expr.l, context);
      const right = exprValue(expr.r, context);
      if (!left || !right) return null;
      if (expr.k === 'add') return q.add(left, right);
      if (expr.k === 'sub') return q.sub(left, right);
      if (expr.k === 'mul') return q.mul(left, right);
      return q.isZero(right) ? null : q.div(left, right);
    }
  }
}

/** All sides have one value, and the line before agrees: that value, or null. */
function chainValue(
  sides: readonly SExpr[],
  context: TruthContext,
  first: Rational | null,
): Rational | null {
  let value = first;
  for (const side of sides) {
    const here = exprValue(side, context);
    if (!here || (value && !q.equals(value, here))) return null;
    value = here;
  }
  return value;
}

/** What a true line's sum comes to, for the line after it. */
export function lineValue(statement: Statement, context: TruthContext = {}): Rational | null {
  if (statement.k === 'mean') return chainValue(statement.sides, context, null);
  if (statement.k !== 'sum') return null;
  const first = statement.continues ? (context.previous ?? null) : null;
  if (statement.continues && !first) return null;
  return chainValue(statement.sides, context, first);
}

/**
 * The number rounded at a place, using the next digit alone: 18 499 000 at the millions is
 * 18 000 000, because the next digit is 4, whatever comes after it.
 */
export function roundAt(value: number, place: number): number {
  const down = Math.floor(value / place) * place;
  const next = Math.floor(value / (place / 10)) % 10;
  return next >= 5 ? down + place : down;
}

function isRounding(left: number, right: number): boolean {
  for (let place = 10; place <= left * 10 && place < 1e15; place *= 10) {
    if (roundAt(left, place) === right) return true;
  }
  return false;
}

function holds(statement: Extract<Statement, { k: 'range' }>, value: number): boolean {
  const { low, high } = statement;
  if (low && (low.strict ? value <= low.value : value < low.value)) return false;
  if (high && (high.strict ? value >= high.value : value > high.value)) return false;
  return true;
}

/** Whether a line is true. A line that leans on something the scene hasn't given isn't. */
export function isTrue(statement: Statement, context: TruthContext = {}): boolean {
  switch (statement.k) {
    case 'sum':
      return statement.sides.length + (statement.continues ? 1 : 0) >= 2
        ? lineValue(statement, context) !== null
        : false;
    case 'mean': {
      const value = lineValue(statement, context);
      if (!value) return false;
      return context.mean === undefined || q.equals(value, q.rational(context.mean));
    }
    case 'member': {
      const belongs = statement.set === 'N0' || statement.value >= 1;
      return statement.negated ? !belongs : belongs;
    }
    case 'range': {
      const x = context.vars?.x;
      if (x !== undefined) return holds(statement, x);
      const { low, high } = statement;
      if (!low || !high) return true;
      // Some whole number has to fit.
      const from = low.strict ? low.value + 1 : low.value;
      const to = high.strict ? high.value - 1 : high.value;
      return from <= to;
    }
    case 'not': {
      const x = context.vars?.x;
      return x === undefined || x !== statement.value;
    }
    case 'list': {
      const distinct = new Set(statement.values);
      if (distinct.size !== statement.values.length) return false;
      if (!context.list) return true;
      return (
        context.list.length === distinct.size && context.list.every((value) => distinct.has(value))
      );
    }
    case 'approx':
      return isRounding(statement.left, statement.right);
    case 'remainder': {
      const { dividend, divisor, quotient, rest } = statement;
      return divisor > 0 && rest < divisor && divisor * quotient + rest === dividend;
    }
    case 'point':
      return context.points?.[statement.label] === statement.value;
  }
}
