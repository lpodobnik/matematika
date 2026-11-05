import { tuning } from '@/config/tuning';
import { stepRng } from './rng';

/** Rolls `count` dice from a generator state, returning the dice and the state after them. */
export function rollDice(
  rngState: number,
  count: number,
  sides: number = tuning.fight.dieSides,
): { dice: number[]; rng: number } {
  const dice: number[] = [];
  let state = rngState;
  for (let i = 0; i < count; i++) {
    const step = stepRng(state);
    state = step.state;
    dice.push(1 + Math.min(sides - 1, Math.floor(step.value * sides)));
  }
  return { dice, rng: state };
}
