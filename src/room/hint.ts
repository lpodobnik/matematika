// The hint button (story 1.16; GDD, Player Assistance; architecture Pattern 2, Hints). Pure:
// when it works, what each press shows, and the exact next move, from `math/steps.ts`.
// Hints are free and never recorded: a press changes nothing in the room, pays nothing and
// fires no event. The root reducer keeps the presses in `ui.hint` (`pressHint`), and an
// action of his ends them (`hintAfter`).
//
//   first press   the current step's handover tag (room/handover.ts), met or not: the
//                 earliest step that applies. Where none applies, the step the next move
//                 belongs to. While the pin is offered, the pin's own question tag. While
//                 the machine is jammed, the `jam` step: the line doesn't hold
//   second press  the exact next move, while the first press's tag shows; each press after
//                 it shows the move again. While jammed: delete the line and write again
//
// The next move (`nextMove`), from where he is:
//   jam     while the machine is jammed on a wrong line: every other control is frozen, so
//           the only move is to delete the line (the draft and the delete key pulse) and
//           write again (story 1.16 review)
//   slide   Try values, the dial not yet where the pans level: two notches toward the
//           stage's solution and back. In a Balance stage before the tray is offered,
//           toward the dial's end, where the tray comes
//   answer  the dial levels the pans (Try), or the pans hold x alone against the solution
//           (Balance; room/handover.ts, `answerOnPans`, the one rule for x alone), and no
//           answer line yet: write `x = n` (or its blank)
//   check   after the answer line: the check line, the first equation with n for x, or n
//           in its blank where the check line is a template
//   tray    Balance: the number beside x off both sides, as a balloon of it (`2x + 5 = 23`:
//           −5), or a weight of it on both sides where it is taken away (`2x − 5 = 13`: 5).
//           Where x is single but a pan holds more than one number piece (`x = 23 − 14`),
//           the piece that clears one of them, as any tray move combines each pan's numbers
//   split   Balance: x's count on its side, with no number beside it (`2x = 18`: by 2);
//           never fewer than 2 parts
//   pin     while the pin is offered: a prediction has no next move to show
//   chain   Undo (story 4.1): the last link's inverse, the operation and its number

import { tuning } from '@/config/tuning';
import { inverseOf, type LinkOp, lastLink } from '@/math/chain';
import { stageSolution } from '@/math/check';
import { type Equation, hasX } from '@/math/expr';
import { toLinear } from '@/math/linear';
import * as q from '@/math/rational';
import { nextStep, type StepWay } from '@/math/steps';
import { chainWorks, pansChain, undoFading } from '@/room/chain';
import { isOnDial } from '@/room/dial';
import { answerOnPans, handoverApplies, handoverOrder } from '@/room/handover';
import { workedExample } from '@/room/help';
import { isNumberPiece, type NumberPiece, panPieces } from '@/room/pieces';
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
  /**
   * The check line, with n for x; `template` where it is a line with x blanked to fill
   * (rooms 1–4), so the hint says only what goes in the blank.
   */
  | { kind: 'check'; x: number; template: boolean }
  /** A tray piece onto the scale: a balloon takes `amount` off both sides, a weight adds it. */
  | { kind: 'tray'; piece: TrayKind; amount: number }
  /** The splitter onto the scale, set to `parts`. */
  | { kind: 'split'; parts: number }
  /** The pin's question again. */
  | { kind: 'pin' }
  /** The jammed line: delete it and write again (the draft and the delete key pulse). */
  | { kind: 'jam' }
  /** Story 4.1: the gear chain's last link, run backward with this operation and number. */
  | { kind: 'chain'; op: LinkOp; n: number }
  /** Story 4.1 review: the number for the blank a chain run left (Undo `blanks`, `4x = ☐`). */
  | { kind: 'blank'; value: number };

/**
 * What a press shows a tag for: a handover step, the pin's question, or the jam (the line
 * doesn't hold; story 1.16 review).
 */
export type HintStep = HandoverId | 'pin' | 'jam' | 'blank';

/** What the hint shows now. */
export interface HintView {
  /** The higher of the button's level and the stage's help (story 2.7), 1–4. */
  level: 1 | 2 | 3 | 4;
  /** The step whose tag the first press shows (and the second, where it has no move). */
  step: HintStep;
  /** The second press's move; null on the first press, or where there is none to show. */
  move: HintMove | null;
  presses: number;
  /** Level 4: the same kind of equation with other numbers, solved (room/help.ts). */
  example: Equation[] | null;
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
 * The way the hint shows: Balance once he has made a Balance move in the stage (story 2.8
 * review: room 5 takes both ways, and a hint mid-Balance must go on with Balance); else Undo
 * where the stage lists it, the chain is earned and the pans are a chain (story 4.1: the
 * chain is the new idea from room 8 on); else Try values where the stage lists it and the
 * dial reaches the solution; else Balance, once he has earned it; else Try where listed.
 * Null for none.
 */
export function wayOf(room: RoomState, tools: readonly ToolId[], n: number): StepWay | null {
  const spec = currentStageSpec(room);
  const tries = spec.ways.includes('try');
  const balances = spec.ways.includes('balance') && tools.includes('balance');
  const undoes = spec.ways.includes('undo') && tools.includes('chain');
  if (balances && room.stage.balance.moves > 0) return 'balance';
  if (undoes && pansChain(room) !== null) return 'undo';
  if (tries && spec.dial !== 'locked' && isOnDial(spec.dial, n)) return 'try';
  if (balances) return 'balance';
  return tries ? 'try' : null;
}

/** Toward the solution on the dial: right where it is above the knob. */
function slideToward(target: number, x: number): HintMove | null {
  if (target === x) return null;
  return { kind: 'slide', direction: target > x ? 1 : -1 };
}

/** A tray move of a whole number, its amount capped at the tray's largest; null for none. */
function trayMove(piece: TrayKind, value: q.Rational): HintMove | null {
  if (!q.isInteger(value) || value.n === 0n) return null;
  const whole = value.n < 0n ? -value.n : value.n;
  return { kind: 'tray', piece, amount: Math.min(Number(whole), tuning.trayMaxNumber) };
}

/**
 * x is single on its pan (`x = 23 − 14`), but not alone: a pan holds more than one number
 * piece, so there is nothing to split, and the answer waits until the pans are simplified.
 * Any tray move combines each pan's numbers into one piece, so the hint names the one that
 * clears a piece off: a balloon's number added as a weight (always allowed), else the
 * smallest weight taken off as a balloon (the weights are then all on the number pan and
 * make the solution together, so none is too big to take).
 */
function clearingMove(pans: Equation): HintMove | null {
  const { left, right } = panPieces(pans);
  const numbers = [...left, ...right].filter(isNumberPiece);
  const balloon = numbers.find((piece) => piece.kind === 'float');
  if (balloon) return trayMove('weight', balloon.value);
  const smallest = numbers.reduce<NumberPiece | null>(
    (least, piece) => (least && q.compare(least.value, piece.value) <= 0 ? least : piece),
    null,
  );
  return smallest ? trayMove('float', smallest.value) : null;
}

/**
 * Balance's next move from the pans (`math/steps.ts`, `nextStep`): the number beside x off
 * both sides, or the split by x's count. The tray's pieces go up to `tuning.trayMaxNumber`,
 * so a bigger number comes off in more than one move. The answer once x is alone on the
 * pans by the one rule (`answerOnPans`, story 1.16 review), as after a split whose blank he
 * then jammed and deleted: `2x : 2 = 18 : 2` is one gear against a 9. Null where Balance
 * can't go on.
 */
function balanceMove(room: RoomState, tools: readonly ToolId[], n: number): HintMove | null {
  const { stage } = room;
  const spec = currentStageSpec(room);
  const pans = stage.pans;
  if (answerOnPans(room)) return { kind: 'answer', x: n };
  const next = nextStep(machineEquation(spec, stage.machine), pans, 'balance');
  if (next === null) return null;
  const xSide = toLinear(hasX(pans.left) ? pans.left : pans.right);
  if (xSide.kind !== 'linear') return null;
  const parts = Number(xSide.a.n);
  const splits = q.isZero(xSide.b) && parts >= tuning.splitterMinParts;
  if (!splits && !trayOffered(room, tools)) {
    // The tray comes once the dial has stood at its end without levelling the pans.
    const { dial } = spec;
    return dial === 'locked' ? null : slideToward(dial.max, stage.dialX);
  }
  if (!q.isZero(xSide.b)) return trayMove(xSide.b.n > 0n ? 'float' : 'weight', xSide.b);
  if (!splits) return clearingMove(pans);
  if (!splitterOffered(room, tools) || parts > tuning.splitterMaxParts) return null;
  return { kind: 'split', parts };
}

/**
 * A chain run's result waits as a blank (Undo `blanks`, `4x = ☐`; story 4.1 review): the
 * hint points at it, never at a Balance tool.
 */
function undoBlankWaits(room: RoomState): boolean {
  const { stage } = room;
  if (stage.templates.length === 0 || answerOnPans(room)) return false;
  if (undoFading(currentStageSpec(room)) !== 'blanks') return false;
  return stage.lines[stage.lines.length - 1]?.source === 'undo';
}

/**
 * Undo's next move (story 4.1): the answer once x is alone against the solution; else the
 * last link's inverse, while the chain works. Null where it doesn't (a blank waits, which
 * the notebook's own tag and blank pulse cover).
 */
function chainMove(room: RoomState, tools: readonly ToolId[], n: number): HintMove | null {
  if (answerOnPans(room)) return { kind: 'answer', x: n };
  const chain = pansChain(room);
  if (chain && undoBlankWaits(room)) return { kind: 'blank', value: chain.output };
  const link = chain ? lastLink(chain) : null;
  if (!link || !chainWorks(room, tools)) return null;
  return { kind: 'chain', ...inverseOf(link) };
}

/** The exact next move from where he is, or null where there is none to show. */
export function nextMove(room: RoomState, tools: readonly ToolId[]): HintMove | null {
  if (!hintPhases.has(room.stage.phase)) return null;
  if (room.stage.jam !== null) return { kind: 'jam' };
  if (pinOffered(room)) return { kind: 'pin' };
  if (hasLine(room, 'check')) return null;
  const n = solutionOf(room);
  if (hasLine(room, 'answer')) {
    return { kind: 'check', x: n, template: room.stage.templates.length > 0 };
  }
  const way = wayOf(room, tools, n);
  if (way === 'try') {
    return room.stage.dialX === n ? { kind: 'answer', x: n } : slideToward(n, room.stage.dialX);
  }
  if (way === 'undo') return chainMove(room, tools, n);
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
    case 'jam':
      return 'jam';
    case 'chain':
      return 'chain';
    case 'blank':
      return 'blank';
  }
}

/**
 * The step the first press shows a tag for: the jam while the machine is jammed (every
 * control but the notebook's delete is frozen then, story 1.16 review); the pin's question
 * while the pin is offered; else the earliest handover step that applies, met or not; else
 * the step of the next move. Null when he can't act, or there is nothing to show.
 */
export function hintStep(room: RoomState, tools: readonly ToolId[]): HintStep | null {
  if (!hintPhases.has(room.stage.phase)) return null;
  if (room.stage.jam !== null) return 'jam';
  if (pinOffered(room)) return 'pin';
  if (undoBlankWaits(room)) return 'blank';
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
  if (!room) return null;
  const level = Math.max(hint?.level ?? 0, room.stage.help);
  if (level === 0) return null;
  const step = hintStep(room, tools);
  if (!step) return null;
  const move = level >= 2 ? nextMove(room, tools) : null;
  const example = level === 4 ? workedExample(room, tools) : null;
  return {
    level: level as HintView['level'],
    step,
    move,
    presses: hint?.presses ?? 0,
    example,
  };
}

/**
 * Whether the next move is in the notebook: the answer line, the check line, deleting the
 * jammed line, or the gear chain, which sits at the top of the notebook (story 4.1).
 */
export function inNotebook(move: HintMove): boolean {
  return (
    move.kind === 'answer' ||
    move.kind === 'check' ||
    move.kind === 'jam' ||
    move.kind === 'chain' ||
    move.kind === 'blank'
  );
}
