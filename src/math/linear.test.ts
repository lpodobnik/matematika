import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { add, type BinaryKind, div, type Expr, maxNumber, num, substitute } from '@/math/expr';
import { type LinearResult, type Solution, solve, toLinear, valueAt } from '@/math/linear';
import { parse, parseExpr } from '@/math/parse';
import * as q from '@/math/rational';

function side(text: string): Expr {
  const result = parseExpr(text);
  if (!result.ok) throw new Error(`"${text}" did not parse: ${result.reason}`);
  return result.expr;
}

function solveText(text: string): Solution {
  const result = parse(text);
  if (!result.ok) throw new Error(`"${text}" did not parse: ${result.reason}`);
  return solve(result.equation);
}

function linear(a: q.Rational, b: q.Rational): LinearResult {
  return { kind: 'linear', a, b };
}

// Random trees of every shape, small numbers (so 0 and division by zero come up) and big ones.
const exprArb: fc.Arbitrary<Expr> = fc.letrec<{ expr: Expr }>((tie) => ({
  expr: fc.oneof(
    { maxDepth: 4, depthSize: 'small' },
    fc
      .oneof(fc.integer({ min: 0, max: 12 }), fc.integer({ min: 0, max: maxNumber }))
      .map((v): Expr => ({ k: 'num', v })),
    fc.constant<Expr>({ k: 'x' }),
    fc
      .tuple(fc.constantFrom<BinaryKind>('add', 'sub', 'mul', 'div'), tie('expr'), tie('expr'))
      .map(([k, l, r]): Expr => ({ k, l, r })),
  ),
})).expr;

describe('toLinear', () => {
  it.each([
    ['2x + 7', q.rational(2), q.rational(7)],
    ['20 − x', q.rational(-1), q.rational(20)],
    ['x : 3', q.rational(1, 3), q.zero],
    ['2 · (x + 3)', q.rational(2), q.rational(6)],
    ['5 905 − 27x', q.rational(-27), q.rational(5905)],
    ['2 · 9 + 7', q.zero, q.rational(25)],
    ['0 · x', q.zero, q.zero],
    ['(x − x) · x', q.zero, q.zero],
    ['x : (2 + 3) · 10', q.rational(2), q.zero],
  ])('%s is exact', (text, a, b) => {
    expect(toLinear(side(text))).toEqual(linear(a, b));
  });

  it('reduces fractions: x : 4 + 6 : 4 is 1/4 · x + 3/2', () => {
    expect(toLinear(side('x : 4 + 6 : 4'))).toEqual({
      kind: 'linear',
      a: { n: 1n, d: 4n },
      b: { n: 3n, d: 2n },
    });
  });

  it('reports x · x and 18 : x as nonlinear', () => {
    for (const text of ['x · x', '18 : x', '2x · 3x', '18 : (x + 1)', '1 + x : x']) {
      expect(toLinear(side(text)), text).toEqual({ kind: 'nonlinear' });
    }
  });

  it('reports division by zero without throwing', () => {
    for (const text of ['18 : 0', 'x : (5 − 5)', '18 : (x − x)', '2 + 3 : (2 · 0)']) {
      expect(toLinear(side(text)), text).toEqual({ kind: 'division-by-zero' });
    }
  });

  it('reports division by zero over nonlinear, wherever each one is', () => {
    for (const text of [
      'x · x + 18 : 0',
      '18 : 0 + x · x',
      'x · x : 0',
      '18 : x : 0',
      'x · x : (x − x)',
      '(x · x) · (18 : 0)',
      '18 : x + 2 : (5 − 5)',
    ]) {
      expect(toLinear(side(text)), text).toEqual({ kind: 'division-by-zero' });
    }
  });

  it('lets division by zero win over any other side (fast-check)', () => {
    const byZero = div(num(18), num(0));
    fc.assert(
      fc.property(exprArb, (expr) => {
        for (const tree of [div(expr, num(0)), add(expr, byZero), add(byZero, expr)]) {
          expect(toLinear(tree)).toEqual({ kind: 'division-by-zero' });
        }
      }),
      { numRuns: 500 },
    );
  });

  it('keeps a chain of big products exact', () => {
    expect(toLinear(side('9 999 999 · 9 999 999 · 9 999 999'))).toEqual(
      linear(q.zero, q.rational(9_999_999n ** 3n)),
    );
    expect(toLinear(side('9 999 999 · 9 999 999 · 9 999 999 · x : 9 999 999'))).toEqual(
      linear(q.rational(9_999_999n ** 2n), q.zero),
    );
  });

  it('never throws, and agrees with putting a number in for x (fast-check)', () => {
    fc.assert(
      fc.property(exprArb, fc.integer({ min: 0, max: 50 }), (expr, x) => {
        const result = toLinear(expr);
        if (result.kind !== 'linear') return;
        // Linear means every divisor is a nonzero constant, so the substituted side is too.
        expect(toLinear(substitute(expr, x))).toEqual(
          linear(q.zero, valueAt(result, q.rational(x))),
        );
      }),
      { numRuns: 1000 },
    );
  });
});

describe('solve', () => {
  it.each([
    ['2x + 7 = 25', q.rational(9)],
    ['9 = x', q.rational(9)],
    ['x : 3 = 5', q.rational(15)],
    ['20 − x = 6', q.rational(14)],
    ['5 905 − 27x = 316', q.rational(207)],
    ['2x = 7', q.rational(7, 2)],
    ['2x + 5 = x + 9', q.rational(4)],
  ])('%s has one solution', (text, x) => {
    expect(solveText(text)).toEqual({ kind: 'one', x });
  });

  it('finds no solution for x + 1 = x + 2', () => {
    expect(solveText('x + 1 = x + 2')).toEqual({ kind: 'none' });
    expect(solveText('25 = 24')).toEqual({ kind: 'none' });
  });

  it('finds every number for 2x = 2x', () => {
    expect(solveText('2x = 2x')).toEqual({ kind: 'every' });
    expect(solveText('2 · 9 + 7 = 25')).toEqual({ kind: 'every' });
  });

  it('passes on nonlinear sides and division by zero', () => {
    expect(solveText('x · x = 4')).toEqual({ kind: 'nonlinear' });
    expect(solveText('x = 18 : 0')).toEqual({ kind: 'division-by-zero' });
  });

  it('reports division by zero over a nonlinear side, on either side', () => {
    for (const text of [
      'x · x = 18 : 0',
      '18 : 0 = x · x',
      'x · x + 18 : 0 = 4',
      'x · x : 0 = 4',
    ]) {
      expect(solveText(text), text).toEqual({ kind: 'division-by-zero' });
    }
  });

  it('lets division by zero on one side win over any other side (fast-check)', () => {
    const byZero = div(num(18), num(0));
    fc.assert(
      fc.property(exprArb, (expr) => {
        expect(solve({ left: expr, right: byZero })).toEqual({ kind: 'division-by-zero' });
        expect(solve({ left: byZero, right: expr })).toEqual({ kind: 'division-by-zero' });
      }),
      { numRuns: 500 },
    );
  });
});
