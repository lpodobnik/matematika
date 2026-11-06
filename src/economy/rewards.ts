import { tuning } from '@/config/tuning';

/**
 * Parts a win pays (GDD, Automaton fights): base parts plus unspent steam, doubled when
 * armour lands on exactly 0. A recovered pile is paid on top and never doubled.
 */
export function fightReward(baseParts: number, steamLeft: number, clean: boolean): number {
  const reward = baseParts + steamLeft;
  return clean ? reward * tuning.fight.cleanCutMultiplier : reward;
}
