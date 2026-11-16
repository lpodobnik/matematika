import { describe, expect, it } from 'vitest';
import { LAIR_ORDER, lairs, PART_TWO_LAIRS, partTwoLairOpens } from './lairs';

describe('lairs (GDD, Automaton fights and Level Structure)', () => {
  it("has part 1's four tiers and part 2's three, with their armour and base parts", () => {
    expect(LAIR_ORDER.map((id) => [lairs[id].armour, lairs[id].baseParts])).toEqual([
      [20, 3],
      [30, 4],
      [40, 5],
      [60, 6],
      [70, 7],
      [120, 8],
      [140, 9],
    ]);
  });

  it("opens each of part 2's with its street, and none of part 1's that way", () => {
    expect(Object.keys(partTwoLairOpens).sort()).toEqual([...PART_TWO_LAIRS].sort());
  });

  it('keys each lair by its own id', () => {
    // An id is in saves, so it stays when the armour is tuned: lair-45 has armour 40.
    for (const [key, lair] of Object.entries(lairs)) expect(lair.id).toBe(key);
    expect([...LAIR_ORDER].sort()).toEqual(Object.keys(lairs).sort());
  });

  it('puts one torn page each on the armour 30, 40 and 60 automatons, none on the others', () => {
    expect(LAIR_ORDER.map((id) => lairs[id].page)).toEqual([
      null,
      'page-1',
      'page-2',
      'page-3',
      null,
      null,
      null,
    ]);
  });
});
