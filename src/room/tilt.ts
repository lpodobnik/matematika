// How far the pans tip (GDD, The scale: 1° per unit of difference between the sides,
// clamped at ±15°, scaled per room for big numbers). The sides' values are exact; only the
// angle, which is for drawing, is a float.

import { tuning } from '@/config/tuning';
import { assert } from '@/lib/assert';
import type { Equation, Expr } from '@/math/expr';
import { toLinear, valueAt } from '@/math/linear';
import * as q from '@/math/rational';

export interface SideValues {
  left: q.Rational;
  right: q.Rational;
}

function sideValue(expr: Expr, x: q.Rational): q.Rational {
  const linear = toLinear(expr);
  assert(linear.kind === 'linear', 'the pans hold only linear equations');
  return valueAt(linear, x);
}

/** Both sides' exact values at x. */
export function sideValues(equation: Equation, x: q.Rational): SideValues {
  return { left: sideValue(equation.left, x), right: sideValue(equation.right, x) };
}

export function isLevel(values: SideValues): boolean {
  return q.equals(values.left, values.right);
}

// A float close to the fraction, for any size of BigInt: very long numbers are shortened
// together first, so Number() never overflows to Infinity on both.
const longest = 1n << 1000n;
function approximately(value: q.Rational): number {
  let { n, d } = value;
  while ((n < 0n ? -n : n) > longest || d > longest) {
    n >>= 64n;
    d >>= 64n;
    if (d === 0n) return n < 0n ? -Infinity : Infinity;
  }
  return Number(n) / Number(d);
}

/**
 * The tilt in degrees: positive when the left side is heavier, so its pan is lower;
 * negative when the right side is. It is `tiltPerUnit` times the difference between the
 * sides, clamped to ±`tiltMax`, and exactly 0 only when the sides are equal.
 */
export function tiltFor(
  values: SideValues,
  tiltPerUnit: number = tuning.tiltPerUnit,
  tiltMax: number = tuning.tiltMax,
): number {
  assert(tiltPerUnit > 0 && tiltMax > 0, 'tilt per unit and maximum tilt must be above 0');
  const difference = q.sub(values.left, values.right);
  if (q.isZero(difference)) return 0;
  const tilt = approximately(difference) * tiltPerUnit;
  return Math.max(-tiltMax, Math.min(tiltMax, tilt));
}

/**
 * The tilt of a wrong line acted out (architecture, Which x the pans show): as `tiltFor`,
 * but at least `jamMinTilt` either way, so a near miss still shows. A line that holds for
 * every x (`x = x`) is level at the solution too, and is wrong only because it doesn't
 * pin x down; it tips toward the left pan.
 */
export function jamTilt(
  values: SideValues,
  tiltPerUnit: number = tuning.tiltPerUnit,
  jamMinTilt: number = tuning.jamMinTilt,
  tiltMax: number = tuning.tiltMax,
): number {
  assert(jamMinTilt > 0 && jamMinTilt <= tiltMax, 'the jam tilt must fit inside the clamp');
  const tilt = tiltFor(values, tiltPerUnit, tiltMax);
  if (Math.abs(tilt) >= jamMinTilt) return tilt;
  return tilt < 0 ? -jamMinTilt : jamMinTilt;
}
