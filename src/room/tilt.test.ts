import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import type { Equation } from '@/math/expr';
import { parse } from '@/math/parse';
import * as q from '@/math/rational';
import { isLevel, jamTilt, sideValues, tiltFor } from '@/room/tilt';

function equation(text: string): Equation {
  const result = parse(text);
  if (!result.ok) throw new Error(`"${text}" did not parse: ${result.reason}`);
  return result.equation;
}

function tiltAt(text: string, x: number, tiltPerUnit?: number): number {
  return tiltFor(sideValues(equation(text), q.rational(x)), tiltPerUnit);
}

describe('tuning', () => {
  it('holds the GDD tilt: 1° per unit, clamped at 15°', () => {
    expect(tuning.tiltPerUnit).toBe(1);
    expect(tuning.tiltMax).toBe(15);
  });
});

describe('sideValues', () => {
  it('weighs both sides exactly at x', () => {
    expect(sideValues(equation('x + 4 = 9'), q.rational(0))).toEqual({
      left: q.rational(4),
      right: q.rational(9),
    });
    expect(sideValues(equation('x : 3 = 5'), q.rational(4))).toEqual({
      left: q.rational(4, 3),
      right: q.rational(5),
    });
  });

  it('is level only when the sides are equal', () => {
    expect(isLevel(sideValues(equation('x + 4 = 9'), q.rational(5)))).toBe(true);
    expect(isLevel(sideValues(equation('x + 4 = 9'), q.rational(4)))).toBe(false);
  });
});

describe('tiltFor', () => {
  it('tips toward the heavier side by 1° per unit of difference', () => {
    // Room 1 at x = 0: 4 against 9, so the right pan is lower by 5°.
    expect(tiltAt('x + 4 = 9', 0)).toBe(-5);
    expect(tiltAt('x + 4 = 9', 4)).toBe(-1);
    expect(tiltAt('x + 4 = 9', 5)).toBe(0);
    expect(tiltAt('x + 4 = 9', 7)).toBe(2);
  });

  it('is positive when the left side is heavier', () => {
    expect(tiltAt('20 − x = 6', 0)).toBe(14);
    expect(tiltAt('20 − x = 6', 20)).toBe(-6);
  });

  it('clamps at ±15°', () => {
    expect(tiltAt('x + 4 = 9', 30)).toBe(15);
    expect(tiltAt('5 905 − 27x = 316', 0)).toBe(15);
    expect(tiltAt('x = 100', 0)).toBe(-15);
  });

  it("uses the stage's own tilt per unit for big numbers", () => {
    expect(tiltAt('2x + 5 = 23', 0, 0.75)).toBeCloseTo(-13.5);
    expect(tiltAt('2x + 5 = 23', 3, 0.75)).toBeCloseTo(-9);
    expect(tiltAt('5 905 − 27x = 316', 207, 0.05)).toBe(0);
    expect(tiltAt('5 905 − 27x = 316', 200, 0.05)).toBeCloseTo(189 * 0.05);
  });

  it('tips by the same amount for every notch (fast-check)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9 }),
        fc.integer({ min: 0, max: 50 }),
        fc.integer({ min: 0, max: 50 }),
        (a, b, x) => {
          // a·x + b against a fixed side, far from the clamp: each notch adds a degrees.
          const values = (at: number) => ({ left: q.rational(a * at + b), right: q.rational(500) });
          const step = tiltFor(values(x + 1), 1, 1000) - tiltFor(values(x), 1, 1000);
          expect(step).toBeCloseTo(a);
        },
      ),
    );
  });

  it('works on sides far beyond a float without losing the sign', () => {
    // (10^400 + 1) : 10^399 is just over 10, though both parts overflow a float.
    const huge = { left: q.rational(10n ** 400n + 1n, 10n ** 399n), right: q.zero };
    expect(tiltFor(huge)).toBeCloseTo(10);
    expect(tiltFor({ left: q.zero, right: q.rational(10n ** 400n) })).toBe(-15);
    expect(tiltFor({ left: q.rational(10n ** 400n * 3n, 10n ** 400n), right: q.zero })).toBe(3);
  });
});

describe('jamTilt (story 1.7)', () => {
  const sides = (left: number, right: number) => ({
    left: q.rational(left),
    right: q.rational(right),
  });

  it(`tips a near miss by at least ${tuning.jamMinTilt}°, toward the heavier side`, () => {
    expect(tuning.jamMinTilt).toBe(4);
    expect(jamTilt(sides(5, 6))).toBe(-4);
    expect(jamTilt(sides(7, 6))).toBe(4);
    expect(jamTilt(sides(10, 6), 0.75)).toBe(4);
  });

  it('keeps a bigger tilt as tiltFor gives it, clamped as usual', () => {
    expect(jamTilt(sides(18, 32))).toBe(-14);
    expect(jamTilt(sides(9, 16))).toBe(-7);
    expect(jamTilt(sides(100, 0))).toBe(tuning.tiltMax);
  });

  it('tips toward the left pan when the sides are equal (a line true for every x)', () => {
    expect(jamTilt(sides(5, 5))).toBe(tuning.jamMinTilt);
  });

  it('is never less than the minimum either way (fast-check)', () => {
    fc.assert(
      fc.property(fc.integer({ min: -50, max: 50 }), fc.integer({ min: -50, max: 50 }), (l, r) => {
        const tilt = jamTilt(sides(l, r));
        expect(Math.abs(tilt)).toBeGreaterThanOrEqual(tuning.jamMinTilt);
        expect(Math.abs(tilt)).toBeLessThanOrEqual(tuning.tiltMax);
        if (l !== r) expect(Math.sign(tilt)).toBe(Math.sign(l - r));
      }),
    );
  });

  it('refuses a minimum that does not fit inside the clamp', () => {
    expect(() => jamTilt(sides(1, 2), 1, 20)).toThrow(/inside the clamp/);
  });
});
