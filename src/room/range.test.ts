import { describe, expect, it } from 'vitest';
import { r11 } from '@/content/rooms/r11-great-wheel';
import { formatEquation } from '@/math/format';
import { parse } from '@/math/parse';
import { dialValue, notchCount, notchOf, nudgeDial, setDial } from '@/room/dial';
import { workedExample } from '@/room/help';
import { nextMove } from '@/room/hint';
import { touchMachine } from '@/room/phases';
import { bucketOf, confirmPin, pinRight, setPin } from '@/room/pin';
import { rangeView } from '@/room/range';
import { enterRoom, openingDial, type RoomStep } from '@/room/room';
import type { DialSpec, RoomState, StageSpec } from '@/room/types';

function step(result: RoomStep | null): RoomStep {
  if (!result) throw new Error('the action was ignored');
  return result;
}

const stage = r11.stages[0] as StageSpec;
const dial = stage.dial as DialSpec;

function wheel(): RoomState {
  return step(touchMachine(enterRoom(r11).room)).room;
}

describe('the coarse dial (story 4.6)', () => {
  it('moves in tens per notch, and its poke window is its first 4 notches', () => {
    expect(notchCount(dial)).toBe(21);
    expect(dialValue(dial, 3)).toBe(30);
    expect(notchOf(dial, 207)).toBeCloseTo(20.7);
    expect(openingDial(stage)).toEqual({ min: 0, max: 30 });
  });

  it('steps one at a time with − and +, within the part he can reach', () => {
    const room = wheel();
    expect(nudgeDial(room, -1)).toBeNull();
    const one = step(nudgeDial(room, 1)).room;
    expect(one.stage.dialX).toBe(1);
    const thirty = step(setDial(room, 30)).room;
    expect(nudgeDial(thirty, 1)).toBeNull();
  });

  it('reaches 207, where the pans level, after the pin', () => {
    let room = step(setPin(wheel(), { kind: 'bucket', index: 1 })).room;
    room = step(confirmPin(room)).room;
    room = step(setDial(room, 210)).room;
    for (let i = 0; i < 3; i += 1) room = step(nudgeDial(room, -1)).room;
    expect(room.stage.dialX).toBe(207);
    const last = step(setDial(room, 200));
    const back = step(nudgeDial(last.room, 1));
    expect(back.events.map((event) => event.type)).toEqual(['DialNotch']);
  });

  it('ignores − and + on a dial that isn’t coarse', () => {
    const plain = { ...r11, stages: [{ ...stage, dial: { min: 0, max: 210, step: 1 } }] };
    expect(nudgeDial(step(touchMachine(enterRoom(plain).room)).room, 1)).toBeNull();
  });
});

describe('the range pin (story 4.6)', () => {
  it('puts x in a range, ends included in the middle one', () => {
    expect(bucketOf([100, 300], 99)).toBe(0);
    expect(bucketOf([100, 300], 100)).toBe(1);
    expect(bucketOf([100, 300], 207)).toBe(1);
    expect(bucketOf([100, 300], 300)).toBe(1);
    expect(bucketOf([100, 300], 301)).toBe(2);
    expect(pinRight(stage, 0, { kind: 'bucket', index: 1 })).toBe(true);
    expect(pinRight(stage, 0, { kind: 'bucket', index: 2 })).toBe(false);
  });

  it('is placed while he pokes, and shows the range x is in once confirmed', () => {
    const room = wheel();
    expect(rangeView(room)).toMatchObject({ bounds: [100, 300], asks: true, at: null });
    const flagged = step(setPin(room, { kind: 'bucket', index: 0 })).room;
    expect(rangeView(flagged)).toMatchObject({ at: 0, confirmable: true });
    const confirmed = step(confirmPin(flagged));
    expect(confirmed.events).toContainEqual(
      expect.objectContaining({ type: 'PredictionMade', right: false }),
    );
    expect(rangeView(confirmed.room)).toMatchObject({ asks: false, right: 1 });
  });
});

describe('help in room 11 (story 4.6 review)', () => {
  const tools = ['balance', 'workshop', 'chain'] as const;

  it('names the chain where Balance can’t split by 27', () => {
    let room = step(setPin(wheel(), { kind: 'bucket', index: 1 })).room;
    room = step(confirmPin(room)).room;
    room = { ...room, stage: { ...room.stage, balance: { ...room.stage.balance, moves: 2 } } };
    const pans = parse('5589 = 27x');
    if (!pans.ok) throw new Error('no parse');
    room = { ...room, stage: { ...room.stage, pans: pans.equation } };
    expect(nextMove(room, [...tools])).toEqual({ kind: 'chain', op: 'div', n: 27 });
  });

  it('works an example of the same shape with small numbers', () => {
    let room = step(setPin(wheel(), { kind: 'bucket', index: 1 })).room;
    room = step(confirmPin(room)).room;
    const lines = workedExample(room, [...tools])?.map(formatEquation) ?? [];
    expect(lines[0]).toMatch(/^50 − 3x = \d+$/);
    expect(lines.length).toBeGreaterThan(2);
  });
});
