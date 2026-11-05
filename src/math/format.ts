// The only place equations and numbers become text (architecture, Consistency Rules:
// Notation): · (U+00B7) for times, : for division, − (U+2212) for minus, `3x` without a
// dot, and U+202F (narrow no-break space) between thousands from 1 000. Whatever this
// writes, `parse` reads back to the same tree.

import { assert } from '@/lib/assert';
import type { Equation, Expr } from '@/math/expr';
import { BLANK, isDigit, type LineToken, type Token } from '@/math/tokens';

export const thousandsSeparator = '\u202f';

const signs = { add: '+', sub: '−', mul: '·', div: ':' } as const;

/** Groups of three from the right: `5905` → `5 905`. Leading zeros stay as written. */
function groupDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+$)/g, thousandsSeparator);
}

/** A whole number in school notation: `5905` → `5 905`, `999` → `999`. */
export function formatNumber(value: number | bigint): string {
  assert(typeof value === 'bigint' || Number.isSafeInteger(value), `not a whole number: ${value}`);
  const big = BigInt(value);
  const grouped = groupDigits((big < 0n ? -big : big).toString());
  return big < 0n ? `−${grouped}` : grouped;
}

type CoefficientTerm = { k: 'mul'; l: { k: 'num'; v: number }; r: { k: 'x' } };

// A number written straight before x (`3x`) reads as one factor, like a number or x.
function isCoefficientTerm(expr: Expr): expr is CoefficientTerm {
  return expr.k === 'mul' && expr.l.k === 'num' && expr.r.k === 'x';
}

function precedence(expr: Expr): number {
  if (expr.k === 'num' || expr.k === 'x' || isCoefficientTerm(expr)) return 3;
  return expr.k === 'mul' || expr.k === 'div' ? 2 : 1;
}

function bracketed(expr: Expr, needed: boolean): string {
  return needed ? `(${formatExpr(expr)})` : formatExpr(expr);
}

/**
 * One side in school notation. Brackets appear only where the tree needs them: around a
 * looser operation, and around an equal one on the right, since + − · : group from the
 * left (`20 − (5 + 3)`, `2 · (x + 3)`).
 */
export function formatExpr(expr: Expr): string {
  if (expr.k === 'num') return formatNumber(expr.v);
  if (expr.k === 'x') return 'x';
  if (isCoefficientTerm(expr)) return `${formatNumber(expr.l.v)}x`;
  const own = precedence(expr);
  const left = bracketed(expr.l, precedence(expr.l) < own);
  const right = bracketed(expr.r, precedence(expr.r) <= own);
  return `${left} ${signs[expr.k]} ${right}`;
}

/** `2x + 7 = 25`, `5 905 − 27x = 316`. */
export function formatEquation(equation: Equation): string {
  return `${formatExpr(equation.left)} = ${formatExpr(equation.right)}`;
}

const operatorTokens: ReadonlySet<Token> = new Set<Token>(['+', '−', '·', ':', '=']);

/**
 * A notebook line as text, in pieces: the line's own text, and blanks to fill (Fading,
 * `blanks`). A blank's text is what fills it so far, `''` while it is empty; the notebook
 * draws the blank's box around it.
 */
export type LineSegment = { kind: 'text'; text: string } | { kind: 'blank'; text: string };

/**
 * A notebook line in school notation, whether or not it parses, with each blank filled by
 * `fill` (Fading, `blanks`): digit runs grouped by thousands (`5905` → `5 905`), a space
 * either side of an operator that follows a number, x, a blank or `)`, and none inside
 * brackets or between a number and x (`2x`, `2 · (x + 3)`). `x = ☐` gives the text `x = `
 * and a blank; `☐ + 4 = 9` a blank and the text ` + 4 = 9`.
 */
export function formatLine(
  tokens: readonly LineToken[],
  fill: readonly Token[] = [],
): LineSegment[] {
  const segments: LineSegment[] = [];
  let text = '';
  let digits = '';
  // Whether the last thing written was a number, x, a blank or `)`, so an operator is binary.
  let afterOperand = false;
  const endNumber = () => {
    if (digits === '') return;
    text += groupDigits(digits);
    digits = '';
    afterOperand = true;
  };
  for (const token of tokens) {
    if (token === BLANK) {
      endNumber();
      if (text !== '') segments.push({ kind: 'text', text });
      text = '';
      segments.push({ kind: 'blank', text: formatTokens(fill) });
      afterOperand = true;
      continue;
    }
    if (isDigit(token)) {
      digits += token;
      continue;
    }
    endNumber();
    if (operatorTokens.has(token)) {
      text += afterOperand ? ` ${token} ` : token;
      afterOperand = false;
    } else if (token === ')') {
      text = `${text.trimEnd()})`;
      afterOperand = true;
    } else {
      text += token;
      afterOperand = token === 'x';
    }
  }
  text = (text + groupDigits(digits)).trimEnd();
  if (text !== '') segments.push({ kind: 'text', text });
  return segments;
}

/**
 * A notebook line as he typed it, in school notation, whether or not it parses (see
 * `formatLine`). For any equation, the tokens of `formatEquation` come back as the same text.
 */
export function formatTokens(tokens: readonly Token[]): string {
  return formatLine(tokens)
    .map((segment) => segment.text)
    .join('');
}
