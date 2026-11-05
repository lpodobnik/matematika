// Judges a line against the stage by its exact solution, never by expected steps
// (architecture Pattern 1, Checker rules). The verdict decides everything the notebook
// and the machine do with the line; nothing here throws on what the child wrote.

import { assert } from '@/lib/assert';
import {
  type Equation,
  equationHasX,
  maxNumber,
  sameEquation,
  substituteEquation,
} from '@/math/expr';
import { solve } from '@/math/linear';
import { classifyMove, type Move, makesProgress } from '@/math/moves';
import { parse } from '@/math/parse';
import * as q from '@/math/rational';
import type { Token } from '@/math/tokens';

export type Verdict =
  | { kind: 'incomplete' } // doesn't parse: refused with a wiggle, not a jam
  | { kind: 'nonlinear' } // e.g. 18 : x: refused, not a jam
  | { kind: 'aside' } // true sum with no x, e.g. 25 − 7 = 18: refused, not a jam
  | { kind: 'wrong' } // different solution, or a false check: acted out, jams
  | { kind: 'valid'; move: Move; progress: boolean }
  | { kind: 'answer' } // x = n with the stage's n
  | { kind: 'check' }; // the stage equation with n put in for x: locks the machine

export type VerdictKind = Verdict['kind'];

/**
 * The stage's solution. A stage equation always has one whole-number solution (content
 * tests check every room), so anything else is a programmer error.
 */
export function stageSolution(stage: Equation): number {
  const solution = solve(stage);
  assert(solution.kind === 'one', `stage equation without one solution: ${solution.kind}`);
  const { x } = solution;
  assert(q.isInteger(x) && x.n >= 0n && x.n <= BigInt(maxNumber), `stage solution ${q.toText(x)}`);
  return Number(x.n);
}

/** `x = n` or `n = x`, with n written as a bare number. */
export function isAnswerLine(line: Equation, n: number): boolean {
  const { left, right } = line;
  if (left.k === 'x' && right.k === 'num') return right.v === n;
  if (right.k === 'x' && left.k === 'num') return left.v === n;
  return false;
}

/** The stage equation with the solution put in for x: `2x + 7 = 25` → `2 · 9 + 7 = 25`. */
export function checkLineFor(stage: Equation): Equation {
  return substituteEquation(stage, stageSolution(stage));
}

/** True when `candidate` is the check line, up to factor order, commuted terms and swapped sides. */
export function isCheckLine(stage: Equation, candidate: Equation): boolean {
  return sameEquation(candidate, checkLineFor(stage));
}

/** A typed line (pad tokens or text) or a candidate equation from the pans. */
export type LineInput = string | readonly Token[] | Equation;

function toEquation(line: LineInput): Equation | null {
  if (typeof line !== 'string' && 'left' in line) return line;
  const parsed = parse(line);
  return parsed.ok ? parsed.equation : null;
}

const incomplete: Verdict = { kind: 'incomplete' };
const nonlinear: Verdict = { kind: 'nonlinear' };
const aside: Verdict = { kind: 'aside' };
const wrong: Verdict = { kind: 'wrong' };
const answer: Verdict = { kind: 'answer' };
const checked: Verdict = { kind: 'check' };

/**
 * Judges `line` (pad tokens, text, or an equation from the pans) against `lines`, the
 * committed lines: `lines[0]` is the stage equation, and the rest are lines already
 * accepted (`valid` or `answer`). The check line locks the stage, so it is always last.
 */
export function check(lines: readonly Equation[], line: LineInput): Verdict {
  const [stage] = lines;
  assert(stage !== undefined, 'check needs the stage equation as line 0');
  const previous = lines[lines.length - 1] ?? stage;
  const n = stageSolution(stage);

  // Rule 1: what doesn't parse, or divides by zero, is incomplete; then nonlinear.
  const equation = toEquation(line);
  if (equation === null) return incomplete;
  const solution = solve(equation);
  if (solution.kind === 'division-by-zero') return incomplete;
  if (solution.kind === 'nonlinear') return nonlinear;

  // Rule 2: a line with no x is a true or false sum.
  if (!equationHasX(equation)) {
    if (solution.kind === 'none') return wrong;
    const answerWritten = lines.slice(1).some((committed) => isAnswerLine(committed, n));
    return answerWritten && isCheckLine(stage, equation) ? checked : aside;
  }

  // Rule 3: correct only with one solution, the stage's.
  if (solution.kind !== 'one' || !q.equals(solution.x, q.rational(n))) return wrong;

  // Rules 4 and 5.
  if (isAnswerLine(equation, n)) return answer;
  return {
    kind: 'valid',
    move: classifyMove(previous, equation),
    progress: makesProgress(previous, equation),
  };
}
