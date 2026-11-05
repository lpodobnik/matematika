import { describe, expect, it } from 'vitest';
import { lairs } from '@/content/lairs';
import { placedValues, startFight } from './fight';
import { createRng } from './rng';
import {
  maxBlows,
  placements,
  playChoice,
  playFight,
  randomPlayer,
  reasoningPlayer,
} from './scripted-players';
import type { FightState, LairSpec } from './types';

const lair = (armour: number, baseParts = 3): LairSpec => ({
  id: 'lair-20',
  armour,
  baseParts,
  page: null,
});

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

const valuesOf = (state: FightState, choice: ReturnType<typeof reasoningPlayer>) => ({
  blade: state.dice[choice.slots.blade],
  charge: state.dice[choice.slots.charge],
  reach: state.dice[choice.slots.reach],
  blows: choice.blows,
});

describe('placements', () => {
  it('lists every ordered pick of three different dice', () => {
    expect(placements(3)).toHaveLength(6);
    expect(placements(4)).toHaveLength(24);
    const keys = placements(4).map((p) => `${p.blade}${p.charge}${p.reach}`);
    expect(new Set(keys).size).toBe(24);
    for (const p of placements(4)) expect(new Set([p.blade, p.charge, p.reach]).size).toBe(3);
  });
});

describe('reasoning player', () => {
  it('finishes the automaton when the roll can, choosing the finish that pays most', () => {
    // Armour 20 with 6, 2, 3: 6 · 3 + 2 = 20 is a clean cut with 7 steam left, paying
    // (3 + 7) · 2 = 20. The only other finish, 3 · 6 + 2 = 20, leaves 4 steam and pays 14.
    const state = rolled(startFight(lair(20), [], 1), [6, 2, 3]);
    expect(valuesOf(state, reasoningPlayer(state))).toEqual({
      blade: 6,
      charge: 2,
      reach: 3,
      blows: 3,
    });
  });

  it('follows its definition on every roll: the best-paying finish, else the hardest hit', () => {
    const rng = createRng(11);
    const die = () => 1 + Math.floor(rng.next() * 6);
    for (let i = 0; i < 2_000; i++) {
      const armour = 1 + Math.floor(rng.next() * 60);
      const steam = 1 + Math.floor(rng.next() * 10);
      const state = rolled({ ...startFight(lair(armour), [], 1), steam }, [die(), die(), die()]);
      const options = placements(3).flatMap((slots) =>
        Array.from({ length: maxBlows(state, slots.reach) }, (_, k) => {
          const blows = k + 1;
          const damage = (state.dice[slots.blade] ?? 0) * blows + (state.dice[slots.charge] ?? 0);
          const parts = (3 + steam - blows) * (damage === armour ? 2 : 1);
          return { damage, blows, parts, kills: damage >= armour };
        }),
      );
      const choice = reasoningPlayer(state);
      const damage =
        (state.dice[choice.slots.blade] ?? 0) * choice.blows +
        (state.dice[choice.slots.charge] ?? 0);
      const kills = options.filter((o) => o.kills);
      if (kills.length > 0) {
        expect(damage).toBeGreaterThanOrEqual(armour);
        const parts = (3 + steam - choice.blows) * (damage === armour ? 2 : 1);
        expect(parts).toBe(Math.max(...kills.map((o) => o.parts)));
      } else {
        const most = Math.max(...options.map((o) => o.damage));
        expect(damage).toBe(most);
        expect(choice.blows).toBe(
          Math.min(...options.filter((o) => o.damage === most).map((o) => o.blows)),
        );
      }
    }
  });

  it('hits as hard as it can when no finish is possible, with the fewest blows on ties', () => {
    // Armour 60 with 6, 5, 4: the most damage is 6 · 5 + 4 = 34 (blade 6, reach 5).
    const state = rolled(startFight(lair(60), [], 1), [6, 5, 4]);
    expect(valuesOf(state, reasoningPlayer(state))).toEqual({
      blade: 6,
      charge: 4,
      reach: 5,
      blows: 5,
    });
    // With 1, 1, 6 the most damage is 1 · 6 + 1 = 7 or 1 · 1 + 6 = 7: fewest blows wins.
    const tie = rolled(startFight(lair(60), [], 1), [1, 1, 6]);
    expect(valuesOf(tie, reasoningPlayer(tie))).toMatchObject({ charge: 6, blows: 1 });
  });

  it('never sets more blows than the steam left', () => {
    const state = rolled({ ...startFight(lair(60), [], 1), steam: 2 }, [6, 6, 6]);
    expect(reasoningPlayer(state).blows).toBe(2);
  });

  it('picks the best three of four dice with the upgrade', () => {
    const state = rolled(startFight(lair(60), ['fourth-die'], 1), [1, 6, 5, 6]);
    expect(valuesOf(state, reasoningPlayer(state))).toEqual({
      blade: 6,
      charge: 5,
      reach: 6,
      blows: 6,
    });
  });
});

describe('random player', () => {
  it('commits every blow the reach and steam allow', () => {
    const player = randomPlayer(createRng(1));
    for (let i = 0; i < 50; i++) {
      const state = rolled({ ...startFight(lair(60), [], 1), steam: 1 + (i % 10) }, [
        1 + (i % 6),
        3,
        5,
      ]);
      const choice = player(state);
      expect(choice.blows).toBe(maxBlows(state, choice.slots.reach));
    }
  });

  it('uses every placement about equally often', () => {
    const player = randomPlayer(createRng(2));
    const state = rolled(startFight(lair(60), [], 1), [1, 2, 3]);
    const counts = new Map<string, number>();
    for (let i = 0; i < 6_000; i++) {
      const { slots } = player(state);
      const key = `${slots.blade}${slots.charge}${slots.reach}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    expect(counts.size).toBe(6);
    for (const count of counts.values()) expect(Math.abs(count - 1_000)).toBeLessThan(150);
  });
});

describe('playing through the fight code', () => {
  it('playChoice places, sets the blows and strikes', () => {
    const state = rolled(startFight(lair(60), [], 1), [6, 2, 3]);
    const struck = playChoice(state, { slots: { blade: 0, charge: 1, reach: 2 }, blows: 3 });
    expect(struck.lastStrike).toMatchObject({ blade: 6, charge: 2, blows: 3, damage: 20 });
    expect(placedValues(struck)).toEqual({ blade: 6, charge: 2, reach: 3 });
  });

  it('playChoice refuses blows the dial does not allow', () => {
    const state = rolled(startFight(lair(60), [], 1), [6, 2, 3]);
    expect(() =>
      playChoice(state, { slots: { blade: 0, charge: 1, reach: 2 }, blows: 4 }),
    ).toThrow();
  });

  it('playFight ends every fight, the same way from the same seed', () => {
    for (let seed = 0; seed < 200; seed++) {
      const end = playFight(startFight(lairs['lair-45'], [], seed), reasoningPlayer);
      expect(end.phase === 'won' || end.phase === 'lost').toBe(true);
      expect(end.strikes).toBeLessThanOrEqual(3);
    }
    const a = playFight(startFight(lairs['lair-60'], [], 5), randomPlayer(createRng(1)));
    const b = playFight(startFight(lairs['lair-60'], [], 5), randomPlayer(createRng(1)));
    expect(a).toEqual(b);
  });
});
