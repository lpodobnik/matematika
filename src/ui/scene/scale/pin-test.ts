// The machine testing a pin he confirms (architecture, Pattern 2, Resolution; story 1.14),
// as the scene plays it out. The store resolves the pin at once and already has the dial
// where the machine turns it; the scene shows the knob turning there notch by notch, with
// the pans following, or the pans weighing the x of a pin beyond the dial, and lights or
// dims the pin once the pans have come to rest. Presentation only: which test plays comes
// from comparing the room just before the confirm with the room after it, and each frame
// from the time since. No React, Pixi or DOM here, so it can be tested on its own; the hook
// that runs it is use-pin-test.ts.

import { tuning } from '@/config/tuning';
import { pinRevealX } from '@/room/pin';
import { currentStageSpec } from '@/room/room';
import type { RoomState } from '@/room/types';

/**
 * How long the pans take to come to rest after the machine's last notch (the tilt spring
 * settles in about a second, most of the way in this long), before the pin lights or dims.
 * For a pin beyond the dial, how long after the pans start weighing its x.
 */
export const pinTestRestMs = 600;

/** The few facts about the room that say whether a test starts. Flat, for selectors. */
export interface PinTestProbe {
  /** Which stage: `r03.0`. */
  stage: string;
  dialX: number;
  /** The dial's step: the machine turns it one step a notch. */
  step: number;
  /** No pin yet, placed but not confirmed, or confirmed and resolved. */
  pin: 'none' | 'placed' | 'tested';
  /** A resolved pin beyond the dial: the x the pans weigh (room/pin.ts). */
  revealX: number | null;
}

export function pinTestProbe(room: RoomState | null): PinTestProbe | null {
  if (!room) return null;
  const { dial } = currentStageSpec(room);
  const { pin, dialX } = room.stage;
  let state: PinTestProbe['pin'] = 'none';
  if (pin && !pin.locked) state = 'placed';
  else if (pin?.resolved) state = 'tested';
  return {
    stage: `${room.spec.id}.${room.stageIndex}`,
    dialX,
    step: dial === 'locked' ? 1 : dial.step,
    pin: state,
    revealX: pinRevealX(room),
  };
}

/**
 * The test the machine plays: it turns the dial from where it was to where the store now
 * has it; or it weighs the x of a pin beyond the dial; or nothing moves (a direction pin
 * with the dial already at its maximum), and the pin shows its result at once.
 */
export type PinTest =
  | { kind: 'turn'; from: number; to: number; step: number }
  | { kind: 'weigh'; x: number }
  | { kind: 'show' };

/**
 * The test that starts as the room goes from `before` to `after`: only when, in the same
 * stage, a placed pin has just been confirmed and resolved. Null otherwise, so a scene that
 * mounts after the confirm (a remount after a lost WebGL context) never plays it again.
 */
export function pinTestOf(before: PinTestProbe | null, after: PinTestProbe | null): PinTest | null {
  if (!before || !after || before.stage !== after.stage) return null;
  if (before.pin !== 'placed' || after.pin !== 'tested') return null;
  if (after.dialX !== before.dialX) {
    return { kind: 'turn', from: before.dialX, to: after.dialX, step: after.step };
  }
  if (after.revealX !== null) return { kind: 'weigh', x: after.revealX };
  return { kind: 'show' };
}

/** What the scene shows at a moment of the test. */
export interface PinTestFrame {
  /** The dial's x the knob and the pans show, or null for the store's. */
  dialX: number | null;
  /** The x the pans weigh for a pin beyond the dial, or null. */
  weighX: number | null;
  /** The pin shows whether it was right (lit or dimmed). */
  result: boolean;
  /** Nothing more to play: the scene shows the store as it is. */
  done: boolean;
}

/** No test playing: the store as it is, the pin's result showing. */
export const restingFrame: PinTestFrame = { dialX: null, weighX: null, result: true, done: true };

function notchesOf(test: Extract<PinTest, { kind: 'turn' }>): number {
  return Math.round(Math.abs(test.to - test.from) / test.step);
}

/** The moments the frame changes, in ms from the confirm, in order; the last ends the test. */
function changes(test: PinTest): number[] {
  if (test.kind === 'show') return [];
  if (test.kind === 'weigh') {
    return [...new Set([pinTestRestMs, tuning.pinRevealMs])].sort((a, b) => a - b);
  }
  const notches = notchesOf(test);
  const turns = Array.from({ length: notches }, (_, i) => (i + 1) * tuning.pinTestNotchMs);
  return [...turns, notches * tuning.pinTestNotchMs + pinTestRestMs];
}

/**
 * The frame `elapsedMs` after the confirm. A turn moves the knob one notch every
 * `tuning.pinTestNotchMs`, the first after one interval, and the pin shows its result
 * `pinTestRestMs` after the last. A pin beyond the dial has the pans weigh its x for
 * `tuning.pinRevealMs`, and shows its result once they have swung there.
 */
export function pinTestFrame(test: PinTest, elapsedMs: number): PinTestFrame {
  const t = Math.max(0, elapsedMs);
  const end = changes(test).at(-1) ?? 0;
  const done = t >= end;
  if (test.kind === 'show') return restingFrame;
  if (test.kind === 'weigh') {
    return {
      dialX: null,
      weighX: t < tuning.pinRevealMs ? test.x : null,
      result: t >= pinTestRestMs,
      done,
    };
  }
  const notches = notchesOf(test);
  const turned = Math.min(notches, Math.floor(t / tuning.pinTestNotchMs));
  const sign = test.to >= test.from ? 1 : -1;
  return {
    dialX: turned < notches ? test.from + sign * turned * test.step : null,
    weighX: null,
    result: done,
    done,
  };
}

/** When the frame next changes, in ms from the confirm, or null once the test is over. */
export function nextChangeMs(test: PinTest, elapsedMs: number): number | null {
  return changes(test).find((at) => at > elapsedMs) ?? null;
}
