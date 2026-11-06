// The splitter (architecture Pattern 1, Balance moves; Pattern 2, Jams; GDD, Three ways to
// solve: Balance). Pure: when the splitter is offered, what its stepper does, and what
// dragging it across both pans, or off them, does to the stage.
//
//   offered    with the tray: once Balance is earned, whenever a stage is open; it does
//              nothing while the machine is jammed, except to be dragged off the pans
//   parts      2–9 (`tuning.splitterMinParts`–`splitterMaxParts`), set by a stepper (−
//              and +); a stage arrives with 2, and reset keeps what he set
//   a split    dragged across both pans: each pan's number pieces first combine into one,
//              as after a drop (`2x = 23 − 5` becomes `2x = 18`), then each pan's gear
//              count and number is divided by the parts (`2x = 18` by 2 gives `x = 9`). The
//              move completes like any balance move (room/tray.ts, `balanceMove`): the pans
//              are weighed at the dial's x; once their equation has the stage's solution
//              again, `WayUsed` fires, and with Balance `auto` its line is written, unless
//              it is `x = n`, which he writes himself
//   uneven     a gear count or number that the parts don't divide jams the machine
//              (`jam.kind = 'split'`, `MachineJammed`). The splitter stays across the pans,
//              and the pans keep their pieces, until he drags it off (`liftSplitter`),
//              which clears the jam
//
// A pan's gear count is how many x-gears (or springs) stand on it, over the divider they
// share: `2x : 3` is two gears on a divider of 3, so it splits by 2 into `x : 3`, while
// `x : 3` can't be split at all.

import { tuning } from '@/config/tuning';
import type { Equation } from '@/math/expr';
import * as q from '@/math/rational';
import type { RoomEvent } from '@/room/events';
import type { RoomStep } from '@/room/room';
import { balanceMove, type Linear, linearSide, sideExpr } from '@/room/tray';
import type { RoomState, StageState, ToolId } from '@/room/types';

/** Whether the game offers the splitter now: Balance is earned and the stage is open. */
export function splitterOffered(room: RoomState, tools: readonly ToolId[]): boolean {
  return tools.includes('balance') && room.stage.phase === 'open';
}

/**
 * Whether the splitter can be set or dragged across the pans now: it is offered, and the
 * machine isn't jammed (while jammed he can only edit the draft, drag the splitter off,
 * reset or leave).
 */
export function splitterWorks(room: RoomState, tools: readonly ToolId[]): boolean {
  return splitterOffered(room, tools) && room.stage.jam === null;
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

/** What a split does to the pans: divides them evenly, or not. */
export type SplitOutcome = { kind: 'even'; pans: Equation } | { kind: 'uneven' };

function divides(side: Linear, parts: bigint): boolean {
  return side.a.n % parts === 0n && side.b.n % parts === 0n;
}

/**
 * The pans split into `parts`: each pan's numbers combined into one, then its gear count
 * and number divided by the parts. Uneven when any of them doesn't divide; null when a
 * pan's combined number would be too long for a line (only a line with two numbers near
 * 9 999 999 could do that), so the split is refused.
 */
export function splitOutcome(pans: Equation, parts: number): SplitOutcome | null {
  const by = BigInt(parts);
  const sides = [linearSide(pans.left), linearSide(pans.right)];
  if (!sides.every((side) => divides(side, by))) return { kind: 'uneven' };
  const share = q.rational(parts);
  const [left, right] = sides.map(({ a, b }) => sideExpr(q.div(a, share), q.div(b, share)));
  if (!left || !right) return null;
  return { kind: 'even', pans: { left, right } };
}

/**
 * The splitter dragged across both pans (`splitter/split`), at the parts it is set to. An
 * even split is exploring, like a tray move: it ends acting out and completes as any
 * balance move does. An uneven one jams the machine (`MachineJammed`, kind `split`): the
 * pans keep their pieces and are weighed at the dial's x, the splitter stays across them,
 * and `jamsInARow` counts it as a jam. Null, so the action is ignored and the splitter
 * slides back, when it doesn't work now or the split is refused.
 */
export function splitBothPans(room: RoomState, tools: readonly ToolId[]): RoomStep | null {
  if (!splitterWorks(room, tools)) return null;
  const { stage } = room;
  const outcome = splitOutcome(stage.pans, stage.splitter);
  if (!outcome) return null;
  if (outcome.kind === 'even') return balanceMove(room, outcome.pans);
  const events: RoomEvent[] = [{ type: 'MachineJammed', roomId: room.spec.id, kind: 'split' }];
  const jammed: StageState = {
    ...stage,
    jam: { kind: 'split', parts: stage.splitter },
    jamsInARow: stage.jamsInARow + 1,
    actingOut: false,
  };
  return { room: { ...room, stage: jammed }, events };
}

/**
 * The splitter dragged off the pans (`splitter/lift`): it clears a split jam, and the pans
 * are as they were before the split. Null, so the action is ignored, when the machine isn't
 * jammed on a split.
 */
export function liftSplitter(room: RoomState): RoomStep | null {
  const { stage } = room;
  if (stage.jam?.kind !== 'split') return null;
  return { room: { ...room, stage: { ...stage, jam: null } }, events: [] };
}

/** What the splitter shows. Flat, for selectors. */
export interface SplitterView {
  /** The parts it is set to, or, while it lies across the pans, the parts it jammed on. */
  parts: number;
  /** Whether the stepper and a drag across the pans do anything now (not while jammed). */
  works: boolean;
  /** A split jammed the machine: the splitter lies across the pans until he drags it off. */
  onPans: boolean;
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
  const onPans = stage.jam?.kind === 'split';
  return {
    parts: stage.jam?.kind === 'split' ? stage.jam.parts : stage.splitter,
    works: splitterWorks(room, tools),
    onPans,
    wiggle: stage.hintLevel >= 1,
  };
}
