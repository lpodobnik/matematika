import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { add, div, type Equation, mul, num, sub, xVar } from '@/math/expr';
import { maxTokens, type ParseFailure, parse, parseExpr } from '@/math/parse';
import { TOKENS, type Token } from '@/math/tokens';

function equation(text: string): Equation {
  const result = parse(text);
  if (!result.ok) throw new Error(`"${text}" did not parse: ${result.reason}`);
  return result.equation;
}

const x = xVar();

describe('parse: the story lines', () => {
  it.each<[string, Equation]>([
    ['2x + 7 = 25', { left: add(mul(num(2), x), num(7)), right: num(25) }],
    ['x : 3 = 5', { left: div(x, num(3)), right: num(5) }],
    ['20 − x = 6', { left: sub(num(20), x), right: num(6) }],
    ['2 · 9 + 7 = 25', { left: add(mul(num(2), num(9)), num(7)), right: num(25) }],
    ['9 = x', { left: num(9), right: x }],
    ['5 905 − 27x = 316', { left: sub(num(5905), mul(num(27), x)), right: num(316) }],
  ])('%s parses', (text, expected) => {
    expect(parse(text)).toEqual({ ok: true, equation: expected });
  });

  it.each<[string, ParseFailure]>([
    ['2x + = 25', 'missing-operand'],
    ['= 9', 'empty-side'],
    ['x =', 'empty-side'],
    ['−x = 14', 'leading-minus'],
    ['2x = 25 − 7 = 18', 'too-many-equals'],
    ['x3 = 12', 'digit-after-x'],
    ['x = 10 000 000', 'number-too-big'],
  ])('%s does not parse (%s)', (text, reason) => {
    expect(parse(text)).toEqual({ ok: false, reason });
  });

  it('parses number-pad tokens the same as text', () => {
    const tokens: Token[] = ['2', 'x', '+', '7', '=', '2', '5'];
    expect(parse(tokens)).toEqual(parse('2x + 7 = 25'));
    expect(parse(['x', '3', '=', '1', '2'])).toEqual({ ok: false, reason: 'digit-after-x' });
  });
});

describe('parse: reading', () => {
  it('reads 3x and 3 · x as the same multiplication', () => {
    expect(equation('3x = 6').left).toEqual(mul(num(3), x));
    expect(equation('3 · x = 6')).toEqual(equation('3x = 6'));
  });

  it('reads : as division', () => {
    expect(equation('18 : 2 = x').left).toEqual(div(num(18), num(2)));
  });

  it('groups with brackets, and otherwise puts · and : before + and −, from the left', () => {
    expect(equation('2 · (x + 3) = 10').left).toEqual(mul(num(2), add(x, num(3))));
    expect(equation('2 · x + 3 = 10').left).toEqual(add(mul(num(2), x), num(3)));
    expect(equation('20 − (5 + 3) = x').left).toEqual(sub(num(20), add(num(5), num(3))));
    expect(equation('20 − 5 − 3 = x').left).toEqual(sub(sub(num(20), num(5)), num(3)));
    expect(equation('12 : 2 · 3 = x').left).toEqual(mul(div(num(12), num(2)), num(3)));
    expect(equation('2 + 3 · 4 = x').left).toEqual(add(num(2), mul(num(3), num(4))));
    expect(equation('((x)) = 2').left).toEqual(x);
  });

  it('reads 3x as one factor', () => {
    expect(equation('12 : 3x = 1').left).toEqual(div(num(12), mul(num(3), x)));
    expect(equation('2 · 3x = 6').left).toEqual(mul(num(2), mul(num(3), x)));
  });

  it('ignores spaces, including the thousands separator', () => {
    const expected = equation('2x + 7 = 25');
    for (const text of ['2x+7=25', ' 2 x + 7 = 2 5 ', '2x\t+\n7 = 25', '2x + 7 =\u00a025']) {
      expect(equation(text), text).toEqual(expected);
    }
    expect(equation('5\u202f905 − 27x = 316')).toEqual(equation('5905 − 27x = 316'));
  });

  it('accepts the keyboard stand-ins *, /, - and X', () => {
    expect(equation('2*X - 6/3 = 5')).toEqual(equation('2 · x − 6 : 3 = 5'));
  });

  it('allows leading zeros and numbers up to 9 999 999', () => {
    expect(equation('x = 007').right).toEqual(num(7));
    expect(equation('x = 0').right).toEqual(num(0));
    expect(equation('x = 9 999 999').right).toEqual(num(9_999_999));
    expect(equation('x = 0 009 999 999').right).toEqual(num(9_999_999));
  });

  it('parses lines that only later steps refuse: x · x, 18 : x and 18 : 0', () => {
    for (const text of ['x · x = 4', '18 : x = 2', 'x = 18 : 0']) {
      expect(parse(text).ok, text).toBe(true);
    }
  });
});

describe('parse: refusals', () => {
  it.each<[string, ParseFailure]>([
    ['2x + 7', 'no-equals'],
    ['', 'no-equals'],
    ['=', 'empty-side'],
    ['x = 9 =', 'too-many-equals'],
    ['2y = 4', 'unknown-symbol'],
    ['+x = 3', 'missing-operand'],
    ['2x + 7 + = 25', 'missing-operand'],
    ['x · = 4', 'missing-operand'],
    ['() = 3', 'missing-operand'],
    ['2 · −3 = x', 'leading-minus'],
    ['20 − −x = 6', 'leading-minus'],
    ['2(x + 1) = 8', 'missing-operator'],
    ['(x + 1)2 = 8', 'missing-operator'],
    ['x x = 4', 'missing-operator'],
    ['2xx = 4', 'missing-operator'],
    ['(x)(2) = 4', 'missing-operator'],
    ['2x2 = 4', 'digit-after-x'],
    ['(x + 1 = 3', 'unbalanced-brackets'],
    ['x + 1) = 3', 'unbalanced-brackets'],
    ['x = 99 999 999 999 999 999 999', 'number-too-big'],
  ])('%s: %s', (text, reason) => {
    expect(parse(text)).toEqual({ ok: false, reason });
  });

  it('refuses lines longer than any notebook line without going deep', () => {
    expect(parse('('.repeat(100_000))).toEqual({ ok: false, reason: 'too-long' });
    // n ones make 2n − 1 tokens, so `${sum}=x` has 2n + 1: just within the limit.
    const sum = Array.from({ length: Math.floor((maxTokens - 1) / 2) }, () => '1').join('+');
    expect(parse(`${sum}=x`).ok).toBe(true);
    expect(parse(`${sum}+1=x`)).toEqual({ ok: false, reason: 'too-long' });
  });

  it('never throws on any sequence of pad tokens', () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom(...TOKENS), { maxLength: 40 }), (tokens) => {
        const result = parse(tokens);
        expect(typeof result.ok).toBe('boolean');
      }),
      { numRuns: 2000 },
    );
  });

  it('never throws on any text', () => {
    const padText = fc.string({
      unit: fc.constantFrom(...TOKENS, ' ', '\u202f', '-', '*', '/', 'X', 'a'),
      maxLength: 40,
    });
    fc.assert(
      fc.property(fc.oneof(padText, fc.string({ unit: 'binary' })), (text) => {
        expect(typeof parse(text).ok).toBe('boolean');
        expect(typeof parseExpr(text).ok).toBe('boolean');
      }),
      { numRuns: 2000 },
    );
    // Many random lines: it needs longer on a busy machine, and a timeout here stops a deploy.
  }, 30_000);
});

describe('parseExpr', () => {
  it('parses one side', () => {
    expect(parseExpr('2x + 7')).toEqual({ ok: true, expr: add(mul(num(2), x), num(7)) });
  });

  it('refuses a whole equation or an empty side', () => {
    expect(parseExpr('2x = 7')).toEqual({ ok: false, reason: 'too-many-equals' });
    expect(parseExpr('')).toEqual({ ok: false, reason: 'empty-side' });
  });
});
