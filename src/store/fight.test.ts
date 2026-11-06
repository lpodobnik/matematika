// Story 3.1–3.3: automaton fights through the real store. He walks into a lair from the
// map, rolls, places and sets blows; leaving before a strike is free; a fight in progress
// survives a reload with the same dice (ADR-8); a fight that ends is settled once, in the
// step that ends it, so a reload never pays or drops twice.

import { describe, expect, it } from 'vitest';
import { blowRange, placedValues, SLOTS } from '@/fight/fight';
import type { FightState, LairId, Slot } from '@/fight/types';
import { decodeSave } from '@/save/decode';
import type { Action } from '@/store/actions';
import type { DomainEvent } from '@/store/events';
import { fromSaveV1, newSave, toSaveV1 } from '@/store/persist';
import { createGameStore } from '@/store/store';
import type { GameState } from '@/store/types';

const at = '2026-11-06T10:00:00.000Z';
const start = Date.parse(at);
const minute = 60_000;

type RoomsDone = GameState['save']['progress']['roomsDone'];

function game(roomsDone: RoomsDone = ['r01', 'r02'], parts = 0, seed: number | null = null) {
  const clock = { now: start };
  const seen: DomainEvent[] = [];
  const store = createGameStore({
    makeCtx: () => ({ now: clock.now, rng: { next: () => 0.5 } }),
    effects: [(event) => seen.push(event)],
  });
  const save = newSave(at);
  store.getState().dispatch({
    type: 'boot/start',
    save: {
      ...save,
      character: { name: 'Ivo', look: 'look-1' as const },
      progress: { ...save.progress, roomsDone, onMap: true, told: [...roomsDone] },
      economy: { ...save.economy, parts },
    },
    room: null,
  });
  if (seed !== null) store.getState().dispatch({ type: 'dev/fight-seed', seed });
  const act = (action: Action) => {
    clock.now += 500;
    store.getState().dispatch(action);
  };
  const state = () => store.getState() as GameState;
  const fight = () => {
    const f = state().fight;
    if (!f) throw new Error('no fight');
    return f;
  };
  return { store, seen, act, state, fight, clock };
}

type Game = ReturnType<typeof game>;

/** Dice indices from the largest die to the smallest. */
const bySize = (f: FightState) =>
  f.dice.map((die, index) => ({ die, index })).sort((a, b) => b.die - a.die);

/** Places dice so a strike hits hard: the largest on blade, the next on reach, then charge. */
function placeHard(g: Game) {
  const [big, mid, low] = bySize(g.fight());
  const order: [Slot, number][] = [
    ['blade', big?.index ?? 0],
    ['reach', mid?.index ?? 1],
    ['charge', low?.index ?? 2],
  ];
  for (const [slot, die] of order) g.act({ type: 'fight/place', die, slot });
}

/** Places dice so a strike hits softly: the smallest on blade and charge. */
function placeSoft(g: Game) {
  const sorted = bySize(g.fight()).reverse();
  const order: [Slot, number][] = [
    ['blade', sorted[0]?.index ?? 0],
    ['charge', sorted[1]?.index ?? 1],
    ['reach', sorted[2]?.index ?? 2],
  ];
  for (const [slot, die] of order) g.act({ type: 'fight/place', die, slot });
}

/** One round: roll, place, set blows (the most, or 1), strike. */
function round(g: Game, hard: boolean) {
  g.act({ type: 'fight/roll' });
  if (hard) placeHard(g);
  else placeSoft(g);
  const range = blowRange(g.fight());
  if (!range) throw new Error('the dial did not open');
  g.act({ type: 'fight/blows', x: hard ? range.max : range.min });
  g.act({ type: 'fight/strike' });
}

/** Plays rounds until the fight ends. */
function playOut(g: Game, hard: boolean) {
  for (let i = 0; i < 20 && g.fight().phase !== 'won' && g.fight().phase !== 'lost'; i++) {
    round(g, hard);
  }
}

/** The first seed whose fight, played hard or soft at a lair, ends as wanted. */
function seedFor(
  lair: LairId,
  roomsDone: RoomsDone,
  hard: boolean,
  wanted: (f: FightState) => boolean,
): number {
  for (let seed = 1; seed < 500; seed++) {
    const g = game(roomsDone, 0, seed);
    g.act({ type: 'map/travel', node: lair });
    playOut(g, hard);
    if (wanted(g.fight())) return seed;
  }
  throw new Error('no seed found');
}

function reload(state: GameState): GameState {
  const decoded = decodeSave(JSON.parse(JSON.stringify(toSaveV1(state, at))), at);
  if (!decoded) throw new Error('the save did not decode');
  const { save, room, fight } = fromSaveV1(decoded);
  const store = createGameStore({ effects: [] });
  store.getState().dispatch({ type: 'boot/start', save, room, fight });
  return store.getState();
}

const types = (events: readonly DomainEvent[]) => events.map((event) => event.type);

describe('entering a lair (story 3.1)', () => {
  it('starts a fight at a lair he has seen, waiting for the first roll', () => {
    const g = game();
    g.act({ type: 'map/travel', node: 'lair-20' });
    expect(g.state().ui.screen).toBe('fight');
    expect(g.fight()).toMatchObject({
      lairId: 'lair-20',
      phase: 'roll',
      armour: 20,
      hull: 3,
      steam: 10,
      limits: { dice: 3, hull: 3, steam: 10 },
    });
    expect(types(g.seen)).toContain('FightStarted');
    // He stays on the map in the save: a fight is entered from it and left back to it.
    expect(g.state().save.progress.onMap).toBe(true);
  });

  it('starts with his upgrades', () => {
    const g = game();
    g.store.setState((s) => ({
      save: { ...s.save, economy: { ...s.save.economy, upgrades: ['fourth-die', 'steam'] } },
    }));
    g.act({ type: 'map/travel', node: 'lair-20' });
    expect(g.fight().limits).toEqual({ dice: 4, hull: 3, steam: 13 });
  });

  it('ignores a lair he has not seen, and any lair off the map', () => {
    const g = game();
    g.act({ type: 'map/travel', node: 'lair-30' });
    expect(g.state().ui.screen).toBe('map');
    expect(g.state().fight).toBeNull();
    g.act({ type: 'map/travel', node: 'r03' });
    expect(g.state().ui.screen).toBe('room');
    g.act({ type: 'map/travel', node: 'lair-20' });
    expect(g.state().fight).toBeNull();
  });

  it('ignores a lair whose automaton is still winding down', () => {
    const g = game();
    const rewindsAt = new Date(start + 10 * minute).toISOString();
    g.store.setState((s) => ({
      save: { ...s.save, economy: { ...s.save.economy, lairs: { 'lair-20': { rewindsAt } } } },
    }));
    g.act({ type: 'map/travel', node: 'lair-20' });
    expect(g.state().fight).toBeNull();
    g.clock.now = start + 10 * minute;
    g.act({ type: 'map/travel', node: 'lair-20' });
    expect(g.state().ui.screen).toBe('fight');
  });

  it('seeds every fight from the dev panel’s seed when one is set', () => {
    const a = game(['r01', 'r02'], 0, 7);
    const b = game(['r01', 'r02'], 0, 7);
    for (const g of [a, b]) {
      g.act({ type: 'map/travel', node: 'lair-20' });
      g.act({ type: 'fight/roll' });
    }
    expect(a.fight().dice).toEqual(b.fight().dice);
  });
});

describe('rolling, placing and setting blows (story 3.1)', () => {
  it('rolls 3 dice, places each, and opens the dial at 1 up to the reach die', () => {
    const g = game();
    g.act({ type: 'map/travel', node: 'lair-20' });
    g.act({ type: 'fight/roll' });
    expect(g.fight().phase).toBe('place');
    expect(g.fight().dice).toHaveLength(3);
    expect(types(g.seen)).toContain('DiceRolled');
    g.act({ type: 'fight/place', die: 0, slot: 'blade' });
    g.act({ type: 'fight/place', die: 1, slot: 'charge' });
    expect(g.fight().phase).toBe('place');
    g.act({ type: 'fight/place', die: 2, slot: 'reach' });
    expect(g.fight().phase).toBe('set');
    expect(g.fight().blows).toBe(1);
    const reach = placedValues(g.fight()).reach ?? 0;
    expect(blowRange(g.fight())).toEqual({ min: 1, max: reach });
    g.act({ type: 'fight/blows', x: reach });
    expect(g.fight().blows).toBe(reach);
    // Taking a die back closes the dial again.
    g.act({ type: 'fight/unplace', slot: 'reach' });
    expect(g.fight().phase).toBe('place');
    expect(blowRange(g.fight())).toBeNull();
  });

  it('ignores fight actions off the fight screen', () => {
    const g = game();
    const before = g.state();
    for (const action of [
      { type: 'fight/roll' },
      { type: 'fight/strike' },
      { type: 'fight/leave' },
      { type: 'fight/close' },
    ] as const) {
      g.act(action);
    }
    expect(g.state().fight).toBeNull();
    expect(g.state().ui.screen).toBe(before.ui.screen);
  });
});

describe('leaving (stories 3.1, 3.2)', () => {
  it('is free before the first strike: back on the map, nothing changed', () => {
    const g = game(['r01', 'r02'], 9);
    g.act({ type: 'map/travel', node: 'lair-20' });
    g.act({ type: 'fight/roll' });
    const economy = g.state().save.economy;
    g.act({ type: 'fight/leave' });
    expect(g.state().ui.screen).toBe('map');
    expect(g.state().fight).toBeNull();
    expect(g.state().save.economy).toBe(economy);
    expect(types(g.seen)).toContain('FightLeft');
    expect(types(g.seen)).not.toContain('FightEnded');
  });

  it('never re-rolls by leaving and walking back in: the dice come back (review)', () => {
    const g = game();
    g.act({ type: 'map/travel', node: 'lair-20' });
    g.act({ type: 'fight/roll' });
    const dice = g.fight().dice;
    g.act({ type: 'fight/leave' });
    expect(g.state().save.economy.seeds['lair-20']).toBeDefined();
    // Kept across a reload too.
    expect(reload(g.state()).save.economy.seeds['lair-20']).toBe(
      g.state().save.economy.seeds['lair-20'],
    );
    g.act({ type: 'map/travel', node: 'lair-20' });
    g.act({ type: 'fight/roll' });
    expect(g.fight().dice).toEqual(dice);
  });

  it('uses the kept seed up with the first strike', () => {
    const g = game(['r01', 'r02'], 0, null);
    g.act({ type: 'map/travel', node: 'lair-20' });
    round(g, false);
    expect(g.state().save.economy.seeds).toEqual({});
  });

  it('counts as losing after a strike, and drops a quarter of his parts', () => {
    // A soft first strike (1 blow of the two smallest dice) deals at most 12 of 20 armour.
    const g = game(['r01', 'r02'], 8, 1);
    g.act({ type: 'map/travel', node: 'lair-20' });
    round(g, false);
    expect(g.fight().phase).toBe('strike');
    g.act({ type: 'fight/leave' });
    expect(g.fight().phase).toBe('lost');
    expect(g.fight().outcome).toEqual({ won: false, reason: 'left' });
    expect(g.state().ui.fightEnd).toMatchObject({ won: false, reason: 'left', dropped: 2 });
    expect(g.state().save.economy.parts).toBe(6);
    expect(g.state().save.economy.piles).toEqual({ 'lair-20': 2 });
  });
});

describe('a fight across a reload (ADR-8)', () => {
  it('resumes on the fight screen where it was, and a re-roll gives the same dice', () => {
    const g = game();
    g.act({ type: 'map/travel', node: 'lair-20' });
    const beforeRoll = reload(g.state());
    expect(beforeRoll.ui.screen).toBe('fight');
    expect(beforeRoll.fight).toEqual(g.fight());
    g.act({ type: 'fight/roll' });
    const dice = g.fight().dice;
    // Rolling in the reloaded game from the same saved state gives the same dice.
    const { save, room, fight, ui } = beforeRoll;
    const again = createGameStore({ effects: [], initialState: { save, room, fight, ui } });
    again.getState().dispatch({ type: 'fight/roll' });
    expect(again.getState().fight?.dice).toEqual(dice);
    // After the roll, the save holds the dice, so a reload shows them.
    expect(reload(g.state()).fight?.dice).toEqual(dice);
  });

  it('resumes after a strike with armour, hull and steam as they were', () => {
    const g = game(['r01', 'r02'], 0, 1);
    g.act({ type: 'map/travel', node: 'lair-20' });
    round(g, false);
    const resumed = reload(g.state());
    expect(resumed.fight).toEqual(g.fight());
    expect(resumed.ui.screen).toBe('fight');
  });
});

describe('a fight that ends (stories 3.2, 3.3)', () => {
  it('a win pays base parts plus steam left (doubled on a clean cut), winds the automaton down, and is never saved', () => {
    const seed = seedFor('lair-20', ['r01', 'r02'], true, (f) => f.phase === 'won');
    const g = game(['r01', 'r02'], 0, seed);
    g.act({ type: 'map/travel', node: 'lair-20' });
    playOut(g, true);
    const f = g.fight();
    expect(f.phase).toBe('won');
    const clean = f.outcome?.won === true && f.outcome.clean;
    const reward = (3 + f.steam) * (clean ? 2 : 1);
    expect(g.state().save.economy.parts).toBe(reward);
    expect(g.state().ui.fightEnd).toMatchObject({ won: true, reward, recovered: 0, clean });
    expect(g.state().save.economy.lairs['lair-20']?.rewindsAt).toBe(
      new Date(g.clock.now + 15 * minute).toISOString(),
    );
    expect(types(g.seen)).toContain('FightEnded');
    expect(toSaveV1(g.state(), at).fight).toBeNull();
    // The end shows until he goes back to the map.
    expect(g.state().ui.screen).toBe('fight');
    g.act({ type: 'fight/close' });
    expect(g.state().ui.screen).toBe('map');
    expect(g.state().fight).toBeNull();
    expect(g.state().ui.fightEnd).toBeNull();
  });

  it('a reload after the end never settles it again', () => {
    const seed = seedFor('lair-20', ['r01', 'r02'], true, (f) => f.phase === 'won');
    const g = game(['r01', 'r02'], 0, seed);
    g.act({ type: 'map/travel', node: 'lair-20' });
    playOut(g, true);
    const parts = g.state().save.economy.parts;
    const reloaded = reload(g.state());
    expect(reloaded.fight).toBeNull();
    expect(reloaded.ui.screen).toBe('map');
    expect(reloaded.save.economy.parts).toBe(parts);
  });

  it('a loss drops a quarter of his parts at the automaton, and a win there recovers it', () => {
    const lose = seedFor('lair-20', ['r01', 'r02'], false, (f) => f.phase === 'lost');
    const g = game(['r01', 'r02'], 13, lose);
    g.act({ type: 'map/travel', node: 'lair-20' });
    playOut(g, false);
    expect(g.fight().phase).toBe('lost');
    expect(g.state().save.economy.parts).toBe(10);
    expect(g.state().save.economy.piles).toEqual({ 'lair-20': 3 });
    expect(g.state().ui.fightEnd).toMatchObject({ won: false, dropped: 3 });
    // A loss leaves the automaton awake, so he can go straight back for the pile.
    expect(g.state().save.economy.lairs).toEqual({});
    g.act({ type: 'fight/close' });

    const win = seedFor('lair-20', ['r01', 'r02'], true, (f) => f.phase === 'won');
    g.act({ type: 'dev/fight-seed', seed: win });
    g.act({ type: 'map/travel', node: 'lair-20' });
    playOut(g, true);
    const f = g.fight();
    expect(f.phase).toBe('won');
    const end = g.state().ui.fightEnd;
    expect(end?.recovered).toBe(3);
    expect(g.state().save.economy.parts).toBe(10 + (end?.reward ?? 0) + 3);
    expect(g.state().save.economy.piles).toEqual({});
  });

  it('the first win at the armour 30 automaton returns its torn page, and later wins none', () => {
    const done: RoomsDone = ['r01', 'r02', 'r03', 'r05'];
    const seed = seedFor('lair-30', done, true, (f) => f.phase === 'won');
    const g = game(done, 0, seed);
    g.act({ type: 'map/travel', node: 'lair-30' });
    playOut(g, true);
    expect(g.state().save.progress.tornPages).toEqual(['page-1']);
    expect(g.state().ui.fightEnd?.page).toBe('page-1');
    expect(types(g.seen)).toContain('TornPageReturned');
    g.act({ type: 'fight/close' });
    g.clock.now += 15 * minute;
    g.act({ type: 'map/travel', node: 'lair-30' });
    playOut(g, true);
    if (g.fight().phase === 'won') expect(g.state().ui.fightEnd?.page).toBeNull();
    expect(g.state().save.progress.tornPages).toEqual(['page-1']);
  });

  it('the dev panel’s jump into a room drops the fight (review)', () => {
    const g = game();
    g.act({ type: 'map/travel', node: 'lair-20' });
    g.act({ type: 'room/enter', roomId: 'r03' });
    expect(g.state().ui.screen).toBe('room');
    expect(g.state().fight).toBeNull();
    expect(toSaveV1(g.state(), at).fight).toBeNull();
  });

  it('a new game from the dev panel drops the fight', () => {
    const g = game();
    g.act({ type: 'map/travel', node: 'lair-20' });
    g.act({ type: 'dev/new-game' });
    expect(g.state().fight).toBeNull();
    expect(g.state().ui.screen).not.toBe('fight');
  });
});

describe('the dev panel (architecture, Debug Tools)', () => {
  it('sets his parts', () => {
    const g = game();
    g.act({ type: 'dev/set-parts', parts: 90 });
    expect(g.state().save.economy.parts).toBe(90);
    g.act({ type: 'dev/set-parts', parts: -1 });
    expect(g.state().save.economy.parts).toBe(90);
  });
});

it('every slot is one of the three (a guard for the helpers above)', () => {
  expect(SLOTS).toEqual(['blade', 'charge', 'reach']);
});
