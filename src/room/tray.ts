// The tray (architecture Pattern 1, Balance moves; GDD, Three ways to solve: Balance). Pure:
// when the tray is offered, what its stepper does, and what a drop on a pan or a piece
// dragged off a pan does to the stage.
//
//   offered    once Balance is earned (room 3), whenever a stage is open; off while the
//              machine is jammed (Pattern 2, Jams)
//   pieces     weights and floats only, each numbered 1–99 by a stepper (− and +); x-gears
//              and springs can't be added or dragged off
//   a drop     a piece from the tray on a pan, or a weight or float dragged off a pan into
//              the tray: the number pieces on that pan combine into one piece of their sum
//              (a weight if positive, a float if negative, nothing if 0). A drop that would
//              leave a pan with no x pieces below 0 is refused, and the piece slides back
//   one pan    changed alone, the pans' equation no longer has the stage's solution: the
//              pans tip at the dial's x, and nothing is written
//   both pans  once the pans' equation has the stage's solution again, the move is complete
//              (`WayUsed`, way `balance`). With Balance fading `auto` the equation is
//              appended as the next line (`LineAccepted`, source `balance`), unless it is
//              `x = n`, which he writes himself. Balance `blanks` arrives in epic 2.
//
// Every tray move is exploring, so it ends acting out a written line: the pans are weighed
// at the dial's x again (Pattern 1). The splitter (room/splitter.ts) completes its moves
// the same way (`balanceMove`). The moves are free and reversible: a pan that gets
// back to the last committed line's pieces shows that line's side again. A reset, or any
// line written, replaces them with that line's layout.

import { tuning } from '@/config/tuning';
import { assert } from '@/lib/assert';
import { check, isAnswerLine, stageSolution } from '@/math/check';
import { add, div, type Equation, type Expr, maxNumber, mul, num, sub, xVar } from '@/math/expr';
import { formatEquation } from '@/math/format';
import { solve, toLinear } from '@/math/linear';
import * as q from '@/math/rational';
import { tokenize } from '@/math/tokens';
import type { RoomEvent } from '@/room/events';
import { commitLine, committedEquations, lastCommitted, lineProgress } from '@/room/notebook';
import { isNumberPiece, numberPieceLabel, sidePieces } from '@/room/pieces';
import { currentStageSpec, machineEquation, type RoomStep } from '@/room/room';
import type { PieceView } from '@/room/scale';
import type {
  FadingMode,
  RoomState,
  Side,
  StageSpec,
  StageState,
  ToolId,
  TrayKind,
} from '@/room/types';

/** The lowest number on the tray's pieces; the highest is `tuning.trayMaxNumber`. */
export const trayMinNumber = 1;

/** Whether the game offers the tray now: Balance is earned and the stage is open. */
export function trayOffered(room: RoomState, tools: readonly ToolId[]): boolean {
  return tools.includes('balance') && room.stage.phase === 'open';
}

/**
 * Whether the tray does anything now: it is offered, and the machine isn't jammed (while
 * jammed he can only edit the draft, drag the splitter off, reset or leave).
 */
export function trayWorks(room: RoomState, tools: readonly ToolId[]): boolean {
  return trayOffered(room, tools) && room.stage.jam === null;
}

/** The stage's Balance line mode; a stage that lists none writes nothing for Balance. */
export function balanceFading(stage: StageSpec): FadingMode {
  return stage.fading.balance ?? 'blank';
}

/** Whether a step of the stepper changes a tray number: not below 1, nor above 99. */
export function canStep(value: number, by: 1 | -1): boolean {
  const next = value + by;
  return next >= trayMinNumber && next <= tuning.trayMaxNumber;
}

function withStage(room: RoomState, stage: StageState): RoomState {
  return { ...room, stage };
}

/**
 * The stepper (`tray/step`): the weight's or the float's number goes up or down by one,
 * within 1–99. The UI repeats it while a button is held. Null, so the action is ignored,
 * when the tray doesn't work now or the number is at its end.
 */
export function stepTray(
  room: RoomState,
  tools: readonly ToolId[],
  kind: TrayKind,
  by: 1 | -1,
): RoomStep | null {
  const { stage } = room;
  if (!trayWorks(room, tools) || !canStep(stage.tray[kind], by)) return null;
  const tray = { ...stage.tray, [kind]: stage.tray[kind] + by };
  return { room: withStage(room, { ...stage, tray }), events: [] };
}

function magnitude(value: q.Rational): q.Rational {
  return value.n < 0n ? q.neg(value) : value;
}

function fits(value: bigint): boolean {
  return value <= BigInt(maxNumber);
}

/** A positive quantity as a number literal, or a division for a fraction; null if too big. */
function quantity(value: q.Rational): Expr | null {
  if (!fits(value.n) || !fits(value.d)) return null;
  const whole = num(Number(value.n));
  return value.d === 1n ? whole : div(whole, num(Number(value.d)));
}

/** A positive count of x as gears, `x`, `3x` or `2x : 3`; null if too big. */
function gears(count: q.Rational): Expr | null {
  if (!fits(count.n) || !fits(count.d)) return null;
  const xs = count.n === 1n ? xVar() : mul(num(Number(count.n)), xVar());
  return count.d === 1n ? xs : div(xs, num(Number(count.d)));
}

/**
 * A pan's side written from its pieces, a·x + b: the x pieces first, then the one number
 * piece (`2x + 8`, `2x − 5`, `2x`); springs after the number they lift, as `20 − x` is
 * written. A pan with nothing on it is `0`. Null when a number would be too long for a
 * line (architecture, Checker rules).
 */
export function sideExpr(a: q.Rational, b: q.Rational): Expr | null {
  const xs = q.isZero(a) ? null : gears(magnitude(a));
  const ns = q.isZero(b) ? null : quantity(magnitude(b));
  if ((!q.isZero(a) && xs === null) || (!q.isZero(b) && ns === null)) return null;
  const positive = b.n > 0n;
  if (xs === null) {
    if (ns === null) return num(0);
    return positive ? ns : sub(num(0), ns);
  }
  if (a.n > 0n) {
    if (ns === null) return xs;
    return positive ? add(xs, ns) : sub(xs, ns);
  }
  const lifted = sub(ns !== null && positive ? ns : num(0), xs);
  return ns !== null && !positive ? sub(lifted, ns) : lifted;
}

/** A pan's side as a·x + b: its gear count over its divider, and its number. */
export interface Linear {
  a: q.Rational;
  b: q.Rational;
}

export function linearSide(expr: Expr): Linear {
  const linear = toLinear(expr);
  assert(linear.kind === 'linear', 'the pans hold only linear equations');
  return { a: linear.a, b: linear.b };
}

function sameSide(m: Expr, n: Expr): boolean {
  const [x, y] = [linearSide(m), linearSide(n)];
  return q.equals(x.a, y.a) && q.equals(x.b, y.b);
}

/** The same pieces on each pan: the same x and the same number, however they are written. */
export function sameLayout(a: Equation, b: Equation): boolean {
  return sameSide(a.left, b.left) && sameSide(a.right, b.right);
}

/**
 * The pans after `delta` is added to one pan's number pieces, which combine into one; or
 * null when the change is refused: a pan with no x pieces would weigh below 0, or a number
 * would be too long for a line. A pan that gets back to the last committed line's pieces
 * shows that line's side as it was written.
 */
function changedPans(stage: StageState, side: Side, delta: q.Rational): Equation | null {
  const { a, b } = linearSide(stage.pans[side]);
  const sum = q.add(b, delta);
  if (q.isZero(a) && q.compare(sum, q.zero) < 0) return null;
  const written = lastCommitted(stage)[side];
  const back = linearSide(written);
  const expr = q.equals(back.a, a) && q.equals(back.b, sum) ? written : sideExpr(a, sum);
  if (expr === null) return null;
  return side === 'left' ? { left: expr, right: stage.pans.right } : { ...stage.pans, right: expr };
}

/** Whether the equation has one solution, the stage's n. */
function holdsSolution(equation: Equation, n: number): boolean {
  const solution = solve(equation);
  return solution.kind === 'one' && q.equals(solution.x, q.rational(n));
}

/**
 * The stage after a balance move (a tray drop or take, or a split: room/splitter.ts) put
 * `pans` on the scale: exploring, at the dial's x. When the pans' equation has the stage's
 * solution again and isn't the last committed line's, the move is complete (`WayUsed`);
 * with Balance `auto` its line is written, unless it is the answer line. The line goes
 * through the checker like any line, so a line it would refuse is never written.
 */
export function balanceMove(room: RoomState, pans: Equation): RoomStep {
  const { stage } = room;
  const spec = currentStageSpec(room);
  const moved: StageState = { ...stage, pans, actingOut: false };
  const n = stageSolution(machineEquation(spec, stage.machine));
  if (!holdsSolution(pans, n) || sameLayout(pans, lastCommitted(stage))) {
    return { room: withStage(room, moved), events: [] };
  }
  const at = { roomId: room.spec.id, stage: room.stageIndex };
  const events: RoomEvent[] = [{ type: 'WayUsed', ...at, way: 'balance' }];
  if (balanceFading(spec) !== 'auto' || isAnswerLine(pans, n)) {
    return { room: withStage(room, moved), events };
  }
  const tokenized = tokenize(formatEquation(pans));
  assert(tokenized.ok, `the pans' equation isn't in pad tokens: ${formatEquation(pans)}`);
  const verdict = check(committedEquations(stage.lines), tokenized.tokens);
  if (verdict.kind !== 'valid') return { room: withStage(room, moved), events };
  events.push({ type: 'LineAccepted', ...at, source: 'balance', progress: lineProgress(verdict) });
  return { room: withStage(room, commitLine(moved, tokenized.tokens, 'balance', verdict)), events };
}

/**
 * A piece from the tray dropped on a pan (`tray/drop`): the weight or float with the
 * number the stepper shows. Null, so the action is ignored and the piece slides back, when
 * the tray doesn't work now or the drop is refused.
 */
export function dropOnPan(
  room: RoomState,
  tools: readonly ToolId[],
  side: Side,
  kind: TrayKind,
): RoomStep | null {
  if (!trayWorks(room, tools)) return null;
  const value = q.rational(room.stage.tray[kind]);
  const pans = changedPans(room.stage, side, kind === 'weight' ? value : q.neg(value));
  return pans ? balanceMove(room, pans) : null;
}

/**
 * A weight or float dragged off a pan into the tray (`tray/take`), named by its key on the
 * scale (`left-weight-0`). Null, so the action is ignored and the piece slides back, when
 * the tray doesn't work now, the pan has no such weight or float (gears and springs stay
 * on), or taking it is refused.
 */
export function takeOffPan(
  room: RoomState,
  tools: readonly ToolId[],
  side: Side,
  key: string,
): RoomStep | null {
  if (!trayWorks(room, tools)) return null;
  const piece = sidePieces(room.stage.pans[side], side).find((each) => each.key === key);
  if (!piece || !isNumberPiece(piece)) return null;
  const delta = piece.kind === 'weight' ? q.neg(piece.value) : piece.value;
  const pans = changedPans(room.stage, side, delta);
  return pans ? balanceMove(room, pans) : null;
}

/** A piece on the tray as the scale draws pieces: the weight or float with its number. */
export function trayPiece(kind: TrayKind, value: number): PieceView {
  return {
    key: `tray-${kind}`,
    kind,
    value: q.rational(value),
    label: numberPieceLabel({ kind, value: q.rational(value) }),
    divisorLabel: null,
  };
}

/** What the tray shows. Flat, for selectors. */
export interface TrayView {
  /** The number on the tray's weight, and on its float. */
  weight: number;
  float: number;
  /** Whether a drag or the stepper does anything now (not while the machine is jammed). */
  works: boolean;
  /** It wiggles once (hint level 1): the game offers it for the first time. */
  wiggle: boolean;
}

/** The tray of the stage in play, or null when the game doesn't offer it. */
export function trayView(room: RoomState | null, tools: readonly ToolId[]): TrayView | null {
  if (!room || !trayOffered(room, tools)) return null;
  const { stage } = room;
  return {
    weight: stage.tray.weight,
    float: stage.tray.float,
    works: trayWorks(room, tools),
    wiggle: stage.hintLevel >= 1,
  };
}
