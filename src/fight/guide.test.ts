import { describe, expect, it } from 'vitest';
import { lairs } from '@/content/lairs';
import { reduceFight, startFight } from './fight';
import {
  GUIDE_START,
  GUIDE_STEPS,
  type GuideStep,
  guideAfter,
  guideAllows,
  guideDice,
  guideFocus,
  guideNext,
  guideResume,
  guideTalks,
} from './guide';
import type { FightAction, FightState } from './types';

const fresh = () => startFight(lairs['lair-20'], [], 7);

/** The fight as `fight/roll` would leave it, but with chosen dice. */
function rolled(dice: number[], from: FightState = fresh()): FightState {
  return {
    ...from,
    phase: 'place',
    round: from.round + 1,
    dice,
    slots: { blade: null, charge: null, reach: null },
    blows: 0,
  };
}

function act(state: FightState, action: FightAction): FightState {
  const next = reduceFight(state, action).state;
  if (!next) throw new Error('expected a fight');
  return next;
}

/**
 * Plays the guided round the way the guide asks, checking at each move that the guide lets
 * it through, and returns the step reached and the fight.
 */
function guided(state: FightState, step: GuideStep, action: FightAction) {
  expect(guideAllows(step, state, action), `${step} lets ${action.type} through`).toBe(true);
  const fight = act(state, action);
  return { fight, step: guideAfter(step, fight, action) };
}

describe('the guided first fight (fight/guide.ts)', () => {
  it('starts at the armour, and every step either talks or waits for one move', () => {
    expect(GUIDE_START).toBe('armour');
    expect(GUIDE_STEPS.filter(guideTalks)).toEqual([
      'armour',
      'goal',
      'banner',
      'dent',
      'steam',
      'clean',
    ]);
    for (const step of GUIDE_STEPS) expect(guideFocus(step).length).toBeGreaterThan(0);
  });

  it('puts the biggest die on blade, the smaller of the other two on charge, the last on reach', () => {
    const f = rolled([2, 6, 4]);
    expect(guideDice('blade', f)).toEqual([1]);
    const bladed = act(f, { type: 'fight/place', die: 1, slot: 'blade' });
    expect(guideDice('charge', bladed)).toEqual([0]);
    const charged = act(bladed, { type: 'fight/place', die: 0, slot: 'charge' });
    expect(guideDice('reach', charged)).toEqual([2]);
    // Not outside its slot steps, nor outside placing.
    expect(guideDice('roll', f)).toEqual([]);
    expect(guideDice('blade', fresh())).toEqual([]);
  });

  it('lets any of equal dice go, and with a 4th die keeps the smallest aside', () => {
    expect(guideDice('blade', rolled([5, 3, 5]))).toEqual([0, 2]);
    const four = act(rolled([1, 6, 3, 5]), { type: 'fight/place', die: 1, slot: 'blade' });
    // Charge takes the 3: reach keeps the 5, and the 1 stays aside.
    expect(guideDice('charge', four)).toEqual([2]);
    const charged = act(four, { type: 'fight/place', die: 2, slot: 'charge' });
    expect(guideDice('reach', charged)).toEqual([3]);
  });

  it('lets through only the move its step asks for; leaving is always allowed', () => {
    const start = fresh();
    for (const step of ['armour', 'goal', 'banner', 'dent', 'steam', 'clean'] as const) {
      expect(guideAllows(step, start, { type: 'fight/roll' })).toBe(false);
      expect(guideAllows(step, start, { type: 'fight/leave' })).toBe(true);
    }
    expect(guideAllows('roll', start, { type: 'fight/roll' })).toBe(true);
    const f = rolled([2, 6, 4]);
    // The wrong die, or the right die in the wrong slot, is refused.
    expect(guideAllows('blade', f, { type: 'fight/place', die: 0, slot: 'blade' })).toBe(false);
    expect(guideAllows('blade', f, { type: 'fight/place', die: 1, slot: 'reach' })).toBe(false);
    expect(guideAllows('blade', f, { type: 'fight/place', die: 1, slot: 'blade' })).toBe(true);
    expect(guideAllows('blade', f, { type: 'fight/unplace', slot: 'blade' })).toBe(false);
    expect(guideAllows('blade', f, { type: 'fight/strike' })).toBe(false);
  });

  it('walks one round: roll, blade, charge, reach, blows, strike, then the banner', () => {
    let { fight, step } = guided(fresh(), 'roll', { type: 'fight/roll' });
    expect(step).toBe('blade');
    for (const slot of ['blade', 'charge', 'reach'] as const) {
      expect(step).toBe(slot);
      const die = guideDice(slot, fight)[0] ?? -1;
      ({ fight, step } = guided(fight, step, { type: 'fight/place', die, slot }));
    }
    expect(step).toBe('blows');
    expect(fight.phase).toBe('set');
    // The dial is not open to the strike yet, and the strike waits for the blows.
    expect(guideAllows('blows', fight, { type: 'fight/strike' })).toBe(false);
    // Picking the number already set (1) still moves on.
    ({ fight, step } = guided(fight, step, { type: 'fight/blows', x: fight.blows }));
    expect(step).toBe('strike');
    // He can still change the blows at the strike step, and that keeps the step.
    expect(guideAllows('strike', fight, { type: 'fight/blows', x: 1 })).toBe(true);
    expect(guideAfter('strike', fight, { type: 'fight/blows', x: 1 })).toBe('strike');
    expect(guideAllows('strike', fight, { type: 'fight/blows', x: 99 })).toBe(false);
    ({ fight, step } = guided(fight, step, { type: 'fight/strike' }));
    expect(step).toBe('banner');
    expect(fight.lastStrike).not.toBeNull();
  });

  it('explains the dent only after a strike that dented him, then steam and the clean cut', () => {
    const f = rolled([1, 1, 1]);
    const struck = (dented: boolean): FightState => ({
      ...f,
      phase: dented ? 'strike' : 'won',
      lastStrike: {
        round: 1,
        blade: 1,
        charge: 1,
        blows: 1,
        damage: 2,
        armourBefore: 20,
        armourAfter: dented ? 18 : 0,
        clean: !dented,
        dented,
      },
    });
    expect(guideNext('armour', f)).toBe('goal');
    expect(guideNext('goal', f)).toBe('roll');
    expect(guideNext('banner', struck(true))).toBe('dent');
    expect(guideNext('banner', struck(false))).toBe('steam');
    expect(guideNext('dent', f)).toBe('steam');
    expect(guideNext('steam', f)).toBe('clean');
    expect(guideNext('clean', f)).toBeNull();
    // A step that waits for a move doesn't move on with "Dalje".
    expect(guideNext('roll', f)).toBe('roll');
    expect(guideNext('strike', f)).toBe('strike');
  });

  it('picks up a resumed fight where it was', () => {
    const start = fresh();
    expect(guideResume(start)).toBe('armour');
    const f = rolled([2, 6, 4]);
    expect(guideResume(f)).toBe('blade');
    const bladed = act(f, { type: 'fight/place', die: 1, slot: 'blade' });
    expect(guideResume(bladed)).toBe('charge');
    const charged = act(bladed, { type: 'fight/place', die: 0, slot: 'charge' });
    expect(guideResume(charged)).toBe('reach');
    const set = act(charged, { type: 'fight/place', die: 2, slot: 'reach' });
    expect(guideResume(set)).toBe('blows');
    const struck = act(set, { type: 'fight/strike' });
    expect(struck.phase).toBe('strike');
    expect(guideResume(struck)).toBe('banner');
    expect(guideResume(act(struck, { type: 'fight/roll' }))).toBe('steam');
  });
});
