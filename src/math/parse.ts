// Pad tokens or school-notation text to an Equation (architecture Pattern 1, Checker
// rules step 1). User input never throws: every failure is a typed reason.
//
//   equation := side '=' side            exactly one '='
//   side     := product (('+' | '−') product)*
//   product  := factor (('·' | ':') factor)*
//   factor   := number 'x'? | 'x' | '(' side ')'
//
// `3x` is one factor (a number written straight before x), so `12 : 3x` divides by 3x.
// No other product is implicit: `2(x + 1)`, `x x` and `x3` don't parse. There is no
// leading minus (5th grade has no negative numbers) and no leading plus. Division by zero
// parses; `toLinear` reports it.

import { type Equation, type Expr, maxNumber } from '@/math/expr';
import { isDigit, type Token, tokenize } from '@/math/tokens';

/** Far beyond any notebook line; keeps recursion shallow for any input. */
export const maxTokens = 500;

export type ParseFailure =
  | 'unknown-symbol' // a character that isn't on the number pad
  | 'too-long'
  | 'no-equals'
  | 'too-many-equals' // 2x = 25 − 7 = 18
  | 'empty-side' // = 9, x =
  | 'missing-operand' // 2x + = 25, () and a leading +
  | 'missing-operator' // two factors side by side: 2(x + 1), x x, (x)(2)
  | 'leading-minus' // −x = 14, 2 · −3
  | 'digit-after-x' // x3 = 12
  | 'unbalanced-brackets'
  | 'number-too-big'; // above 9 999 999

export type ParseResult = { ok: true; equation: Equation } | { ok: false; reason: ParseFailure };
export type ParseExprResult = { ok: true; expr: Expr } | { ok: false; reason: ParseFailure };

class ParseError {
  constructor(readonly reason: ParseFailure) {}
}

function fail(reason: ParseFailure): never {
  throw new ParseError(reason);
}

// Only ParseError is turned into a result; anything else is a programmer error.
function attempt<T>(run: () => T): T | { ok: false; reason: ParseFailure } {
  try {
    return run();
  } catch (error) {
    if (error instanceof ParseError) return { ok: false, reason: error.reason };
    throw error;
  }
}

function toTokens(input: string | readonly Token[]): readonly Token[] {
  if (typeof input !== 'string') return input;
  const result = tokenize(input);
  return result.ok ? result.tokens : fail(result.reason);
}

class Cursor {
  private pos = 0;
  constructor(private readonly tokens: readonly Token[]) {}

  peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  next(): Token | undefined {
    const token = this.tokens[this.pos];
    this.pos += 1;
    return token;
  }

  atEnd(): boolean {
    return this.pos >= this.tokens.length;
  }
}

function parseSide(tokens: readonly Token[]): Expr {
  if (tokens.length === 0) fail('empty-side');
  const cursor = new Cursor(tokens);
  const expr = parseSum(cursor);
  if (!cursor.atEnd()) fail(cursor.peek() === ')' ? 'unbalanced-brackets' : 'missing-operator');
  return expr;
}

function parseSum(cursor: Cursor): Expr {
  let expr = parseProduct(cursor);
  for (let token = cursor.peek(); token === '+' || token === '−'; token = cursor.peek()) {
    cursor.next();
    expr = { k: token === '+' ? 'add' : 'sub', l: expr, r: parseProduct(cursor) };
  }
  return expr;
}

function parseProduct(cursor: Cursor): Expr {
  let expr = parseFactor(cursor);
  for (let token = cursor.peek(); token === '·' || token === ':'; token = cursor.peek()) {
    cursor.next();
    expr = { k: token === '·' ? 'mul' : 'div', l: expr, r: parseFactor(cursor) };
  }
  return expr;
}

function parseFactor(cursor: Cursor): Expr {
  const token = cursor.peek();
  if (isDigit(token)) {
    const number = parseNumber(cursor);
    if (cursor.peek() !== 'x') return number;
    return { k: 'mul', l: number, r: parseX(cursor) };
  }
  if (token === 'x') return parseX(cursor);
  if (token === '(') {
    cursor.next();
    if (cursor.peek() === ')') fail('missing-operand');
    const inner = parseSum(cursor);
    const close = cursor.next();
    if (close === ')') return inner;
    return fail(close === undefined ? 'unbalanced-brackets' : 'missing-operator');
  }
  if (token === '−') fail('leading-minus');
  return fail('missing-operand'); // the end, '+', '·', ':' or ')'
}

function parseX(cursor: Cursor): Expr {
  cursor.next();
  if (isDigit(cursor.peek())) fail('digit-after-x');
  return { k: 'x' };
}

function parseNumber(cursor: Cursor): Expr {
  let digits = '';
  while (isDigit(cursor.peek())) digits += cursor.next();
  const significant = digits.replace(/^0+(?=\d)/, '');
  // Compare digit counts first, so a long run never turns into an inexact float.
  if (significant.length > String(maxNumber).length || Number(significant) > maxNumber) {
    fail('number-too-big');
  }
  return { k: 'num', v: Number(significant) };
}

/** Parses an equation from pad tokens or text. Never throws on user input. */
export function parse(input: string | readonly Token[]): ParseResult {
  return attempt(() => {
    const tokens = toTokens(input);
    if (tokens.length > maxTokens) fail('too-long');
    const equals = tokens.indexOf('=');
    if (equals === -1) fail('no-equals');
    if (tokens.indexOf('=', equals + 1) !== -1) fail('too-many-equals');
    const left = parseSide(tokens.slice(0, equals));
    const right = parseSide(tokens.slice(equals + 1));
    return { ok: true as const, equation: { left, right } };
  });
}

/** Parses one side, with no `=`. Never throws on user input. */
export function parseExpr(input: string | readonly Token[]): ParseExprResult {
  return attempt(() => {
    const tokens = toTokens(input);
    if (tokens.length > maxTokens) fail('too-long');
    if (tokens.includes('=')) fail('too-many-equals');
    return { ok: true as const, expr: parseSide(tokens) };
  });
}
