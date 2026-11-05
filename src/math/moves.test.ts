import { describe, expect, it } from 'vitest';
import type { Equation } from '@/math/expr';
import {
  classifyMove,
  compareComplexity,
  complexity,
  type Move,
  makesProgress,
} from '@/math/moves';
import { parse } from '@/math/parse';

function equation(text: string): Equation {
  const result = parse(text);
  if (!result.ok) throw new Error(`"${text}" did not parse: ${result.reason}`);
  return result.equation;
}

function move(previous: string, next: string): Move {
  return classifyMove(equation(previous), equation(next));
}

describe('complexity', () => {
  it('gives the architecture tuples along 2x + 7 = 25 → … → x = 9', () => {
    const chain: [string, readonly number[]][] = [
      ['2x + 7 = 25', [2, 1, 0]],
      ['2x = 25 − 7', [1, 1, 1]],
      ['2x = 18', [1, 1, 0]],
      ['x = 18 : 2', [1, 0, 1]],
      ['x = 9', [1, 0, 0]],
    ];
    for (const [text, tuple] of chain) expect(complexity(equation(text)), text).toEqual(tuple);
  });

  it('makes progress on every step of that chain', () => {
    const texts = ['2x + 7 = 25', '2x = 25 − 7', '2x = 18', 'x = 18 : 2', 'x = 9'];
    for (let i = 1; i < texts.length; i += 1) {
      const [previous, next] = [texts[i - 1] ?? '', texts[i] ?? ''];
      expect(makesProgress(equation(previous), equation(next)), `${previous} → ${next}`).toBe(true);
    }
  });

  it('makes no progress from 2x + 7 = 25 to 2x + 8 = 26, or by swapping sides', () => {
    expect(makesProgress(equation('2x + 7 = 25'), equation('2x + 8 = 26'))).toBe(false);
    expect(makesProgress(equation('2x + 7 = 25'), equation('25 = 2x + 7'))).toBe(false);
    expect(makesProgress(equation('x = 9'), equation('2x = 18'))).toBe(false);
  });

  it('reads the x side wherever it is', () => {
    expect(complexity(equation('9 = x'))).toEqual([1, 0, 0]);
    expect(complexity(equation('20 − 6 = x'))).toEqual([1, 0, 1]);
    expect(complexity(equation('20 = 6 + x'))).toEqual([2, 0, 0]);
  });

  it('flags any coefficient other than 1, springs and dividers included', () => {
    expect(complexity(equation('20 − x = 6'))).toEqual([2, 1, 0]);
    expect(complexity(equation('x : 3 = 5'))).toEqual([1, 1, 0]);
    expect(complexity(equation('1x = 9'))).toEqual([1, 0, 0]);
  });

  it('counts terms as written, with a bracketed group as one', () => {
    expect(complexity(equation('2x + 7 − 7 = 25 − 7'))).toEqual([3, 1, 1]);
    expect(complexity(equation('x = (25 − 7) : 2'))).toEqual([1, 0, 2]);
    expect(complexity(equation('2 · (x + 3) = 24'))).toEqual([1, 1, 0]);
    expect(complexity(equation('20 − (x + 4) = 6'))).toEqual([2, 1, 0]);
  });

  it('handles x on both sides and lines with no x', () => {
    expect(complexity(equation('2x + 7 = x + 16'))).toEqual([4, 1, 0]);
    expect(complexity(equation('2 · 9 + 7 = 25'))).toEqual([0, 0, 2]);
  });

  it('compares lexicographically', () => {
    expect(compareComplexity([1, 1, 9], [2, 0, 0])).toBe(-1);
    expect(compareComplexity([1, 1, 0], [1, 0, 9])).toBe(1);
    expect(compareComplexity([1, 0, 1], [1, 0, 1])).toBe(0);
  });
});

describe('classifyMove', () => {
  it('sees the same piece on or off both pans', () => {
    expect(move('2x + 7 = 25', '2x = 18')).toEqual({
      kind: 'add-both',
      term: { kind: 'num', value: 7, sign: -1 },
    });
    expect(move('x − 6 = 8', 'x = 14')).toEqual({
      kind: 'add-both',
      term: { kind: 'num', value: 6, sign: 1 },
    });
    expect(move('2x + 7 = 25', '2x + 7 − 7 = 25 − 7')).toEqual({
      kind: 'add-both',
      term: { kind: 'num', value: 7, sign: -1 },
    });
    expect(move('x + 4 = 9', 'x + 4 − 4 = 5')).toMatchObject({ kind: 'add-both' });
    expect(move('2x + 7 = 25', '3x + 7 = x + 25')).toEqual({
      kind: 'add-both',
      term: { kind: 'x', coef: 1, sign: 1 },
    });
    expect(move('x : 3 = 5', 'x : 3 + x : 3 = 5 + x : 3')).toEqual({
      kind: 'add-both',
      term: { kind: 'x', coef: 1, sign: 1, divisor: 3 },
    });
  });

  it('sees a piece moved across: the weight leaves, a float appears opposite', () => {
    expect(move('2x + 7 = 25', '2x = 25 − 7')).toEqual({
      kind: 'move-across',
      term: { kind: 'num', value: 7, sign: 1 },
    });
    expect(move('x − 6 = 8', 'x = 8 + 6')).toEqual({
      kind: 'move-across',
      term: { kind: 'num', value: 6, sign: -1 },
    });
    expect(move('20 − x = 6', '20 = 6 + x')).toEqual({
      kind: 'move-across',
      term: { kind: 'x', coef: 1, sign: -1 },
    });
    expect(move('25 = 2x + 7', '25 − 7 = 2x')).toEqual({
      kind: 'move-across',
      term: { kind: 'num', value: 7, sign: 1 },
    });
  });

  it('sees the splitter', () => {
    expect(move('2x = 18', 'x = 9')).toEqual({ kind: 'split-both', parts: 2 });
    expect(move('2x = 18', 'x = 18 : 2')).toEqual({ kind: 'split-both', parts: 2 });
    expect(move('3x = 12', 'x = 12 : 3')).toEqual({ kind: 'split-both', parts: 3 });
    expect(move('4x + 8 = 20', '2x + 4 = 10')).toEqual({ kind: 'split-both', parts: 2 });
  });

  it('sees a side evaluated', () => {
    expect(move('2x = 25 − 7', '2x = 18')).toEqual({ kind: 'evaluate', side: 'right' });
    expect(move('x + 2 · 3 = 10', 'x + 6 = 10')).toEqual({ kind: 'evaluate', side: 'left' });
  });

  it('sees nothing changed up to commuted terms, and swapped sides', () => {
    expect(move('2x + 7 = 25', '7 + 2x = 25')).toEqual({ kind: 'none' });
    expect(move('3x = 12', 'x · 3 = 12')).toEqual({ kind: 'none' });
    expect(move('2x + 7 = 25', '25 = 2x + 7')).toEqual({ kind: 'swap' });
  });

  it('calls everything else compound', () => {
    expect(move('2x + 7 = 25', 'x = 18 : 2')).toEqual({ kind: 'compound' }); // skipped steps
    expect(move('x : 3 = 5', 'x = 15')).toEqual({ kind: 'compound' }); // both sides multiplied
    expect(move('2x = 18', '4x = 36')).toEqual({ kind: 'compound' });
    expect(move('2x = 18', '2x + 1 : 2 = 18 + 1 : 2')).toEqual({ kind: 'compound' }); // half a weight
    expect(move('2x + 7 = 25', '20 − 6 = x · x')).toEqual({ kind: 'compound' }); // not linear
  });
});
