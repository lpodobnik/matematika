import { describe, expect, it } from 'vitest';
import { createEconomy, earnParts, spendParts } from './parts';

describe('parts', () => {
  it('starts with nothing', () => {
    expect(createEconomy()).toEqual({
      parts: 0,
      upgrades: [],
      paidPredictions: [],
      piles: {},
      lairs: {},
    });
  });

  it('earns parts', () => {
    expect(earnParts(createEconomy(), 7).parts).toBe(7);
    const economy = createEconomy();
    expect(earnParts(economy, 0)).toBe(economy);
  });

  it('spends parts he has, down to exactly 0', () => {
    const economy = earnParts(createEconomy(), 10);
    const spent = spendParts(economy, 10);
    expect(spent).toEqual({ ok: true, economy: { ...economy, parts: 0 } });
  });

  it('refuses to spend more than he has, changing nothing', () => {
    const economy = earnParts(createEconomy(), 9);
    expect(spendParts(economy, 10)).toEqual({ ok: false, reason: 'parts' });
    expect(economy.parts).toBe(9);
  });

  it('throws on amounts that are not whole and positive (a programmer error)', () => {
    const economy = createEconomy();
    for (const n of [-1, 1.5, Number.NaN]) {
      expect(() => earnParts(economy, n)).toThrow();
      expect(() => spendParts(economy, n)).toThrow();
    }
  });
});
