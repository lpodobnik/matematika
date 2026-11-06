import { describe, expect, it } from 'vitest';
import { r01 } from '@/content/rooms/r01-door-lift';
import { r03 } from '@/content/rooms/r03-sluice-gate';
import { meetControls, offeredControls } from '@/room/first-use';
import { touchMachine } from '@/room/phases';
import { confirmPin, setPin } from '@/room/pin';
import { enterRoom, type RoomStep } from '@/room/room';
import type { RoomState } from '@/room/types';

function step(result: RoomStep | null): RoomStep {
  if (!result) throw new Error('the action was ignored');
  return result;
}

const poking = (): RoomState => step(touchMachine(enterRoom(r03).room)).room;

describe('first use (Pattern 2)', () => {
  it('offers the pin in poke and pin only, and nothing in a room without one', () => {
    expect(offeredControls(enterRoom(r03).room)).toEqual([]);
    expect(offeredControls(poking())).toEqual(['pin']);
    const pinned = step(setPin(poking(), { kind: 'x', x: 12 })).room;
    expect(offeredControls(pinned)).toEqual(['pin']);
    expect(offeredControls(step(confirmPin(pinned)).room)).toEqual([]);
    expect(offeredControls(step(touchMachine(enterRoom(r01).room)).room)).toEqual([]);
  });

  it('wiggles the pin once, at hint level 1, the first time the game offers it', () => {
    const met = meetControls(poking(), []);
    expect(met?.room.stage.hintLevel).toBe(1);
    expect(met?.met).toEqual(['pin']);
  });

  it('does nothing once the pin is met, so room 3 stage 2 does not wiggle it again', () => {
    expect(meetControls(poking(), ['pin'])).toBeNull();
    const second = step(touchMachine(enterRoom(r03, 1).room)).room;
    expect(meetControls(second, ['pin'])).toBeNull();
    expect(meetControls(second, [])?.room.stage.hintLevel).toBe(1);
  });

  it('never lowers a higher hint level', () => {
    const room = poking();
    const hinted = { ...room, stage: { ...room.stage, hintLevel: 3 as const } };
    expect(meetControls(hinted, [])?.room.stage.hintLevel).toBe(3);
  });

  it('does nothing before the stage offers anything', () => {
    expect(meetControls(enterRoom(r03).room, [])).toBeNull();
  });
});
