// The recording drum (story 4.8; GDD, Line reveal; architecture: "the drum records (x, left
// side's value) for every dial value tried in the stage; the right side is drawn as the
// level line"). Pure.
//
//   dots     every x the slider has stood at in the stage (his notches and the machine's
//            pin test), each with the stage equation's left side there
//   level    the right side, a level line across the drum
//   pin      `next-dot`: after the poke window's dots, where the next one lands, at the x
//            just past the window. Three heights are offered: the right one, one that
//            stays where the last dot was, and one that jumps twice as far. He confirms
//            one, and the machine turns the slider there, so the dot shows if he was right
//   line     once the stage locks, the line through every x of the dial: the dots were on
//            it, and it crosses the level line at the answer. Rising for `3x + 5 = 20`,
//            falling for `50 − 4x = 34`

import { assert } from '@/lib/assert';
import { toLinear, valueAt } from '@/math/linear';
import * as q from '@/math/rational';
import { isLocked } from '@/room/machine';
import { currentStageSpec, machineEquation, openingDial } from '@/room/room';
import type { RoomState, StageSpec } from '@/room/types';

/** A side's value at x, as a number (the drum's sides are whole at every x of its dial). */
function sideAt(spec: StageSpec, side: 'left' | 'right', x: number): number {
  const linear = toLinear(machineEquation(spec, 0)[side]);
  assert(linear.kind === 'linear', 'the drum draws only linear sides');
  const value = valueAt(linear, q.rational(x));
  return Number(value.n) / Number(value.d);
}

/** The x just past the poke window, where the next dot lands: the `next-dot` pin's x. */
export function nextDotX(spec: StageSpec): number {
  return openingDial(spec).max + (spec.dial === 'locked' ? 1 : spec.dial.step);
}

/**
 * The `next-dot` pin's three heights, lowest first: the right one, and one and two steps
 * past it, as if the dots sped up (story 4.8 review: a distractor on each side always left
 * the right one in the middle). So the right one is the lowest on a rising line and the
 * highest on a falling one: he has to read which way the dots go, and by how much. Content
 * tests keep them distinct, and the right one off the middle.
 */
export function nextDotOptions(spec: StageSpec): number[] {
  const x = nextDotX(spec);
  const step = spec.dial === 'locked' ? 1 : spec.dial.step;
  const right = sideAt(spec, 'left', x);
  const change = right - sideAt(spec, 'left', x - step);
  return [right, right + change, right + 2 * change].sort((a, b) => a - b);
}

/** Which of the options is right. */
export function rightDot(spec: StageSpec): number {
  return nextDotOptions(spec).indexOf(sideAt(spec, 'left', nextDotX(spec)));
}

/**
 * The stage with the slider's x recorded for the drum (story 4.8): every room step passes
 * through here, so his notches and the machine's pin test both leave a dot. The same room
 * when the x is already recorded.
 */
export function recordDial(room: RoomState): RoomState {
  const { stage } = room;
  if (stage.tried.includes(stage.dialX)) return room;
  return { ...room, stage: { ...stage, tried: [...stage.tried, stage.dialX] } };
}

/** What the notebook draws of the drum. Flat, for selectors. */
export interface DrumView {
  /** The dial's range, the drum's width. */
  min: number;
  max: number;
  /** The heights the drum shows, lowest and highest, across the dial and the level line. */
  low: number;
  high: number;
  /** The dots so far, by x. */
  dots: { x: number; y: number }[];
  /** The right side: the level line. */
  level: number;
  /**
   * The next-dot pin: its x, its heights, the one flagged; whether it is offered and can be
   * confirmed (once every dot of the poke window is on the drum); and once confirmed, the
   * height that was right, so his guess stays beside the real dot (story 4.8 review).
   */
  pin: {
    x: number;
    options: number[];
    at: number | null;
    asks: boolean;
    confirmable: boolean;
    right: number | null;
  } | null;
  /** Once the stage locks: the line through the whole dial, from its two ends. */
  line: { from: number; to: number } | null;
}

/** The drum of the stage in play, or null in a stage without one. */
export function drumView(room: RoomState | null): DrumView | null {
  if (!room) return null;
  const spec = currentStageSpec(room);
  if (!spec.drum || spec.dial === 'locked') return null;
  const { min, max } = spec.dial;
  const level = sideAt(spec, 'right', 0);
  const [atMin, atMax] = [sideAt(spec, 'left', min), sideAt(spec, 'left', max)];
  const { stage } = room;
  const offered =
    (stage.phase === 'poke' || stage.phase === 'pin') && !(stage.pin?.locked ?? false);
  const at = stage.pin?.value.kind === 'choice' ? stage.pin.value.index : null;
  const window = openingDial(spec);
  const { step } = spec.dial;
  const poked: number[] = [];
  for (let x = window.min; x <= window.max; x += step) poked.push(x);
  const pokedAll = poked.every((x) => stage.tried.includes(x));
  const confirmed = stage.pin?.locked === true;
  return {
    min,
    max,
    low: Math.min(atMin, atMax, level),
    high: Math.max(atMin, atMax, level),
    dots: [...new Set(room.stage.tried)]
      .filter((x) => x >= min && x <= max)
      .sort((a, b) => a - b)
      .map((x) => ({ x, y: sideAt(spec, 'left', x) })),
    level,
    pin:
      spec.pin?.kind === 'next-dot' && (offered || confirmed)
        ? {
            x: nextDotX(spec),
            options: nextDotOptions(spec),
            at,
            asks: offered,
            // Story 4.8 review: not until the poke window's dots show the step.
            confirmable: offered && stage.phase === 'pin' && at !== null && pokedAll,
            right: confirmed ? rightDot(spec) : null,
          }
        : null,
    line: isLocked(stage.phase) ? { from: atMin, to: atMax } : null,
  };
}
