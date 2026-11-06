import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import { r03 } from '@/content/rooms/r03-sluice-gate';
import { r04 } from '@/content/rooms/r04-water-wheel';
import { setDial } from '@/room/dial';
import { touchMachine } from '@/room/phases';
import { confirmPin, setPin } from '@/room/pin';
import { enterRoom, type RoomStep } from '@/room/room';
import type { PinValue, RoomSpec, RoomState } from '@/room/types';
import {
  nextChangeMs,
  nextPlay,
  type PinTest,
  pinTestFrame,
  pinTestOf,
  pinTestProbe,
  pinTestRestMs,
  playedFrame,
  restingFrame,
} from '@/ui/scene/scale/pin-test';

function step(result: RoomStep | null): RoomState {
  if (!result) throw new Error('the action was ignored');
  return result.room;
}

/** A room's stage with the pin placed at `value` after poking to `dialX`, and confirmed. */
function confirming(spec: RoomSpec, stage: number, value: PinValue, dialX?: number) {
  let room = step(touchMachine(enterRoom(spec, stage).room));
  if (dialX !== undefined) room = step(setDial(room, dialX));
  const placed = step(setPin(room, value));
  return { placed, confirmed: step(confirmPin(placed)) };
}

const notch = tuning.pinTestNotchMs;

describe('pinTestOf (story 1.14)', () => {
  it('turns the dial from where it was to the pin a level-x pin names', () => {
    const { placed, confirmed } = confirming(r03, 0, { kind: 'x', x: 14 }, 9);
    expect(pinTestOf(pinTestProbe(placed), pinTestProbe(confirmed))).toEqual({
      kind: 'turn',
      from: 9,
      to: 14,
      step: 1,
    });
  });

  it('turns the dial up 3 notches for a direction pin', () => {
    const { placed, confirmed } = confirming(r03, 1, { kind: 'choice', index: 1 });
    expect(pinTestOf(pinTestProbe(placed), pinTestProbe(confirmed))).toEqual({
      kind: 'turn',
      from: 0,
      to: 3,
      step: 1,
    });
  });

  it('weighs the x of a pin beyond the dial, without turning it', () => {
    const { placed, confirmed } = confirming(r04, 0, { kind: 'x', x: 9 }, 2);
    expect(pinTestOf(pinTestProbe(placed), pinTestProbe(confirmed))).toEqual({
      kind: 'weigh',
      x: 9,
    });
  });

  it('shows the result at once when nothing can move', () => {
    const { placed, confirmed } = confirming(r03, 1, { kind: 'choice', index: 1 });
    const atMax = { ...placed, stage: { ...placed.stage, dialX: 20 } };
    const after = { ...confirmed, stage: { ...confirmed.stage, dialX: 20 } };
    expect(pinTestOf(pinTestProbe(atMax), pinTestProbe(after))).toEqual({ kind: 'show' });
  });

  it('plays only on the confirm itself, never on a mount, a notch or a new stage', () => {
    const { placed, confirmed } = confirming(r03, 0, { kind: 'x', x: 14 }, 9);
    expect(pinTestOf(null, pinTestProbe(confirmed))).toBeNull();
    expect(pinTestOf(pinTestProbe(confirmed), pinTestProbe(confirmed))).toBeNull();
    const turned = step(setDial(confirmed, 13));
    expect(pinTestOf(pinTestProbe(confirmed), pinTestProbe(turned))).toBeNull();
    expect(pinTestOf(pinTestProbe(placed), pinTestProbe(placed))).toBeNull();
    const other = { ...confirmed, stageIndex: 1 };
    expect(pinTestOf(pinTestProbe(placed), pinTestProbe(other))).toBeNull();
  });
});

describe('pinTestFrame', () => {
  const turn: PinTest = { kind: 'turn', from: 9, to: 14, step: 1 };

  it('moves the knob one notch every 120 ms, the pans following, then lights the pin', () => {
    expect(tuning.pinTestNotchMs).toBe(120);
    const xs = [0, 1, 2, 3, 4].map((k) => pinTestFrame(turn, k * notch + 1).dialX);
    expect(xs).toEqual([9, 10, 11, 12, 13]);
    // At the last notch the knob reaches the store's x, and the pans come to rest.
    expect(pinTestFrame(turn, 5 * notch)).toMatchObject({ dialX: null, result: false });
    expect(pinTestFrame(turn, 5 * notch + pinTestRestMs)).toEqual(restingFrame);
  });

  it('turns down notch by notch too, and in the dial’s steps', () => {
    const down: PinTest = { kind: 'turn', from: 15, to: 6, step: 3 };
    expect([0, 1, 2].map((k) => pinTestFrame(down, k * notch).dialX)).toEqual([15, 12, 9]);
    expect(pinTestFrame(down, 3 * notch).dialX).toBeNull();
  });

  it('weighs a pin beyond the dial for 1.6 s, lighting it once the pans have swung there', () => {
    const weigh: PinTest = { kind: 'weigh', x: 9 };
    expect(pinTestFrame(weigh, 0)).toEqual({ dialX: null, weighX: 9, result: false, done: false });
    expect(pinTestFrame(weigh, pinTestRestMs)).toMatchObject({ weighX: 9, result: true });
    expect(pinTestFrame(weigh, tuning.pinRevealMs)).toEqual(restingFrame);
  });

  it('shows the result at once when nothing moves', () => {
    expect(pinTestFrame({ kind: 'show' }, 0)).toEqual(restingFrame);
  });

  it('changes once per notch, never per animation frame, and stops when done', () => {
    expect(nextChangeMs(turn, 0)).toBe(notch);
    expect(nextChangeMs(turn, notch)).toBe(2 * notch);
    expect(nextChangeMs(turn, 5 * notch)).toBe(5 * notch + pinTestRestMs);
    expect(nextChangeMs(turn, 5 * notch + pinTestRestMs)).toBeNull();
    expect(nextChangeMs({ kind: 'weigh', x: 9 }, 0)).toBe(pinTestRestMs);
    expect(nextChangeMs({ kind: 'weigh', x: 9 }, pinTestRestMs)).toBe(tuning.pinRevealMs);
    expect(nextChangeMs({ kind: 'show' }, 0)).toBeNull();
  });

  it('plays well within the time a stage lock may take', () => {
    // Room 3's widest turn: 6 to 20 is 14 notches.
    const widest: PinTest = { kind: 'turn', from: 6, to: 20, step: 1 };
    const end = 14 * notch + pinTestRestMs;
    expect(pinTestFrame(widest, end).done).toBe(true);
    expect(end).toBeLessThan(tuning.presentationTimeoutMs);
  });
});

describe('nextPlay (review fix: an ended test never resumes)', () => {
  const placed = confirming(r03, 0, { kind: 'x', x: 20 }).placed;
  const confirmed = step(confirmPin(placed));
  const at = (x: number) => pinTestProbe(step(setDial(confirmed, x)));

  it('starts on the confirm and plays while the stage and dial hold', () => {
    const play = nextPlay(null, pinTestProbe(placed), pinTestProbe(confirmed), 100);
    expect(play).toMatchObject({
      test: { kind: 'turn', from: 6, to: 20 },
      dialX: 20,
      startedAt: 100,
    });
    expect(nextPlay(play, pinTestProbe(confirmed), pinTestProbe(confirmed), 200)).toBe(play);
    expect(playedFrame(play, pinTestProbe(confirmed)).dialX).toBe(6);
  });

  it('ends for good when he grabs the knob, even if he drags it back to the test’s end', () => {
    const play = nextPlay(null, pinTestProbe(placed), pinTestProbe(confirmed), 0);
    // He grabs the knob at 12, 0.4 s in: the dial is set there, so the test is over…
    const grabbed = nextPlay(play, pinTestProbe(confirmed), at(12), 400);
    expect(grabbed).toBeNull();
    // …and he drags it on to 20, where the machine was turning it: it doesn't resume.
    const back = pinTestProbe(step(setDial(step(setDial(confirmed, 12)), 20)));
    const after = nextPlay(grabbed, at(12), back, 700);
    expect(after).toBeNull();
    expect(playedFrame(after, back)).toEqual(restingFrame);
    // Even a play kept from before the grab shows nothing once the dial has moved.
    expect(playedFrame(play, at(12))).toEqual(restingFrame);
  });

  it('ends the weighing of a pin beyond the dial for good when the dial turns off and back', () => {
    const { placed: pinned, confirmed: weighed } = confirming(r04, 0, { kind: 'x', x: 9 }, 2);
    const play = nextPlay(null, pinTestProbe(pinned), pinTestProbe(weighed), 0);
    expect(play?.test).toEqual({ kind: 'weigh', x: 9 });
    const off = pinTestProbe(step(setDial(weighed, 3)));
    const back = pinTestProbe(step(setDial(step(setDial(weighed, 3)), 2)));
    const ended = nextPlay(play, pinTestProbe(weighed), off, 300);
    expect(ended).toBeNull();
    expect(nextPlay(ended, off, back, 500)).toBeNull();
    expect(playedFrame(null, back)).toEqual(restingFrame);
  });

  it('ends when the stage changes', () => {
    const play = nextPlay(null, pinTestProbe(placed), pinTestProbe(confirmed), 0);
    const probe = pinTestProbe(confirmed);
    if (!probe) throw new Error('no probe');
    expect(nextPlay(play, probe, { ...probe, stage: 'r03.1' }, 100)).toBeNull();
  });
});
