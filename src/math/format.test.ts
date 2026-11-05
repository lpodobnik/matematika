import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { AssertionError } from '@/lib/assert';
import {
  add,
  type BinaryKind,
  div,
  type Equation,
  type Expr,
  maxNumber,
  mul,
  num,
  sub,
  xVar,
} from '@/math/expr';
import {
  formatEquation,
  formatExpr,
  formatLine,
  formatNumber,
  formatTokens,
  thousandsSeparator,
} from '@/math/format';
import { solve } from '@/math/linear';
import { parse } from '@/math/parse';
import * as q from '@/math/rational';
import { BLANK, blankOutX, fillBlanks, type LineToken, TOKENS, tokenize } from '@/math/tokens';

const x = xVar();

function reformat(text: string): string {
  const result = parse(text);
  if (!result.ok) throw new Error(`"${text}" did not parse: ${result.reason}`);
  return formatEquation(result.equation);
}

describe('formatNumber', () => {
  it('separates thousands from 1 000 with U+202F', () => {
    expect(thousandsSeparator).toBe('\u202f');
    expect(formatNumber(5905)).toBe('5\u202f905');
    expect(formatNumber(1000)).toBe('1\u202f000');
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(maxNumber)).toBe('9\u202f999\u202f999');
    expect(formatNumber(9_999_999n ** 2n)).toBe('99\u202f999\u202f980\u202f000\u202f001');
  });

  it('writes a negative number with −, U+2212', () => {
    expect(formatNumber(-5905)).toBe('−5\u202f905');
  });

  it('refuses a number that is not whole', () => {
    expect(() => formatNumber(1.5)).toThrow(AssertionError);
  });
});

describe('formatEquation', () => {
  it('writes ·, :, − and 3x in school notation', () => {
    expect(formatExpr(mul(num(2), num(9)))).toBe('2 · 9');
    expect(formatExpr(div(x, num(3)))).toBe('x : 3');
    expect(formatExpr(sub(num(20), x))).toBe('20 − x');
    expect(formatExpr(mul(num(3), x))).toBe('3x');
    expect(formatEquation({ left: add(mul(num(2), x), num(7)), right: num(25) })).toBe(
      '2x + 7 = 25',
    );
  });

  it('uses exactly U+00B7 for times and U+2212 for minus', () => {
    expect(formatExpr(mul(num(2), num(9))).codePointAt(2)).toBe(0x00b7);
    expect(formatExpr(sub(num(20), x)).codePointAt(3)).toBe(0x2212);
    expect(formatNumber(5905).codePointAt(1)).toBe(0x202f);
  });

  it('writes 3 · x as 3x, and x · 3 as it is', () => {
    expect(reformat('3 · x = 6')).toBe('3x = 6');
    expect(reformat('x · 3 = 6')).toBe('x · 3 = 6');
  });

  it('writes the story lines back as they are written', () => {
    for (const text of [
      '2x + 7 = 25',
      'x : 3 = 5',
      '20 − x = 6',
      '2 · 9 + 7 = 25',
      '9 = x',
      '5\u202f905 − 27x = 316',
    ]) {
      expect(reformat(text)).toBe(text);
    }
    expect(reformat('5905-27x=316')).toBe('5\u202f905 − 27x = 316');
  });

  it('writes brackets only where they are needed', () => {
    expect(reformat('2 · (x + 3) = 10')).toBe('2 · (x + 3) = 10');
    expect(reformat('(2 · x) + 3 = 10')).toBe('2x + 3 = 10');
    expect(reformat('(20 − 5) − 3 = x')).toBe('20 − 5 − 3 = x');
    expect(reformat('20 − (5 − 3) = x')).toBe('20 − (5 − 3) = x');
    expect(reformat('20 + (5 − 3) = x')).toBe('20 + (5 − 3) = x');
    expect(reformat('12 : (2 · 3) = x')).toBe('12 : (2 · 3) = x');
    expect(reformat('(x + 1) : 2 = 4')).toBe('(x + 1) : 2 = 4');
    expect(reformat('12 : 3x = 1')).toBe('12 : 3x = 1');
    expect(reformat('2 · 3x = 6')).toBe('2 · 3x = 6');
    expect(reformat('((x)) = 2')).toBe('x = 2');
  });

  it('writes 1 200x with the separator inside the coefficient', () => {
    expect(formatExpr(mul(num(1200), x))).toBe('1\u202f200x');
  });
});

// Random trees of every shape, so that every bracket rule is exercised.
const exprArb: fc.Arbitrary<Expr> = fc.letrec<{ expr: Expr }>((tie) => ({
  expr: fc.oneof(
    { maxDepth: 3, depthSize: 'small' },
    fc
      .oneof(fc.integer({ min: 0, max: 99 }), fc.integer({ min: 0, max: maxNumber }))
      .map((v): Expr => ({ k: 'num', v })),
    fc.constant<Expr>({ k: 'x' }),
    fc
      .tuple(fc.constantFrom<BinaryKind>('add', 'sub', 'mul', 'div'), tie('expr'), tie('expr'))
      .map(([k, l, r]): Expr => ({ k, l, r })),
  ),
})).expr;

describe('format and parse round-trip (fast-check)', () => {
  it('round-trips ax + b = c with a whole-number solution, and solve returns it', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 99 }),
        fc.integer({ min: 0, max: 9999 }),
        fc.integer({ min: 0, max: 9999 }),
        (a, solution, b) => {
          const equation: Equation = {
            left: add(a === 1 ? x : mul(num(a), x), num(b)),
            right: num(a * solution + b),
          };
          const parsed = parse(formatEquation(equation));
          expect(parsed).toEqual({ ok: true, equation });
          if (parsed.ok) {
            expect(solve(parsed.equation)).toEqual({ kind: 'one', x: q.rational(solution) });
          }
        },
      ),
      { numRuns: 1000 },
    );
  });

  it('round-trips any equation tree', () => {
    fc.assert(
      fc.property(exprArb, exprArb, (left, right) => {
        const equation: Equation = { left, right };
        expect(parse(formatEquation(equation))).toEqual({ ok: true, equation });
      }),
      { numRuns: 1000 },
    );
  });
});

describe('formatTokens', () => {
  const typed = (text: string): string => {
    const result = tokenize(text);
    if (!result.ok) throw new Error(`"${text}" has a symbol that isn't on the pad`);
    return formatTokens(result.tokens);
  };

  it('writes a line typed without spaces in school notation', () => {
    expect(typed('2x+7=25')).toBe('2x + 7 = 25');
    expect(typed('2*9+7=25')).toBe('2 · 9 + 7 = 25');
    expect(typed('x=18/2')).toBe('x = 18 : 2');
    expect(typed('20-x=6')).toBe('20 − x = 6');
    expect(typed('2*(x+3)=10')).toBe('2 · (x + 3) = 10');
  });

  it('groups thousands as he types: 5905 shows as 5 905', () => {
    expect(typed('5')).toBe('5');
    expect(typed('59')).toBe('59');
    expect(typed('590')).toBe('590');
    expect(typed('5905')).toBe('5 905');
    expect(typed('5905-27x=316')).toBe('5 905 − 27x = 316');
    expect(typed('1200x=9999999')).toBe('1 200x = 9 999 999');
  });

  it('keeps leading zeros as typed', () => {
    expect(typed('x=009')).toBe('x = 009');
    expect(typed('x=0009')).toBe('x = 0 009');
  });

  it('shows a line that is not finished yet, or never parses, as typed', () => {
    expect(formatTokens([])).toBe('');
    expect(typed('2x+')).toBe('2x +');
    expect(typed('2x=')).toBe('2x =');
    expect(typed('=')).toBe('=');
    expect(typed('-x=14')).toBe('−x = 14');
    expect(typed('2*-3=x')).toBe('2 · −3 = x');
    expect(typed('(-5)')).toBe('(−5)');
    expect(typed('(2+)')).toBe('(2 +)');
    expect(typed('x3=12')).toBe('x3 = 12');
    expect(typed('2(x+1)')).toBe('2(x + 1)');
    expect(typed('(x)(2)')).toBe('(x)(2)');
    expect(typed('x==')).toBe('x = =');
  });

  it('uses only the school signs and U+202F', () => {
    expect(typed('5905*2-1:3')).toBe('5 905 · 2 − 1 : 3');
    expect([...typed('1000-1*1')].filter((c) => /[-*/]/.test(c))).toEqual([]);
  });

  it('gives the same text as formatEquation for any equation (fast-check)', () => {
    fc.assert(
      fc.property(exprArb, exprArb, (left, right) => {
        const text = formatEquation({ left, right });
        expect(typed(text)).toBe(text);
      }),
      { numRuns: 1000 },
    );
  });

  it('writes text that reads back as the same tokens (fast-check)', () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom(...TOKENS), { maxLength: 40 }), (tokens) => {
        expect(tokenize(formatTokens(tokens))).toEqual({ ok: true, tokens });
      }),
      { numRuns: 1000 },
    );
  });
});

describe('formatLine (story 1.7)', () => {
  const line = (text: string): LineToken[] => {
    const result = tokenize(text);
    if (!result.ok) throw new Error(text);
    return blankOutX(result.tokens);
  };

  it('writes x = ☐ as its text and a blank, with the blank filled so far', () => {
    const answer: LineToken[] = ['x', '=', BLANK];
    expect(formatLine(answer)).toEqual([
      { kind: 'text', text: 'x = ' },
      { kind: 'blank', text: '' },
    ]);
    expect(formatLine(answer, ['5', '9', '0', '5'])).toEqual([
      { kind: 'text', text: 'x = ' },
      { kind: 'blank', text: '5 905' },
    ]);
  });

  it('writes the check line with x blanked in school notation', () => {
    expect(formatLine(line('x + 4 = 9'))).toEqual([
      { kind: 'blank', text: '' },
      { kind: 'text', text: ' + 4 = 9' },
    ]);
    expect(formatLine(line('3x = 12'))).toEqual([
      { kind: 'text', text: '3 · ' },
      { kind: 'blank', text: '' },
      { kind: 'text', text: ' = 12' },
    ]);
    expect(formatLine(line('5905 − 27x = 316'), ['2', '0', '7'])).toEqual([
      { kind: 'text', text: '5 905 − 27 · ' },
      { kind: 'blank', text: '207' },
      { kind: 'text', text: ' = 316' },
    ]);
    expect(formatLine(line('2(x + 1) = 8'))).toEqual([
      { kind: 'text', text: '2(' },
      { kind: 'blank', text: '' },
      { kind: 'text', text: ' + 1) = 8' },
    ]);
  });

  it('is one text segment, the same as formatTokens, for a line with no blank', () => {
    expect(formatLine([])).toEqual([]);
    expect(formatLine(['2', 'x', '+', '7', '=', '2', '5'])).toEqual([
      { kind: 'text', text: '2x + 7 = 25' },
    ]);
  });

  it('shows a filled line as the line itself would show (fast-check)', () => {
    // As blankOutX writes them: a blank never touches a digit or another blank, so the
    // filled number is grouped on its own.
    const touchesDigit = (line: readonly LineToken[]) =>
      line.some(
        (token, i) =>
          token === BLANK &&
          [line[i - 1], line[i + 1]].some((t) => t !== undefined && /\d|☐/.test(t)),
      );
    const lineArb = fc
      .array(fc.constantFrom<LineToken>(...TOKENS, BLANK), { maxLength: 20 })
      .filter((line) => !touchesDigit(line));
    const fillArb = fc.array(fc.constantFrom(...'0123456789'), { minLength: 1, maxLength: 7 });
    fc.assert(
      fc.property(lineArb, fillArb, (template, digits) => {
        const fill = digits as (typeof TOKENS)[number][];
        const text = formatLine(template, fill)
          .map((segment) => segment.text)
          .join('');
        expect(text).toBe(formatTokens(fillBlanks(template, fill)));
      }),
      { numRuns: 1000 },
    );
  });
});
