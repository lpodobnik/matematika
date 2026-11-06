// How the fight on screen ended (stories 3.2–3.4): the fight's outcome and what settling
// it did to his parts and pages. Kept in `ui` only while the fight's end shows; the save
// already holds the settled parts and pages.

import type { Settlement } from '@/fight/settle';
import type { FightState, LairId, LossReason, PageId } from '@/fight/types';

export interface FightEnd {
  lairId: LairId;
  won: boolean;
  /** Armour landed on exactly 0: the reward was doubled. */
  clean: boolean;
  /** Why he lost; null on a win. */
  reason: LossReason | null;
  /** Parts the win paid, before the pile. */
  reward: number;
  /** Parts recovered from the pile by the win. */
  recovered: number;
  /** Parts the loss dropped in the pile. */
  dropped: number;
  /** The torn page this win returned, if it was the first. */
  page: PageId | null;
}

/** The end of a finished fight, from the fight and its settlement. */
export function fightEndOf(fight: FightState, settlement: Settlement): FightEnd {
  const outcome = fight.outcome;
  return {
    lairId: fight.lairId,
    won: outcome?.won === true,
    clean: outcome?.won === true && outcome.clean,
    reason: outcome && !outcome.won ? outcome.reason : null,
    reward: settlement.reward,
    recovered: settlement.recovered,
    dropped: settlement.dropped,
    page: settlement.page,
  };
}
