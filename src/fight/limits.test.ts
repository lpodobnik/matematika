import { describe, expect, it } from 'vitest';
import { fightLimits } from './limits';

describe('fightLimits', () => {
  it('starts with 3 dice, 3 hull and 10 steam', () => {
    expect(fightLimits([])).toEqual({ dice: 3, hull: 3, steam: 10 });
  });

  it('adds a 4th die, 3 steam and 1 hull for the upgrades', () => {
    expect(fightLimits(['fourth-die'])).toEqual({ dice: 4, hull: 3, steam: 10 });
    expect(fightLimits(['steam'])).toEqual({ dice: 3, hull: 3, steam: 13 });
    expect(fightLimits(['hull'])).toEqual({ dice: 3, hull: 4, steam: 10 });
    expect(fightLimits(['hull', 'fourth-die', 'steam'])).toEqual({ dice: 4, hull: 4, steam: 13 });
  });

  it('counts each upgrade once', () => {
    expect(fightLimits(['steam', 'steam'])).toEqual({ dice: 3, hull: 3, steam: 13 });
  });

  it('skips an id it does not know, such as one from a damaged save', () => {
    const unknown = ['wings', 'toString', 'steam'] as unknown as Parameters<typeof fightLimits>[0];
    expect(fightLimits(unknown)).toEqual({ dice: 3, hull: 3, steam: 13 });
  });
});
