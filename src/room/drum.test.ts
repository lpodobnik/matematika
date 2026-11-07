import { describe, expect, it } from 'vitest';
import { r08 } from '@/content/rooms/r08-tram';
import { r13 } from '@/content/rooms/r13-clock-tower';
import { setDial } from '@/room/dial';
import { drumView, nextDotOptions, nextDotX, recordDial, rightDot } from '@/room/drum';
import { resetStage, touchMachine } from '@/room/phases';
import { confirmPin, pinRight, setPin } from '@/room/pin';
import { enterRoom, type RoomStep } from '@/room/room';
import type { RoomState, StageSpec } from '@/room/types';

function step(result: RoomStep | null): RoomStep {
  if (!result) throw new Error('the action was ignored');
  return result;
}

const [rising, falling] = r13.stages as [StageSpec, StageSpec];

function tower(stage = 0): RoomState {
  return step(touchMachine(enterRoom(r13, stage).room)).room;
}

/** The slider to x, recorded as the root reducer records it. */
function dial(room: RoomState, x: number): RoomState {
  return recordDial(step(setDial(room, x)).room);
}

describe('the recording drum (story 4.8)', () => {
  it('pins the next dot past the poke window among three heights', () => {
    expect(nextDotX(rising)).toBe(3);
    // The right one, then one and two steps past it: lowest rising, highest falling.
    expect(nextDotOptions(rising)).toEqual([14, 17, 20]);
    expect(rightDot(rising)).toBe(0);
    expect(nextDotOptions(falling)).toEqual([30, 34, 38]);
    expect(rightDot(falling)).toBe(2);
    expect(pinRight(rising, 0, { kind: 'choice', index: 0 })).toBe(true);
    expect(pinRight(rising, 0, { kind: 'choice', index: 1 })).toBe(false);
  });

  it('draws a dot for each x tried, with the right side as its level line', () => {
    const room = dial(dial(tower(), 1), 2);
    const view = drumView(room);
    expect(view?.dots).toEqual([
      { x: 0, y: 5 },
      { x: 1, y: 8 },
      { x: 2, y: 11 },
    ]);
    expect(view?.level).toBe(20);
    expect(view?.pin).toMatchObject({ x: 3, options: [14, 17, 20], at: null, asks: true });
    expect(view?.line).toBeNull();
  });

  it('shows the next dot once the machine tests the pin, and keeps the dots on a reset', () => {
    const pinned = step(setPin(dial(dial(tower(), 1), 2), { kind: 'choice', index: 1 })).room;
    expect(drumView(pinned)?.pin?.confirmable).toBe(true);
    const tested = recordDial(step(confirmPin(pinned)).room);
    expect(tested.stage.dialX).toBe(3);
    expect(drumView(tested)?.dots.map((dot) => dot.y)).toEqual([5, 8, 11, 14]);
    // His guess stays beside the real dot, with the right height marked (story 4.8 review).
    expect(drumView(tested)?.pin).toMatchObject({ asks: false, at: 1, right: 0 });
    const reset = step(resetStage(tested)).room;
    expect(drumView(reset)?.dots).toHaveLength(4);
  });

  it('draws the whole line once the machine locks: falling in the second', () => {
    const room = tower(1);
    const locked: RoomState = { ...room, stage: { ...room.stage, phase: 'locked' } };
    expect(drumView(locked)?.line).toEqual({ from: 50, to: 10 });
    expect(drumView(locked)?.low).toBe(10);
    expect(drumView(locked)?.high).toBe(50);
  });

  it('is nowhere but in a stage with the drum', () => {
    expect(drumView(enterRoom(r08).room)).toBeNull();
  });

  it('can’t be confirmed until the poke window’s dots are all on the drum', () => {
    const early = step(setPin(tower(), { kind: 'choice', index: 0 })).room;
    expect(drumView(early)?.pin?.confirmable).toBe(false);
  });
});
