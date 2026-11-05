import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { AssertionError } from '@/lib/assert';
import {
  check,
  checkLineFor,
  isAnswerLine,
  isCheckLine,
  stageSolution,
  type Verdict,
} from '@/math/check';
import { add, div, type Equation, type Expr, mul, num, sub, xVar } from '@/math/expr';
import { formatEquation } from '@/math/format';
import { parse } from '@/math/parse';
import { TOKENS, type Token, tokenize } from '@/math/tokens';

function equation(text: string): Equation {
  const result = parse(text);
  if (!result.ok) throw new Error(`"${text}" did not parse: ${result.reason}`);
  return result.equation;
}

function lines(...texts: string[]): Equation[] {
  return texts.map(equation);
}

function tokens(text: string): Token[] {
  const result = tokenize(text);
  if (!result.ok) throw new Error(`"${text}" did not tokenize`);
  return result.tokens;
}

const stage = '2x + 7 = 25';

describe('stageSolution', () => {
  it('is the one whole-number solution', () => {
    expect(stageSolution(equation('2x + 7 = 25'))).toBe(9);
    expect(stageSolution(equation('20 − x = 6'))).toBe(14);
    expect(stageSolution(equation('x : 3 = 5'))).toBe(15);
    expect(stageSolution(equation('5 905 − 27x = 316'))).toBe(207);
  });

  it('treats a stage without one whole-number solution as a programmer error', () => {
    for (const text of ['x + 1 = x + 2', '2x = 2x', '2x = 3', 'x + 5 = 2', 'x · x = 4']) {
      expect(() => stageSolution(equation(text)), text).toThrow(AssertionError);
    }
  });
});

describe('check', () => {
  it('needs the stage equation as line 0', () => {
    expect(() => check([], 'x = 9')).toThrow(AssertionError);
  });

  it('judges pad tokens, text and an equation from the pans alike', () => {
    const committed = lines(stage);
    for (const line of ['2x = 18', 'x = 9', '2x = 32', 'x3 = 9', '18 : x = 2', '25 − 7 = 18']) {
      const fromText = check(committed, line);
      expect(check(committed, tokens(line)), line).toEqual(fromText);
      const parsed = parse(line);
      if (parsed.ok) expect(check(committed, parsed.equation), line).toEqual(fromText);
    }
  });

  it('reads the keyboard stand-ins: 2*9+7=25 after x=9 is the check line', () => {
    expect(check(lines(stage, 'x = 9'), '2*9+7=25')).toEqual({ kind: 'check' });
  });

  it('gives each verdict kind its shape', () => {
    const committed = lines(stage);
    const expected: [string, Verdict][] = [
      ['2x + = 25', { kind: 'incomplete' }],
      ['x · x = 81', { kind: 'nonlinear' }],
      ['25 − 7 = 18', { kind: 'aside' }],
      ['2x = 32', { kind: 'wrong' }],
      [
        '2x = 18',
        {
          kind: 'valid',
          move: { kind: 'add-both', term: { kind: 'num', value: 7, sign: -1 } },
          progress: true,
        },
      ],
      ['x = 9', { kind: 'answer' }],
    ];
    for (const [line, verdict] of expected) expect(check(committed, line), line).toEqual(verdict);
    expect(check(lines(stage, 'x = 9'), '2 · 9 + 7 = 25')).toEqual({ kind: 'check' });
  });

  it('measures move and progress from the last committed line', () => {
    expect(check(lines(stage, '2x = 25 − 7'), '2x = 18')).toEqual({
      kind: 'valid',
      move: { kind: 'evaluate', side: 'right' },
      progress: true,
    });
    expect(check(lines(stage, 'x = 18 : 2'), '2x = 18')).toMatchObject({
      kind: 'valid',
      progress: false,
    });
  });

  it('accepts the check line only after the answer line', () => {
    const line = '2 · 9 + 7 = 25';
    expect(check(lines(stage), line)).toEqual({ kind: 'aside' });
    expect(check(lines(stage, '2x = 18', 'x = 18 : 2'), line)).toEqual({ kind: 'aside' });
    expect(check(lines(stage, 'x = 9'), line)).toEqual({ kind: 'check' });
    expect(check(lines(stage, '9 = x', '2x = 18'), line)).toEqual({ kind: 'check' });
  });

  it('never throws on random pad input', () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom(...TOKENS), { maxLength: 30 }), (input) => {
        check(lines(stage), input);
        check(lines(stage, 'x = 9'), input);
      }),
      { numRuns: 2000 },
    );
  });
});

describe('isAnswerLine, checkLineFor and isCheckLine', () => {
  it('knows x = n and n = x only with n written bare', () => {
    expect(isAnswerLine(equation('x = 9'), 9)).toBe(true);
    expect(isAnswerLine(equation('9 = x'), 9)).toBe(true);
    expect(isAnswerLine(equation('x = 8'), 9)).toBe(false);
    expect(isAnswerLine(equation('x = 18 : 2'), 9)).toBe(false);
    expect(isAnswerLine(equation('1x = 9'), 9)).toBe(false);
  });

  it('puts the solution in for x, and compares up to order and sides', () => {
    expect(formatEquation(checkLineFor(equation('2x + 7 = 25')))).toBe('2 · 9 + 7 = 25');
    expect(formatEquation(checkLineFor(equation('x : 3 = 5')))).toBe('15 : 3 = 5');
    const s = equation('2x + 7 = 25');
    for (const text of ['2 · 9 + 7 = 25', '9 · 2 + 7 = 25', '7 + 9 · 2 = 25', '25 = 2 · 9 + 7']) {
      expect(isCheckLine(s, equation(text)), text).toBe(true);
    }
    for (const text of ['25 = 25', '18 + 7 = 25', '2 · 9 + 7 = 20 + 5', '2 · 8 + 7 = 25']) {
      expect(isCheckLine(s, equation(text)), text).toBe(false);
    }
  });
});

// Random stages with whole-number solutions, in the forms of rooms 1–13.
interface Stage {
  equation: Equation;
  solution: number;
}

function xTerm(a: number): Expr {
  return a === 1 ? xVar() : mul(num(a), xVar());
}

function stageArb(minSolution: number): fc.Arbitrary<Stage> {
  const a = fc.integer({ min: 1, max: 99 });
  const s = fc.integer({ min: minSolution, max: 999 });
  const n = fc.integer({ min: 0, max: 9999 });
  return fc.oneof(
    // ax + b = c
    fc.tuple(a, s, n).map(([a, s, b]) => ({
      equation: { left: add(xTerm(a), num(b)), right: num(a * s + b) },
      solution: s,
    })),
    // ax − b = c
    fc.tuple(a, s, n).map(([a, s, b]) => {
      const taken = b % (a * s + 1);
      return {
        equation: { left: sub(xTerm(a), num(taken)), right: num(a * s - taken) },
        solution: s,
      };
    }),
    // b − ax = c
    fc.tuple(a, s, n).map(([a, s, c]) => ({
      equation: { left: sub(num(a * s + c), xTerm(a)), right: num(c) },
      solution: s,
    })),
    // x : a = c
    fc
      .tuple(fc.integer({ min: 2, max: 99 }), fc.integer({ min: minSolution, max: 99 }))
      .map(([a, c]) => ({
        equation: { left: div(xVar(), num(a)), right: num(c) },
        solution: a * c,
      })),
  );
}

function verdictOf(stageEquation: Equation, line: Equation): Verdict {
  // Through the text the child would see, so the parser is exercised too.
  return check([stageEquation], formatEquation(line));
}

/** Every number literal, with a way to put a different number in its place. */
function literals(expr: Expr): { value: number; divisor: boolean; put: (v: number) => Expr }[] {
  if (expr.k === 'num') return [{ value: expr.v, divisor: false, put: (v) => num(v) }];
  if (expr.k === 'x') return [];
  const { k, l, r } = expr;
  return [
    ...literals(l).map((lit) => ({ ...lit, put: (v: number) => ({ k, l: lit.put(v), r }) })),
    ...literals(r).map((lit) => ({
      ...lit,
      divisor: lit.divisor || (k === 'div' && r.k === 'num'),
      put: (v: number) => ({ k, l, r: lit.put(v) }),
    })),
  ];
}

describe('solution-preserving steps (fast-check)', () => {
  it('accepts the same number added to or taken from both sides', () => {
    fc.assert(
      fc.property(stageArb(0), fc.integer({ min: 1, max: 9999 }), (s, n) => {
        const { left, right } = s.equation;
        const added = verdictOf(s.equation, { left: add(left, num(n)), right: add(right, num(n)) });
        const taken = verdictOf(s.equation, { left: sub(left, num(n)), right: sub(right, num(n)) });
        expect(added).toMatchObject({ kind: 'valid', move: { kind: 'add-both' } });
        expect(taken).toMatchObject({ kind: 'valid', move: { kind: 'add-both' } });
      }),
      { numRuns: 1000 },
    );
  });

  it('accepts both sides multiplied by a whole number other than 0', () => {
    fc.assert(
      fc.property(stageArb(0), fc.integer({ min: 1, max: 99 }), (s, k) => {
        const { left, right } = s.equation;
        const line = { left: mul(num(k), left), right: mul(num(k), right) };
        expect(verdictOf(s.equation, line).kind).toBe('valid');
      }),
      { numRuns: 1000 },
    );
  });

  it('accepts a side evaluated', () => {
    fc.assert(
      fc.property(stageArb(0), fc.integer({ min: 0, max: 9999 }), (s, part) => {
        // The number side written as a difference (`25 − 7` for 18), then evaluated.
        const { left, right } = s.equation;
        if (right.k !== 'num') return;
        const written: Equation = { left, right: sub(num(right.v + part), num(part)) };
        const evaluated: Equation = { left, right: num(right.v) };
        expect(verdictOf(s.equation, written).kind).toBe('valid');
        const verdict = check([s.equation, written], formatEquation(evaluated));
        expect(verdict).toMatchObject({
          kind: 'valid',
          move: { kind: 'evaluate', side: 'right' },
          progress: true,
        });
      }),
      { numRuns: 1000 },
    );
  });

  it('accepts x = n and the check line after it', () => {
    fc.assert(
      fc.property(stageArb(0), (s) => {
        const answer: Equation = { left: xVar(), right: num(s.solution) };
        expect(verdictOf(s.equation, answer)).toEqual({ kind: 'answer' });
        const checkLine = formatEquation(checkLineFor(s.equation));
        expect(check([s.equation, answer], checkLine)).toEqual({ kind: 'check' });
        expect(check([s.equation], checkLine)).toEqual({ kind: 'aside' });
      }),
      { numRuns: 500 },
    );
  });

  it('rejects one number changed on one side only', () => {
    fc.assert(
      fc.property(
        stageArb(1),
        fc.nat(),
        fc.integer({ min: 0, max: 9999 }),
        fc.boolean(),
        (s, pick, value, onLeft) => {
          const side = onLeft ? s.equation.left : s.equation.right;
          const found = literals(side);
          const literal = found[pick % Math.max(found.length, 1)];
          if (literal === undefined) return; // a bare number side always has one; x alone has none
          fc.pre(value !== literal.value && !(literal.divisor && value === 0));
          const changed = literal.put(value);
          const line = onLeft
            ? { left: changed, right: s.equation.right }
            : { left: s.equation.left, right: changed };
          expect(verdictOf(s.equation, line)).toEqual({ kind: 'wrong' });
        },
      ),
      { numRuns: 1000 },
    );
  });

  it('rejects a number added to one side and a different one to the other', () => {
    fc.assert(
      fc.property(
        stageArb(0),
        fc.integer({ min: 1, max: 9999 }),
        fc.integer({ min: 1, max: 9999 }),
        (s, n, m) => {
          fc.pre(n !== m);
          const { left, right } = s.equation;
          const line = { left: add(left, num(n)), right: add(right, num(m)) };
          expect(verdictOf(s.equation, line)).toEqual({ kind: 'wrong' });
        },
      ),
      { numRuns: 1000 },
    );
  });
});
