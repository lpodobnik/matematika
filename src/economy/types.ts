import type { LairId } from '@/fight/types';

/** The three fight upgrades (GDD, Automaton fights). */
export type UpgradeId = 'fourth-die' | 'steam' | 'hull';

/** The economy slice of the save (architecture, Data Architecture: `SaveV1.economy`). */
export interface Economy {
  /** Unspent parts. Parts already spent are safe from losing. */
  parts: number;
  upgrades: UpgradeId[];
  /** Stages whose right prediction has paid, such as `"r05:1"` (epic 3, not built yet). */
  paidPredictions: string[];
  /** Parts dropped at each automaton by losing to it. */
  piles: Partial<Record<LairId, number>>;
  /** Automatons winding down after a win, until `rewindsAt` (ISO 8601). */
  lairs: Partial<Record<LairId, { rewindsAt: string }>>;
}
