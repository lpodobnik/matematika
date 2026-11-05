import { describe, expect, it } from 'vitest';
import { createRng, randomIndex, seedFrom, stepRng, toRngState } from './rng';

const twoTo32 = 4_294_967_296;
const draws = (seed: number, n: number) => {
  const rng = createRng(seed);
  return Array.from({ length: n }, () => rng.next());
};

describe('seeded generator', () => {
  // Saved fights carry the generator's state (ADR-8), so its output must never change.
  it('matches the reference mulberry32 output', () => {
    const asInts = (seed: number) => draws(seed, 3).map((v) => v * twoTo32);
    expect(asInts(0)).toEqual([1144304738, 1416247, 958946056]);
    expect(asInts(1)).toEqual([2693262067, 11749833, 2265367787]);
    expect(asInts(42)).toEqual([2581720956, 1925393290, 3661312704]);
  });

  it('repeats a sequence from the same seed and differs between seeds', () => {
    expect(draws(7, 10)).toEqual(draws(7, 10));
    expect(draws(7, 10)).not.toEqual(draws(8, 10));
  });

  it('gives numbers in [0, 1)', () => {
    for (const value of draws(123, 10_000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('carries its whole state in one number, so it can be saved and resumed', () => {
    const rng = createRng(2026);
    rng.next();
    rng.next();
    const resumed = createRng(JSON.parse(JSON.stringify(rng.state)));
    expect([resumed.next(), resumed.next()]).toEqual([rng.next(), rng.next()]);
  });

  it('steps the same way as the object form', () => {
    const rng = createRng(55);
    let state = 55;
    for (let i = 0; i < 5; i++) {
      const step = stepRng(state);
      expect(step.value).toBe(rng.next());
      expect(step.state).toBe(rng.state);
      state = step.state;
    }
  });

  it('turns any seed into an unsigned 32-bit state', () => {
    expect(toRngState(5)).toBe(5);
    expect(toRngState(-1)).toBe(twoTo32 - 1);
    expect(toRngState(twoTo32 + 3)).toBe(3);
    expect(toRngState(2.9)).toBe(2);
    expect(toRngState(Number.NaN)).toBe(0);
    expect(toRngState(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('randomIndex and seedFrom', () => {
  it('picks every index from 0 to count − 1 about equally often', () => {
    const rng = createRng(9);
    const counts = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 60_000; i++) {
      const index = randomIndex(rng, 6);
      counts[index] = (counts[index] ?? 0) + 1;
    }
    expect(counts).toHaveLength(6);
    for (const count of counts) expect(Math.abs(count - 10_000)).toBeLessThan(400);
  });

  it('draws a whole unsigned 32-bit seed', () => {
    const rng = createRng(3);
    for (let i = 0; i < 100; i++) {
      const seed = seedFrom(rng);
      expect(Number.isInteger(seed) && seed >= 0 && seed < twoTo32).toBe(true);
    }
  });
});
