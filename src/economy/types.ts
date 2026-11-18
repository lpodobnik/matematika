import type { LairId } from '@/fight/types';

/** The three fight upgrades (GDD, Automaton fights), and part 2's brackets. */
export type UpgradeId = 'fourth-die' | 'steam' | 'hull' | 'brackets';

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
  /**
   * And the level of his next fight there (tuning.fight.levels): a win raises it, a loss lowers
   * it. Missing is level 1.
   */
  lairs: Partial<Record<LairId, { rewindsAt: string; level?: number }>>;
  /**
   * The seed of a fight he walked into and left before striking (story 3.1 review): the
   * next fight there starts from it, so leaving and walking back in never re-rolls the
   * dice. Cleared by the first strike.
   */
  seeds: Partial<Record<LairId, number>>;
}
