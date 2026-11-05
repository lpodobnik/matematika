import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { AssertionError } from '@/lib/assert';
import * as q from '@/math/rational';

function gcd(a: bigint, b: bigint): bigint {
  let [x, y] = [a < 0n ? -a : a, b < 0n ? -b : b];
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

const nonZeroRational = fc
  .tuple(fc.bigInt({ min: -1000n, max: 1000n }), fc.bigInt({ min: 1n, max: 1000n }))
  .filter(([n]) => n !== 0n)
  .map(([n, d]) => q.rational(n, d));
const anyRational = fc
  .tuple(fc.bigInt({ min: -(10n ** 12n), max: 10n ** 12n }), fc.bigInt({ min: 1n, max: 10n ** 6n }))
  .map(([n, d]) => q.rational(n, d));

describe('rational', () => {
  it('is always reduced, with a positive denominator', () => {
    expect(q.rational(6, 4)).toEqual({ n: 3n, d: 2n });
    expect(q.rational(3, -6)).toEqual({ n: -1n, d: 2n });
    expect(q.rational(-4, -8)).toEqual({ n: 1n, d: 2n });
    expect(q.rational(0, -5)).toEqual({ n: 0n, d: 1n });
    expect(q.rational(18n)).toEqual({ n: 18n, d: 1n });
  });

  it('treats a zero denominator or an unsafe number as a programmer error', () => {
    expect(() => q.rational(1, 0)).toThrow(AssertionError);
    expect(() => q.rational(0.5)).toThrow(AssertionError);
    expect(() => q.rational(2 ** 60)).toThrow(AssertionError);
    expect(() => q.div(q.one, q.zero)).toThrow(AssertionError);
  });

  it('adds, subtracts, multiplies and divides exactly', () => {
    expect(q.add(q.rational(1, 3), q.rational(1, 6))).toEqual(q.rational(1, 2));
    expect(q.sub(q.rational(1, 3), q.rational(1, 2))).toEqual(q.rational(-1, 6));
    expect(q.mul(q.rational(2, 3), q.rational(9, 4))).toEqual(q.rational(3, 2));
    expect(q.div(q.rational(18), q.rational(2))).toEqual(q.rational(9));
    expect(q.neg(q.rational(7, 2))).toEqual(q.rational(-7, 2));
  });

  it('stays exact far beyond floating point', () => {
    const big = q.rational(9_999_999);
    expect(q.mul(q.mul(big, big), big)).toEqual({ n: 9_999_999n ** 3n, d: 1n });
  });

  it('compares and tells whole numbers', () => {
    expect(q.compare(q.rational(1, 3), q.rational(1, 2))).toBe(-1);
    expect(q.compare(q.rational(2, 4), q.rational(1, 2))).toBe(0);
    expect(q.compare(q.rational(-1), q.rational(-2))).toBe(1);
    expect(q.equals(q.rational(2, 4), q.rational(1, 2))).toBe(true);
    expect(q.isInteger(q.rational(18, 2))).toBe(true);
    expect(q.isInteger(q.rational(7, 2))).toBe(false);
    expect(q.isZero(q.sub(q.one, q.one))).toBe(true);
    expect(q.toText(q.rational(-7, 2))).toBe('-7/2');
    expect(q.toText(q.rational(9))).toBe('9');
  });

  it('keeps every result reduced and obeys the field laws (fast-check)', () => {
    fc.assert(
      fc.property(anyRational, nonZeroRational, (a, b) => {
        for (const r of [q.add(a, b), q.sub(a, b), q.mul(a, b), q.div(a, b)]) {
          expect(r.d > 0n && gcd(r.n, r.d) === 1n).toBe(true);
        }
        expect(q.sub(q.add(a, b), b)).toEqual(a);
        expect(q.div(q.mul(a, b), b)).toEqual(a);
        expect(q.add(a, q.neg(a))).toEqual(q.zero);
      }),
    );
  });
});
