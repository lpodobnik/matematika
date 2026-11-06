// The hint button (story 1.16; GDD, Player Assistance; architecture Pattern 2, Hints). Pure:
// when it works, what each press shows, and the exact next move, from `math/steps.ts`.
// Hints are free and never recorded: a press changes nothing in the room, pays nothing and
// fires no event. The root reducer keeps the presses in `ui.hint` (`pressHint`), and an
// action of his ends them (`hintAfter`).
//
//   first press   the current step's handover tag (room/handover.ts), met or not: the
//                 earliest step that applies. Where none applies (the machine is jammed, or
//                 a typed line is acted out), the step the next move belongs to. While the
//                 pin is offered, the pin's own question tag
//   second press  the exact next move, while the first press's tag shows; each press after
//                 it shows the move again
//
// The next move (`nextMove`), from where he is:
//   slide   Try values, the dial not yet where the pans level: two notches toward the
//           stage's solution and back. In a Balance stage before the tray is offered,
//           toward the dial's end, where the tray comes
//   answer  the dial levels the pans (Try), or the pans hold x alone against the solution
//           (Balance), and no answer line yet: write `x = n` (or its blank)
//   check   after the answer line: the check line, the first equation with n for x
//   tray    Balance: the number beside x off both sides, as a balloon of it (`2x + 5 = 23`:
//           −5), or a weight of it on both sides where it is taken away (`2x − 5 = 13`: 5)
//   split   Balance: x's count on its side, with no number beside it (`2x = 18`: by 2)
//   pin     while the pin is offered: a prediction has no next move to show

import { tuning } from '@/config/tuning';
import { isAnswerLine, stageSolution } from '@/math/check';
import { hasX } from '@/math/expr';
import { toLinear } from '@/math/linear';
import * as q from '@/math/rational';
import { nextStep, type StepWay } from '@/math/steps';
import { isOnDial } from '@/room/dial';
import { handoverApplies, handoverOrder } from '@/room/handover';
import { pinOffered } from '@/room/pin';
import { currentStageSpec, machineEquation } from '@/room/room';
import { splitterOffered } from '@/room/splitter';
import { trayOffered } from '@/room/tray';
import type { HandoverId, Phase, RoomState, ToolId, TrayKind } from '@/room/types';

/** The hint button's presses in the stage in play, until an action of his ends them. */
export interface HintState {
  /** 1: the current step's tag shows; 2: the exact next move. */
  level: 1 | 2;
  /** Presses so far: each one starts the tag's pop and the move's ghost again. */
  presses: number;
}

/** The exact next move, as the second press shows it. */
export type HintMove =
  /** The dial: its knob's ghost goes two notches this way and back. */
  | { kind: 'slide'; direction: 1 | -1 }
  /** The answer line, `x = n`. */
  | { kind: 'answer'; x: number }
  /** The check line, with n for x. */
  | { kind: 'check'; x: number }
  /** A tray piece onto the scale: a balloon takes `amount` off both sides, a weight adds it. */
  | { kind: 'tray'; piece: TrayKind; amount: number }
  /** The splitter onto the scale, set to `parts`. */
  | { kind: 'split'; parts: number }
  /** The pin's question again. */
  | { kind: 'pin' };

/** What a press shows a tag for: a handover step, or the pin's question. */
export type HintStep = HandoverId | 'pin';

/** What the hint shows now. */
export interface HintView {
  level: 1 | 2;
  /** The step whose tag the first press shows (and the second, where it has no move). */
  step: HintStep;
  /** The second press's move; null on the first press, or where there is none to show. */
  move: HintMove | null;
  presses: number;
}

/** Phases he can act in, so the button works: from arrival until the stage locks. */
const hintPhases: ReadonlySet<Phase> = new Set<Phase>(['arrive', 'poke', 'pin', 'open']);

/**
 * Lane A of story 1.16 adds an `answer` handover (x alone on the pans, no answer line yet),
 * before `check`. Until it is in `handoverOrder`, the answer belongs to `write`.
 */
const answerHandover = 'answer';

function answerStep(): HandoverId {
  const order: readonly string[] = handoverOrder;
  return order.includes(answerHandover) ? (answerHandover as HandoverId) : 'write';
}

function hasLine(room: RoomState, kind: 'answer' | 'check'): boolean {
  return room.stage.lines.some((line) => line.verdict.kind === kind);
}

function solutionOf(room: RoomState): number {
  return stageSolution(machineEquation(currentStageSpec(room), room.stage.machine));
}

/**
 * The way the hint shows: Try values where the stage lists it and the dial reaches the
 * solution; else Balance, once he has earned it; else Try where listed. Null for none.
 */
function wayOf(room: RoomState, tools: readonly ToolId[], n: number): StepWay | null {
  const spec = currentStageSpec(room);
  const tries = spec.ways.includes('try');
  if (tries && spec.dial !== 'locked' && isOnDial(spec.dial, n)) return 'try';
  if (spec.ways.includes('balance') && tools.includes('balance')) return 'balance';
  return tries ? 'try' : null;
}

/** Toward the solution on the dial: right where it is above the knob. */
function slideToward(target: number, x: number): HintMove | null {
  if (target === x) return null;
  return { kind: 'slide', direction: target > x ? 1 : -1 };
}

/**
 * Balance's next move from the pans (`math/steps.ts`, `nextStep`): the number beside x off
 * both sides, or the split by x's count. The tray's pieces go up to `tuning.trayMaxNumber`,
 * so a bigger number comes off in more than one move. Null where Balance can't go on.
 */
function balanceMove(room: RoomState, tools: readonly ToolId[], n: number): HintMove | null {
  const { stage } = room;
  const spec = currentStageSpec(room);
  const pans = stage.pans;
  if (isAnswerLine(pans, n)) return { kind: 'answer', x: n };
  const next = nextStep(machineEquation(spec, stage.machine), pans, 'balance');
  if (next === null) return null;
  const xSide = toLinear(hasX(pans.left) ? pans.left : pans.right);
  if (xSide.kind !== 'linear') return null;
  if (!q.isZero(xSide.b)) {
    if (!trayOffered(room, tools)) {
      // The tray comes once the dial has stood at its end without levelling the pans.
      const { dial } = spec;
      return dial === 'locked' ? null : slideToward(dial.max, stage.dialX);
    }
    const amount = Math.min(Math.abs(Number(xSide.b.n)), tuning.trayMaxNumber);
    return { kind: 'tray', piece: xSide.b.n > 0n ? 'float' : 'weight', amount };
  }
  const parts = Number(xSide.a.n);
  if (!splitterOffered(room, tools) || parts > tuning.splitterMaxParts) return null;
  return { kind: 'split', parts };
}

/** The exact next move from where he is, or null where there is none to show. */
export function nextMove(room: RoomState, tools: readonly ToolId[]): HintMove | null {
  if (!hintPhases.has(room.stage.phase)) return null;
  if (pinOffered(room)) return { kind: 'pin' };
  if (hasLine(room, 'check')) return null;
  const n = solutionOf(room);
  if (hasLine(room, 'answer')) return { kind: 'check', x: n };
  const way = wayOf(room, tools, n);
  if (way === 'try') {
    return room.stage.dialX === n ? { kind: 'answer', x: n } : slideToward(n, room.stage.dialX);
  }
  return way === 'balance' ? balanceMove(room, tools, n) : null;
}

/** The handover step a move belongs to, for a first press where no step applies. */
function stepOfMove(move: HintMove, room: RoomState, tools: readonly ToolId[]): HintStep {
  switch (move.kind) {
    case 'slide':
      return 'dial';
    case 'answer':
      return wayOf(room, tools, move.x) === 'try' ? 'write' : answerStep();
    case 'check':
      return 'check';
    case 'tray':
      return room.stage.balance.moves > 0 ? 'balance-goal' : 'tray';
    case 'split':
      return 'splitter';
    case 'pin':
      return 'pin';
  }
}

/**
 * The step the first press shows a tag for: the pin's question while the pin is offered;
 * else the earliest handover step that applies, met or not; else the step of the next move.
 * Null when he can't act, or there is nothing to show.
 */
export function hintStep(room: RoomState, tools: readonly ToolId[]): HintStep | null {
  if (!hintPhases.has(room.stage.phase)) return null;
  if (pinOffered(room)) return 'pin';
  const applying = handoverOrder.find((id) => handoverApplies(id, room, tools));
  if (applying) return applying;
  const move = nextMove(room, tools);
  return move ? stepOfMove(move, room, tools) : null;
}

/** Whether the hint button does anything now: he can act, and there is a step to show. */
export function hintWorks(room: RoomState | null, tools: readonly ToolId[]): boolean {
  return room !== null && hintStep(room, tools) !== null;
}

/** A press of the hint button: the first shows the step's tag, the next ones the move. */
export function pressHint(hint: HintState | null): HintState {
  return { level: hint ? 2 : 1, presses: (hint?.presses ?? 0) + 1 };
}

/**
 * What an action means for the hint, as the root reducer names it: a `press` of the
 * button; one that `ends` it: an action of his that did something to the room, or a room
 * entered; or `other`: the game's own actions, the clock's, the notebook's slide on a
 * phone, an action that did nothing, and the tray's and splitter's steppers, which set a
 * tool for the move rather than make one, so he can set the number the hint names while it
 * shows.
 */
export type HintAction = 'press' | 'ends' | 'other';

/**
 * The hint after an action: a press where the button works adds a press; an action that
 * `ends` it ends it; and it ends when the stage in play changes, or he can no longer act
 * in it.
 */
export function hintAfter(
  hint: HintState | null,
  action: HintAction,
  before: RoomState | null,
  after: RoomState | null,
  tools: readonly ToolId[],
): HintState | null {
  if (action === 'press') return hintWorks(after, tools) ? pressHint(hint) : hint;
  if (!hint) return hint;
  if (action === 'ends' || !after || !before) return null;
  const sameStage = before.spec.id === after.spec.id && before.stageIndex === after.stageIndex;
  return sameStage && hintWorks(after, tools) ? hint : null;
}

/** What the hint shows now, or null: no presses, or nothing to show in the stage in play. */
export function hintView(
  room: RoomState | null,
  tools: readonly ToolId[],
  hint: HintState | null,
): HintView | null {
  if (!hint || !room) return null;
  const step = hintStep(room, tools);
  if (!step) return null;
  const move = hint.level === 2 ? nextMove(room, tools) : null;
  return { level: hint.level, step, move, presses: hint.presses };
}

/** Whether the next move is written in the notebook: the answer line or the check line. */
export function inNotebook(move: HintMove): boolean {
  return move.kind === 'answer' || move.kind === 'check';
}
