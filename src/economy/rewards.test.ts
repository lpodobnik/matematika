import { describe, expect, it } from 'vitest';
import { fightReward } from './rewards';

describe('fightReward', () => {
  it('pays base parts plus unspent steam', () => {
    expect(fightReward(3, 7, false)).toBe(10);
    expect(fightReward(6, 0, false)).toBe(6);
  });

  it('doubles it all on a clean cut', () => {
    expect(fightReward(3, 7, true)).toBe(20);
    expect(fightReward(4, 0, true)).toBe(8);
  });
});
