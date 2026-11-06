import { describe, expect, it } from 'vitest';
import { r03 } from '@/content/rooms/r03-sluice-gate';
import { parse } from '@/math/parse';
import type { Token } from '@/math/tokens';
import { dialView, setDial } from '@/room/dial';
import { enterLine, notebookWrites, typeToken } from '@/room/notebook';
import { touchMachine } from '@/room/phases';
import {
  confirmPin,
  pinOffered,
  pinRevealX,
  pinRight,
  pinSupported,
  pinTrack,
  pinView,
  resolvePin,
  setPin,
  slotCount,
  slotOf,
  slotsInReach,
  slotValue,
  xPanMotion,
} from '@/room/pin';
import { enterRoom, type RoomStep } from '@/room/room';
import { pinRevealView, scaleView } from '@/room/scale';
import type { Phase, PinValue, RoomSpec, RoomState, StageSpec } from '@/room/types';

function step(result: RoomStep | null): RoomStep {
  if (!result) throw new Error('the action was ignored');
  return result;
}

function equation(text: string) {
  const result = parse(text);
  if (!result.ok) throw new Error(`"${text}" did not parse`);
  return result.equation;
}

const at = (x: number): PinValue => ({ kind: 'x', x });
const choice = (index: number): PinValue => ({ kind: 'choice', index });

/** Room 3 at a stage, touched, so it is in its opening phase. */
function opened(stageIndex = 0): RoomState {
  return step(touchMachine(enterRoom(r03, stageIndex).room)).room;
}

/** Room 3's first stage with the pin locked at x. */
function lockedAt(x: number): RoomState {
  return step(confirmPin(step(setPin(opened(0), at(x))).room)).room;
}

/** Room 3's second stage with the pin locked on an option. */
function lockedOn(index: number): RoomState {
  return step(confirmPin(step(setPin(opened(1), choice(index))).room)).room;
}

function typed(room: RoomState, tokens: readonly Token[]): RoomState {
  let current = room;
  for (const token of tokens) current = step(typeToken(current, token)).room;
  return current;
}

/** Writes the stage's two blanks with x, ending on the check line at `now`. */
function solveWith(room: RoomState, answer: readonly Token[]): RoomStep {
  const answered = step(enterLine(typed(room, answer), 0)).room;
  return step(enterLine(typed(answered, answer), 0));
}

const levelStage = r03.stages[0] as StageSpec;
const effectStage = r03.stages[1] as StageSpec;

describe('the pin track (Pattern 2, Pin)', () => {
  it("runs over the dial's range, in its steps", () => {
    const track = pinTrack(levelStage);
    expect(track).toEqual({ kind: 'x', min: 6, max: 20, step: 1, reach: 20 });
    if (!track) return;
    expect(slotCount(track)).toBe(15);
    expect(slotsInReach(track)).toBe(15);
    expect(slotValue(track, 0)).toEqual(at(6));
    expect(slotValue(track, 8)).toEqual(at(14));
    expect(slotOf(track, at(14))).toBe(8);
  });

  it("runs to twice the dial's maximum when the pin goes beyond the dial (room 4)", () => {
    const room4: StageSpec = {
      ...levelStage,
      machines: [{ equation: '2x + 5 = 23' }],
      dial: { min: 0, max: 6, step: 1 },
      pin: { kind: 'level-x', beyondDial: true },
    };
    const track = pinTrack(room4);
    expect(track).toEqual({ kind: 'x', min: 0, max: 12, step: 1, reach: 6 });
    if (!track) return;
    expect(slotCount(track)).toBe(13);
    expect(slotsInReach(track)).toBe(7);
    expect(slotOf(track, at(9))).toBe(9);
  });

  it('steps by the divisor on a division dial', () => {
    const division: StageSpec = { ...levelStage, dial: { min: 0, max: 30, step: 3 } };
    const track = pinTrack(division);
    if (!track) throw new Error('no track');
    expect(slotCount(track)).toBe(11);
    expect(slotOf(track, at(15))).toBe(5);
    expect(slotOf(track, at(14))).toBeNull();
  });

  it("has an effect pin's options as its places", () => {
    const track = pinTrack(effectStage);
    expect(track).toEqual({ kind: 'choice', options: ['pan-down', 'pan-up'] });
    if (!track) return;
    expect(slotCount(track)).toBe(2);
    expect(slotValue(track, 1)).toEqual(choice(1));
    expect(slotOf(track, choice(2))).toBeNull();
    expect(slotOf(track, at(1))).toBeNull();
  });

  it('refuses values that are off the track', () => {
    const track = pinTrack(levelStage);
    if (!track) throw new Error('no track');
    for (const value of [at(5), at(21), at(6.5), choice(0)])
      expect(slotOf(track, value)).toBeNull();
    expect(() => slotValue(track, 15)).toThrow(/no pin place/);
  });

  it('places only level-x and effect pins so far; the other kinds arrive with their rooms', () => {
    expect(pinSupported({ kind: 'level-x' })).toBe(true);
    expect(pinSupported({ kind: 'effect', options: ['pan-up'], resolvesOn: 'level' })).toBe(true);
    for (const kind of ['x-hidden', 'wrong-line', 'story-choice', 'next-dot'] as const) {
      expect(pinSupported({ kind })).toBe(false);
      expect(pinTrack({ ...levelStage, pin: { kind } })).toBeNull();
    }
    expect(pinTrack({ ...levelStage, pin: undefined })).toBeNull();
  });
});

describe('poke, then pin (Pattern 2)', () => {
  it('opens room 3 stage 1 in poke, with the dial over 6, 7, 8 and 9 only and the notebook off', () => {
    const room = opened(0);
    expect(room.stage.phase).toBe('poke');
    expect(room.stage.dialOpen).toEqual({ min: 6, max: 9 });
    expect(notebookWrites(room.stage)).toBe(false);
    expect(dialView(room)).toMatchObject({ openMin: 6, openMax: 9, turns: true });
    expect(setDial(room, 9)?.room.stage.dialX).toBe(9);
    expect(setDial(room, 10)).toBeNull();
    expect(pinOffered(room)).toBe(true);
  });

  it('goes to pin on his first drag of the pin, and the dial freezes', () => {
    const poked = step(setDial(opened(0), 8)).room;
    const pinned = step(setPin(poked, at(12)));
    expect(pinned.events).toEqual([]);
    expect(pinned.room.stage.phase).toBe('pin');
    expect(pinned.room.stage.pin).toEqual({ value: at(12), locked: false, resolved: false });
    expect(pinned.room.stage.dialX).toBe(8);
    expect(dialView(pinned.room)?.turns).toBe(false);
    expect(setDial(pinned.room, 7)).toBeNull();
    expect(notebookWrites(pinned.room.stage)).toBe(false);
  });

  it('moves the pin on a second drag, and ignores a drag to where it already is', () => {
    const pinned = step(setPin(opened(0), at(12))).room;
    const moved = step(setPin(pinned, at(15))).room;
    expect(moved.stage.phase).toBe('pin');
    expect(moved.stage.pin?.value).toEqual(at(15));
    expect(setPin(moved, at(15))).toBeNull();
  });

  it('ignores a pin put off its track, or of the wrong kind', () => {
    const room = opened(0);
    expect(setPin(room, at(21))).toBeNull();
    expect(setPin(room, at(5))).toBeNull();
    expect(setPin(room, choice(0))).toBeNull();
    expect(setPin(opened(1), at(3))).toBeNull();
  });

  it('locks the pin on confirming, opens the full dial range and turns the notebook on', () => {
    const pinned = step(setPin(opened(0), at(14))).room;
    const confirmed = step(confirmPin(pinned));
    expect(confirmed.events).toEqual([]);
    const { stage } = confirmed.room;
    expect(stage.phase).toBe('open');
    expect(stage.pin).toEqual({ value: at(14), locked: true, resolved: false });
    expect(stage.dialOpen).toEqual({ min: 6, max: 20 });
    expect(notebookWrites(stage)).toBe(true);
    expect(dialView(confirmed.room)).toMatchObject({ openMax: 20, turns: true });
    expect(pinOffered(confirmed.room)).toBe(false);
    expect(setPin(confirmed.room, at(15))).toBeNull();
    expect(confirmPin(confirmed.room)).toBeNull();
  });

  it('confirms nothing before the pin is placed', () => {
    expect(confirmPin(opened(0))).toBeNull();
    expect(confirmPin(enterRoom(r03).room)).toBeNull();
  });

  it('offers the pin only in poke and pin', () => {
    const phases: Phase[] = ['arrive', 'open', 'locked', 'restart', 'done'];
    for (const phase of phases) {
      const room = opened(0);
      const there = { ...room, stage: { ...room.stage, phase } };
      expect(pinOffered(there), phase).toBe(false);
      expect(setPin(there, at(12)), phase).toBeNull();
    }
  });

  it('opens room 3 stage 2 straight into pin: the dial does not move before he pins', () => {
    const arrived = enterRoom(r03, 1).room;
    expect(dialView(arrived)?.turns).toBe(false);
    expect(setDial(arrived, 1)).toBeNull();
    const room = opened(1);
    expect(room.stage.phase).toBe('pin');
    expect(room.stage.pin).toBeNull();
    expect(room.stage.dialOpen).toEqual({ min: 0, max: 20 });
    expect(setDial(room, 1)).toBeNull();
    expect(confirmPin(room)).toBeNull();
    const pinned = step(setPin(room, choice(0))).room;
    expect(pinned.stage.phase).toBe('pin');
    const confirmed = step(confirmPin(pinned)).room;
    expect(confirmed.stage.phase).toBe('open');
    expect(setDial(confirmed, 1)?.room.stage.dialX).toBe(1);
  });
});

describe('resolution (Pattern 2)', () => {
  it('resolves a right "where it levels" pin when the dial levels the pans', () => {
    let room = lockedAt(14);
    room = step(setDial(room, 13)).room;
    expect(room.stage.pin?.resolved).toBe(false);
    const levelled = step(setDial(room, 14));
    expect(levelled.events).toEqual([
      { type: 'DialNotch', x: 14 },
      { type: 'PansLevel', roomId: 'r03', stage: 0, x: 14 },
      { type: 'PredictionMade', roomId: 'r03', stage: 0, right: true },
    ]);
    expect(levelled.room.stage.pin).toEqual({ value: at(14), locked: true, resolved: true });
    expect(pinView(levelled.room)?.result).toBe('right');
    expect(pinRevealX(levelled.room)).toBeNull();
  });

  it('resolves once: levelling the pans again fires no second PredictionMade', () => {
    let room = step(setDial(lockedAt(14), 14)).room;
    room = step(setDial(room, 15)).room;
    const again = step(setDial(room, 14));
    expect(again.events.map((event) => event.type)).toEqual(['DialNotch', 'PansLevel']);
  });

  it('resolves a wrong pin as wrong, with no penalty, and shows its own x on the pans', () => {
    const room = lockedAt(12);
    const levelled = step(setDial(room, 14));
    expect(levelled.events.at(-1)).toEqual({
      type: 'PredictionMade',
      roomId: 'r03',
      stage: 0,
      right: false,
    });
    const after = levelled.room;
    expect(after.stage.machineProgress).toEqual([0]);
    expect(after.stage.jam).toBeNull();
    expect(pinView(after)?.result).toBe('wrong');
    expect(pinRevealX(after)).toBe(12);
    // x − 6 = 8 at 12: the left side weighs 6 against 8, so the right pan is lower.
    const reveal = pinRevealView(after);
    expect(reveal?.x).toBe(12);
    expect(reveal?.tilt).toBe(-2);
    expect(reveal?.readouts).toEqual({ left: '6', right: '8' });
    expect(scaleView(after)).toMatchObject({ x: 14, tilt: 0, level: true });
  });

  it("doesn't resolve on a notch that doesn't level the pans", () => {
    const room = lockedAt(12);
    for (const x of [7, 12, 20]) {
      const turned = setDial(room, x);
      expect(turned?.events.map((event) => event.type)).not.toContain('PredictionMade');
      expect(turned?.room.stage.pin?.resolved).toBe(false);
    }
  });

  it('resolves when the stage locks, if the dial never levelled the pans', () => {
    const solved = solveWith(lockedAt(12), ['1', '4']);
    expect(solved.events.map((event) => event.type)).toEqual([
      'LineAccepted',
      'StageLocked',
      'PredictionMade',
    ]);
    expect(solved.events.at(-1)).toMatchObject({ right: false });
    expect(solved.room.stage.pin?.resolved).toBe(true);
    // The pans hold the check line, with no x: the reveal weighs the stage's equation.
    expect(pinRevealView(solved.room)).toMatchObject({ x: 12, tilt: -2 });
  });

  it('fires nothing more on the lock once the pin has resolved', () => {
    const levelled = step(setDial(lockedAt(14), 14)).room;
    const solved = solveWith(levelled, ['1', '4']);
    expect(solved.events.map((event) => event.type)).toEqual(['LineAccepted', 'StageLocked']);
  });

  it('resolves a direction pin on the first notch after it is locked: up is right for 20 − x', () => {
    const right = step(setDial(lockedOn(1), 1));
    expect(right.events).toEqual([
      { type: 'DialNotch', x: 1 },
      { type: 'PredictionMade', roomId: 'r03', stage: 1, right: true },
    ]);
    expect(pinView(right.room)?.result).toBe('right');
    const wrong = step(setDial(lockedOn(0), 3));
    expect(wrong.events.at(-1)).toMatchObject({ type: 'PredictionMade', right: false });
    expect(pinView(wrong.room)?.result).toBe('wrong');
    expect(pinRevealX(wrong.room)).toBeNull();
    expect(pinRevealView(wrong.room)).toBeNull();
    const next = step(setDial(right.room, 2));
    expect(next.events).toEqual([{ type: 'DialNotch', x: 2 }]);
  });

  it("raises x's spring pan: the left pan rises on the first notch of 20 − x = 6", () => {
    const before = scaleView(lockedOn(1)).tilt;
    const after = scaleView(step(setDial(lockedOn(1), 1)).room).tilt;
    expect(after).toBeLessThan(before);
  });

  it('resolves an effect pin that waits for the level when the pans level', () => {
    const levelEffect: RoomSpec = {
      ...r03,
      stages: [
        {
          ...effectStage,
          pin: { kind: 'effect', options: ['pan-down', 'pan-up'], resolvesOn: 'level' },
        },
      ],
    };
    let room = step(touchMachine(enterRoom(levelEffect).room)).room;
    room = step(confirmPin(step(setPin(room, choice(1))).room)).room;
    room = step(setDial(room, 1)).room;
    expect(room.stage.pin?.resolved).toBe(false);
    const levelled = step(setDial(room, 14));
    expect(levelled.events.at(-1)).toMatchObject({ type: 'PredictionMade', right: true });
  });

  it('resolves nothing without a locked pin, or on a trigger that is not its own', () => {
    expect(resolvePin(opened(0), 'lock')).toBeNull();
    expect(resolvePin(step(setPin(opened(0), at(14))).room, 'lock')).toBeNull();
    expect(resolvePin(lockedAt(14), 'notch')).toBeNull();
    expect(resolvePin(lockedOn(1), 'level')).toBeNull();
    expect(resolvePin(lockedAt(14), 'lock')?.events).toHaveLength(1);
  });
});

describe('xPanMotion and pinRight', () => {
  it('says which way the pan holding x goes as x grows', () => {
    expect(xPanMotion(equation('20 − x = 6'))).toBe('pan-up');
    expect(xPanMotion(equation('x − 6 = 8'))).toBe('pan-down');
    expect(xPanMotion(equation('2x + 5 = 23'))).toBe('pan-down');
    expect(xPanMotion(equation('6 = 20 − x'))).toBe('pan-up');
    expect(xPanMotion(equation('23 = 2x + 5'))).toBe('pan-down');
    expect(xPanMotion(equation('135 − 5x = 100'))).toBe('pan-up');
  });

  it("is right for the stage's solution, or the option that names what x does", () => {
    expect(pinRight(levelStage, 0, at(14))).toBe(true);
    expect(pinRight(levelStage, 0, at(13))).toBe(false);
    expect(pinRight(levelStage, 0, choice(0))).toBe(false);
    expect(pinRight(effectStage, 0, choice(1))).toBe(true);
    expect(pinRight(effectStage, 0, choice(0))).toBe(false);
    expect(pinRight(effectStage, 0, at(14))).toBe(false);
  });
});

describe('pinView', () => {
  it('shows nothing with no room, no pin, or before the stage offers it', () => {
    expect(pinView(null)).toBeNull();
    expect(pinView(enterRoom(r03).room)).toBeNull();
    const noPin = { ...r03, stages: [{ ...levelStage, pin: undefined, pokeNotches: undefined }] };
    expect(pinView(step(touchMachine(enterRoom(noPin).room)).room)).toBeNull();
  });

  it('shows the pin in its holder in poke, wiggling once if this is its first use', () => {
    const room = opened(0);
    expect(pinView(room)).toEqual({
      kind: 'x',
      slots: 15,
      reach: 15,
      slot: null,
      label: null,
      option: null,
      movable: true,
      confirmable: false,
      locked: false,
      result: null,
      wiggle: false,
    });
    expect(pinView({ ...room, stage: { ...room.stage, hintLevel: 1 } })?.wiggle).toBe(true);
  });

  it('shows its place and number once placed, confirmable, then locked', () => {
    const pinned = step(setPin(opened(0), at(12))).room;
    expect(pinView(pinned)).toMatchObject({
      slot: 6,
      label: '12',
      movable: true,
      confirmable: true,
    });
    const locked = step(confirmPin(pinned)).room;
    expect(pinView(locked)).toMatchObject({
      slot: 6,
      label: '12',
      movable: false,
      confirmable: false,
      locked: true,
      result: null,
      wiggle: false,
    });
  });

  it("shows a choice pin's option", () => {
    const pinned = step(setPin(opened(1), choice(1))).room;
    expect(pinView(pinned)).toMatchObject({
      kind: 'choice',
      slots: 2,
      slot: 1,
      label: null,
      option: 'pan-up',
    });
  });
});
