import { tuning } from '@/config/tuning';
import { spendParts } from './parts';
import type { Economy, UpgradeId } from './types';

export const UPGRADE_IDS: readonly UpgradeId[] = ['fourth-die', 'steam', 'hull'];

export function upgradeCost(id: UpgradeId): number {
  return tuning.upgrades[id].cost;
}

export type UpgradeEvent = { type: 'UpgradeBought'; upgrade: UpgradeId; cost: number };

export type BuyResult =
  | { ok: true; economy: Economy; events: UpgradeEvent[] }
  | { ok: false; reason: 'owned' | 'parts' };

/** Buys an upgrade once, paying its cost from his unspent parts. */
export function buyUpgrade(economy: Economy, id: UpgradeId): BuyResult {
  if (economy.upgrades.includes(id)) return { ok: false, reason: 'owned' };
  const cost = upgradeCost(id);
  const spent = spendParts(economy, cost);
  if (!spent.ok) return spent;
  return {
    ok: true,
    economy: { ...spent.economy, upgrades: [...economy.upgrades, id] },
    events: [{ type: 'UpgradeBought', upgrade: id, cost }],
  };
}
