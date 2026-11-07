import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { check } from '@/math/check';
import { add, type Equation, type Expr, mul, num, sub, xVar } from '@/math/expr';
import { formatEquation } from '@/math/format';
import { classifyMove } from '@/math/moves';
import { parse } from '@/math/parse';
import { canonicalSolution, nextStep, type StepWay } from '@/math/steps';

function equation(text: string): Equation {
  const result = parse(text);
  if (!result.ok) throw new Error(`"${text}" did not parse: ${result.reason}`);
  return result.equation;
}

function next(stage: string, current: string, way: StepWay): string | null {
  const step = nextStep(equation(stage), equation(current), way);
  return step === null ? null : formatEquation(step);
}

function solution(stage: string, way: StepWay): string[] | null {
  return canonicalSolution(equation(stage), way)?.map(formatEquation) ?? null;
}

describe('nextStep', () => {
  it('Balance for 2x + 5 = 23: 2x = 18, then x = 9, then the check line', () => {
    const stage = '2x + 5 = 23';
    expect(next(stage, stage, 'balance')).toBe('2x = 18');
    expect(next(stage, '2x = 18', 'balance')).toBe('x = 9');
    expect(next(stage, 'x = 9', 'balance')).toBe('2 · 9 + 5 = 23');
    expect(next(stage, '2 · 9 + 5 = 23', 'balance')).toBeNull();
  });

  it('Try values writes x = n from wherever he is, then the check line', () => {
    const stage = '2x + 7 = 25';
    expect(next(stage, stage, 'try')).toBe('x = 9');
    expect(next(stage, '2x = 18', 'try')).toBe('x = 9');
    expect(next(stage, 'x = 18 : 2', 'try')).toBe('x = 9');
    expect(next(stage, 'x = 9', 'try')).toBe('2 · 9 + 7 = 25');
    expect(next(stage, '9 = x', 'try')).toBe('2 · 9 + 7 = 25');
    expect(next(stage, '2 · 9 + 7 = 25', 'try')).toBeNull();
  });

  it('Balance combines the pans first, so a typed 2x = 23 − 5 splits to x = 9', () => {
    expect(next('2x + 5 = 23', '2x = 23 − 5', 'balance')).toBe('x = 9');
  });

  it('Balance takes a subtracted number off with a weight', () => {
    expect(next('x − 6 = 8', 'x − 6 = 8', 'balance')).toBe('x = 14');
  });

  it('Balance keeps x on the side it is on', () => {
    const stage = '25 = 2x + 7';
    expect(solution(stage, 'balance')).toEqual(['18 = 2x', '9 = x', '25 = 2 · 9 + 7']);
  });

  it('Balance stops where the tray has no piece for it', () => {
    expect(next('20 − x = 6', '20 − x = 6', 'balance')).toBeNull(); // a spring
    expect(next('x : 3 = 5', 'x : 3 = 5', 'balance')).toBeNull(); // a divider
    expect(next('2x + 7 = 25', '2x + 7 = x + 16', 'balance')).toBeNull(); // x on both sides
  });
});

describe('canonicalSolution for rooms 1–4', () => {
  it.each([
    ['x + 4 = 9', 'try', ['x = 5', '5 + 4 = 9']],
    ['x + 4 = 9', 'balance', ['x = 5', '5 + 4 = 9']],
    ['3x = 12', 'try', ['x = 4', '3 · 4 = 12']],
    ['3x = 12', 'balance', ['x = 4', '3 · 4 = 12']],
    ['x : 3 = 5', 'try', ['x = 15', '15 : 3 = 5']],
    ['x : 3 = 5', 'balance', null],
    ['x − 6 = 8', 'try', ['x = 14', '14 − 6 = 8']],
    ['x − 6 = 8', 'balance', ['x = 14', '14 − 6 = 8']],
    ['20 − x = 6', 'try', ['x = 14', '20 − 14 = 6']],
    ['20 − x = 6', 'balance', null],
    ['2x + 5 = 23', 'try', ['x = 9', '2 · 9 + 5 = 23']],
    ['2x + 5 = 23', 'balance', ['2x = 18', 'x = 9', '2 · 9 + 5 = 23']],
  ] as const)('%s by %s', (stage, way, expected) => {
    expect(solution(stage, way)).toEqual(expected);
  });
});

// Stages Balance can finish (x added, with any coefficient) and ones only Try values can.
function xTerm(a: number): Expr {
  return a === 1 ? xVar() : mul(num(a), xVar());
}

const balanceStage = fc
  .tuple(
    fc.integer({ min: 1, max: 99 }),
    fc.integer({ min: 0, max: 999 }),
    fc.integer({ min: 0, max: 9999 }),
    fc.boolean(),
  )
  .map(([a, s, b, plus]): Equation => {
    const taken = b % (a * s + 1);
    return plus
      ? { left: add(xTerm(a), num(b)), right: num(a * s + b) }
      : { left: sub(xTerm(a), num(taken)), right: num(a * s - taken) };
  });

const anyStage = fc.oneof(
  balanceStage,
  fc
    .tuple(fc.integer({ min: 1, max: 99 }), fc.integer({ min: 0, max: 999 }), fc.nat(9999))
    .map(([a, s, c]): Equation => ({ left: sub(num(a * s + c), xTerm(a)), right: num(c) })),
);

/** Checks every line in turn: valid lines, then the answer, then the check line. */
function accepted(stage: Equation, lines: readonly Equation[]): boolean {
  const committed = [stage];
  const kinds = lines.map((line) => {
    const verdict = check(committed, formatEquation(line));
    committed.push(line);
    return verdict.kind;
  });
  const last = kinds.length - 1;
  return (
    kinds[last] === 'check' &&
    kinds[last - 1] === 'answer' &&
    kinds.slice(0, -2).every((kind) => kind === 'valid')
  );
}

describe('canonical solutions pass the checker (fast-check)', () => {
  it('Try values finishes every stage', () => {
    fc.assert(
      fc.property(anyStage, (stage) => {
        const lines = canonicalSolution(stage, 'try');
        expect(lines).not.toBeNull();
        expect(accepted(stage, lines ?? [])).toBe(true);
      }),
      { numRuns: 500 },
    );
  });

  it('Balance finishes every stage with x added, one drop and one split at most', () => {
    fc.assert(
      fc.property(balanceStage, (stage) => {
        const lines = canonicalSolution(stage, 'balance');
        expect(lines).not.toBeNull();
        if (lines === null) return;
        expect(accepted(stage, lines)).toBe(true);
        expect(lines.length).toBeLessThanOrEqual(4);
        const moves = lines
          .slice(0, -1)
          .map((line, i) => classifyMove(lines[i - 1] ?? stage, line));
        for (const move of moves)
          expect(['add-both', 'split-both', 'evaluate']).toContain(move.kind);
      }),
      { numRuns: 500 },
    );
  });
});

describe('canonicalSolution for Undo (epic 4)', () => {
  it('runs the chain backward, writing each move and its result', () => {
    expect(solution('2x + 7 = 25', 'undo')).toEqual([
      '2x = 25 − 7',
      '2x = 18',
      'x = 18 : 2',
      'x = 9',
      '2 · 9 + 7 = 25',
    ]);
    expect(solution('135 − 5x = 100', 'undo')).toEqual([
      '5x = 135 − 100',
      '5x = 35',
      'x = 35 : 5',
      'x = 7',
      '135 − 5 · 7 = 100',
    ]);
  });

  it('gets stuck where x is not a chain', () => {
    expect(solution('2x + 1 = x + 5', 'undo')).toBeNull();
  });
});
