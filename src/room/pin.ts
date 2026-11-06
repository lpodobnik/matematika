// The prediction pin (architecture, Pattern 2: poke, pin, resolution, reset; GDD,
// Prediction). Pure: where the pin can go, what dragging and confirming it do, and when it
// resolves.
//
//   poke        the dial turns only over its poke window (room/room.ts); the pin waits in
//               its holder, and the first time the game offers it, it wiggles once
//               (room/first-use.ts)
//   pin         his first drag puts the pin on its track (`pin/set`): the stage goes to
//               `pin` and the dial freezes; a second drag moves it; confirming
//               (`pin/confirm`) locks it, opens the dial's full range and turns the
//               notebook on (`open`)
//   resolution  once per stage: a `level-x` pin when the dial levels the pans at the stage's
//               solution; an `effect` pin about direction on the first dial notch after it
//               is locked (with `resolvesOn: 'level'`, as a level-x pin); and any pin still
//               unresolved when the stage locks. `PredictionMade` says whether it was right.
//
// A stage with a pin but no poke window (room 3's second stage) opens straight into `pin`,
// so the dial doesn't move before he pins. A wrong pin costs nothing; parts for a right one
// come in epic 3.

import { assert } from '@/lib/assert';
import { stageSolution } from '@/math/check';
import type { Equation } from '@/math/expr';
import { formatNumber } from '@/math/format';
import { toLinear } from '@/math/linear';
import * as q from '@/math/rational';
import type { RoomEvent } from '@/room/events';
import { currentStageSpec, fullDial, machineEquation, type RoomStep } from '@/room/room';
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
  | { kind: 'choice'; options: readonly EffectOption[] };

/**
 * The stage's pin track, or null with no pin, or a pin kind that arrives with its rooms
 * (compare, mistake, story, range and drum pins: epics 2 and 4; content tests keep them out
 * of the rooms until then).
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
  return null;
}

/** Pin kinds the engine can place and resolve so far. */
export function pinSupported(pin: PinSpec): boolean {
  return pin.kind === 'level-x' || pin.kind === 'effect';
}

/** How many places the track has: room 3's first stage, 6–20, has 15. */
export function slotCount(track: PinTrack): number {
  if (track.kind === 'choice') return track.options.length;
  return Math.floor((track.max - track.min) / track.step) + 1;
}

/** How many of the places the dial reaches: all but those beyond the dial. */
export function slotsInReach(track: PinTrack): number {
  if (track.kind === 'choice') return track.options.length;
  return Math.floor((track.reach - track.min) / track.step) + 1;
}

/** The value of a place on the track. */
export function slotValue(track: PinTrack, slot: number): PinValue {
  assert(Number.isInteger(slot) && slot >= 0 && slot < slotCount(track), `no pin place ${slot}`);
  if (track.kind === 'choice') return { kind: 'choice', index: slot };
  return { kind: 'x', x: track.min + slot * track.step };
}

function rawSlot(track: PinTrack, value: PinValue): number | null {
  if (track.kind === 'x') return value.kind === 'x' ? (value.x - track.min) / track.step : null;
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
 * `poke` to `pin` and the dial freezes; after that it moves the pin. The UI sends it once
 * per place, as he drags. Null, so the action is ignored, when the pin isn't offered, the
 * value isn't on its track, or the pin is already there.
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
 * Confirms the pin where it is (`pin/confirm`): it locks, the dial's full range opens and
 * the stage opens, so the notebook turns on. Null unless the stage is in `pin` with the pin
 * placed.
 */
export function confirmPin(room: RoomState): RoomStep | null {
  const { stage } = room;
  if (stage.phase !== 'pin' || !stage.pin || stage.pin.locked) return null;
  const opened: StageState = {
    ...stage,
    phase: 'open',
    pin: { ...stage.pin, locked: true },
    dialOpen: fullDial(currentStageSpec(room)),
  };
  return { room: withStage(room, opened), events: [] };
}

/**
 * Which way the pan holding x moves as x grows: down when x pushes it (a gear), up when x
 * lifts it (a spring), as in room 3's `20 − x = 6`. Content tests keep x on one side in
 * every stage with an effect pin.
 */
export function xPanMotion(equation: Equation): EffectOption {
  const left = toLinear(equation.left);
  const right = toLinear(equation.right);
  assert(left.kind === 'linear' && right.kind === 'linear', 'the pans hold only linear sides');
  // How much more the left side weighs for each unit x grows.
  const change = q.compare(q.sub(left.a, right.a), q.zero);
  const xOnLeft = !q.isZero(left.a);
  const goesDown = xOnLeft ? change > 0 : change < 0;
  return goesDown ? 'pan-down' : 'pan-up';
}

/** Whether a pin there is right: the stage's solution, or what x really does to its pan. */
export function pinRight(stage: StageSpec, machine: number, value: PinValue): boolean {
  const { pin } = stage;
  const equation = machineEquation(stage, machine);
  if (pin?.kind === 'level-x') return value.kind === 'x' && value.x === stageSolution(equation);
  if (pin?.kind === 'effect') {
    return value.kind === 'choice' && pin.options[value.index] === xPanMotion(equation);
  }
  return false;
}

/**
 * What can resolve a locked pin: the dial levelling the pans at the stage's solution, a
 * dial notch, or the stage locking.
 */
export type PinTrigger = 'level' | 'notch' | 'lock';

function resolvesOn(pin: PinSpec, trigger: PinTrigger): boolean {
  if (trigger === 'lock') return true;
  if (pin.kind === 'level-x') return trigger === 'level';
  if (pin.kind === 'effect') {
    return trigger === (pin.resolvesOn === 'first-notch' ? 'notch' : 'level');
  }
  return false;
}

/**
 * Resolves the stage's pin, once, when the trigger is its own: the pin shows whether it
 * was right, and `PredictionMade` says so. Null when nothing resolves: no pin, not locked
 * yet, already resolved, or not its trigger.
 */
export function resolvePin(room: RoomState, trigger: PinTrigger): RoomStep | null {
  const spec = currentStageSpec(room);
  const { stage } = room;
  const { pin } = stage;
  if (!spec.pin || !pin?.locked || pin.resolved || !resolvesOn(spec.pin, trigger)) {
    return null;
  }
  const right = pinRight(spec, stage.machine, pin.value);
  const events: RoomEvent[] = [
    { type: 'PredictionMade', roomId: room.spec.id, stage: room.stageIndex, right },
  ];
  return { room: withStage(room, { ...stage, pin: { ...pin, resolved: true } }), events };
}

/** The pin's x when it is a wrong x pin that has resolved: the pans briefly show its tilt. */
export function pinRevealX(room: RoomState): number | null {
  const { pin } = room.stage;
  if (!pin?.resolved || pin.value.kind !== 'x') return null;
  return pinRight(currentStageSpec(room), room.stage.machine, pin.value) ? null : pin.value.x;
}

function resultOf(right: boolean): 'right' | 'wrong' {
  return right ? 'right' : 'wrong';
}

/** What the pin shows. Flat, for selectors. */
export interface PinView {
  kind: PinTrack['kind'];
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
  if (!track) return null;
  const { stage } = room;
  const offered = pinOffered(room);
  if (!offered && !stage.pin) return null;
  const slot = stage.pin ? slotOf(track, stage.pin.value) : null;
  const value = stage.pin?.value ?? null;
  const resolved = stage.pin?.resolved ?? false;
  return {
    kind: track.kind,
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
