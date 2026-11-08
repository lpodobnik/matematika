// The handover tags (story 1.15; GDD, Player Assistance). His first play showed he needs
// to be told the next step once: he didn't know to move the slider, nor that the notebook
// came next when the pans levelled. They are the deliberate exception to "no instructions".
// Pure: which single step applies now, when he has taken one, and the idle clock. The
// tags' text is in hr.ts (`hr.handover`); the scene and the notebook draw them.
//
//   dial          from arrival until he first turns a dial; the knob nudges itself too
//   write         his dial levels the pans, the answer line may be written, and none is
//   answer        x is alone on the pans and no answer line: `x = ☐` pulses (story 1.16)
//   check         after the answer line, before the check line
//   tray          the tray is offered, before his first Balance move in the stage
//   balance-goal  after a Balance move, until a side holds only x and the other no x
//   splitter      the splitter is offered and a side holds only x, more than one x (story
//                 1.16 review: not `x = 23 − 14`, where x is single but not yet alone)
//   story         a story stage waits for its story to be written (story 4.5)
//   chain         the gear chain works and he hasn't answered (story 4.1); it comes before
//                 the tray, since the chain is room 8's new idea
//
// Only one tag shows at a time: the earliest step that applies and that he hasn't met
// (`save.progress.firstUse` holds `handover-<id>`). Once he takes the step it is met, and
// its tag goes. After `tuning.hintIdleMs` without an action of his in the stage, the
// earliest step that applies shows again, met or not, until he acts. No tag shows while the
// pin is offered (its own question tag asks then), while the machine is jammed, or once the
// stage locks.

import { tuning } from '@/config/tuning';
import type { Equation, Expr } from '@/math/expr';
import { toLinear } from '@/math/linear';
import * as q from '@/math/rational';
import { chainWorks } from '@/room/chain';
import { dialTurnsNow } from '@/room/dial';
import { answerAllowed, notebookWrites } from '@/room/notebook';
import { aloneAgainst } from '@/room/pieces';
import { pinOffered } from '@/room/pin';
import { currentStageSpec } from '@/room/room';
import { scaleView, stageX } from '@/room/scale';
import { splitterOffered } from '@/room/splitter';
import { storyWaits } from '@/room/story';
import { hasXBalloons, overTheTray, readyToSplit, trayOffered } from '@/room/tray';
import type { FirstUseId, HandoverId, Phase, RoomState, ToolId } from '@/room/types';

/** The handover steps in the order he meets them; the earliest that applies comes first. */
export const handoverOrder: readonly HandoverId[] = [
  'story',
  'dial',
  'rewrite',
  'write',
  'answer',
  'check',
  'chain',
  'tray',
  'balance-goal',
  'splitter',
  'drag-off',
];

/** The id that marks a handover step met, in `save.progress.firstUse`. */
export function handoverMet(id: HandoverId): FirstUseId {
  return `handover-${id}`;
}

/** Phases a handover can show in: from arrival until the stage locks. */
const handoverPhases: ReadonlySet<Phase> = new Set<Phase>(['arrive', 'poke', 'pin', 'open']);

function hasLine(room: RoomState, kind: 'answer' | 'check'): boolean {
  return room.stage.lines.some((line) => line.verdict.kind === kind);
}

/**
 * A Balance move was made in this stage (`stage.balance.moves`), whatever its line mode
 * writes: with Balance `blank` or `blanks` a move writes no line (story 1.15 review; it
 * looked for a line written by Balance, so the goal tag never showed there).
 */
function balanced(room: RoomState): boolean {
  return room.stage.balance.moves > 0;
}

interface Side {
  a: q.Rational;
  b: q.Rational;
}

function sideOf(expr: Expr): Side | null {
  const linear = toLinear(expr);
  return linear.kind === 'linear' ? { a: linear.a, b: linear.b } : null;
}

/** The x side and the number side when one side holds only x and the other no x; or null. */
function isolatedSides(pans: Equation): { xs: Side; other: Side } | null {
  const left = sideOf(pans.left);
  const right = sideOf(pans.right);
  if (!left || !right) return null;
  const onlyX = (s: Side) => !q.isZero(s.a) && q.isZero(s.b);
  if (onlyX(left) && q.isZero(right.a)) return { xs: left, other: right };
  if (onlyX(right) && q.isZero(left.a)) return { xs: right, other: left };
  return null;
}

/**
 * Balance's goal is reached: one pan holds only x (`2x`, `x`) and the other only numbers,
 * as `2x = 18` or `x = 9`.
 */
export function xIsolated(pans: Equation): boolean {
  return isolatedSides(pans) !== null;
}

/**
 * The pans hold the answer: x alone against the stage's solution, `x = 9`, `9 = x` or a
 * split's `2x : 2 = 18 : 2`, by the one rule for x alone on the pans' pieces (story 1.16
 * review; room/pieces.ts, `aloneAgainst`), the rule the notebook's blanks and simplify
 * first use too. The hint reads it for its answer move (room/hint.ts).
 */
export function answerOnPans(room: RoomState): boolean {
  const against = aloneAgainst(room.stage.pans);
  return against !== null && q.equals(against, q.rational(stageX(room)));
}

/** What the steps ask of the stage, worked out once for all of them. */
interface Situation {
  /** A handover can show at all: not while the pin is offered, jammed, or once locked. */
  on: boolean;
  open: boolean;
  answered: boolean;
  checked: boolean;
  balanced: boolean;
  isolated: boolean;
  /** A side holds only x pieces, more than one x: the splitter has something to split. */
  splittable: boolean;
  answerOnPans: boolean;
  /**
   * He has written a line himself. Story 1.15 kept the dial's tag away while a written line
   * was acted out; the pans now stay at the dial's x (story 1.16), so this keeps it away.
   */
  wrote: boolean;
  /** His dial levels the pans: the sides are equal at the dial's x (story 1.16: always it). */
  levelAtDial: boolean;
  /** The answer line may be written now: simplify first (story 1.16, `answerAllowed`). */
  answerAllowed: boolean;
  dialTurns: boolean;
  writes: boolean;
  tray: boolean;
  splitter: boolean;
  /** Story 2.10: the logbook's wrong line is found, for him to rewrite. */
  rewrites: boolean;
  /** Story 4.1: the gear chain works now (room/chain.ts). */
  chain: boolean;
  /** Story 4.5: the stage's story waits to be written (room/story.ts). */
  story: boolean;
  /** The number beside x is more than the tray reaches, with no balloons left to cancel. */
  overTray: boolean;
}

function situationOf(room: RoomState, tools: readonly ToolId[]): Situation {
  const { stage } = room;
  return {
    on: handoverPhases.has(stage.phase) && stage.jam === null && !pinOffered(room),
    open: stage.phase === 'open',
    answered: hasLine(room, 'answer'),
    checked: hasLine(room, 'check'),
    balanced: balanced(room),
    isolated: xIsolated(stage.pans),
    splittable: readyToSplit(stage.pans),
    answerOnPans: answerOnPans(room),
    wrote: stage.lines.some((line) => line.source === 'typed'),
    levelAtDial: scaleView(room).level,
    answerAllowed: answerAllowed(currentStageSpec(room), stage.pans),
    dialTurns: dialTurnsNow(room),
    writes: notebookWrites(stage),
    tray: trayOffered(room, tools),
    splitter: splitterOffered(room, tools),
    rewrites: stage.planted?.found === true,
    chain: chainWorks(room, tools),
    story: storyWaits(room),
    overTray: overTheTray(stage.pans) && !hasXBalloons(stage.pans),
  };
}

function applies(id: HandoverId, s: Situation): boolean {
  if (!s.on) return false;
  switch (id) {
    case 'dial':
      return (
        s.dialTurns &&
        !s.answered &&
        !s.balanced &&
        !s.tray &&
        !s.wrote &&
        !s.levelAtDial &&
        !s.rewrites
      );
    case 'rewrite':
      return s.rewrites && s.writes && !s.answered;
    case 'write':
      return s.writes && !s.answered && s.levelAtDial && s.answerAllowed;
    case 'answer':
      return s.writes && !s.answered && s.answerOnPans;
    case 'check':
      return s.writes && s.answered && !s.checked;
    case 'tray':
      return s.tray && !s.answered && !s.balanced && !s.isolated;
    case 'balance-goal':
      return s.open && !s.answered && s.balanced && !s.isolated;
    case 'splitter':
      return s.splitter && !s.answered && s.isolated && s.splittable;
    case 'chain':
      return s.chain && !s.answered;
    case 'story':
      return s.open && s.story;
    case 'drag-off':
      return s.tray && !s.answered && s.overTray;
  }
}

/** Whether a handover step applies to the stage now, met or not. */
export function handoverApplies(
  id: HandoverId,
  room: RoomState,
  tools: readonly ToolId[],
): boolean {
  return applies(id, situationOf(room, tools));
}

/**
 * The handover whose tag shows now, or null: the earliest step that applies and that he
 * hasn't met; or, after `tuning.hintIdleMs` without his acting (`stage.idle`), the earliest
 * step that applies, met or not. Flat, for selectors.
 */
export function handoverView(
  room: RoomState | null,
  met: readonly FirstUseId[],
  tools: readonly ToolId[],
): HandoverId | null {
  if (!room) return null;
  const situation = situationOf(room, tools);
  const applying = handoverOrder.filter((id) => applies(id, situation));
  const fresh = applying.find((id) => !met.includes(handoverMet(id)));
  if (fresh) return fresh;
  // Past these the game waits for a line he must know to write: it always says so.
  const waiting = applying.find((id) => id === 'answer' || id === 'check' || id === 'drag-off');
  if (waiting) return waiting;
  return room.stage.idle ? (applying[0] ?? null) : null;
}

/** What his action was, as far as the handovers care: the root reducer names it. */
export type HandoverMove = 'dial' | 'tray' | 'split' | 'chain' | 'other';

/**
 * The handover steps an action of his took, which count as met from now on:
 * - `dial`: he turned a dial (any notch, wherever);
 * - `write` and `check`: the answer line, or the check line, is now written;
 * - `answer`: the step applied, and the answer line is now written (story 1.16), so an
 *   answer written after his dial levelled the pans in room 1 doesn't meet it;
 * - `tray`: a weight or balloon moved between the tray and the scale;
 * - `balance-goal`: the step applied, and his Balance move left x isolated;
 * - `splitter`: he split the pans;
 * - `chain`: he ran a link of the gear chain backward, and it didn't jam (story 4.1).
 * `before` and `after` are the same stage; `move` is null when the action did nothing.
 */
export function stepsTaken(
  before: RoomState,
  after: RoomState,
  move: HandoverMove | null,
  tools: readonly ToolId[],
): HandoverId[] {
  if (move === null) return [];
  const taken: HandoverId[] = [];
  if (move === 'dial') taken.push('dial');
  const answeredNow = hasLine(after, 'answer') && !hasLine(before, 'answer');
  if (answeredNow) taken.push('write');
  if (answeredNow && handoverApplies('answer', before, tools)) taken.push('answer');
  if (hasLine(after, 'check') && !hasLine(before, 'check')) taken.push('check');
  if (move === 'tray') taken.push('tray');
  if (
    (move === 'tray' || move === 'split') &&
    handoverApplies('balance-goal', before, tools) &&
    xIsolated(after.stage.pans)
  ) {
    taken.push('balance-goal');
  }
  if (move === 'split') taken.push('splitter');
  // The story written (story 4.5).
  if (handoverApplies('story', before, tools) && !storyWaits(after)) taken.push('story');
  // A run of the chain that didn't jam (story 4.1).
  if (move === 'chain' && after.stage.jam === null) taken.push('chain');
  return taken;
}

/**
 * What he has met after an action: `met` with the steps it took added (`stepsTaken`), or
 * null when nothing new is met. Steps of another room or stage are never compared.
 */
export function meetHandovers(
  before: RoomState | null,
  after: RoomState,
  move: HandoverMove | null,
  met: readonly FirstUseId[],
  tools: readonly ToolId[],
): FirstUseId[] | null {
  if (!before || before.spec.id !== after.spec.id || before.stageIndex !== after.stageIndex) {
    return null;
  }
  const fresh = stepsTaken(before, after, move, tools)
    .map(handoverMet)
    .filter((id) => !met.includes(id));
  return fresh.length > 0 ? [...met, ...fresh] : null;
}

/**
 * A stage the idle clock hasn't started on yet (it has just arrived) starts it at `now`;
 * null when it has started.
 */
export function stampArrival(room: RoomState, now: number): RoomState | null {
  if (room.stage.lastActionAt !== null) return null;
  return { ...room, stage: { ...room.stage, lastActionAt: now } };
}

/** His action at `now`, one that did something: the idle clock starts over, and idle ends. */
export function actedAt(room: RoomState, now: number): RoomState {
  const { stage } = room;
  if (stage.lastActionAt === now && !stage.idle) return room;
  return { ...room, stage: { ...stage, lastActionAt: now, idle: false } };
}

/**
 * The clock (`clock/tick`): once `tuning.hintIdleMs` has passed since his last action in a
 * stage that can show a handover, the stage goes idle. A stage with no start time, or one
 * after now (the device's clock went back), starts counting now. Null when nothing changes.
 */
export function tickIdle(room: RoomState, now: number): RoomState | null {
  const { stage } = room;
  if (!handoverPhases.has(stage.phase)) return null;
  if (stage.lastActionAt === null || now < stage.lastActionAt) {
    return { ...room, stage: { ...stage, lastActionAt: now } };
  }
  if (stage.idle || now - stage.lastActionAt < tuning.hintIdleMs) return null;
  return { ...room, stage: { ...stage, idle: true } };
}
