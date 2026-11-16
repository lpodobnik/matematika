import { describe, expect, it } from 'vitest';
import { createEconomy, earnParts } from '@/economy/parts';
import {
  anythingToBuy,
  bracketsOnSale,
  buyGear,
  buyLook,
  gearCost,
  lookCost,
  shopGear,
  toggleLook,
} from '@/hunt/gear';
import { lookPieceIds } from '@/hunt/ids';
import type { CompanionSave } from '@/hunt/types';

const little = (): CompanionSave => ({
  name: 'Kotačić',
  looks: [],
  wearing: [],
  gear: ['hook'],
  taught: [],
});

describe("Faust's gear for the little one (GDD, The little one: gear)", () => {
  it('costs 15 for the bright lamp, 25 for the magnet and 20 for the longer hook, 60 in all', () => {
    expect(gearCost('lamp')).toBe(15);
    expect(gearCost('magnet')).toBe(25);
    expect(gearCost('long-hook')).toBe(20);
    expect(shopGear.reduce((sum, id) => sum + gearCost(id), 0)).toBe(60);
  });

  it('costs about 45 for the six looks', () => {
    expect(lookPieceIds.reduce((sum, id) => sum + lookCost(id), 0)).toBe(45);
  });

  it('buys a piece once, from unspent parts, and the little one carries it', () => {
    const bought = buyGear(earnParts(createEconomy(), 20), little(), 'lamp');
    if (!bought.ok) throw new Error('expected to buy the lamp');
    expect(bought.economy.parts).toBe(5);
    expect(bought.companion.gear).toEqual(['hook', 'lamp']);
    expect(buyGear(bought.economy, bought.companion, 'lamp')).toEqual({
      ok: false,
      reason: 'owned',
    });
    expect(buyGear(earnParts(createEconomy(), 24), little(), 'magnet')).toEqual({
      ok: false,
      reason: 'parts',
    });
  });

  it('puts a bought look on at once, in place of the one in its slot', () => {
    let companion = little();
    let economy = earnParts(createEconomy(), 100);
    for (const look of ['paint-red', 'hat-cap', 'paint-blue'] as const) {
      const bought = buyLook(economy, companion, look);
      if (!bought.ok) throw new Error(`expected to buy ${look}`);
      ({ economy, companion } = bought);
    }
    expect(companion.looks).toEqual(['paint-red', 'hat-cap', 'paint-blue']);
    expect([...companion.wearing].sort()).toEqual(['hat-cap', 'paint-blue']);
  });

  it('takes a look off and puts it back on, and ignores one he does not own', () => {
    const owned = { ...little(), looks: ['hat-top' as const], wearing: ['hat-top' as const] };
    const off = toggleLook(owned, 'hat-top');
    expect(off.wearing).toEqual([]);
    expect(toggleLook(off, 'hat-top').wearing).toEqual(['hat-top']);
    expect(toggleLook(owned, 'hat-chef')).toBe(owned);
  });

  it('marks the workshop while something there is affordable', () => {
    const all = ['fourth-die', 'steam', 'hull'] as const;
    expect(anythingToBuy(9, [...all], [...all], null)).toBe(false);
    expect(anythingToBuy(10, [], [...all], null)).toBe(true);
    // With every upgrade owned, the little one's lamp is still for sale.
    expect(anythingToBuy(15, [...all], [...all], little())).toBe(true);
    expect(anythingToBuy(4, [...all], [...all], little())).toBe(false);
  });

  it('puts brackets on sale only after the coat', () => {
    expect(bracketsOnSale(['l09', 'l10'])).toBe(false);
    expect(bracketsOnSale(['l09', 'l10', 'l11'])).toBe(true);
  });
});
