// The equation model's syntax tree (architecture Pattern 1). Every view (pans, notebook,
// chain, drum) and the checker work from these types.

import { assert } from '@/lib/assert';

export type Expr =
  | { k: 'num'; v: number } // whole number literal, 0–9 999 999
  | { k: 'x' }
  | { k: 'add' | 'sub' | 'mul' | 'div'; l: Expr; r: Expr }; // mul covers implicit 3x; div is ':'

export interface Equation {
  left: Expr;
  right: Expr;
}

export type BinaryKind = 'add' | 'sub' | 'mul' | 'div';
export type BinaryExpr = Extract<Expr, { l: Expr }>;

/** The largest number literal a line may hold (architecture, Checker rules). */
export const maxNumber = 9_999_999;

export function num(v: number): Expr {
  assert(Number.isSafeInteger(v) && v >= 0 && v <= maxNumber, `not a number literal: ${v}`);
  return { k: 'num', v };
}

export function xVar(): Expr {
  return { k: 'x' };
}

export function add(l: Expr, r: Expr): Expr {
  return { k: 'add', l, r };
}

export function sub(l: Expr, r: Expr): Expr {
  return { k: 'sub', l, r };
}

export function mul(l: Expr, r: Expr): Expr {
  return { k: 'mul', l, r };
}

export function div(l: Expr, r: Expr): Expr {
  return { k: 'div', l, r };
}

export function hasX(expr: Expr): boolean {
  if (expr.k === 'x') return true;
  if (expr.k === 'num') return false;
  return hasX(expr.l) || hasX(expr.r);
}

export function equationHasX(equation: Equation): boolean {
  return hasX(equation.left) || hasX(equation.right);
}

/** Puts a whole number in for x, as in the check line: `2x + 7` at 9 is `2 · 9 + 7`. */
export function substitute(expr: Expr, value: number): Expr {
  if (expr.k === 'x') return num(value);
  if (expr.k === 'num') return expr;
  return { k: expr.k, l: substitute(expr.l, value), r: substitute(expr.r, value) };
}

export function substituteEquation(equation: Equation, value: number): Equation {
  return { left: substitute(equation.left, value), right: substitute(equation.right, value) };
}

// Structural comparison up to commuted terms and factors: `2 · 9 + 7`, `7 + 9 · 2` and
// `7 + 2 · 9` are the same, `25` and `18 + 7` are not. A chain of + and − (or of ·) is
// flattened along its left spine, which is how the parser builds it; a bracketed group
// on the right stays one term, so `a − (b − c)` is not `a − b + c`. Division doesn't
// commute.
function shapeKey(expr: Expr): string {
  switch (expr.k) {
    case 'num':
      return String(expr.v);
    case 'x':
      return 'x';
    case 'add':
    case 'sub':
      return `S(${collectTerms(expr, []).sort().join(',')})`;
    case 'mul':
      return `P(${collectFactors(expr, []).sort().join(',')})`;
    case 'div':
      return `D(${shapeKey(expr.l)},${shapeKey(expr.r)})`;
  }
}

// expr is an add or sub node.
function collectTerms(expr: BinaryExpr, out: string[]): string[] {
  if (expr.l.k === 'add' || expr.l.k === 'sub') collectTerms(expr.l, out);
  else out.push(`+${shapeKey(expr.l)}`);
  out.push(`${expr.k === 'add' ? '+' : '-'}${shapeKey(expr.r)}`);
  return out;
}

// expr is a mul node.
function collectFactors(expr: BinaryExpr, out: string[]): string[] {
  if (expr.l.k === 'mul') collectFactors(expr.l, out);
  else out.push(shapeKey(expr.l));
  out.push(shapeKey(expr.r));
  return out;
}

export function sameExpr(a: Expr, b: Expr): boolean {
  return shapeKey(a) === shapeKey(b);
}

/** The same equation up to commuted terms and factors, and swapped sides. */
export function sameEquation(a: Equation, b: Equation): boolean {
  const [aLeft, aRight, bLeft, bRight] = [a.left, a.right, b.left, b.right].map(shapeKey);
  return (aLeft === bLeft && aRight === bRight) || (aLeft === bRight && aRight === bLeft);
}
