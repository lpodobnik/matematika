import { describe, expect, it } from 'vitest';
import { lairs } from '@/content/lairs';
import {
  blowRange,
  blowsAffordable,
  placedValues,
  reduceFight,
  startFight,
  strikeDamage,
} from './fight';
import type { FightAction, FightState, LairSpec, Slot } from './types';

const lair20 = lairs['lair-20'];
const lair60 = lairs['lair-60'];

function must(state: FightState | null): FightState {
  if (!state) throw new Error('expected a fight');
  return state;
}

function act(state: FightState, ...actions: FightAction[]): FightState {
  return actions.reduce((s, action) => must(reduceFight(s, action).state), state);
}

/** The fight as `fight/roll` would leave it, but with chosen dice. */
function rolled(state: FightState, dice: number[]): FightState {
  return {
    ...state,
    phase: 'place',
    round: state.round + 1,
    dice,
    slots: { blade: null, charge: null, reach: null },
    blows: 0,
  };
}

/** Puts dice 0, 1 and 2 on blade, charge and reach. */
function placeInOrder(state: FightState): FightState {
  return act(
    state,
    { type: 'fight/place', die: 0, slot: 'blade' },
    { type: 'fight/place', die: 1, slot: 'charge' },
    { type: 'fight/place', die: 2, slot: 'reach' },
  );
}

/** One round with chosen dice (blade, charge, reach) and blows. */
function round(state: FightState, dice: [number, number, number], blows: number): FightState {
  return act(
    placeInOrder(rolled(state, dice)),
    { type: 'fight/blows', x: blows },
    { type: 'fight/strike' },
  );
}

const testLair = (armour: number, baseParts = 3): LairSpec => ({
  id: 'lair-20',
  armour,
  baseParts,
  page: null,
});

describe('startFight', () => {
  it('starts at the lair with the base limits, waiting for the first roll', () => {
    const fight = startFight(lair60, [], 42);
    expect(fight).toMatchObject({
      lairId: 'lair-60',
      baseParts: 6,
      phase: 'roll',
      limits: { dice: 3, hull: 3, steam: 10 },
      armour: 60,
      hull: 3,
      steam: 10,
      round: 0,
      rng: 42,
      dice: [],
      strikes: 0,
      lastStrike: null,
      outcome: null,
    });
  });

  it('applies upgrades to the limits and the starting hull and steam', () => {
    const fight = startFight(lair20, ['fourth-die', 'steam', 'hull'], 1);
    expect(fight.limits).toEqual({ dice: 4, hull: 4, steam: 13 });
    expect(fight.hull).toBe(4);
    expect(fight.steam).toBe(13);
  });

  it('is plain data that survives JSON', () => {
    const fight = round(startFight(lair60, [], 7), [2, 3, 4], 4);
    expect(JSON.parse(JSON.stringify(fight))).toEqual(fight);
  });
});

describe('rolling', () => {
  it('rolls three dice from 1 to 6, starts round 1 and waits for placing', () => {
    const { state, events } = reduceFight(startFight(lair20, [], 5), { type: 'fight/roll' });
    const fight = must(state);
    expect(fight.phase).toBe('place');
    expect(fight.round).toBe(1);
    expect(fight.dice).toHaveLength(3);
    for (const die of fight.dice) expect(die >= 1 && die <= 6 && Number.isInteger(die)).toBe(true);
    expect(fight.slots).toEqual({ blade: null, charge: null, reach: null });
    expect(events).toEqual([{ type: 'DiceRolled', lairId: 'lair-20', dice: fight.dice }]);
  });

  it('rolls four dice with the 4th-die upgrade', () => {
    const fight = act(startFight(lair20, ['fourth-die'], 5), { type: 'fight/roll' });
    expect(fight.dice).toHaveLength(4);
  });

  it('rolls the same dice from the same seed, and other dice from another', () => {
    const first = act(startFight(lair20, [], 99), { type: 'fight/roll' }).dice;
    const again = act(startFight(lair20, [], 99), { type: 'fight/roll' }).dice;
    expect(again).toEqual(first);
    const many = new Set(
      Array.from({ length: 20 }, (_, seed) =>
        act(startFight(lair20, [], seed), { type: 'fight/roll' }).dice.join(),
      ),
    );
    expect(many.size).toBeGreaterThan(10);
  });

  it('advances the generator, so the next round rolls on', () => {
    const fight = act(startFight(lair60, [], 3), { type: 'fight/roll' });
    expect(fight.rng).not.toBe(3);
    const struck = act(placeInOrder(fight), { type: 'fight/strike' });
    expect(struck.phase).toBe('strike');
    const next = act(struck, { type: 'fight/roll' });
    expect(next.round).toBe(2);
    expect(next.phase).toBe('place');
    expect(next.slots).toEqual({ blade: null, charge: null, reach: null });
    expect(next.rng).not.toBe(fight.rng);
  });

  it('is ignored while placing, setting and after the fight', () => {
    const placing = act(startFight(lair20, [], 1), { type: 'fight/roll' });
    expect(reduceFight(placing, { type: 'fight/roll' }).state).toBe(placing);
    const setting = placeInOrder(placing);
    expect(reduceFight(setting, { type: 'fight/roll' }).state).toBe(setting);
    const won = round(startFight(testLair(5), [], 1), [1, 5, 1], 1);
    expect(won.phase).toBe('won');
    expect(reduceFight(won, { type: 'fight/roll' })).toEqual({ state: won, events: [] });
  });
});

describe('placing dice', () => {
  const fight = rolled(startFight(lair60, [], 1), [6, 2, 3]);

  it('fills slots one at a time and opens the dial at 1 when all three are filled', () => {
    const one = act(fight, { type: 'fight/place', die: 0, slot: 'blade' });
    expect(one.phase).toBe('place');
    expect(placedValues(one)).toEqual({ blade: 6, charge: null, reach: null });
    const all = placeInOrder(fight);
    expect(all.phase).toBe('set');
    expect(placedValues(all)).toEqual({ blade: 6, charge: 2, reach: 3 });
    expect(all.blows).toBe(1);
  });

  it('moves a die that is already in another slot', () => {
    const moved = act(
      fight,
      { type: 'fight/place', die: 0, slot: 'blade' },
      { type: 'fight/place', die: 0, slot: 'reach' },
    );
    expect(moved.slots).toEqual({ blade: null, charge: null, reach: 0 });
  });

  it('sends a replaced die back to the tray', () => {
    const swapped = act(placeInOrder(fight), { type: 'fight/place', die: 1, slot: 'blade' });
    expect(swapped.slots).toEqual({ blade: 1, charge: null, reach: 2 });
    expect(swapped.phase).toBe('place');
  });

  it('ignores a die that is not in the roll', () => {
    for (const die of [-1, 3, 1.5, Number.NaN]) {
      expect(reduceFight(fight, { type: 'fight/place', die, slot: 'blade' }).state).toBe(fight);
    }
    const badSlot = { type: 'fight/place', die: 0, slot: 'shield' as Slot } as const;
    expect(reduceFight(fight, badSlot).state).toBe(fight);
    const placed = act(fight, { type: 'fight/place', die: 0, slot: 'blade' });
    expect(reduceFight(placed, { type: 'fight/place', die: 0, slot: 'blade' }).state).toBe(placed);
  });

  it('takes a die back out, closing the dial', () => {
    const back = act(placeInOrder(fight), { type: 'fight/unplace', slot: 'charge' });
    expect(back.phase).toBe('place');
    expect(back.slots.charge).toBeNull();
    expect(back.blows).toBe(0);
    expect(reduceFight(back, { type: 'fight/unplace', slot: 'charge' }).state).toBe(back);
  });

  it('reopens the dial at 1 after a die moves between slots', () => {
    const set = act(placeInOrder(fight), { type: 'fight/blows', x: 3 });
    const swapped = act(
      set,
      { type: 'fight/place', die: 0, slot: 'reach' },
      { type: 'fight/place', die: 2, slot: 'blade' },
    );
    expect(placedValues(swapped)).toEqual({ blade: 3, charge: 2, reach: 6 });
    expect(swapped.phase).toBe('set');
    expect(swapped.blows).toBe(1);
  });

  it('clamps the blows when the 4th die replaces the reach die', () => {
    const four = rolled(startFight(lair60, ['fourth-die'], 1), [6, 2, 5, 3]);
    const set = act(placeInOrder(four), { type: 'fight/blows', x: 5 });
    const narrower = act(set, { type: 'fight/place', die: 3, slot: 'reach' });
    expect(narrower.phase).toBe('set');
    expect(placedValues(narrower)).toEqual({ blade: 6, charge: 2, reach: 3 });
    expect(narrower.blows).toBe(3);
    const wider = act(narrower, { type: 'fight/place', die: 2, slot: 'reach' });
    expect(wider.blows).toBe(3);
  });

  it('with four dice places three and discards the fourth', () => {
    const four = rolled(startFight(lair60, ['fourth-die'], 1), [1, 6, 5, 4]);
    const set = act(
      four,
      { type: 'fight/place', die: 1, slot: 'blade' },
      { type: 'fight/place', die: 3, slot: 'charge' },
      { type: 'fight/place', die: 2, slot: 'reach' },
    );
    expect(set.phase).toBe('set');
    expect(placedValues(set)).toEqual({ blade: 6, charge: 4, reach: 5 });
    const struck = act(set, { type: 'fight/blows', x: 5 }, { type: 'fight/strike' });
    expect(struck.lastStrike?.damage).toBe(6 * 5 + 4);
  });

  it('is ignored before the roll and after the fight', () => {
    const fresh = startFight(lair60, [], 1);
    expect(reduceFight(fresh, { type: 'fight/place', die: 0, slot: 'blade' }).state).toBe(fresh);
    expect(reduceFight(fresh, { type: 'fight/unplace', slot: 'blade' }).state).toBe(fresh);
  });
});

describe('setting blows on the dial', () => {
  const set = placeInOrder(rolled(startFight(lair60, [], 1), [4, 2, 5]));

  it('allows 1 up to the reach die', () => {
    expect(blowRange(set)).toEqual({ min: 1, max: 5 });
    for (let x = 1; x <= 5; x++) expect(act(set, { type: 'fight/blows', x }).blows).toBe(x);
  });

  it('refuses 0, more than reach, and anything not whole', () => {
    for (const x of [0, -1, 6, 2.5, Number.NaN]) {
      expect(reduceFight(set, { type: 'fight/blows', x }).state).toBe(set);
    }
  });

  it('never allows more blows than the steam left pays for', () => {
    const low = placeInOrder(rolled({ ...startFight(lair60, [], 1), steam: 2 }, [4, 2, 5]));
    expect(blowRange(low)).toEqual({ min: 1, max: 2 });
    expect(reduceFight(low, { type: 'fight/blows', x: 3 }).state).toBe(low);
    expect(act(low, { type: 'fight/blows', x: 2 }).blows).toBe(2);
  });

  it('is ignored while placing', () => {
    const placing = rolled(startFight(lair60, [], 1), [4, 2, 5]);
    expect(reduceFight(placing, { type: 'fight/blows', x: 1 }).state).toBe(placing);
    expect(blowRange(placing)).toBeNull();
  });

  it('has no range after a strike, though the slots still hold the dice', () => {
    const struck = act(set, { type: 'fight/strike' });
    expect(struck.slots.reach).not.toBeNull();
    expect(blowRange(struck)).toBeNull();
  });

  it('counts blows against steam one for one', () => {
    expect(blowsAffordable(10)).toBe(10);
    expect(blowsAffordable(0)).toBe(0);
  });
});

describe('striking', () => {
  it('deals a · x + b, spends one steam per blow and shows the sum on the banner', () => {
    const fight = startFight(lair60, [], 1);
    const set = act(placeInOrder(rolled(fight, [6, 2, 3])), { type: 'fight/blows', x: 3 });
    const { state, events } = reduceFight(set, { type: 'fight/strike' });
    const struck = must(state);
    expect(strikeDamage(6, 3, 2)).toBe(20);
    expect(struck.lastStrike).toEqual({
      round: 1,
      blade: 6,
      charge: 2,
      blows: 3,
      damage: 20,
      armourBefore: 60,
      armourAfter: 40,
      clean: false,
      dented: true,
    });
    expect(struck.armour).toBe(40);
    expect(struck.steam).toBe(7);
    expect(struck.strikes).toBe(1);
    expect(events).toEqual([
      { type: 'StrikeLanded', lairId: 'lair-60', strike: struck.lastStrike },
    ]);
  });

  it('with armour left, the automaton dents him and the next round waits for a roll', () => {
    const struck = round(startFight(lair60, [], 1), [6, 2, 3], 3);
    expect(struck.hull).toBe(2);
    expect(struck.phase).toBe('strike');
    expect(struck.outcome).toBeNull();
  });

  it('wins when armour lands on exactly 0: a clean cut doubles the reward', () => {
    const won = round(startFight(testLair(20, 3), [], 1), [6, 2, 3], 3);
    expect(won.phase).toBe('won');
    expect(won.armour).toBe(0);
    expect(won.hull).toBe(3);
    expect(won.lastStrike).toMatchObject({ clean: true, dented: false, armourAfter: 0 });
    expect(won.outcome).toEqual({ won: true, clean: true, reward: (3 + 7) * 2 });
  });

  it('wins when armour goes below 0, without the doubling', () => {
    const won = round(startFight(testLair(19, 3), [], 1), [6, 2, 3], 3);
    expect(won.phase).toBe('won');
    expect(won.armour).toBe(0);
    expect(won.lastStrike).toMatchObject({ damage: 20, armourAfter: 0, clean: false });
    expect(won.outcome).toEqual({ won: true, clean: false, reward: 3 + 7 });
  });

  it('checks armour first, so winning on the last steam counts', () => {
    const lastSteam = { ...startFight(testLair(14, 4), [], 1), steam: 2, hull: 1 };
    const won = round(lastSteam, [6, 2, 3], 2);
    expect(won.steam).toBe(0);
    expect(won.phase).toBe('won');
    expect(won.outcome).toEqual({ won: true, clean: true, reward: 4 * 2 });
  });

  it('wins on the last dent of hull too, since armour comes first', () => {
    const lastHull = { ...startFight(testLair(14, 4), [], 1), hull: 1 };
    const won = round(lastHull, [6, 2, 3], 2);
    expect(won.phase).toBe('won');
    expect(won.hull).toBe(1);
  });

  it('loses when the third dent empties the hull', () => {
    let fight = startFight(lair60, [], 1);
    fight = round(fight, [1, 1, 1], 1);
    fight = round(fight, [1, 1, 1], 1);
    expect(fight.phase).toBe('strike');
    expect(fight.hull).toBe(1);
    fight = round(fight, [1, 1, 1], 1);
    expect(fight.hull).toBe(0);
    expect(fight.phase).toBe('lost');
    expect(fight.outcome).toEqual({ won: false, reason: 'hull' });
  });

  it('loses when armour is left and the steam is gone', () => {
    const fight = round(startFight(lair60, [], 1), [6, 6, 6], 6);
    expect(fight.steam).toBe(4);
    const out = round(fight, [1, 1, 4], 4);
    expect(out.steam).toBe(0);
    expect(out.armour).toBe(60 - 42 - 5);
    expect(out.hull).toBe(1);
    expect(out.phase).toBe('lost');
    expect(out.outcome).toEqual({ won: false, reason: 'steam' });
  });

  it('names the hull when hull and steam run out together', () => {
    const fight = { ...startFight(lair60, [], 1), hull: 1, steam: 1 };
    expect(round(fight, [1, 1, 1], 1).outcome).toEqual({ won: false, reason: 'hull' });
  });

  it('lets +1 hull take a third dent and lose on the fourth', () => {
    let fight = startFight(lair60, ['hull'], 1);
    for (let i = 0; i < 3; i++) fight = round(fight, [1, 1, 1], 1);
    expect(fight.phase).toBe('strike');
    expect(round(fight, [1, 1, 1], 1).outcome).toEqual({ won: false, reason: 'hull' });
  });

  it('lets +3 steam pay for 13 blows', () => {
    let fight = startFight(lair60, ['steam'], 1);
    fight = round(fight, [1, 1, 6], 6);
    fight = round(fight, [1, 1, 6], 6);
    expect(fight.steam).toBe(1);
    expect(fight.phase).toBe('strike');
    const placed = placeInOrder(rolled(fight, [1, 1, 6]));
    expect(blowRange(placed)).toEqual({ min: 1, max: 1 });
  });

  it('is ignored outside setting', () => {
    const placing = rolled(startFight(lair60, [], 1), [6, 2, 3]);
    expect(reduceFight(placing, { type: 'fight/strike' }).state).toBe(placing);
    const fresh = startFight(lair60, [], 1);
    expect(reduceFight(fresh, { type: 'fight/strike' })).toEqual({ state: fresh, events: [] });
  });
});

describe('leaving', () => {
  it('is free before the first strike, in every phase of round 1', () => {
    const fresh = startFight(lair60, [], 1);
    const placing = act(fresh, { type: 'fight/roll' });
    const setting = placeInOrder(placing);
    for (const fight of [fresh, placing, setting]) {
      expect(reduceFight(fight, { type: 'fight/leave' })).toEqual({ state: null, events: [] });
    }
  });

  it('counts as losing after the first strike', () => {
    const struck = round(startFight(lair60, [], 1), [6, 2, 3], 3);
    for (const fight of [struck, act(struck, { type: 'fight/roll' })]) {
      const left = must(reduceFight(fight, { type: 'fight/leave' }).state);
      expect(left.phase).toBe('lost');
      expect(left.outcome).toEqual({ won: false, reason: 'left' });
      expect(left.armour).toBe(fight.armour);
    }
  });

  it('is ignored once the fight is over', () => {
    const won = round(startFight(testLair(20), [], 1), [6, 2, 3], 3);
    expect(reduceFight(won, { type: 'fight/leave' }).state).toBe(won);
    const lost = {
      ...won,
      phase: 'lost' as const,
      outcome: { won: false as const, reason: 'hull' as const },
    };
    expect(reduceFight(lost, { type: 'fight/leave' }).state).toBe(lost);
  });
});

describe('after the fight', () => {
  it('ignores every action once the fight is won or lost', () => {
    const won = round(startFight(testLair(20), [], 1), [6, 2, 3], 3);
    let lost = startFight(lair60, [], 1);
    for (let i = 0; i < 3; i++) lost = round(lost, [1, 1, 1], 1);
    const actions: FightAction[] = [
      { type: 'fight/roll' },
      { type: 'fight/place', die: 0, slot: 'reach' },
      { type: 'fight/unplace', slot: 'blade' },
      { type: 'fight/blows', x: 2 },
      { type: 'fight/strike' },
      { type: 'fight/leave' },
    ];
    for (const fight of [won, lost]) {
      for (const action of actions) {
        expect(reduceFight(fight, action)).toEqual({ state: fight, events: [] });
      }
    }
  });
});

describe('saving and resuming (ADR-8)', () => {
  it('a fight saved after a strike and reloaded plays on exactly as if never saved', () => {
    const struck = round(startFight(lair60, [], 1234), [6, 2, 3], 3);
    const reloaded: FightState = JSON.parse(JSON.stringify(struck));
    const actions: FightAction[] = [
      { type: 'fight/roll' },
      { type: 'fight/place', die: 0, slot: 'blade' },
      { type: 'fight/place', die: 1, slot: 'charge' },
      { type: 'fight/place', die: 2, slot: 'reach' },
      { type: 'fight/strike' },
      { type: 'fight/roll' },
    ];
    expect(act(reloaded, ...actions)).toEqual(act(struck, ...actions));
  });

  it('rolling again after a reload gives the same dice, so a reload is no re-roll', () => {
    const struck = round(startFight(lair60, [], 77), [6, 2, 3], 3);
    const firstTry = act(struck, { type: 'fight/roll' }).dice;
    const reloaded: FightState = JSON.parse(JSON.stringify(struck));
    expect(act(reloaded, { type: 'fight/roll' }).dice).toEqual(firstTry);
  });

  it('a reloaded fight is still in progress, not left', () => {
    const struck = round(startFight(lair60, [], 1), [6, 2, 3], 3);
    const reloaded: FightState = JSON.parse(JSON.stringify(struck));
    expect(reloaded.phase).toBe('strike');
    expect(reloaded.outcome).toBeNull();
  });
});
