// The tray (architecture Pattern 1, Balance moves; GDD, Three ways to solve: Balance; story
// 1.15). Pure: when the tray is offered, what its stepper does, and what a drop over the
// scale or a piece dragged off a side does to the stage.
//
// Every Balance move acts on both sides at once: "you can only do left what you do right".
//
//   offered    in an open stage once Balance is earned, from the moment one of these holds:
//              he met the tray before this stage; the dial has stood at its maximum this
//              stage without levelling the pans (his notch, or the machine's pin test
//              leaving it there: room/dial.ts, `dialMaxedAt`); a Balance move was made
//              this stage. Each is remembered, so it stays for the rest of the stage. It
//              does nothing while the machine is jammed (Pattern 2, Jams)
//   pieces     weights and floats only, each numbered 1–99 by a stepper (− and +); x-gears
//              and springs can't be added or dragged off
//   a drop     a piece from the tray let go anywhere over the scale sends one copy to each
//              side; the number pieces on each side then combine into one piece of their sum
//              (a weight if positive, a float if negative, nothing if 0)
//   drag-off   a weight or float dragged off a side takes the same number off both sides:
//              the same move as dropping a float (or a weight) of that number
//   refused    a move that would leave a side with no x pieces below 0 is refused, and the
//              piece slides back
//   one x      the pans stay weighed at the slider's x, with readouts (story 1.16; 1.15
//              weighed them at the stage's solution). A move acts on both sides, so at a
//              wrong x the scale stays out of balance through every move (room/scale.ts)
//   lines      with Balance `auto` the move is written as done, then its result, both from
//              `balance`: `2x + 5 − 5 = 23 − 5`, then `2x = 18`. A result `x = n` is left for
//              him to write, and once x is alone the notebook gives him `x = ☐` and the
//              check line as blanks (room/fading.ts, `withLastLines`). `WayUsed` fires once
//              per move. Balance `blanks` arrives in epic 2; until then, as with `blank`,
//              the pans move and nothing is written
//
// The splitter (room/splitter.ts) moves the same way (`balanceMove`).

import { tuning } from '@/config/tuning';
import { assert } from '@/lib/assert';
import { isAnswerLine, stageSolution } from '@/math/check';
import { add, div, type Equation, type Expr, maxNumber, mul, num, sub, xVar } from '@/math/expr';
import { toLinear } from '@/math/linear';
import * as q from '@/math/rational';
import type { RoomEvent } from '@/room/events';
import { withLastLines } from '@/room/fading';
import { writeWayLine } from '@/room/notebook';
import { isNumberPiece, numberPieceLabel, sidePieces } from '@/room/pieces';
import { currentStageSpec, machineEquation, type RoomStep } from '@/room/room';
import type { PieceView } from '@/room/scale';
import type {
  FadingMode,
  FirstUseId,
  RoomState,
  Side,
  StageSpec,
  StageState,
  ToolId,
  TrayKind,
} from '@/room/types';

/** The lowest number on the tray's pieces; the highest is `tuning.trayMaxNumber`. */
export const trayMinNumber = 1;

/**
 * Whether the game offers the tray now: Balance is earned, the stage is open, and he met
 * the tray before, the dial has been at its maximum without levelling the pans, or a
 * Balance move was made this stage (story 1.15). Lane C's handovers read this too.
 */
export function trayOffered(room: RoomState, tools: readonly ToolId[]): boolean {
  if (!tools.includes('balance') || room.stage.phase !== 'open') return false;
  // A stage Try values can't finish (room 4) offers it from the start (story 1.16).
  if (!currentStageSpec(room).ways.includes('try')) return true;
  const { balance } = room.stage;
  return balance.trayMet || balance.dialMaxed || balance.moves > 0;
}

/**
 * Whether the tray does anything now: it is offered, and the machine isn't jammed (while
 * jammed he can only edit the draft, reset or leave).
 */
export function trayWorks(room: RoomState, tools: readonly ToolId[]): boolean {
  return trayOffered(room, tools) && room.stage.jam === null;
}

/**
 * The room with its stage knowing he met the tray before (`save.progress.firstUse`), so
 * every later stage offers it at once. The root reducer hands in what he has met. The same
 * room when nothing changes.
 */
export function rememberTray(room: RoomState, met: readonly FirstUseId[]): RoomState {
  const { stage } = room;
  if (stage.balance.trayMet || !met.includes('tray')) return room;
  return withStage(room, { ...stage, balance: { ...stage.balance, trayMet: true } });
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

/** A side holding only x pieces, more than one x: `2x`, `27x`, `2x : 3`, `0 − 5x`. */
function onlyXs(side: Expr): boolean {
  const { a, b } = linearSide(side);
  return q.isZero(b) && (a.n > 1n || a.n < -1n);
}

/** Whether one side holds only x pieces, more than one x: the splitter's moment (room/splitter.ts). */
export function readyToSplit(pans: Equation): boolean {
  return onlyXs(pans.left) || onlyXs(pans.right);
}

/**
 * A Balance move before it is made: the move as done, which `auto` writes first
 * (`2x + 5 − 5 = 23 − 5`), and the pans after it, its result (`2x = 18`).
 */
export interface BalanceChange {
  line: Equation;
  pans: Equation;
}

/** One side's number after `delta`, or null when a side with no x pieces would weigh below 0. */
function shifted(side: Linear, delta: q.Rational): q.Rational | null {
  const sum = q.add(side.b, delta);
  return q.isZero(side.a) && q.compare(sum, q.zero) < 0 ? null : sum;
}

/**
 * `delta` on both sides at once: a positive one is a weight, a negative one a float (or a
 * weight dragged off). The move is written by appending it to each side as the pans show
 * it; the result combines each side's numbers into one. Null when the move is refused: a
 * side with no x pieces would weigh below 0, or a number would be too long for a line.
 */
export function onBothSides(pans: Equation, delta: q.Rational): BalanceChange | null {
  const [left, right] = [linearSide(pans.left), linearSide(pans.right)];
  const [leftSum, rightSum] = [shifted(left, delta), shifted(right, delta)];
  if (leftSum === null || rightSum === null) return null;
  const result = { left: sideExpr(left.a, leftSum), right: sideExpr(right.a, rightSum) };
  const amount = quantity(magnitude(delta));
  if (!result.left || !result.right || !amount || q.isZero(delta)) return null;
  const append = (side: Expr) => (delta.n > 0n ? add(side, amount) : sub(side, amount));
  return {
    line: { left: append(pans.left), right: append(pans.right) },
    pans: { left: result.left, right: result.right },
  };
}

/**
 * The stage after a Balance move (a tray drop, a drag-off, or an even split:
 * room/splitter.ts). The pans take the move's result, still weighed at the dial's x (story
 * 1.16). `WayUsed` fires. With Balance `auto` the move is written as done, then its result,
 * unless that is the answer line; once x is alone, the last two lines' blanks appear
 * (`withLastLines`). Each line goes through the checker like any line, against the lines
 * before the move, so the move and its result are one step: the result of `2x + 5 = 23`
 * minus 5 makes progress, of plus 3 doesn't. A line the checker wouldn't commit as valid
 * stops the writing.
 */
export function balanceMove(room: RoomState, change: BalanceChange): RoomStep {
  const { stage } = room;
  const spec = currentStageSpec(room);
  const at = { roomId: room.spec.id, stage: room.stageIndex };
  const events: RoomEvent[] = [{ type: 'WayUsed', ...at, way: 'balance' }];
  const balance = {
    ...stage.balance,
    moves: stage.balance.moves + 1,
    splitterSeen: stage.balance.splitterSeen || readyToSplit(change.pans),
  };
  let next: StageState = { ...stage, balance };
  if (balanceFading(spec) === 'auto') {
    const n = stageSolution(machineEquation(spec, stage.machine));
    const lines = isAnswerLine(change.pans, n) ? [change.line] : [change.line, change.pans];
    for (const line of lines) {
      const written = writeWayLine(next, line, 'balance', stage.lines);
      if (!written) break;
      next = written.stage;
      events.push({ type: 'LineAccepted', ...at, source: 'balance', progress: written.progress });
    }
  }
  return { room: withStage(room, withLastLines(spec, { ...next, pans: change.pans })), events };
}

/**
 * A piece from the tray dropped anywhere over the scale (`tray/drop`): the weight or float
 * with the number the stepper shows, one copy on each side. Null, so the action is ignored
 * and the piece slides back, when the tray doesn't work now or the move is refused.
 */
export function dropOnScale(
  room: RoomState,
  tools: readonly ToolId[],
  kind: TrayKind,
): RoomStep | null {
  if (!trayWorks(room, tools)) return null;
  const value = q.rational(room.stage.tray[kind]);
  const change = onBothSides(room.stage.pans, kind === 'weight' ? value : q.neg(value));
  return change ? balanceMove(room, change) : null;
}

/**
 * A weight or float dragged off a side (`tray/take`), named by its key on the scale
 * (`left-weight-0`): the same number comes off both sides. Null, so the action is ignored
 * and the piece slides back, when the tray doesn't work now, the side has no such weight or
 * float (gears and springs stay on), or the move is refused.
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
  const change = onBothSides(room.stage.pans, delta);
  return change ? balanceMove(room, change) : null;
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
