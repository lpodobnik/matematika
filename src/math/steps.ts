// The canonical next line per way (architecture Pattern 1: `steps.ts`), for hints, worked
// examples and the content tests that prove every listed way can finish a room. Undo
// joins with the gear chain (`chain.ts`) in epic 4.

import { assert } from '@/lib/assert';
import { checkLineFor, isAnswerLine, isCheckLine, stageSolution } from '@/math/check';
import { type Equation, type Expr, equationHasX, hasX, maxNumber, num, xVar } from '@/math/expr';
import { toLinear } from '@/math/linear';
import * as q from '@/math/rational';

export type WayId = 'try' | 'balance' | 'undo';
export type StepWay = Exclude<WayId, 'undo'>;

/** More lines than any solution needs; a longer one is a programmer error. */
const maxSteps = 12;

function whole(value: q.Rational): number | null {
  if (!q.isInteger(value) || value.n < 0n || value.n > BigInt(maxNumber)) return null;
  return Number(value.n);
}

function xTerm(coefficient: number): Expr {
  return coefficient === 1 ? xVar() : { k: 'mul', l: num(coefficient), r: xVar() };
}

/** Keeps x on the side it was on: `25 = 2x + 7` gives `18 = 2x`. */
function onSide(xOnLeft: boolean, xSide: Expr, numberSide: Expr): Equation {
  return xOnLeft ? { left: xSide, right: numberSide } : { left: numberSide, right: xSide };
}

/**
 * Balance on the pans: the same float or weight on both pans takes the number off the x
 * side (the pans combine their numbers, so `2x + 5 = 23` gives `2x = 18`), then the
 * splitter divides by x's coefficient. One drop and one split, as in the architecture's
 * worked sequence for room 4; the tray's and splitter's limits are the content tests'
 * business. The tray holds no gears or springs, so Balance can't finish when x is
 * subtracted or divided (`20 − x = 6`, `x : 3 = 5`) or on both sides: that is `null`.
 */
function balanceStep(current: Equation): Equation | null {
  const xOnLeft = hasX(current.left);
  if (xOnLeft === hasX(current.right)) return null;
  const [xSide, numberSide] = xOnLeft
    ? [current.left, current.right]
    : [current.right, current.left];
  const xs = toLinear(xSide);
  const ns = toLinear(numberSide);
  if (xs.kind !== 'linear' || ns.kind !== 'linear') return null;
  const coefficient = whole(xs.a);
  if (coefficient === null || coefficient === 0) return null;

  if (!q.isZero(xs.b)) {
    const rest = whole(q.sub(ns.b, xs.b));
    if (rest === null || !q.isInteger(xs.b)) return null;
    return onSide(xOnLeft, xTerm(coefficient), num(rest));
  }
  const value = whole(q.div(ns.b, xs.a));
  return value === null ? null : onSide(xOnLeft, xVar(), num(value));
}

/**
 * The canonical line after `current`, the last committed line of `stage`, for `way`:
 * Try values writes `x = n` from wherever he is (the dial levels the pans at n); Balance
 * as in `balanceStep`. After the answer line comes the check line, and after the check
 * line nothing (`null`). `null` also means the way can't go on from `current`.
 */
export function nextStep(stage: Equation, current: Equation, way: StepWay): Equation | null {
  const n = stageSolution(stage);
  if (!equationHasX(current)) return null; // the check line, or nothing he could have written
  if (isAnswerLine(current, n)) return checkLineFor(stage);
  if (way === 'try') return { left: xVar(), right: num(n) };
  return balanceStep(current);
}

/**
 * Every line `way` writes for `stage`, from the first move to the check line, or `null`
 * if the way gets stuck before the check line.
 */
export function canonicalSolution(stage: Equation, way: StepWay): Equation[] | null {
  const lines: Equation[] = [];
  let current = stage;
  for (let i = 0; i < maxSteps; i += 1) {
    const next = nextStep(stage, current, way);
    if (next === null) {
      return current !== stage && isCheckLine(stage, current) ? lines : null;
    }
    lines.push(next);
    current = next;
  }
  assert(false, `${way} took more than ${maxSteps} lines`);
}
