import { describe, expect, it } from 'vitest';
import { AssertionError } from '@/lib/assert';
import {
  add,
  type Equation,
  type Expr,
  equationHasX,
  hasX,
  maxNumber,
  mul,
  num,
  sameEquation,
  sameExpr,
  substitute,
  substituteEquation,
  xVar,
} from '@/math/expr';
import { parse, parseExpr } from '@/math/parse';

function side(text: string): Expr {
  const result = parseExpr(text);
  if (!result.ok) throw new Error(`"${text}" did not parse: ${result.reason}`);
  return result.expr;
}

function equation(text: string): Equation {
  const result = parse(text);
  if (!result.ok) throw new Error(`"${text}" did not parse: ${result.reason}`);
  return result.equation;
}

describe('expr: building', () => {
  it('builds number literals from 0 to 9 999 999 only', () => {
    expect(num(0)).toEqual({ k: 'num', v: 0 });
    expect(num(maxNumber)).toEqual({ k: 'num', v: 9_999_999 });
    for (const bad of [-1, 1.5, maxNumber + 1, Number.NaN]) {
      expect(() => num(bad), String(bad)).toThrow(AssertionError);
    }
  });

  it('knows whether x appears', () => {
    expect(hasX(side('2 · 9 + 7'))).toBe(false);
    expect(hasX(side('2 · 9 + 7 : x'))).toBe(true);
    expect(equationHasX(equation('25 = 25'))).toBe(false);
    expect(equationHasX(equation('25 = x'))).toBe(true);
  });
});

describe('expr: substitute', () => {
  it('puts a whole number in for x, as in the check line', () => {
    expect(substitute(side('2x + 7'), 9)).toEqual(add(mul(num(2), num(9)), num(7)));
    expect(substituteEquation(equation('2x + 7 = 25'), 9)).toEqual(equation('2 · 9 + 7 = 25'));
    expect(substitute(side('x : 3 + x'), 15)).toEqual(side('15 : 3 + 15'));
  });

  it('leaves an expression without x alone', () => {
    const expr = side('18 : 2');
    expect(substitute(expr, 4)).toEqual(expr);
  });

  it('refuses a value that is not a number literal', () => {
    expect(() => substitute(xVar(), -1)).toThrow(AssertionError);
    expect(() => substitute(xVar(), 3.5)).toThrow(AssertionError);
  });
});

describe('expr: structural comparison', () => {
  it.each([
    ['2 · 9 + 7', '9 · 2 + 7'],
    ['2 · 9 + 7', '7 + 2 · 9'],
    ['2 · 9 + 7', '7 + 9 · 2'],
    ['2x', '2 · x'],
    ['2x', 'x · 2'],
    ['20 − 5 − 3', '20 − 3 − 5'],
    ['20 − 5 + 3', '20 + 3 − 5'],
    ['2 · 3 · x', 'x · 3 · 2'],
    ['(2 + 3) · x', 'x · (3 + 2)'],
    ['5 905 − 27 · 207', '5905 − 207 · 27'],
  ])('%s is the same as %s', (a, b) => {
    expect(sameExpr(side(a), side(b))).toBe(true);
  });

  it.each([
    ['25', '18 + 7'],
    ['20 − x', 'x − 20'],
    ['x : 3', '3 : x'],
    ['20 − (5 − 3)', '20 − 5 + 3'],
    ['2 · 9 + 7', '2 · 9 + 8'],
    ['2x + 7', '2x · 7'],
  ])('%s is not the same as %s', (a, b) => {
    expect(sameExpr(side(a), side(b))).toBe(false);
  });

  it('compares equations up to commuted terms and swapped sides', () => {
    const check = equation('2 · 9 + 7 = 25');
    expect(sameEquation(check, equation('9 · 2 + 7 = 25'))).toBe(true);
    expect(sameEquation(check, equation('25 = 7 + 2 · 9'))).toBe(true);
    expect(sameEquation(check, equation('25 = 25'))).toBe(false);
    expect(sameEquation(check, equation('2 · 9 = 25 − 7'))).toBe(false);
    expect(sameEquation(equation('2x + 7 = 25'), equation('7 + 2x = 25'))).toBe(true);
  });
});
