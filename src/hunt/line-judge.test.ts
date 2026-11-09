import { describe, expect, it } from 'vitest';
import { flagsOf, judgeLine } from '@/hunt/line-judge';
import { readTokens, type SToken } from '@/math/statement-tokens';

const typed = (line: string) => readTokens(line) as SToken[];
const verdict = (accepted: string, line: string) => judgeLine('', [accepted], typed(line)).verdict;

describe('a line he has to write', () => {
  it('takes what’s asked', () => {
    expect(verdict('7 · 2 + 1 = 15', '7 · 2 + 1 = 15')).toBe('right');
  });

  it.each([
    ['7 · 2 + 1 = 15', '15 = 7 · 2 + 1'],
    ['9 = 4 · 2 + 1', '9 = 2 · 4 + 1'],
    ['125 · 7 · 8 = 1 000 · 7 = 7 000', '125 · 8 · 7 = 1 000 · 7 = 7 000'],
    [
      '409 · 86 − 309 · 86 = (409 − 309) · 86 = 8 600',
      '409 · 86 − 309 · 86 = 86 · (409 − 309) = 8 600',
    ],
    [
      '409 · 86 − 309 · 86 = (409 − 309) · 86 = 8 600',
      '409 · 86 − 309 · 86 = (409 − 309) · 86 = 100 · 86 = 8 600',
    ],
    ['(6 + 2) · 3 = 24', '3 · (6 + 2) = 24'],
    ['38 · 30 = 1 140', '30 · 38 = 1 140'],
    [
      '34 072 = 3 · 10⁴ + 4 · 10³ + 7 · 10 + 2',
      '34 072 = 3 · 10⁴ + 4 · 10³ + 0 · 10² + 7 · 10 + 2',
    ],
  ])('takes the same thing said another way: %s, as %s', (accepted, line) => {
    expect(verdict(accepted, line)).toBe('right');
  });

  it('bounces what’s false', () => {
    expect(verdict('7 · 2 + 1 = 15', '7 · 2 + 1 = 16')).toBe('false');
  });

  it('doesn’t call a true line unreadable when it isn’t what’s asked', () => {
    expect(verdict('7 · 2 + 1 = 15', '2 + 2 = 4')).toBe('off-task');
    expect(verdict('230 < x < 240', '230 ≤ x < 240')).toBe('off-task');
    expect(verdict('7 · 2 + 1 = 15', '7 · 2 = 14')).toBe('off-task');
  });

  it('won’t take a true line of another form', () => {
    expect(verdict('0 ∉ N', '0 ∈ N₀')).toBe('off-task');
  });

  it('refuses what doesn’t read', () => {
    expect(verdict('7 · 2 + 1 = 15', '7 · =')).toBe('unreadable');
  });

  it('fills what’s started', () => {
    expect(judgeLine('7 · 2 + 1 =', ['7 · 2 + 1 = 15'], ['1', '5']).verdict).toBe('right');
    expect(judgeLine('☐ ∉ N', ['0 ∉ N'], ['0']).verdict).toBe('right');
  });

  it('leans on the scene where it says', () => {
    const context = { points: { A: 25 } };
    expect(judgeLine('A =', ['A = 25'], ['2', '5'], context).verdict).toBe('right');
    expect(judgeLine('A =', ['A = 25'], ['1', '5'], context).verdict).toBe('false');
  });

  it('says what each verdict leaves on a state', () => {
    expect(flagsOf('false')).toEqual({ bounced: true, refused: false });
    expect(flagsOf('unreadable')).toEqual({ bounced: false, refused: true });
    expect(flagsOf('off-task')).toEqual({ bounced: false, refused: 'off' });
  });
});
