import type { LairId } from '@/fight/types';

/** The three fight upgrades (GDD, Automaton fights). */
export type UpgradeId = 'fourth-die' | 'steam' | 'hull';

/** The economy slice of the save (architecture, Data Architecture: `SaveV1.economy`). */
export interface Economy {
  /** Unspent parts. Parts already spent are safe from losing. */
  parts: number;
  upgrades: UpgradeId[];
  /** Stages whose right prediction has paid, such as `"r03:0"` (economy/predictions.ts). */
  paidPredictions: string[];
  /** Parts dropped at each automaton by losing to it. */
  piles: Partial<Record<LairId, number>>;
  /** Automatons winding down after a win, until `rewindsAt` (ISO 8601). */
  lairs: Partial<Record<LairId, { rewindsAt: string }>>;
  /**
   * The seed of a fight he walked into and left before striking (story 3.1 review): the
   * next fight there starts from it, so leaving and walking back in never re-rolls the
   * dice. Cleared by the first strike.
   */
  seeds: Partial<Record<LairId, number>>;
}
