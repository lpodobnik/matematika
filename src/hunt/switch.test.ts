import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import { partTwoOn } from '@/hunt/switch';

describe('the part 2 switch', () => {
  // Opening part 2 for his son is Luka's decision. To open it, change the tuning value and
  // this test together, on purpose.
  it('is off for players until Luka opens it', () => {
    expect(tuning.part2.live).toBe(false);
    expect(partTwoOn(false)).toBe(false);
  });

  it('is previewed with ?dev', () => {
    expect(partTwoOn(true)).toBe(true);
  });
});
