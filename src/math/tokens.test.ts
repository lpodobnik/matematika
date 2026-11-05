import { describe, expect, it } from 'vitest';
import { DIGITS, isDigit, TOKENS, tokenFromChar, tokenize } from '@/math/tokens';

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
