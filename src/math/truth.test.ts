import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { formatStatementLine } from '@/math/format';
import { parse } from '@/math/parse';
import { parseStatement } from '@/math/statement';
import {
  fillLine,
  readLine,
  readTokens,
  STATEMENT_TOKENS,
  type SToken,
} from '@/math/statement-tokens';
import { statementTable } from '@/math/statements.table';
import { TOKENS } from '@/math/tokens';
import { isTrue, lineValue, roundAt } from '@/math/truth';

describe('the statement table', () => {
  it.each(statementTable.map((row) => [row.line, row.verdict, row] as const))(
    '%s is %s',
    (line, verdict, row) => {
      const tokens = readTokens(line);
      expect(tokens, 'the notebook can write it').not.toBeNull();
      const parsed = parseStatement(tokens ?? []);
      if (verdict === 'refused') {
        expect(parsed.ok).toBe(false);
        return;
      }
      expect(parsed.ok).toBe(true);
      if (parsed.ok) expect(isTrue(parsed.statement, row.context)).toBe(verdict === 'true');
    },
  );

  it('holds a true, a false and a refused row for the main forms', () => {
    const verdicts = (sign: string) =>
      new Set(statementTable.filter((r) => r.line.includes(sign)).map((r) => r.verdict));
    for (const sign of ['∈', '≈', 'ost.', 'x̄', '=']) {
      expect([...verdicts(sign)].sort(), sign).toEqual(['false', 'refused', 'true']);
    }
  });
});

describe('parsing', () => {
  it('never throws, whatever is typed', () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom(...STATEMENT_TOKENS), { maxLength: 30 }), (tokens) => {
        const parsed = parseStatement(tokens);
        if (parsed.ok) isTrue(parsed.statement);
      }),
      { numRuns: 3000 },
    );
  });

  it('never throws on lines close to right', () => {
    const lines = statementTable.flatMap((row) => readTokens(row.line) ?? []);
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...new Set(lines)), { maxLength: 20 }),
        (tokens: SToken[]) => {
          parseStatement(tokens);
        },
      ),
    );
  });

  it('keeps the bracket he wrote', () => {
    const parsed = parseStatement(readTokens('[1 + 2] · 3 = 9') ?? []);
    expect(parsed.ok && parsed.statement.k === 'sum' && parsed.statement.sides[0]).toMatchObject({
      k: 'mul',
      l: { k: 'group', kind: 'square' },
    });
  });

  it('leaves the rooms as they were: none of the new forms read there', () => {
    expect(TOKENS).toHaveLength(18);
    for (const line of ['0 ∉ N', '230 < x < 240', '334 ≈ 330', '100 : 7 = 14 ost. 2', 'A = 25']) {
      expect(parse(line).ok, line).toBe(false);
    }
  });
});

describe('truth', () => {
  it('rounds with the next digit alone', () => {
    expect(roundAt(18_499_000, 1_000_000)).toBe(18_000_000);
    expect(roundAt(335, 10)).toBe(340);
    expect(roundAt(325, 100)).toBe(300);
  });

  it('carries a line’s value to the next', () => {
    const first = parseStatement(readTokens('100 − 20 · 3 + 10 : 2 = 100 − 60 + 5') ?? []);
    const value = first.ok ? lineValue(first.statement) : null;
    const next = parseStatement(readTokens('= 45') ?? []);
    expect(next.ok && isTrue(next.statement, { previous: value })).toBe(true);
  });

  it('any division with a remainder too big is false, whatever else fits', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 99 }), fc.nat(99), (divisor, quotient) => {
        const dividend = divisor * quotient + divisor;
        const line = `${dividend} : ${divisor} = ${quotient} ost. ${divisor}`;
        const parsed = parseStatement(readTokens(line) ?? []);
        expect(parsed.ok && isTrue(parsed.statement)).toBe(false);
      }),
    );
  });
});

describe('reading and writing a line', () => {
  it('fills a blank, or goes on from the end of a started line', () => {
    expect(fillLine(readLine('☐ ∉ N') ?? [], ['0'])).toEqual(['0', '∉', 'N']);
    expect(fillLine(readLine('7 =') ?? [], ['1', '5'])).toEqual(['7', '=', '1', '5']);
  });

  it('refuses what the notebook can’t write', () => {
    expect(readLine('7 % 2')).toBeNull();
    expect(readTokens('☐ = 2')).toBeNull();
  });

  it.each([
    ['7·2+1=15', '7 · 2 + 1 = 15'],
    ['0∉N', '0 ∉ N'],
    ['0∈N₀', '0 ∈ N₀'],
    ['100:7=14ost.2', '100 : 7 = 14 ost. 2'],
    ['10⁶=1000000', '10⁶ = 1 000 000'],
    ['230<x<240', '230 < x < 240'],
    ['{232,234}', '{232, 234}'],
    ['x̄=(6+14):2=10', 'x̄ = (6 + 14) : 2 = 10'],
    ['2·[3+(4−1)]=12', '2 · [3 + (4 − 1)] = 12'],
    ['=45', '= 45'],
    ['A=25', 'A = 25'],
  ])('writes %s as %s', (typed, written) => {
    const segments = formatStatementLine(readLine(typed) ?? []);
    expect(segments.map((segment) => segment.text).join('')).toBe(written);
  });

  it('writes a blank as a blank', () => {
    const segments = formatStatementLine(readLine('☐ ∉ N') ?? [], ['0']);
    expect(segments).toEqual([
      { kind: 'blank', text: '0' },
      { kind: 'text', text: ' ∉ N' },
    ]);
  });
});
