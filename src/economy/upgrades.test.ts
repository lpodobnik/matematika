import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import { createEconomy, earnParts } from './parts';
import { buyUpgrade, UPGRADE_IDS, upgradeCost } from './upgrades';

describe('upgrades', () => {
  it('cost 30 for the 4th die, 10 for steam and 20 for hull, 60 in all', () => {
    expect(upgradeCost('fourth-die')).toBe(30);
    expect(upgradeCost('steam')).toBe(10);
    expect(upgradeCost('hull')).toBe(20);
    expect(UPGRADE_IDS.reduce((sum, id) => sum + upgradeCost(id), 0)).toBe(60);
  });

  it('lists every upgrade in the tuning file', () => {
    expect([...UPGRADE_IDS].sort()).toEqual(Object.keys(tuning.upgrades).sort());
  });

  it('buys an upgrade with unspent parts', () => {
    const economy = earnParts(createEconomy(), 35);
    const bought = buyUpgrade(economy, 'fourth-die');
    expect(bought).toEqual({
      ok: true,
      economy: { ...economy, parts: 5, upgrades: ['fourth-die'] },
      events: [{ type: 'UpgradeBought', upgrade: 'fourth-die', cost: 30 }],
    });
  });

  it('buys with exactly enough parts', () => {
    const bought = buyUpgrade(earnParts(createEconomy(), 10), 'steam');
    expect(bought.ok && bought.economy.parts).toBe(0);
  });

  it('refuses without enough parts, or a second time', () => {
    expect(buyUpgrade(earnParts(createEconomy(), 19), 'hull')).toEqual({
      ok: false,
      reason: 'parts',
    });
    const once = buyUpgrade(earnParts(createEconomy(), 100), 'hull');
    if (!once.ok) throw new Error('expected the first purchase to succeed');
    expect(buyUpgrade(once.economy, 'hull')).toEqual({ ok: false, reason: 'owned' });
  });

  it('buys all three for 60 parts', () => {
    let economy = earnParts(createEconomy(), 60);
    for (const id of UPGRADE_IDS) {
      const bought = buyUpgrade(economy, id);
      if (!bought.ok) throw new Error(`could not buy ${id}`);
      economy = bought.economy;
    }
    expect(economy.parts).toBe(0);
    expect(economy.upgrades).toEqual(['fourth-die', 'steam', 'hull']);
  });
});
