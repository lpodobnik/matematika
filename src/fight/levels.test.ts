import { describe, expect, it } from 'vitest';
import { lairs } from '@/content/lairs';
import { createEconomy } from '@/economy/parts';
import type { Economy } from '@/economy/types';
import { armourAt, reduceFight, startFight, strikeDamage } from './fight';
import { nextLevel, settleFight } from './settle';
import type { FightState } from './types';

// Levels (tuning.fight.levels; Luka, 2026-11-18): his son grinds the automatons, so each win
// brings one back a level up, its blade and charge dice squared and then cubed, and a loss
// brings it a level down. The armour per level is set in `balance.test.ts`.

const now = Date.parse('2026-11-18T12:00:00.000Z');
const lair = lairs['lair-20'];

/** A fight at a level, in phase `set` with these dice: blade, charge, reach, and his blows. */
function setAt(level: number, dice: [number, number, number], blows: number): FightState {
  return {
    ...startFight(lair, [], 1, level),
    phase: 'set',
    round: 1,
    dice,
    slots: { blade: 0, charge: 1, reach: 2 },
    blows,
  };
}

const economyWith = (level?: number): Economy => ({
  ...createEconomy(),
  lairs: { 'lair-20': { rewindsAt: '2026-11-18T11:00:00.000Z', level } },
});

describe('a level is the power the blade and charge dice are raised to', () => {
  it('squares them at level 2 and cubes them at level 3, before multiplying', () => {
    expect(strikeDamage(6, 4, 5)).toBe(29);
    expect(strikeDamage(6, 4, 5, 'plain', 2)).toBe(6 ** 2 * 4 + 5 ** 2);
    expect(strikeDamage(6, 4, 5, 'plain', 3)).toBe(6 ** 3 * 4 + 5 ** 3);
    expect(strikeDamage(6, 4, 5, 'brackets', 2)).toBe(6 ** 2 * (4 + 5 ** 2));
  });

  it("starts a fight at the level's armour", () => {
    expect(armourAt(lair, 1)).toBe(20);
    expect(startFight(lair, [], 1, 2)).toMatchObject({ level: 2, armour: 250 });
    expect(startFight(lair, [], 1, 3)).toMatchObject({ level: 3, armour: 1500 });
  });

  it('strikes with the powers, records the level, and pays the reward times the level', () => {
    const { state } = reduceFight(setAt(2, [6, 6, 6], 6), { type: 'fight/strike' });
    expect(state?.lastStrike).toMatchObject({ level: 2, damage: 36 * 6 + 36 });
    expect(state?.phase).toBe('won');
    // Base parts 3 and the 4 steam left, times level 2.
    expect(state?.outcome).toEqual({ won: true, clean: false, reward: (3 + 4) * 2 });
  });
});

describe("an automaton's level, from his wins and losses", () => {
  it('is 1 until he beats it, and never past the top', () => {
    expect(nextLevel(createEconomy(), 'lair-20')).toBe(1);
    expect(nextLevel(economyWith(3), 'lair-20')).toBe(3);
    expect(nextLevel(economyWith(9), 'lair-20')).toBe(3);
  });

  const won = (level: number, economy = createEconomy()) =>
    settleFight(
      { economy, tornPages: [] },
      {
        ...startFight(lair, [], 1, level),
        phase: 'won',
        armour: 0,
        strikes: 1,
        outcome: { won: true, clean: false, reward: 5 },
      },
      lair,
      now,
    ).ledger.economy;
  const lost = (level: number, economy: Economy) =>
    settleFight(
      { economy, tornPages: [] },
      {
        ...startFight(lair, [], 1, level),
        phase: 'lost',
        strikes: 3,
        outcome: { won: false, reason: 'hull' },
      },
      lair,
      now,
    ).ledger.economy;

  it('goes up a level with each win, up to 3', () => {
    expect(nextLevel(won(1), 'lair-20')).toBe(2);
    expect(nextLevel(won(2, economyWith(2)), 'lair-20')).toBe(3);
    expect(nextLevel(won(3, economyWith(3)), 'lair-20')).toBe(3);
  });

  it('goes down a level with each loss, down to 1', () => {
    expect(nextLevel(lost(3, economyWith(3)), 'lair-20')).toBe(2);
    expect(nextLevel(lost(2, economyWith(2)), 'lair-20')).toBe(1);
    // The moment before he has ever beaten it: a loss leaves no record.
    expect(lost(1, createEconomy()).lairs['lair-20']).toBeUndefined();
  });
});
