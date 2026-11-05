import { describe, expect, it } from 'vitest';
import {
  BLANK,
  blankOutX,
  DIGITS,
  fillBlanks,
  hasBlank,
  isDigit,
  TOKENS,
  type Token,
  tokenFromChar,
  tokenize,
} from '@/math/tokens';

function tokens(text: string): Token[] {
  const result = tokenize(text);
  if (!result.ok) throw new Error(text);
  return result.tokens;
}

describe('tokens', () => {
  it('has the number pad: digits, x, +, −, ·, :, = and brackets', () => {
    expect(TOKENS).toEqual([...DIGITS, 'x', '+', '−', '·', ':', '=', '(', ')']);
  });

  it('tells digits from other tokens', () => {
    expect(DIGITS.every(isDigit)).toBe(true);
    expect(TOKENS.filter((token) => !isDigit(token))).toHaveLength(8);
    expect(isDigit(undefined)).toBe(false);
  });

  it('maps the keyboard stand-ins: * to ·, / to :, - to −, X to x', () => {
    expect(['*', '/', '-', 'X'].map(tokenFromChar)).toEqual(['·', ':', '−', 'x']);
    for (const token of TOKENS) expect(tokenFromChar(token)).toBe(token);
  });

  it('has no token for letters other than x or for other signs', () => {
    for (const char of ['a', 'y', '×', '÷', '.', ',', '^', '≠', '–']) {
      expect(tokenFromChar(char), char).toBeNull();
    }
  });

  it('turns school notation into one token per key, dropping every kind of space', () => {
    expect(tokenize('5\u202f905 − 27x = 316')).toEqual({
      ok: true,
      tokens: ['5', '9', '0', '5', '−', '2', '7', 'x', '=', '3', '1', '6'],
    });
    expect(tokenize(' 2\tx\u00a0+ 7\n= 25 ')).toEqual(tokenize('2x+7=25'));
  });

  it('refuses text with a symbol the pad does not have', () => {
    expect(tokenize('2y = 4')).toEqual({ ok: false, reason: 'unknown-symbol' });
    expect(tokenize('2,5 = x')).toEqual({ ok: false, reason: 'unknown-symbol' });
  });
});

describe('blanks (story 1.7)', () => {
  it('is not a pad key, nor a symbol he can type', () => {
    expect(TOKENS).not.toContain(BLANK);
    expect(tokenFromChar(BLANK)).toBeNull();
  });

  it('blanks out every x, writing the times sign a number before x stood for', () => {
    expect(blankOutX(tokens('x + 4 = 9'))).toEqual([BLANK, '+', '4', '=', '9']);
    expect(blankOutX(tokens('3x = 12'))).toEqual(['3', '·', BLANK, '=', '1', '2']);
    expect(blankOutX(tokens('x : 3 = 5'))).toEqual([BLANK, ':', '3', '=', '5']);
    expect(blankOutX(tokens('20 − x = 6'))).toEqual(['2', '0', '−', BLANK, '=', '6']);
    expect(blankOutX(tokens('2(x + 1) = 8'))).toEqual(['2', '(', BLANK, '+', '1', ')', '=', '8']);
    expect(blankOutX(tokens('(x + 1)x = 8'))).toEqual([
      '(',
      BLANK,
      '+',
      '1',
      ')',
      '·',
      BLANK,
      '=',
      '8',
    ]);
  });

  it('fills every blank with the same value, or leaves a gap while it is empty', () => {
    const check = blankOutX(tokens('3x = 12'));
    expect(fillBlanks(check, ['4'])).toEqual(tokens('3 · 4 = 12'));
    expect(fillBlanks(check, ['1', '5'])).toEqual(tokens('3 · 15 = 12'));
    expect(fillBlanks(check, [])).toEqual(tokens('3 · = 12'));
    expect(fillBlanks(tokens('2x = 18'), ['9'])).toEqual(tokens('2x = 18'));
  });

  it('tells a line with a blank from one without', () => {
    expect(hasBlank(blankOutX(tokens('x + 4 = 9')))).toBe(true);
    expect(hasBlank(tokens('5 + 4 = 9'))).toBe(false);
  });
});
