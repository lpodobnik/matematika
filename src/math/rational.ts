// Exact fractions on BigInt (architecture Pattern 1), so no chain of · can overflow and no
// step is ever off by a rounding error. Every value is reduced, with a positive
// denominator, so two equal fractions always have the same numerator and denominator.

import { assert } from '@/lib/assert';

export interface Rational {
  readonly n: bigint;
  readonly d: bigint;
}

function abs(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function gcd(a: bigint, b: bigint): bigint {
  let [x, y] = [abs(a), abs(b)];
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

function toBig(value: bigint | number): bigint {
  if (typeof value === 'bigint') return value;
  assert(Number.isSafeInteger(value), `not a safe integer: ${value}`);
  return BigInt(value);
}

/** The reduced fraction n / d. A zero denominator is a programmer error. */
export function rational(n: bigint | number, d: bigint | number = 1n): Rational {
  let [num, den] = [toBig(n), toBig(d)];
  assert(den !== 0n, 'rational with a zero denominator');
  if (den < 0n) [num, den] = [-num, -den];
  const divisor = gcd(num, den);
  return divisor > 1n ? { n: num / divisor, d: den / divisor } : { n: num, d: den };
}

export const zero: Rational = rational(0);
export const one: Rational = rational(1);

export function add(a: Rational, b: Rational): Rational {
  return rational(a.n * b.d + b.n * a.d, a.d * b.d);
}

export function sub(a: Rational, b: Rational): Rational {
  return rational(a.n * b.d - b.n * a.d, a.d * b.d);
}

export function mul(a: Rational, b: Rational): Rational {
  return rational(a.n * b.n, a.d * b.d);
}

/** a / b. Callers check for a zero divisor first: user input never reaches this with 0. */
export function div(a: Rational, b: Rational): Rational {
  assert(b.n !== 0n, 'division of a rational by zero');
  return rational(a.n * b.d, a.d * b.n);
}

/** a to a whole power, 0 or more. */
export function pow(a: Rational, exp: number): Rational {
  assert(Number.isInteger(exp) && exp >= 0, `not a whole power: ${exp}`);
  return rational(a.n ** BigInt(exp), a.d ** BigInt(exp));
}

export function neg(a: Rational): Rational {
  return { n: -a.n, d: a.d };
}

export function isZero(a: Rational): boolean {
  return a.n === 0n;
}

export function isInteger(a: Rational): boolean {
  return a.d === 1n;
}

export function equals(a: Rational, b: Rational): boolean {
  return a.n === b.n && a.d === b.d;
}

export function compare(a: Rational, b: Rational): -1 | 0 | 1 {
  const difference = a.n * b.d - b.n * a.d;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

/** `9`, `-7/2`: for tests and the dev panel, not for the child (that is `format`). */
export function toText(a: Rational): string {
  return a.d === 1n ? String(a.n) : `${a.n}/${a.d}`;
}
