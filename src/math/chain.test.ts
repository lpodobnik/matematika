import { describe, expect, it } from 'vitest';
import { chainOf, inverseOf, lastLink, undoLast, undoneLinks } from '@/math/chain';
import { formatEquation } from '@/math/format';
import { solve } from '@/math/linear';
import { parse } from '@/math/parse';
import * as q from '@/math/rational';

function eq(text: string) {
  const parsed = parse(text);
  if (!parsed.ok) throw new Error(`doesn't parse: ${text}`);
  return parsed.equation;
}

describe('chainOf', () => {
  it('reads the GDD chains', () => {
    expect(chainOf(eq('2x + 7 = 25'))).toEqual({
      links: [
        { op: 'mul', n: 2 },
        { op: 'add', n: 7 },
      ],
      output: 25,
      xOnLeft: true,
    });
    expect(chainOf(eq('135 − 5x = 100'))?.links).toEqual([
      { op: 'mul', n: 5 },
      { op: 'from', n: 135 },
    ]);
    expect(chainOf(eq('60 + 3x = 90'))?.links).toEqual([
      { op: 'mul', n: 3 },
      { op: 'add', n: 60 },
    ]);
    expect(chainOf(eq('x : 3 = 5'))?.links).toEqual([{ op: 'div', n: 3 }]);
    expect(chainOf(eq('x − 6 = 8'))?.links).toEqual([{ op: 'sub', n: 6 }]);
    expect(chainOf(eq('5 905 − 27x = 316'))?.output).toBe(316);
    expect(chainOf(eq('x = 9'))).toEqual({ links: [], output: 9, xOnLeft: true });
  });

  it('reads a move he typed himself, its number side worked out (story 4.1 review)', () => {
    expect(chainOf(eq('4x = 41 − 9'))).toEqual({
      links: [{ op: 'mul', n: 4 }],
      output: 32,
      xOnLeft: true,
    });
    expect(chainOf(eq('2x + 7 = 20 + 5'))?.output).toBe(25);
  });

  it('reads x on the right', () => {
    expect(chainOf(eq('135 = 100 + 5x'))).toEqual({
      links: [
        { op: 'mul', n: 5 },
        { op: 'add', n: 100 },
      ],
      output: 135,
      xOnLeft: false,
    });
  });

  it('is null for what is not a chain', () => {
    for (const text of ['x + x = 6', '2x = x + 3', '18 : x = 2', '7 = 7', '2x = 7 : 2']) {
      expect(chainOf(eq(text)), text).toBeNull();
    }
  });
});

describe('undoLast', () => {
  it('writes the move and its result, as school does', () => {
    const undo = undoLast(eq('2x + 7 = 25'), { op: 'sub', n: 7 });
    expect(undo && formatEquation(undo.line)).toBe('2x = 25 − 7');
    expect(undo?.result && formatEquation(undo.result)).toBe('2x = 18');
    expect(undo?.right).toBe(true);
    const split = undoLast(eq('2x = 18'), { op: 'div', n: 2 });
    expect(split && formatEquation(split.line)).toBe('x = 18 : 2');
    expect(split?.result && formatEquation(split.result)).toBe('x = 9');
  });

  it('undoes 135 − ☐ with 135 − 100, not + 135', () => {
    const right = undoLast(eq('135 − 5x = 100'), { op: 'from', n: 135 });
    expect(right && formatEquation(right.line)).toBe('5x = 135 − 100');
    expect(right?.result && formatEquation(right.result)).toBe('5x = 35');
    expect(right?.right).toBe(true);
    const wrong = undoLast(eq('135 − 5x = 100'), { op: 'add', n: 135 });
    expect(wrong && formatEquation(wrong.line)).toBe('5x = 100 + 135');
    expect(wrong?.right).toBe(false);
  });

  it('keeps the solution exactly when the choice is right', () => {
    const cases: [string, number][] = [
      ['4x + 9 = 41', 8],
      ['135 − 5x = 100', 7],
      ['5 905 − 27x = 316', 207],
      ['x : 3 = 5', 15],
      ['25 = 7 + 2x', 9],
    ];
    for (const [text, x] of cases) {
      let current = eq(text);
      for (let i = 0; i < 3; i += 1) {
        const chain = chainOf(current);
        const link = chain && lastLink(chain);
        if (!link) break;
        const undo = undoLast(current, inverseOf(link));
        if (!undo?.result) throw new Error(`no whole result for ${text}`);
        for (const line of [undo.line, undo.result]) {
          const solution = solve(line);
          expect(solution.kind === 'one' && q.equals(solution.x, q.rational(x)), text).toBe(true);
        }
        current = undo.result;
      }
      expect([`x = ${x}`, `${x} = x`]).toContain(formatEquation(current));
    }
  });

  it('gives a wrong choice its line, with another solution, and no result when not whole', () => {
    const undo = undoLast(eq('2x + 7 = 25'), { op: 'div', n: 7 });
    expect(undo?.right).toBe(false);
    expect(undo?.result).toBeNull();
    expect(undo && formatEquation(undo.line)).toBe('2x = 25 : 7');
  });

  it('is null when x is alone or the line is not a chain', () => {
    expect(undoLast(eq('x = 9'), { op: 'sub', n: 1 })).toBeNull();
    expect(undoLast(eq('x + x = 6'), { op: 'sub', n: 1 })).toBeNull();
  });
});

describe('undoneLinks', () => {
  it('darkens the links the current line no longer has', () => {
    const stage = eq('2x + 7 = 25');
    expect(undoneLinks(stage, stage)).toEqual([]);
    expect(undoneLinks(stage, eq('2x = 18'))).toEqual([{ op: 'add', n: 7 }]);
    expect(undoneLinks(stage, eq('x = 9'))).toHaveLength(2);
  });

  it('darkens nothing once Balance made another chain', () => {
    expect(undoneLinks(eq('135 − 5x = 100'), eq('135 = 100 + 5x'))).toEqual([]);
  });
});
