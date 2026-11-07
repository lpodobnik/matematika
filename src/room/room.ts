// Entering a room and opening its stages (architecture, Pattern 2). Pure: the store looks
// the RoomSpec up in content and hands it in. What happens after a stage arrives (his first
// touch, the lock, the restart and reset) is in room/phases.ts.

import { tuning } from '@/config/tuning';
import { assert } from '@/lib/assert';
import { stageSolution } from '@/math/check';
import { type Equation, num } from '@/math/expr';
import { parse } from '@/math/parse';
import { tokenize } from '@/math/tokens';
import type { RoomEvent } from '@/room/events';
import { openingTemplates } from '@/room/fading';
import { logbookOpening } from '@/room/logbook';
import type {
  DialSpec,
  NotebookLine,
  RoomSpec,
  RoomState,
  StageSpec,
  StageState,
  TrayNumbers,
} from '@/room/types';

export interface RoomStep {
  room: RoomState;
  events: RoomEvent[];
}

/** A machine's equation. Content tests check that every room's equations parse. */
export function machineEquation(stage: StageSpec, machine: number): Equation {
  const spec = stage.machines[machine];
  assert(spec, `the stage has no machine ${machine}`);
  const parsed = parse(spec.equation);
  assert(parsed.ok, `the machine's equation doesn't parse: ${spec.equation}`);
  return parsed.equation;
}

/**
 * Line 0 of the notebook: the machine's equation as pad tokens, read-only. Its verdict is
 * what the checker would say of the stage against itself: valid, with no move and no
 * progress (fixed here, so a stage arrives without being judged).
 */
export function givenLine(stage: StageSpec, machine: number): NotebookLine {
  const spec = stage.machines[machine];
  assert(spec, `the stage has no machine ${machine}`);
  const tokenized = tokenize(spec.equation);
  assert(
    tokenized.ok,
    `the machine's equation has a symbol that isn't on the pad: ${spec.equation}`,
  );
  return {
    tokens: tokenized.tokens,
    source: 'given',
    verdict: { kind: 'valid', move: { kind: 'none' }, progress: false },
  };
}

/** Whether the stage has a prediction pin, so it opens into poke or pin (Pattern 2). */
export function hasPin(stage: StageSpec): boolean {
  return stage.pin !== undefined;
}

/**
 * The poke window's notches (Pattern 2, Poke): a stage with a pin and `pokeNotches` opens
 * only that many positions of its dial, from the minimum, until the pin is locked; 'all'
 * opens them all. Null for a stage with no poke window: a poke window without a pin would
 * never open, so it counts only with one (content tests keep the two together).
 */
export function pokeNotches(stage: StageSpec): number | 'all' | null {
  if (!hasPin(stage) || stage.pokeNotches === undefined) return null;
  return stage.pokeNotches;
}

/** The dial's whole range, or just its x for a locked dial, which never moves. */
export function fullDial(stage: StageSpec): { min: number; max: number } {
  const { dial } = stage;
  // A locked dial (room 7) never moves; its x is decided with the find-the-mistake rules.
  if (dial === 'locked') return { min: 0, max: 0 };
  return { min: dial.min, max: dial.max };
}

/**
 * The part of the dial he can reach as the stage opens: the poke window, min, min + step,
 * …, min + (pokeNotches − 1)·step (never past the maximum), or the full range.
 */
export function openingDial(stage: StageSpec): { min: number; max: number } {
  const full = fullDial(stage);
  const notches = pokeNotches(stage);
  if (stage.dial === 'locked' || notches === null || notches === 'all') return full;
  const { min } = stage.dial;
  // A notch of a coarse dial moves x by its tens (story 4.6).
  const size: DialSpec['step'] = stage.dial.coarse ?? stage.dial.step;
  return { min, max: Math.min(full.max, min + (Math.max(1, notches) - 1) * size) };
}

/** The tray's numbers as a stage arrives: its weight, its float and its gear all show 1. */
export const trayStart: Readonly<TrayNumbers> = { weight: 1, float: 1, gear: 1 };

/**
 * Where the slider starts: at its lowest notch; or, on a stage after a change (room 5,
 * story 2.8), where the stage before it levelled, so the change shows as the scale tipping
 * away from level.
 */
function startingDial(stage: StageSpec): number {
  const { min, max } = fullDial(stage);
  if (!stage.change || stage.dial === 'locked') return min;
  const now = machineEquation(stage, 0);
  const before = stageSolution({ left: now.left, right: num(stage.change.from) });
  const onDial = (before - stage.dial.min) % stage.dial.step === 0;
  return onDial && before >= min && before <= max ? before : min;
}

/**
 * A stage as it arrives: the first machine's equation on the pans and as the notebook's
 * line 0, an empty draft (or, with Try values `blanks`, the lines to fill), every machine
 * stopped, no pin placed, the tray at 1 and 1, the splitter at 2 parts, no Balance move
 * made nor tool offered yet (room/tray.ts), and the dial where it starts (`startingDial`),
 * exploring, with its poke window open if it has one. It waits in `arrive` for his first
 * touch on the machine (room/phases.ts).
 */
export function arriveAtStage(stage: StageSpec): StageState {
  const dialX = startingDial(stage);
  const logbook = logbookOpening(stage, givenLine(stage, 0));
  return {
    phase: 'arrive',
    machine: 0,
    lines: logbook.lines,
    planted: logbook.planted,
    shownLine: null,
    linesTapped: false,
    draft: [],
    templates: openingTemplates(stage, 0),
    jam: null,
    refused: 0,
    refusal: null,
    jamsInARow: 0,
    machineProgress: stage.machines.map(() => 0),
    // Story 4.5: a story to write opens with empty pans (room/story.ts).
    pans: stage.story?.build ? { left: num(0), right: num(0) } : machineEquation(stage, 0),
    tray: { ...trayStart },
    splitter: tuning.splitterMinParts,
    balance: { moves: 0, dialMaxed: false, trayMet: false, splitterSeen: false },
    dialX,
    dialOpen: openingDial(stage),
    pin: null,
    hintLevel: 0,
    help: 0,
    helpAt: null,
    lastActionAt: null,
    idle: false,
    presentedAt: null,
  };
}

/** The `StageArrived` event for a stage of a room: it fires as the stage's arrive begins. */
export function stageArrived(spec: RoomSpec, stage: number): RoomEvent {
  return { type: 'StageArrived', roomId: spec.id, stage };
}

/**
 * Enters a room at a stage, the first unless another is given (the dev panel jumps to any
 * stage). The stages before it count as solved: the machine shows their parts running.
 */
export function enterRoom(spec: RoomSpec, stageIndex = 0): RoomStep {
  assert(spec.stages.length > 0, `room ${spec.id} has no stages`);
  const stage = spec.stages[stageIndex];
  assert(stage, `room ${spec.id} has no stage ${stageIndex}`);
  return {
    room: { spec, stageIndex, stage: arriveAtStage(stage) },
    events: [stageArrived(spec, stageIndex)],
  };
}

/** The spec of the stage in play. */
export function currentStageSpec(room: RoomState): StageSpec {
  const stage = room.spec.stages[room.stageIndex];
  assert(stage, `room ${room.spec.id} has no stage ${room.stageIndex}`);
  return stage;
}
