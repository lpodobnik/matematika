import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { type BinaryKind, type Equation, type Expr, maxNumber } from '@/math/expr';
import { toLinear, valueAt } from '@/math/linear';
import { parse, parseExpr } from '@/math/parse';
import * as q from '@/math/rational';
import {
  countLabel,
  divisorLabel,
  isNumberPiece,
  numberLabel,
  numberPieceLabel,
  type Piece,
  panPieces,
  sidePieces,
} from '@/room/pieces';

function equation(text: string): Equation {
  const result = parse(text);
  if (!result.ok) throw new Error(`"${text}" did not parse: ${result.reason}`);
  return result.equation;
}

function side(text: string): Expr {
  const result = parseExpr(text);
  if (!result.ok) throw new Error(`"${text}" did not parse: ${result.reason}`);
  return result.expr;
}

// A short picture of a pan: `gear`, `gear:3` (on a divider of 3), `gear×13` (large),
// `weight 4`, `float 9/2`.
function describePiece(piece: Piece): string {
  if (isNumberPiece(piece)) return `${piece.kind} ${q.toText(piece.value)}`;
  const count = piece.count === 1n ? '' : `×${piece.count}`;
  const divisor = piece.divisor === null ? '' : `:${piece.divisor}`;
  return `${piece.kind}${count}${divisor}`;
}

function pan(text: string): string[] {
  return sidePieces(side(text), 'left').map(describePiece);
}

// What the pieces weigh together at x: weights push down, floats lift, gears push down by
// x each (or by x divided by their divider), springs lift by as much.
function piecesValue(pieces: Piece[], x: q.Rational): q.Rational {
  return pieces.reduce((sum, piece) => {
    if (isNumberPiece(piece)) {
      return piece.kind === 'weight' ? q.add(sum, piece.value) : q.sub(sum, piece.value);
    }
    const each = q.mul(q.rational(piece.count, piece.divisor ?? 1n), x);
    return piece.kind === 'gear' ? q.add(sum, each) : q.sub(sum, each);
  }, q.zero);
}

describe('panPieces', () => {
  it('puts room 1 on the pans: one x-gear and a weight of 4, against a weight of 9', () => {
    const pieces = panPieces(equation('x + 4 = 9'));
    expect(pieces.left).toEqual([
      { key: 'left-gear-0', kind: 'gear', count: 1n, divisor: null },
      { key: 'left-weight-0', kind: 'weight', value: q.rational(4) },
    ]);
    expect(pieces.right).toEqual([{ key: 'right-weight-0', kind: 'weight', value: q.rational(9) }]);
  });

  it('keys pieces by side, kind and index', () => {
    const pieces = panPieces(equation('3x + 5 = 2x + 7 + 4'));
    expect(pieces.left.map((p) => p.key)).toEqual([
      'left-gear-0',
      'left-gear-1',
      'left-gear-2',
      'left-weight-0',
    ]);
    expect(pieces.right.map((p) => p.key)).toEqual([
      'right-gear-0',
      'right-gear-1',
      'right-weight-0',
      'right-weight-1',
    ]);
  });
});

describe('sidePieces', () => {
  it.each([
    ['9', ['weight 9']],
    ['x + 4', ['gear', 'weight 4']],
    ['4 + x', ['weight 4', 'gear']],
    ['x − 6', ['gear', 'float 6']],
    ['25 − 7', ['weight 25', 'float 7']],
  ])('makes a number a weight and a subtracted number a float: %s', (text, pieces) => {
    expect(pan(text)).toEqual(pieces);
  });

  it.each([
    ['x', ['gear']],
    ['3x', ['gear', 'gear', 'gear']],
    ['3 · x', ['gear', 'gear', 'gear']],
    ['x · 3', ['gear', 'gear', 'gear']],
    ['x + x', ['gear', 'gear']],
    ['12x', Array.from({ length: 12 }, () => 'gear')],
    ['13x', ['gear×13']],
    ['27x + 5', ['gear×27', 'weight 5']],
  ])('makes kx k x-gears, and one large gear above 12: %s', (text, pieces) => {
    expect(pan(text)).toEqual(pieces);
  });

  it.each([
    ['20 − x', ['weight 20', 'spring']],
    ['20 − 3x', ['weight 20', 'spring', 'spring', 'spring']],
    ['5 905 − 27x', ['weight 5905', 'spring×27']],
    ['135 − 5x', ['weight 135', 'spring', 'spring', 'spring', 'spring', 'spring']],
  ])('makes −kx springs: %s', (text, pieces) => {
    expect(pan(text)).toEqual(pieces);
  });

  it.each([
    ['x : 3', ['gear:3']],
    ['x : 3 + 2', ['gear:3', 'weight 2']],
    ['2x : 3', ['gear:3', 'gear:3']],
    ['20 − x : 4', ['weight 20', 'spring:4']],
  ])('puts x : n on a divider under an x-gear: %s', (text, pieces) => {
    expect(pan(text)).toEqual(pieces);
  });

  it.each([
    ['2 · 9 + 5', ['weight 18', 'weight 5']],
    ['2 · 9 + 7', ['weight 18', 'weight 7']],
    ['3 · 4', ['weight 12']],
    ['15 : 3', ['weight 5']],
    ['18 : 2', ['weight 9']],
    ['20 − 2 · 3', ['weight 20', 'float 6']],
    ['20 − (5 + 3)', ['weight 20', 'float 8']],
    ['x + (3 − 5)', ['gear', 'float 2']],
  ])(
    'makes a term without x that is not a bare number one weight of its value: %s',
    (text, pieces) => {
      expect(pan(text)).toEqual(pieces);
    },
  );

  it('gives every check line pieces', () => {
    for (const text of ['2 · 9 + 5 = 23', '3 · 4 = 12', '15 : 3 = 5', '5 + 4 = 9']) {
      const pieces = panPieces(equation(text));
      expect(pieces.left.length, text).toBeGreaterThan(0);
      expect(pieces.right.length, text).toBeGreaterThan(0);
    }
  });

  it.each([
    ['2 · (x + 3)', ['gear', 'gear', 'weight 6']],
    ['20 − (x + 4)', ['weight 20', 'spring', 'float 4']],
    ['(x + 3) : 3', ['gear:3', 'weight 1']],
  ])('acts brackets out from their toLinear form: %s', (text, pieces) => {
    expect(pan(text)).toEqual(pieces);
  });

  it.each([
    ['x + 5 − 5', ['gear']],
    ['x − 5 + 5', ['gear']],
    ['5 + x − 5', ['gear']],
    ['x + 5 + 5 − 5', ['gear', 'weight 5']],
    ['x + 2 · 9 − 18', ['gear']],
    ['x + 7 − 5', ['gear', 'weight 7', 'float 5']],
  ])('cancels a weight and a float of the same number: %s', (text, pieces) => {
    expect(pan(text)).toEqual(pieces);
  });

  it.each([
    ['3x − x + 4', ['gear', 'gear', 'weight 4']],
    ['x − x + 4', ['weight 4']],
    ['20 − x + x', ['weight 20']],
    ['14x − 2x', Array.from({ length: 12 }, () => 'gear')],
    ['x : 3 − x : 3 + 1', ['weight 1']],
    ['x − x : 3', ['gear', 'spring:3']],
  ])('cancels a gear and a spring on dividers of the same size: %s', (text, pieces) => {
    expect(pan(text)).toEqual(pieces);
  });

  it('leaves a pan with nothing worth 0 empty', () => {
    expect(pan('0')).toEqual([]);
    expect(pan('x + 0')).toEqual(['gear']);
    expect(pan('0 · x + 4')).toEqual(['weight 4']);
  });

  it('keeps a fraction exact, as only a wrong line acted out can make one', () => {
    expect(pan('25 : 2')).toEqual(['weight 25/2']);
  });

  it('refuses a side that is not linear (the pans never hold one)', () => {
    expect(() => sidePieces(side('x · x'), 'left')).toThrow(/linear/);
    expect(() => sidePieces(side('18 : 0'), 'left')).toThrow(/linear/);
  });

  // Random trees of every shape, as in linear.test.ts.
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

  it('always weighs what the side is worth, at any x (fast-check)', () => {
    fc.assert(
      fc.property(exprArb, fc.integer({ min: 0, max: 50 }), (expr, x) => {
        const linear = toLinear(expr);
        if (linear.kind !== 'linear') return;
        const at = q.rational(x);
        expect(piecesValue(sidePieces(expr, 'left'), at)).toEqual(valueAt(linear, at));
      }),
      { numRuns: 1000 },
    );
  });

  it('never leaves a weight and float of one number, or a gear and spring, on a pan (fast-check)', () => {
    fc.assert(
      fc.property(exprArb, (expr) => {
        if (toLinear(expr).kind !== 'linear') return;
        const pieces = sidePieces(expr, 'left');
        for (const float of pieces) {
          if (float.kind !== 'float') continue;
          const twin = pieces.some((p) => p.kind === 'weight' && q.equals(p.value, float.value));
          expect(twin).toBe(false);
        }
        for (const spring of pieces) {
          if (spring.kind !== 'spring') continue;
          expect(pieces.some((p) => p.kind === 'gear' && p.divisor === spring.divisor)).toBe(false);
        }
        expect(new Set(pieces.map((p) => p.key)).size).toBe(pieces.length);
      }),
      { numRuns: 1000 },
    );
  });
});

describe('labels', () => {
  it('writes whole numbers in school notation', () => {
    expect(numberLabel(q.rational(9))).toBe('9');
    expect(numberLabel(q.rational(5905))).toBe('5\u202f905');
    expect(numberLabel(q.rational(9_999_999n ** 3n))).toBe(
      '999\u202f999\u202f700\u202f000\u202f029\u202f999\u202f999',
    );
  });

  it('writes a fraction as a division, and one too big for a literal as its nearest whole number', () => {
    expect(numberLabel(q.rational(25, 2))).toBe('25 : 2');
    expect(numberLabel(q.rational(-25, 2))).toBe('25 : 2');
    // 99 999 980 000 002 : 3 is 33 333 326 666 667.33…
    expect(numberLabel(q.rational(9_999_999n ** 2n + 1n, 3n))).toBe(
      '33\u202f333\u202f326\u202f666\u202f667',
    );
  });

  it('writes a large gear count as kx', () => {
    expect(countLabel(13n)).toBe('13x');
    expect(countLabel(1234n)).toBe('1\u202f234x');
    expect(countLabel(9_999_999n ** 2n)).toBe('99\u202f999\u202f980\u202f000\u202f001');
  });

  it('puts the school minus on a negative number, on a division\u2019s first number', () => {
    expect(numberLabel(q.rational(6), true)).toBe('\u22126');
    expect(numberLabel(q.rational(5905), true)).toBe('\u22125\u202f905');
    expect(numberLabel(q.rational(25, 2), true)).toBe('\u221225 : 2');
    expect(numberLabel(q.rational(9_999_999n ** 2n + 1n, 3n), true)).toBe(
      '\u221233\u202f333\u202f326\u202f666\u202f667',
    );
  });

  it('labels a weight with its number and a float with its minus (story 1.14)', () => {
    expect(numberPieceLabel({ kind: 'weight', value: q.rational(6) })).toBe('6');
    expect(numberPieceLabel({ kind: 'float', value: q.rational(6) })).toBe('\u22126');
    expect(numberPieceLabel({ kind: 'float', value: q.rational(9, 2) })).toBe('\u22129 : 2');
    const [, float] = sidePieces(side('x \u2212 6'), 'left');
    if (!float || !isNumberPiece(float)) throw new Error('expected a float');
    expect(numberPieceLabel(float)).toBe('\u22126');
  });

  it('tags a divided gear or spring with its division, with the school sign (story 1.14)', () => {
    expect(divisorLabel(3n)).toBe(': 3');
    expect(divisorLabel(12n)).toBe(': 12');
    expect(divisorLabel(1234n)).toBe(': 1\u202f234');
    expect(divisorLabel(9_999_999n ** 2n)).toBe(': 99\u202f999\u202f980\u202f000\u202f001');
  });
});
