import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import { partTwoOn } from '@/hunt/switch';

describe('the part 2 switch', () => {
  // Luka opened part 2 for his son on 2026-11-18. Closing it again would hide a trail his live
  // save may already be on, so change the tuning value and this test together, on purpose.
  it('is open for players since Luka opened it', () => {
    expect(tuning.part2.live).toBe(true);
    expect(partTwoOn(false)).toBe(true);
  });

  it('is on with ?dev too', () => {
    expect(partTwoOn(true)).toBe(true);
  });
});
