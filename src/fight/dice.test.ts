import { describe, expect, it } from 'vitest';
import { rollDice } from './dice';
import { stepRng } from './rng';

describe('rollDice', () => {
  it('rolls the asked number of six-sided dice', () => {
    expect(rollDice(1, 3).dice).toHaveLength(3);
    expect(rollDice(1, 4).dice).toHaveLength(4);
    for (const die of rollDice(8, 1000).dice) {
      expect(Number.isInteger(die) && die >= 1 && die <= 6).toBe(true);
    }
  });

  it('is deterministic and hands back the state after the dice', () => {
    expect(rollDice(31, 3)).toEqual(rollDice(31, 3));
    let state = 31;
    for (let i = 0; i < 3; i++) state = stepRng(state).state;
    expect(rollDice(31, 3).rng).toBe(state);
  });

  it('continues a sequence: two rolls of 3 equal one roll of 6', () => {
    const first = rollDice(500, 3);
    const second = rollDice(first.rng, 3);
    expect([...first.dice, ...second.dice]).toEqual(rollDice(500, 6).dice);
  });

  it('is fair: each face comes up about a sixth of the time', () => {
    const { dice } = rollDice(4, 60_000);
    for (let face = 1; face <= 6; face++) {
      const count = dice.filter((die) => die === face).length;
      expect(Math.abs(count - 10_000)).toBeLessThan(400);
    }
  });
});
