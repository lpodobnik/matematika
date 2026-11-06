import { describe, expect, it } from 'vitest';
import { lairs } from '@/content/lairs';
import { reduceFight, startFight } from '@/fight/fight';
import type { FightAction, FightState } from '@/fight/types';
import { decodeFight } from './decode-fight';

const act = (state: FightState, ...actions: FightAction[]): FightState =>
  actions.reduce((s, action) => {
    const next = reduceFight(s, action).state;
    if (!next) throw new Error('the fight was dropped');
    return next;
  }, state);

const fresh = startFight(lairs['lair-30'], [], 42);
const rolled = act(fresh, { type: 'fight/roll' });
const placing = act(rolled, { type: 'fight/place', die: 0, slot: 'blade' });
const set = act(
  placing,
  { type: 'fight/place', die: 1, slot: 'charge' },
  { type: 'fight/place', die: 2, slot: 'reach' },
);
const struck = act(set, { type: 'fight/strike' });
const nextRound = act(struck, { type: 'fight/roll' });
const fourDice = act(startFight(lairs['lair-30'], ['fourth-die'], 5), { type: 'fight/roll' });

const roundTrip = (state: FightState) => decodeFight(JSON.parse(JSON.stringify(state)));

describe('decodeFight (story 3.1; ADR-8)', () => {
  it('reads back a fight saved in any phase it can be saved in', () => {
    for (const state of [fresh, rolled, placing, set, struck, nextRound, fourDice]) {
      expect(roundTrip(state)).toEqual(state);
    }
    expect(struck.phase).toBe('strike');
  });

  it('reads nothing as no fight', () => {
    for (const value of [null, undefined, 7, 'fight', [], {}])
      expect(decodeFight(value)).toBeNull();
  });

  it('never reads a finished fight, which is settled and never saved', () => {
    expect(decodeFight({ ...set, phase: 'won' })).toBeNull();
    expect(decodeFight({ ...set, phase: 'lost' })).toBeNull();
  });

  it('drops a fight that does not hang together', () => {
    const broken: unknown[] = [
      { ...rolled, lairId: 'lair-99' },
      { ...rolled, dice: [7, 1, 1] },
      { ...rolled, dice: [1, 1] },
      { ...rolled, dice: [1.5, 1, 1] },
      { ...placing, slots: { blade: 5, charge: null, reach: null } },
      { ...set, slots: { blade: 0, charge: 0, reach: 2 } },
      { ...set, phase: 'place' },
      { ...placing, phase: 'set' },
      { ...set, blows: 0 },
      { ...set, blows: 7 },
      { ...rolled, hull: 4 },
      { ...rolled, hull: 0 },
      { ...rolled, steam: 11 },
      { ...rolled, armour: 0 },
      { ...rolled, rng: -1 },
      { ...rolled, round: 0 },
      { ...fresh, dice: [1, 2, 3] },
      { ...rolled, limits: { dice: 5, hull: 3, steam: 10 } },
      { ...struck, lastStrike: null },
      { ...struck, strikes: 0 },
      { ...struck, armour: struck.armour + 1 },
      { ...struck, lastStrike: { ...struck.lastStrike, damage: 1 } },
      { ...struck, lastStrike: { ...struck.lastStrike, round: 9 } },
      { ...rolled, strikes: 3 },
      { ...struck, hull: struck.hull + 1 },
      { ...nextRound, lastStrike: { ...struck.lastStrike, round: 2 } },
    ];
    for (const value of broken) expect(decodeFight(JSON.parse(JSON.stringify(value)))).toBeNull();
  });

  it('never carries an outcome', () => {
    expect(roundTrip(set)?.outcome).toBeNull();
  });
});
