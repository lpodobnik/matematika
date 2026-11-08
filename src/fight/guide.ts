// The guided first fight. The first time he fights, at any lair, Nikola talks him through
// one round a step at a time: what armour is and the goal, the roll, a die of his choice on
// blade, the charge, the reach, the blows, the strike and its banner, the dent, steam and
// the clean cut. Some steps are read and then closed with "Dalje" (talking steps); the
// others wait for the move they ask for, and only that move is let through, so the guided
// round can't go wrong. Once the last step is read the guide is met (`fight-guide` in
// `save.progress.firstUse`) and never shows again.

import { blowRange, SLOTS } from './fight';
import type { FightAction, FightState, Slot } from './types';

export type GuideStep =
  | 'armour'
  | 'goal'
  | 'roll'
  | 'blade'
  | 'charge'
  | 'reach'
  | 'blows'
  | 'strike'
  | 'banner'
  | 'dent'
  | 'steam'
  | 'clean';

/** Every step, in the order the guide can show them (`dent` only after a strike that dents). */
export const GUIDE_STEPS: readonly GuideStep[] = [
  'armour',
  'goal',
  'roll',
  'blade',
  'reach',
  'charge',
  'blows',
  'strike',
  'banner',
  'dent',
  'steam',
  'clean',
];

/** The step a new guide starts at. */
export const GUIDE_START: GuideStep = 'armour';

const talking: ReadonlySet<GuideStep> = new Set<GuideStep>([
  'armour',
  'goal',
  'banner',
  'dent',
  'steam',
  'clean',
]);

/** A step he reads and closes with "Dalje", rather than one that waits for a move. */
export function guideTalks(step: GuideStep): boolean {
  return talking.has(step);
}

/** What on the fight screen a step points at; everything else is dimmed while it shows. */
export type GuideTarget =
  | 'armour'
  | 'roll'
  | 'dice'
  | Slot
  | 'formula'
  | 'blows'
  | 'strike'
  | 'banner'
  | 'hull'
  | 'steam';

const focus: Readonly<Record<GuideStep, readonly GuideTarget[]>> = {
  armour: ['armour'],
  goal: ['armour'],
  roll: ['roll'],
  blade: ['dice', 'blade'],
  charge: ['dice', 'charge'],
  reach: ['dice', 'reach'],
  blows: ['formula', 'blows'],
  strike: ['formula', 'strike'],
  banner: ['banner', 'armour'],
  dent: ['hull'],
  steam: ['steam'],
  clean: ['armour', 'banner'],
};

/** What a step points at. */
export function guideFocus(step: GuideStep): readonly GuideTarget[] {
  return focus[step];
}

const isSlotStep = (step: GuideStep): step is Slot => (SLOTS as readonly string[]).includes(step);

/**
 * The dice the guide lets him put in its slot now, as indices into the roll: any die still
 * free. He chooses, and the strike's banner shows what his choice did (Luka: "let the kid
 * choose the die himself to learn"). Empty outside the blade, charge and reach steps.
 */
export function guideDice(step: GuideStep, fight: FightState): number[] {
  if (!isSlotStep(step) || fight.phase !== 'place') return [];
  const placed = new Set(SLOTS.map((slot) => fight.slots[slot]));
  return fight.dice.map((_, index) => index).filter((index) => !placed.has(index));
}

/**
 * Whether the guide lets a fight action through at this step. Leaving is always his choice;
 * otherwise only the move the step asks for, and on a talking step none.
 */
export function guideAllows(step: GuideStep, fight: FightState, action: FightAction): boolean {
  switch (action.type) {
    case 'fight/leave':
      return true;
    case 'fight/roll':
      return step === 'roll';
    case 'fight/place':
      return action.slot === step && guideDice(step, fight).includes(action.die);
    case 'fight/unplace':
      return false;
    case 'fight/blows': {
      const range = blowRange(fight);
      const open = range !== null && action.x >= range.min && action.x <= range.max;
      return open && (step === 'blows' || step === 'strike');
    }
    case 'fight/strike':
      return step === 'strike';
  }
}

/**
 * The step after a move the guide let through, with `fight` the fight after it. Picking a
 * number of blows moves on even when it is the number already set.
 */
export function guideAfter(step: GuideStep, fight: FightState, action: FightAction): GuideStep {
  switch (action.type) {
    case 'fight/roll':
      return step === 'roll' && fight.phase === 'place' ? 'blade' : step;
    case 'fight/place':
      if (step === 'blade' && fight.slots.blade !== null) return 'charge';
      if (step === 'charge' && fight.slots.charge !== null) return 'reach';
      if (step === 'reach' && fight.phase === 'set') return 'blows';
      return step;
    case 'fight/blows':
      return step === 'blows' ? 'strike' : step;
    case 'fight/strike':
      return step === 'strike' && fight.lastStrike ? 'banner' : step;
    default:
      return step;
  }
}

/**
 * "Dalje" on a talking step: the next step, or null when the guide is over. The dent is
 * explained only after a strike that dented him. A step that waits for a move stays.
 */
export function guideNext(step: GuideStep, fight: FightState): GuideStep | null {
  switch (step) {
    case 'armour':
      return 'goal';
    case 'goal':
      return 'roll';
    case 'banner':
      return fight.lastStrike?.dented ? 'dent' : 'steam';
    case 'dent':
      return 'steam';
    case 'steam':
      return 'clean';
    case 'clean':
      return null;
    default:
      return step;
  }
}

/**
 * Where the guide picks up in a fight resumed on launch (the guide itself isn't saved, the
 * fight is): from the fight's phase before the first strike, at the banner right after it,
 * and at steam once the next round has begun.
 */
export function guideResume(fight: FightState): GuideStep {
  if (fight.strikes > 0) return fight.phase === 'strike' && fight.round === 1 ? 'banner' : 'steam';
  if (fight.phase === 'roll') return GUIDE_START;
  if (fight.phase === 'set') return 'blows';
  if (fight.slots.blade === null) return 'blade';
  return fight.slots.charge === null ? 'charge' : 'reach';
}
