import type { Economy } from './types';

/** The economy of a new game: no parts, no upgrades, no piles, every lair awake. */
export function createEconomy(): Economy {
  return { parts: 0, upgrades: [], paidPredictions: [], piles: {}, lairs: {} };
}

function requireCount(n: number, what: string): void {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`${what} must be a whole number of parts, not ${n}`);
  }
}

export function earnParts(economy: Economy, n: number): Economy {
  requireCount(n, 'Earned parts');
  return n === 0 ? economy : { ...economy, parts: economy.parts + n };
}

export type SpendResult = { ok: true; economy: Economy } | { ok: false; reason: 'parts' };

/** Spends parts if he has enough; otherwise nothing changes. */
export function spendParts(economy: Economy, n: number): SpendResult {
  requireCount(n, 'Spent parts');
  if (economy.parts < n) return { ok: false, reason: 'parts' };
  return { ok: true, economy: n === 0 ? economy : { ...economy, parts: economy.parts - n } };
}
