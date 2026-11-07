// The gear chain (architecture Pattern 1, `chain.ts`; GDD, Gear chain): an equation with x
// once, on one side, as linked operations from x out to the number on the other side.
// `2x + 7 = 25` is `x → ·2 → +7 → 25`; `135 − 5x = 100` is `x → ·5 → 135 − ☐ → 100`. He
// undoes the last link by choosing an operation and a number; the right choice is the
// link's inverse, and the chain never offers it. Undoing writes the move as school does
// (`2x = 25 − 7`) and, when the number comes out whole, its result (`2x = 18`). Pure.

import {
  add,
  div,
  type Equation,
  type Expr,
  hasX,
  maxNumber,
  mul,
  num,
  sub,
  xVar,
} from '@/math/expr';
import { formatNumber } from '@/math/format';
import { toLinear } from '@/math/linear';
import * as q from '@/math/rational';

/**
 * One link's operation: `add` (+ n), `sub` (− n), `mul` (· n), `div` (: n), and `from`
 * (n − ☐), where x's side is taken away from a number, as in `135 − 5x`.
 */
export type LinkOp = 'add' | 'sub' | 'mul' | 'div' | 'from';
export const linkOps: readonly LinkOp[] = ['add', 'sub', 'mul', 'div', 'from'];

export interface Link {
  op: LinkOp;
  n: number;
}

/** An equation as a chain: the links from x outward, the number they reach, and x's side. */
export interface Chain {
  links: Link[];
  output: number;
  xOnLeft: boolean;
}

/** The links from x out to the root of `expr`, or null when x isn't there exactly once in a chain. */
function linksOf(expr: Expr): Link[] | null {
  if (expr.k === 'x') return [];
  if (expr.k === 'num') return null;
  const [lx, rx] = [hasX(expr.l), hasX(expr.r)];
  if (lx === rx) return null;
  const inner = lx ? expr.l : expr.r;
  const other = lx ? expr.r : expr.l;
  if (other.k !== 'num') return null;
  const links = linksOf(inner);
  if (links === null) return null;
  const n = other.v;
  switch (expr.k) {
    case 'add':
      return [...links, { op: 'add', n }];
    case 'sub':
      return [...links, lx ? { op: 'sub', n } : { op: 'from', n }];
    case 'mul':
      return [...links, { op: 'mul', n }];
    case 'div':
      // `18 : x` isn't linear, and never a chain.
      return lx ? [...links, { op: 'div', n }] : null;
  }
}

/**
 * The equation as a gear chain, or null when it isn't one: x must be on one side only,
 * once, with every other operand on that side a written number, and the other side worth a
 * whole number a line may hold. `2x + 7 = 25`, `25 = 7 + 2x` and a move he typed himself,
 * `2x = 25 − 7` (output 18; story 4.1 review), are chains; `x + x = 6` and `2x + 1 = x`
 * aren't.
 */
export function chainOf(equation: Equation): Chain | null {
  const xOnLeft = hasX(equation.left);
  if (xOnLeft === hasX(equation.right)) return null;
  const [xSide, numberSide] = xOnLeft
    ? [equation.left, equation.right]
    : [equation.right, equation.left];
  const output = numberSide.k === 'num' ? numberSide.v : wholeValue(numberSide);
  if (output === null) return null;
  const links = linksOf(xSide);
  if (links === null) return null;
  return { links, output, xOnLeft };
}

/** The last link, the one he undoes next, or null when x is already alone. */
export function lastLink(chain: Chain): Link | null {
  return chain.links[chain.links.length - 1] ?? null;
}

/** The inverse of a link: + and −, · and : undo each other; `n − ☐` undoes itself. */
export function inverseOf(link: Link): Link {
  switch (link.op) {
    case 'add':
      return { op: 'sub', n: link.n };
    case 'sub':
      return { op: 'add', n: link.n };
    case 'mul':
      return { op: 'div', n: link.n };
    case 'div':
      return { op: 'mul', n: link.n };
    case 'from':
      return { op: 'from', n: link.n };
  }
}

export function sameLink(a: Link, b: Link): boolean {
  return a.op === b.op && a.n === b.n;
}

/** The chosen operation acting on the output, as written: `25 − 7`, `18 : 2`, `135 − 100`. */
function written(output: number, choice: Link): Expr {
  const [o, n] = [num(output), num(choice.n)];
  switch (choice.op) {
    case 'add':
      return add(o, n);
    case 'sub':
      return sub(o, n);
    case 'mul':
      return mul(o, n);
    case 'div':
      return div(o, n);
    case 'from':
      return sub(n, o);
  }
}

/** x's side without its last link. */
function peeled(xSide: Expr): Expr {
  if (xSide.k === 'num' || xSide.k === 'x') return xSide;
  return hasX(xSide.l) ? xSide.l : xSide.r;
}

/** A side's value when it is a whole number a line may hold, else null. */
function wholeValue(expr: Expr): number | null {
  const linear = toLinear(expr);
  if (linear.kind !== 'linear' || !q.isZero(linear.a)) return null;
  const { b } = linear;
  if (!q.isInteger(b) || b.n < 0n || b.n > BigInt(maxNumber)) return null;
  return Number(b.n);
}

/** What undoing the last link with a choice writes: the move, and its result if whole. */
export interface Undo {
  /** `2x = 25 − 7`: the last link gone from x's side, the choice acting on the output. */
  line: Equation;
  /** `2x = 18`: the move worked out; null when it isn't a whole number a line may hold. */
  result: Equation | null;
  /** The choice is the last link's inverse, so the line keeps the equation's solution. */
  right: boolean;
}

/**
 * Undoes the last link of `equation`'s chain with `choice`, his operation and number. Null
 * when the equation isn't a chain, x is already alone, or the choice's number is out of a
 * line's range. A wrong choice still gives its line, which has another solution, so it jams
 * like any wrong line.
 */
export function undoLast(equation: Equation, choice: Link): Undo | null {
  const chain = chainOf(equation);
  const link = chain ? lastLink(chain) : null;
  if (!chain || !link) return null;
  if (!Number.isSafeInteger(choice.n) || choice.n < 0 || choice.n > maxNumber) return null;
  const xSide = peeled(chain.xOnLeft ? equation.left : equation.right);
  const numberSide = written(chain.output, choice);
  const onSide = (side: Expr): Equation =>
    chain.xOnLeft ? { left: xSide, right: side } : { left: side, right: xSide };
  const value = wholeValue(numberSide);
  return {
    line: onSide(numberSide),
    result: value === null ? null : onSide(num(value)),
    right: sameLink(choice, inverseOf(link)),
  };
}

/**
 * The links of `stage`'s chain that are already undone in `current`, the line the pans
 * show: when `current`'s links are the first links of the stage's, the rest are dark
 * (`x → ·2 → (+7) → 18`). None when either isn't a chain, or they no longer match (after a
 * Balance move made a different chain).
 */
export function undoneLinks(stage: Equation, current: Equation): Link[] {
  const [whole, now] = [chainOf(stage), chainOf(current)];
  if (!whole || !now || now.links.length > whole.links.length) return [];
  const prefix = now.links.every((link, i) => {
    const original = whole.links[i];
    return original !== undefined && sameLink(link, original);
  });
  return prefix ? whole.links.slice(now.links.length) : [];
}

/** x alone, as the chain reaches it: `x = 9`. Only for tests and hints. */
export function xEquals(value: number, xOnLeft = true): Equation {
  return xOnLeft ? { left: xVar(), right: num(value) } : { left: num(value), right: xVar() };
}

/** A link as the chain writes it, in school notation: `+ 9`, `· 4`, `: 3`, `135 − ☐`. */
export function linkText(link: Link): string {
  const n = formatNumber(link.n);
  switch (link.op) {
    case 'add':
      return `+ ${n}`;
    case 'sub':
      return `− ${n}`;
    case 'mul':
      return `· ${n}`;
    case 'div':
      return `: ${n}`;
    case 'from':
      return `${n} − ☐`;
  }
}
