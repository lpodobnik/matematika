// The splitter (architecture Pattern 1, Balance moves; GDD, Three ways to solve: Balance;
// story 1.15). Pure: when the splitter is offered, what its stepper does, and what
// dropping it over the scale does to the stage.
//
//   offered    in an open stage once Balance is earned, from the moment one side holds only
//              x pieces, more than one x (`2x = 18`), then for the rest of the stage, a
//              reset included (`rememberSplitter`). It does nothing while the machine is
//              jammed
//   parts      2–9 (`tuning.splitterMinParts`–`splitterMaxParts`), set by a stepper (−
//              and +); a stage arrives with 2, and reset keeps what he set
//   a split    dropped anywhere over the scale: each side's pieces separate into n equal
//              groups, and every group but one fades away, on both sides (`splitGroups`
//              says what the groups hold). Each side's gear count and number are divided by
//              the parts (`2x = 18` by 2 gives `x = 9`). It is a Balance move like a tray
//              move (room/tray.ts, `balanceMove`): the pans stay weighed at the dial's x
//              (story 1.16), `WayUsed` fires, and with Balance `auto` the move is written as
//              done, `2x : 2 = 18 : 2`, then its result, unless that is `x = n`, which he
//              writes himself into the `x = ☐` that appears then (room/fading.ts)
//   uneven     a gear count or number the parts don't divide is refused, never a jam: the
//              pieces start to separate, show what is left over (`splitGroups`), and slide
//              back together. Nothing changes and nothing is written
//
// A side's gear count is how many x-gears (or springs) stand on it, over the divider they
// share: `2x : 3` is two gears on a divider of 3, so it splits by 2 into `x : 3`, while
// `x : 3` can't be split at all. A side's number is its number pieces combined.

import { tuning } from '@/config/tuning';
import { div, type Equation, type Expr, num } from '@/math/expr';
import * as q from '@/math/rational';
import { chainBlankWaits } from '@/room/chain';
import { committedEquations } from '@/room/notebook';
import type { RoomStep } from '@/room/room';
import { type PieceView, sideViews } from '@/room/scale';
import { storyWaits } from '@/room/story';
import { balanceMove, type Linear, linearSide, readyToSplit, sideExpr } from '@/room/tray';
import type { RoomState, Side, ToolId } from '@/room/types';

/**
 * Whether the game offers the splitter now: Balance is earned, the stage is open, and one
 * side has held only x pieces, more than one x, at some point this stage: on the pans, in a
 * committed line, or after a Balance move (story 1.15). Lane C's handovers read this too.
 */
export function splitterOffered(room: RoomState, tools: readonly ToolId[]): boolean {
  const { stage } = room;
  if (!tools.includes('balance') || stage.phase !== 'open') return false;
  // Story 4.5 review: nor while a story waits to be written (a reset keeps `splitterSeen`).
  if (storyWaits(room)) return false;
  return (
    stage.balance.splitterSeen ||
    readyToSplit(stage.pans) ||
    committedEquations(stage.lines).some(readyToSplit)
  );
}

/**
 * The room with its stage remembering that the splitter is offered (AC 10: from that moment
 * "for the rest of the stage"), so a reset that takes away the line or the pans that
 * offered it keeps it: `2x = 18` typed, then a reset (story 1.15 review). The root reducer
 * calls it after every room step, as it does `rememberTray`. The same room when nothing
 * changes.
 */
export function rememberSplitter(room: RoomState, tools: readonly ToolId[]): RoomState {
  const { stage } = room;
  if (stage.balance.splitterSeen || !splitterOffered(room, tools)) return room;
  return { ...room, stage: { ...stage, balance: { ...stage.balance, splitterSeen: true } } };
}

/**
 * Whether the splitter can be set or dropped over the scale now: it is offered, and the
 * machine isn't jammed (while jammed he can only edit the draft, reset or leave).
 */
export function splitterWorks(room: RoomState, tools: readonly ToolId[]): boolean {
  // Story 4.2 review: nor while a chain run's result waits as a blank (Undo `blanks`).
  return splitterOffered(room, tools) && room.stage.jam === null && !chainBlankWaits(room);
}

/** Whether a step of the stepper changes the parts: not below 2, nor above 9. */
export function canStepParts(parts: number, by: 1 | -1): boolean {
  const next = parts + by;
  return next >= tuning.splitterMinParts && next <= tuning.splitterMaxParts;
}

/**
 * The stepper (`splitter/step`): the parts go up or down by one, within 2–9. The UI repeats
 * it while a button is held. Null, so the action is ignored, when the splitter doesn't work
 * now or the parts are at an end.
 */
export function stepSplitter(
  room: RoomState,
  tools: readonly ToolId[],
  by: 1 | -1,
): RoomStep | null {
  const { stage } = room;
  if (!splitterWorks(room, tools) || !canStepParts(stage.splitter, by)) return null;
  return { room: { ...room, stage: { ...stage, splitter: stage.splitter + by } }, events: [] };
}

/**
 * What a split does to the pans: divides them evenly, with the move as done (`2x : 2 =
 * 18 : 2`) and its result (`x = 9`), or not.
 */
export type SplitOutcome = { kind: 'even'; line: Equation; pans: Equation } | { kind: 'uneven' };

function divides(side: Linear, parts: bigint): boolean {
  return side.a.n % parts === 0n && side.b.n % parts === 0n;
}

/**
 * The pans split into `parts`: each side's gear count and number divided by the parts, the
 * move written as each side as the pans show it, divided (`(2x + 4) : 2` where a side has
 * more than one term). Uneven when any of them doesn't divide; null when a side's number
 * would be too long for a line (only a line with two numbers near 9 999 999 could do that).
 */
export function splitOutcome(pans: Equation, parts: number): SplitOutcome | null {
  const by = BigInt(parts);
  const sides = [linearSide(pans.left), linearSide(pans.right)];
  if (!sides.every((side) => divides(side, by))) return { kind: 'uneven' };
  const share = q.rational(parts);
  const [left, right] = sides.map(({ a, b }) => sideExpr(q.div(a, share), q.div(b, share)));
  if (!left || !right) return null;
  const divided = (side: Expr) => div(side, num(parts));
  return {
    kind: 'even',
    line: { left: divided(pans.left), right: divided(pans.right) },
    pans: { left, right },
  };
}

/**
 * The splitter dropped over the scale (`splitter/split`), at the parts it is set to: an
 * even split is a Balance move (room/tray.ts). Null, so the action is ignored and the
 * splitter goes back to its place, when it doesn't work now, or the split is uneven or
 * refused; the scene shows an uneven one separating and sliding back (`splitGroups`).
 */
export function splitBothPans(room: RoomState, tools: readonly ToolId[]): RoomStep | null {
  if (!splitterWorks(room, tools)) return null;
  const outcome = splitOutcome(room.stage.pans, room.stage.splitter);
  return outcome?.kind === 'even' ? balanceMove(room, outcome) : null;
}

/** One side's pieces as a split separates them: n equal groups, and what is left over. */
export interface SideGroups {
  /** One list of pieces per part, all alike: a share of the gears and of the number. */
  groups: PieceView[][];
  /** What doesn't make equal groups (`23` by 2 leaves a weight of 1); empty when even. */
  leftover: PieceView[];
}

/** Both sides separated by a split, for the scene to show (story 1.15). */
export interface SplitGroups {
  parts: number;
  even: boolean;
  left: SideGroups;
  right: SideGroups;
}

/** The whole share of `value` per part, and what is left over, keeping the sign and divider. */
function shareOf(value: q.Rational, parts: bigint): { share: q.Rational; rest: q.Rational } {
  const negative = value.n < 0n;
  const size = negative ? -value.n : value.n;
  const signed = (n: bigint) => q.rational(negative ? -n : n, value.d);
  return { share: signed(size / parts), rest: signed(size % parts) };
}

function views(a: q.Rational, b: q.Rational, side: Side, tag: string): PieceView[] {
  const expr = sideExpr(a, b);
  if (!expr) return [];
  return sideViews(expr, side).map((piece) => ({ ...piece, key: `${piece.key}@${tag}` }));
}

function sideGroups(expr: Expr, side: Side, parts: number): SideGroups {
  const by = BigInt(parts);
  const { a, b } = linearSide(expr);
  const xs = shareOf(a, by);
  const ns = shareOf(b, by);
  return {
    groups: Array.from({ length: parts }, (_, i) => views(xs.share, ns.share, side, `${i}`)),
    leftover: views(xs.rest, ns.rest, side, 'rest'),
  };
}

/**
 * What a split at `parts` shows on each side before it lands or slides back: each side's
 * pieces separated into `parts` equal groups, with what is left over. For an even split
 * nothing is left over, and one group is the side's result.
 */
export function splitGroups(pans: Equation, parts: number): SplitGroups {
  return {
    parts,
    even: splitOutcome(pans, parts)?.kind === 'even',
    left: sideGroups(pans.left, 'left', parts),
    right: sideGroups(pans.right, 'right', parts),
  };
}

/** What the splitter shows. Flat, for selectors. */
export interface SplitterView {
  /** The parts it is set to. */
  parts: number;
  /** Whether the stepper and a drop over the scale do anything now (not while jammed). */
  works: boolean;
  /** It wiggles once (hint level 1): the game offers it for the first time. */
  wiggle: boolean;
}

/** The splitter of the stage in play, or null when the game doesn't offer it. */
export function splitterView(
  room: RoomState | null,
  tools: readonly ToolId[],
): SplitterView | null {
  if (!room || !splitterOffered(room, tools)) return null;
  const { stage } = room;
  return {
    parts: stage.splitter,
    works: splitterWorks(room, tools),
    wiggle: stage.hintLevel >= 1,
  };
}
