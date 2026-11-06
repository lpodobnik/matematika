// The GDD's two scripted players (GDD, Automaton fights: "one reasoning perfectly and one
// placing dice at random and committing every blow it can"), used by `balance.test.ts`.
// They play through the real fight code: they read a FightState and dispatch actions.
//
// "Reasoning perfectly" means perfect arithmetic within the round, not planning across
// rounds. It looks at every way to put three of the rolled dice on blade, charge and reach,
// and every blow count the dial allows, and:
//   1. if any of them brings armour to 0 or below, takes the one that pays the most parts
//      (base parts plus the steam left, doubled on a clean cut);
//   2. otherwise takes the one that deals the most damage this round, with the fewest
//      blows when several deal the same.
// This rule reproduces the GDD's table. Planning across rounds does better: the strategy
// that maximises the chance of winning wins 43.7% at armour 60, against the GDD's 39%, so
// it is not what the GDD simulated (story file `ahead-fight-rules.md`, Calls Made).

import { tuning } from '@/config/tuning';
import { fightReward } from '@/economy/rewards';
import { blowsAffordable, reduceFight, SLOTS, strikeDamage } from './fight';
import { type Rng, randomIndex } from './rng';
import type { FightAction, FightState, Slot } from './types';

/** A placement of three dice (indices into `dice`) and the blows to strike with. */
export interface Choice {
  slots: Record<Slot, number>;
  blows: number;
}

export type ScriptedPlayer = (state: FightState) => Choice;

/** Every ordered pick of three different dice as blade, charge and reach. */
export function placements(diceCount: number): Record<Slot, number>[] {
  const out: Record<Slot, number>[] = [];
  for (let blade = 0; blade < diceCount; blade++) {
    for (let charge = 0; charge < diceCount; charge++) {
      if (charge === blade) continue;
      for (let reach = 0; reach < diceCount; reach++) {
        if (reach === blade || reach === charge) continue;
        out.push({ blade, charge, reach });
      }
    }
  }
  return out;
}

function value(state: FightState, index: number): number {
  const die = state.dice[index];
  if (die === undefined) throw new Error(`No die ${index} in this roll`);
  return die;
}

/** The most blows the die at `reachDie` and the steam left allow. */
export function maxBlows(state: FightState, reachDie: number): number {
  return Math.min(value(state, reachDie), blowsAffordable(state.steam));
}

export const reasoningPlayer: ScriptedPlayer = (state) => {
  let bestKill: Choice | null = null;
  let bestKillParts = -1;
  let bestHit: Choice | null = null;
  let bestHitDamage = -1;
  for (const slots of placements(state.dice.length)) {
    const blade = value(state, slots.blade);
    const charge = value(state, slots.charge);
    const most = maxBlows(state, slots.reach);
    for (let blows = 1; blows <= most; blows++) {
      const damage = strikeDamage(blade, blows, charge);
      if (damage >= state.armour) {
        const steamLeft = state.steam - blows * tuning.fight.steamPerBlow;
        const parts = fightReward(state.baseParts, steamLeft, damage === state.armour);
        if (parts > bestKillParts) {
          bestKillParts = parts;
          bestKill = { slots, blows };
        }
      } else if (
        damage > bestHitDamage ||
        (damage === bestHitDamage && bestHit !== null && blows < bestHit.blows)
      ) {
        bestHitDamage = damage;
        bestHit = { slots, blows };
      }
    }
  }
  const choice = bestKill ?? bestHit;
  if (!choice) throw new Error('No legal strike for this roll');
  return choice;
};

/** Places three of the dice at random and commits every blow the reach and steam allow. */
export function randomPlayer(rng: Rng): ScriptedPlayer {
  return (state) => {
    const options = placements(state.dice.length);
    const slots = options[randomIndex(rng, options.length)];
    if (!slots) throw new Error('No placement for this roll');
    return { slots, blows: maxBlows(state, slots.reach) };
  };
}

function act(state: FightState, action: FightAction): FightState {
  const next = reduceFight(state, action).state;
  if (!next) throw new Error('A scripted player never leaves');
  return next;
}

/** Places the dice, sets the blows and strikes, through `reduceFight`. */
export function playChoice(state: FightState, choice: Choice): FightState {
  let next = state;
  for (const slot of SLOTS)
    next = act(next, { type: 'fight/place', die: choice.slots[slot], slot });
  next = act(next, { type: 'fight/blows', x: choice.blows });
  if (next.phase !== 'set' || next.blows !== choice.blows) {
    throw new Error('The fight refused the placement or the blows');
  }
  return act(next, { type: 'fight/strike' });
}

/** Plays a fight to its end through `reduceFight`, one action at a time. */
export function playFight(start: FightState, player: ScriptedPlayer): FightState {
  let state = start;
  for (let guard = 0; guard < 100; guard++) {
    switch (state.phase) {
      case 'won':
      case 'lost':
        return state;
      case 'roll':
      case 'strike':
        state = act(state, { type: 'fight/roll' });
        break;
      case 'place':
      case 'set':
        state = playChoice(state, player(state));
        break;
    }
  }
  throw new Error('The fight did not end');
}
