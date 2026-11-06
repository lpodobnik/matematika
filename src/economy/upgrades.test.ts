import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import { createEconomy, earnParts } from './parts';
import { buyUpgrade, UPGRADE_IDS, upgradeCost } from './upgrades';

describe('upgrades', () => {
  it('cost 40 for the 4th die, 20 for steam and 30 for hull, 90 in all', () => {
    expect(upgradeCost('fourth-die')).toBe(40);
    expect(upgradeCost('steam')).toBe(20);
    expect(upgradeCost('hull')).toBe(30);
    expect(UPGRADE_IDS.reduce((sum, id) => sum + upgradeCost(id), 0)).toBe(90);
  });

  it('lists every upgrade in the tuning file', () => {
    expect([...UPGRADE_IDS].sort()).toEqual(Object.keys(tuning.upgrades).sort());
  });

  it('buys an upgrade with unspent parts', () => {
    const economy = earnParts(createEconomy(), 45);
    const bought = buyUpgrade(economy, 'fourth-die');
    expect(bought).toEqual({
      ok: true,
      economy: { ...economy, parts: 5, upgrades: ['fourth-die'] },
      events: [{ type: 'UpgradeBought', upgrade: 'fourth-die', cost: 40 }],
    });
  });

  it('buys with exactly enough parts', () => {
    const bought = buyUpgrade(earnParts(createEconomy(), 20), 'steam');
    expect(bought.ok && bought.economy.parts).toBe(0);
  });

  it('refuses without enough parts, or a second time', () => {
    expect(buyUpgrade(earnParts(createEconomy(), 29), 'hull')).toEqual({
      ok: false,
      reason: 'parts',
    });
    const once = buyUpgrade(earnParts(createEconomy(), 100), 'hull');
    if (!once.ok) throw new Error('expected the first purchase to succeed');
    expect(buyUpgrade(once.economy, 'hull')).toEqual({ ok: false, reason: 'owned' });
  });

  it('buys all three for 90 parts', () => {
    let economy = earnParts(createEconomy(), 90);
    for (const id of UPGRADE_IDS) {
      const bought = buyUpgrade(economy, id);
      if (!bought.ok) throw new Error(`could not buy ${id}`);
      economy = bought.economy;
    }
    expect(economy.parts).toBe(0);
    expect(economy.upgrades).toEqual(['fourth-die', 'steam', 'hull']);
  });
});
