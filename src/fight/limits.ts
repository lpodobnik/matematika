import { tuning } from '@/config/tuning';
import type { UpgradeId } from '@/economy/types';
import type { FightLimits } from './types';

/** A fight's dice, hull and steam, with each owned upgrade added once. */
export function fightLimits(upgrades: readonly UpgradeId[]): FightLimits {
  const limits: FightLimits = {
    dice: tuning.fight.dice,
    hull: tuning.fight.hull,
    steam: tuning.fight.steam,
  };
  for (const id of new Set(upgrades)) {
    const upgrade = tuning.upgrades[id];
    limits.dice += upgrade.dice;
    limits.hull += upgrade.hull;
    limits.steam += upgrade.steam;
  }
  return limits;
}
