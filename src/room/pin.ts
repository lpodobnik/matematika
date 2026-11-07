// The prediction pin (architecture, Pattern 2: poke, pin, resolution, reset; GDD,
// Prediction). Pure: where the pin can go, what dragging and confirming it do, and how the
// machine tests it.
//
//   poke        the dial turns only over its poke window (room/room.ts); the pin waits in
//               its holder, and the first time the game offers it, it wiggles once
//               (room/first-use.ts)
//   pin         his first drag puts the pin on its track (`pin/set`): the stage goes to
//               `pin`, and the dial keeps turning inside the poke window (room/dial.ts); a
//               second drag moves it
//   confirm     (`pin/confirm`) locks it, opens the dial's full range and the stage, so the
//               notebook turns on, and resolves it at once: `PredictionMade` says whether
//               it was right. The machine tests it: it turns the dial itself to a `level-x`
//               pin's x (or, beyond the dial, the scene has the pans weigh that x for a
//               moment), or all the way to the dial's maximum for an `effect` pin, so the
//               scale ends tilted the way the right option shows (story 1.15 review).
//               A dial the machine turns fires no `DialNotch`, `PansLevel` or `WayUsed`:
//               it is neither his exploring nor his way (story 1.14). Left at the dial's
//               maximum with the pans tipped, it counts as his dial having been there: it
//               offers the tray (room/tray.ts), since grabbing the knob there does nothing.
//   lock        a pin still unresolved when the stage locks resolves then; a safety only,
//               since confirming resolves every pin.
//
// A stage with a pin but no poke window (room 3's second stage) opens straight into `pin`,
// so the dial doesn't move before he pins. A wrong pin costs nothing; the root reducer pays
// parts for a right one (store/reducer.ts), so this file knows nothing of the economy.

import { assert } from '@/lib/assert';
import { stageSolution } from '@/math/check';
import type { Equation } from '@/math/expr';
import { formatNumber } from '@/math/format';
import { toLinear } from '@/math/linear';
import * as q from '@/math/rational';
import { dialMaxedAt, isOnDial } from '@/room/dial';
import type { RoomEvent } from '@/room/events';
import { foundMistake, plantedLineOf, writtenLineCount } from '@/room/logbook';
import { currentStageSpec, fullDial, givenLine, machineEquation, type RoomStep } from '@/room/room';
import { rightStory } from '@/room/story';
import type {
  EffectOption,
  PinSpec,
  PinValue,
  RoomState,
  StageSpec,
  StageState,
} from '@/room/types';

/**
 * Where the pin can go. An x pin's track runs over the dial's range in its steps, or to
 * twice the dial's maximum when the pin spec says `beyondDial`; a choice pin's places are
 * its options.
 */
export type PinTrack =
  | {
      kind: 'x';
      min: number;
      max: number;
      step: number;
      /** The dial's maximum: places past it lie beyond the dial. */
      reach: number;
    }
  | { kind: 'choice'; options: readonly EffectOption[] }
  /** A `wrong-line` pin (room 7, story 2.10): its places are the written lines, 1 to `lines`. */
  | { kind: 'line'; lines: number }
  /** A `story-choice` pin (room 10, story 4.5): its places are the stories, in the notebook. */
  | { kind: 'story'; options: number }
  /** A `range` pin (room 11, story 4.6): its places are the ranges its bounds make, in the notebook. */
  | { kind: 'range'; bounds: readonly number[] };

/**
 * The stage's pin track, or null with no pin, or a pin kind that arrives with its rooms
 * (mistake, story, range and drum pins: epics 2 and 4; content tests keep them out of the
 * rooms until then). A compare stage pins with `level-x` and its readouts hidden (room 6).
 */
export function pinTrack(stage: StageSpec): PinTrack | null {
  const { pin, dial } = stage;
  if (!pin) return null;
  if (pin.kind === 'level-x') {
    assert(dial !== 'locked', 'a level-x pin needs a dial');
    const max = pin.beyondDial ? dial.max * 2 : dial.max;
    return { kind: 'x', min: dial.min, max, step: dial.step, reach: dial.max };
  }
  if (pin.kind === 'effect') return { kind: 'choice', options: pin.options };
  if (pin.kind === 'wrong-line') return { kind: 'line', lines: writtenLineCount(stage) };
  if (pin.kind === 'story-choice')
    return { kind: 'story', options: stage.story?.options?.length ?? 0 };
  if (pin.kind === 'range') return { kind: 'range', bounds: pin.bounds };
  return null;
}

/** Pin kinds the engine can place and resolve so far. */
export function pinSupported(pin: PinSpec): boolean {
  return (
    pin.kind === 'level-x' ||
    pin.kind === 'effect' ||
    pin.kind === 'wrong-line' ||
    pin.kind === 'story-choice' ||
    pin.kind === 'range'
  );
}

/** How many places the track has: room 3's first stage, 6–20, has 15. */
export function slotCount(track: PinTrack): number {
  if (track.kind === 'choice') return track.options.length;
  if (track.kind === 'line') return track.lines;
  if (track.kind === 'story') return track.options;
  if (track.kind === 'range') return track.bounds.length + 1;
  return Math.floor((track.max - track.min) / track.step) + 1;
}

/** How many of the places the dial reaches: all but those beyond the dial. */
export function slotsInReach(track: PinTrack): number {
  if (track.kind === 'choice') return track.options.length;
  if (track.kind === 'line') return track.lines;
  if (track.kind === 'story') return track.options;
  if (track.kind === 'range') return track.bounds.length + 1;
  return Math.floor((track.reach - track.min) / track.step) + 1;
}

/** The value of a place on the track. */
export function slotValue(track: PinTrack, slot: number): PinValue {
  assert(Number.isInteger(slot) && slot >= 0 && slot < slotCount(track), `no pin place ${slot}`);
  if (track.kind === 'choice' || track.kind === 'story') return { kind: 'choice', index: slot };
  if (track.kind === 'range') return { kind: 'bucket', index: slot };
  if (track.kind === 'line') return { kind: 'line', index: slot + 1 };
  return { kind: 'x', x: track.min + slot * track.step };
}

function rawSlot(track: PinTrack, value: PinValue): number | null {
  if (track.kind === 'x') return value.kind === 'x' ? (value.x - track.min) / track.step : null;
  if (track.kind === 'line') return value.kind === 'line' ? value.index - 1 : null;
  if (track.kind === 'range') return value.kind === 'bucket' ? value.index : null;
  return value.kind === 'choice' ? value.index : null;
}

/** The place a value is in, or null when it isn't one of the track's. */
export function slotOf(track: PinTrack, value: PinValue): number | null {
  const slot = rawSlot(track, value);
  if (slot === null || !Number.isInteger(slot) || slot < 0 || slot >= slotCount(track)) {
    return null;
  }
  return slot;
}

function placeKey(value: PinValue): string {
  return value.kind === 'x' ? `x:${value.x}` : `${value.kind}:${value.index}`;
}

/** Whether the game offers the pin now: the stage has one, in poke or pin, and it isn't locked. */
export function pinOffered(room: RoomState): boolean {
  const { stage } = room;
  if (stage.phase !== 'poke' && stage.phase !== 'pin') return false;
  if (stage.pin?.locked) return false;
  return pinTrack(currentStageSpec(room)) !== null;
}

function withStage(room: RoomState, stage: StageState): RoomState {
  return { ...room, stage };
}

/**
 * Puts the pin on a place of its track (`pin/set`): the first time, the stage goes from
 * `poke` to `pin`, and the dial keeps turning inside its poke window; after that it moves
 * the pin. The UI sends it once per place, as he drags. Null, so the action is ignored,
 * when the pin isn't offered, the value isn't on its track, or the pin is already there.
 */
export function setPin(room: RoomState, value: PinValue): RoomStep | null {
  if (!pinOffered(room)) return null;
  const track = pinTrack(currentStageSpec(room));
  if (!track || slotOf(track, value) === null) return null;
  const { stage } = room;
  if (stage.phase === 'pin' && stage.pin && placeKey(stage.pin.value) === placeKey(value)) {
    return null;
  }
  const pin = { value, locked: false, resolved: false };
  return { room: withStage(room, { ...stage, phase: 'pin', pin }), events: [] };
}

/**
 * Where the machine turns the dial to test a pin he confirms (story 1.14): to a `level-x`
 * pin's x when the dial reaches it; all the way to the dial's maximum for an `effect` pin,
 * so the scale swings as far as x grows on the dial and ends tilted the way x tips it (in
 * room 3's `20 − x = 6`, from tipped left at 0, through level at 14, to tipped right at
 * 20; story 1.15 review, replacing three notches, which left it tipped left); and nowhere
 * for a pin beyond the dial, whose x the scene has the pans weigh instead (`pinRevealX`).
 */
export function machineTestX(stage: StageSpec, dialX: number, value: PinValue): number {
  const { dial, pin } = stage;
  if (dial === 'locked') return dialX;
  if (pin?.kind === 'level-x' && value.kind === 'x') {
    return isOnDial(dial, value.x) ? value.x : dialX;
  }
  if (pin?.kind === 'effect') return dial.max;
  if (pin?.kind === 'wrong-line') {
    const x = stageSolution(machineEquation(stage, 0));
    return isOnDial(dial, x) ? x : dialX;
  }
  return dialX;
}

/**
 * Confirms the pin where it is (`pin/confirm`): it locks, the dial's full range opens and
 * the stage opens, so the notebook turns on. The machine tests the pin at once: it turns
 * the dial itself (`machineTestX`), which fires no dial events, and the pin resolves, with
 * `PredictionMade`. The scene plays the test out: the knob moves there notch by notch, or
 * the pans weigh the pin's x beyond the dial. A test that leaves the dial at its maximum
 * with the pans tipped counts as the dial maxed (`dialMaxedAt`), so it offers the tray: in
 * room 4 a pin at 6 parks the knob there, and grabbing it there sends a notch the dial
 * already has, which does nothing. Null unless the stage is in `pin` with the pin placed.
 */
export function confirmPin(room: RoomState): RoomStep | null {
  const { stage } = room;
  if (stage.phase !== 'pin' || !stage.pin || stage.pin.locked) return null;
  const spec = currentStageSpec(room);
  const dialX = machineTestX(spec, stage.dialX, stage.pin.value);
  const opened: StageState = {
    ...stage,
    phase: 'open',
    pin: { ...stage.pin, locked: true },
    dialOpen: fullDial(spec),
    dialX,
    balance: spec.dial === 'locked' ? stage.balance : dialMaxedAt(stage, spec.dial, dialX),
  };
  // A mistake pin (room 7): the machine puts the pinned line on the scale where the stage
  // equation levels, and the planted line is found, right pin or not, for him to rewrite.
  const tested =
    spec.pin?.kind === 'wrong-line' && stage.pin.value.kind === 'line'
      ? foundMistake({ ...opened, shownLine: stage.pin.value.index }, spec)
      : opened;
  const confirmed = withStage(room, tested);
  return resolvePin(confirmed) ?? { room: confirmed, events: [] };
}

/**
 * Which way the whole scale tilts as x grows (story 1.15; it replaces 1.14's "which way the
 * pan holding x goes"): toward the side that gets heavier as x grows, because that side goes
 * down. In room 3's `20 − x = 6`, x takes off the left side, so the right side goes down:
 * `tilt-right`. x may sit on both sides, as long as growing it makes one side heavier;
 * content tests check every stage with an effect pin.
 */
export function tiltAsXGrows(equation: Equation): EffectOption {
  const left = toLinear(equation.left);
  const right = toLinear(equation.right);
  assert(left.kind === 'linear' && right.kind === 'linear', 'the pans hold only linear sides');
  // How much more the left side weighs for each unit x grows.
  const change = q.compare(q.sub(left.a, right.a), q.zero);
  assert(change !== 0, 'growing x tips the scale neither way');
  return change > 0 ? 'tilt-left' : 'tilt-right';
}

/**
 * The range x falls in among `bounds` (story 4.6; room 11's 100 and 300): under the first
 * is 0; up to each next bound, ends included, the next; over the last, the last range.
 */
export function bucketOf(bounds: readonly number[], x: number): number {
  const first = bounds[0];
  if (first === undefined || x < first) return 0;
  const above = bounds.findIndex((bound, i) => i > 0 && x <= bound);
  return above === -1 ? bounds.length : above;
}

/** Whether a pin there is right: the stage's solution, or the way x really tilts the scale. */
export function pinRight(stage: StageSpec, machine: number, value: PinValue): boolean {
  const { pin } = stage;
  const equation = machineEquation(stage, machine);
  if (pin?.kind === 'level-x') return value.kind === 'x' && value.x === stageSolution(equation);
  if (pin?.kind === 'effect') {
    return value.kind === 'choice' && pin.options[value.index] === tiltAsXGrows(equation);
  }
  if (pin?.kind === 'wrong-line') {
    return value.kind === 'line' && value.index === plantedLineOf(stage, givenLine(stage, 0));
  }
  if (pin?.kind === 'story-choice')
    return value.kind === 'choice' && value.index === rightStory(stage);
  if (pin?.kind === 'range') {
    return value.kind === 'bucket' && value.index === bucketOf(pin.bounds, stageSolution(equation));
  }
  return false;
}

/**
 * Resolves the stage's pin, once: the pin shows whether it was right, and `PredictionMade`
 * says so. Confirming the pin calls it, and so does the stage locking, as a safety for a
 * pin that is somehow still unresolved then. Null when nothing resolves: no pin, not
 * locked yet, or already resolved.
 */
export function resolvePin(room: RoomState): RoomStep | null {
  const spec = currentStageSpec(room);
  const { stage } = room;
  const { pin } = stage;
  if (!spec.pin || !pin?.locked || pin.resolved) return null;
  const right = pinRight(spec, stage.machine, pin.value);
  const events: RoomEvent[] = [
    { type: 'PredictionMade', roomId: room.spec.id, stage: room.stageIndex, right },
  ];
  return { room: withStage(room, { ...stage, pin: { ...pin, resolved: true } }), events };
}

/**
 * The pin's x when it is an x pin beyond the dial that has resolved, right or wrong: the
 * dial can't go there, so the pans briefly weigh that x instead (story 1.14). Null for a
 * pin the dial reaches, which the machine tests by turning the dial, and for a choice pin.
 */
export function pinRevealX(room: RoomState): number | null {
  const { pin } = room.stage;
  const { dial } = currentStageSpec(room);
  if (!pin?.resolved || pin.value.kind !== 'x' || dial === 'locked') return null;
  return isOnDial(dial, pin.value.x) ? null : pin.value.x;
}

function resultOf(right: boolean): 'right' | 'wrong' {
  return right ? 'right' : 'wrong';
}

/**
 * The pin kinds the engine places so far, and `change`: a `level-x` pin after the stage's
 * numbers changed (room 5, story 2.8), and `hidden`: one with the readouts hidden (room 6,
 * story 2.9), each with its own question. They are also the keys of
 * their questions in `hr.pin.questions`.
 */
export type PinQuestion =
  | Extract<PinSpec['kind'], 'level-x' | 'effect' | 'wrong-line' | 'story-choice' | 'range'>
  | 'change'
  | 'hidden'
  /** Story 4.4: from room 8 on (a stage with Undo) he knows the flag, so it asks only where. */
  | 'level-x-short';

/** What the pin shows. Flat, for selectors. */
export interface PinView {
  kind: PinTrack['kind'];
  /** Which question its tag asks (`hr.pin.questions`). */
  question: PinQuestion;
  /** Its tag hangs on the holder with the question: while it is offered, until confirmed. */
  asks: boolean;
  /** How many places the track has… */
  slots: number;
  /** …and how many of them the dial reaches; the rest lie beyond it. */
  reach: number;
  /** The place the pin is in, or null while it waits in its holder. */
  slot: number | null;
  /** An x pin's number, in school notation; null for a choice pin, or in the holder. */
  label: string | null;
  /** A choice pin's option where it is; null for an x pin, or in the holder. */
  option: EffectOption | null;
  /** Dragging it does something now: it is offered. */
  movable: boolean;
  /** Confirming it does something now. */
  confirmable: boolean;
  locked: boolean;
  /** Null until it resolves; then whether it was right. */
  result: 'right' | 'wrong' | null;
  /** It wiggles once (hint level 1): the game offers it for the first time. */
  wiggle: boolean;
}

/**
 * The pin of the stage in play, or null: with no room, no pin the engine can place, or
 * before the game offers it (in `arrive`). Once placed it stays in view, locked, until the
 * next stage.
 */
export function pinView(room: RoomState | null): PinView | null {
  if (!room) return null;
  const spec = currentStageSpec(room);
  const track = pinTrack(spec);
  const kind = spec.pin?.kind;
  if (!track || !pinSupported(spec.pin ?? { kind: 'level-x' })) return null;
  if (
    kind !== 'level-x' &&
    kind !== 'effect' &&
    kind !== 'wrong-line' &&
    kind !== 'story-choice' &&
    kind !== 'range'
  ) {
    return null;
  }
  const question: PinQuestion =
    kind !== 'level-x'
      ? kind
      : spec.change
        ? 'change'
        : // As the scale shows them (room/scale.ts, `showsReadouts`), without importing it back.
          spec.readouts && !spec.blinds?.readouts
          ? spec.ways.includes('undo')
            ? 'level-x-short'
            : 'level-x'
          : 'hidden';
  const { stage } = room;
  const offered = pinOffered(room);
  if (!offered && !stage.pin) return null;
  const slot = stage.pin ? slotOf(track, stage.pin.value) : null;
  const value = stage.pin?.value ?? null;
  const resolved = stage.pin?.resolved ?? false;
  return {
    kind: track.kind,
    question,
    asks: offered,
    slots: slotCount(track),
    reach: slotsInReach(track),
    slot,
    label: value?.kind === 'x' ? formatNumber(value.x) : null,
    option:
      track.kind === 'choice' && value?.kind === 'choice'
        ? (track.options[value.index] ?? null)
        : null,
    movable: offered,
    confirmable: stage.phase === 'pin' && stage.pin !== null && !stage.pin.locked,
    locked: stage.pin?.locked ?? false,
    result: resolved && value ? resultOf(pinRight(spec, stage.machine, value)) : null,
    wiggle: offered && stage.hintLevel >= 1,
  };
}
