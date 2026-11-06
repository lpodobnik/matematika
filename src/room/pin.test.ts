import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import { r03 } from '@/content/rooms/r03-sluice-gate';
import { parse } from '@/math/parse';
import type { Token } from '@/math/tokens';
import { dialView, setDial } from '@/room/dial';
import { enterLine, notebookWrites, typeToken } from '@/room/notebook';
import { touchMachine } from '@/room/phases';
import {
  confirmPin,
  machineTestX,
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
  tiltAsXGrows,
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
    expect(track).toEqual({ kind: 'choice', options: ['tilt-left', 'tilt-right'] });
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
    expect(pinSupported({ kind: 'effect', options: ['tilt-right'] })).toBe(true);
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

  // Story 1.14 replaces "and the dial freezes": the dial keeps turning inside the poke
  // window while he pins, and turning it never moves the pin.
  it('goes to pin on his first drag of the pin, and the dial keeps turning in its window', () => {
    const poked = step(setDial(opened(0), 8)).room;
    const pinned = step(setPin(poked, at(12)));
    expect(pinned.events).toEqual([]);
    expect(pinned.room.stage.phase).toBe('pin');
    expect(pinned.room.stage.pin).toEqual({ value: at(12), locked: false, resolved: false });
    expect(pinned.room.stage.dialX).toBe(8);
    expect(dialView(pinned.room)).toMatchObject({ openMin: 6, openMax: 9, turns: true });
    const turned = step(setDial(pinned.room, 7));
    expect(turned.events).toEqual([{ type: 'DialNotch', x: 7 }]);
    expect(turned.room.stage).toMatchObject({ phase: 'pin', dialX: 7 });
    expect(turned.room.stage.pin).toEqual(pinned.room.stage.pin);
    expect(setDial(pinned.room, 10)).toBeNull();
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
    expect(confirmed.events).toEqual([
      { type: 'PredictionMade', roomId: 'r03', stage: 0, right: true },
    ]);
    const { stage } = confirmed.room;
    expect(stage.phase).toBe('open');
    expect(stage.pin).toEqual({ value: at(14), locked: true, resolved: true });
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
    // The machine turned it up 3 notches to test the pin; now it is his.
    expect(confirmed.stage.dialX).toBe(3);
    expect(setDial(confirmed, 1)?.room.stage.dialX).toBe(1);
  });
});

// Story 1.14 replaces the old triggers: a level-x pin no longer waits for the dial to level
// the pans, and an effect pin no longer waits for the first notch. Every pin resolves as he
// confirms it, and the machine tests it; the lock stays as a safety trigger only.
describe('the machine tests the pin on confirm (Pattern 2, Resolution)', () => {
  it('resolves a right "where it levels" pin at once, and turns the dial to it itself', () => {
    const poked = step(setDial(opened(0), 9)).room;
    const confirmed = step(confirmPin(step(setPin(poked, at(14))).room));
    // No DialNotch, PansLevel or WayUsed: the machine's turn is neither exploring nor a way.
    expect(confirmed.events).toEqual([
      { type: 'PredictionMade', roomId: 'r03', stage: 0, right: true },
    ]);
    const { room } = confirmed;
    expect(room.stage).toMatchObject({ phase: 'open', dialX: 14, actingOut: false });
    expect(room.stage.dialOpen).toEqual({ min: 6, max: 20 });
    expect(room.stage.pin).toEqual({ value: at(14), locked: true, resolved: true });
    expect(pinView(room)?.result).toBe('right');
    // The pans come to rest level at the pin's x.
    expect(scaleView(room)).toMatchObject({ x: 14, tilt: 0, level: true });
    expect(pinRevealX(room)).toBeNull();
  });

  it('resolves a wrong pin as wrong, with no penalty: the pans come to rest tipped at its x', () => {
    const confirmed = step(confirmPin(step(setPin(opened(0), at(12))).room));
    expect(confirmed.events).toEqual([
      { type: 'PredictionMade', roomId: 'r03', stage: 0, right: false },
    ]);
    const after = confirmed.room;
    expect(after.stage.dialX).toBe(12);
    expect(after.stage.machineProgress).toEqual([0]);
    expect(after.stage.jam).toBeNull();
    expect(pinView(after)?.result).toBe('wrong');
    // x − 6 = 8 at 12: the left side weighs 6 against 8, so the right pan is lower.
    expect(scaleView(after)).toMatchObject({ x: 12, tilt: -2, level: false });
    expect(scaleView(after).readouts).toEqual({ left: '6', right: '8' });
    expect(pinRevealView(after)).toBeNull();
  });

  it('then gives him the dial over its full range, and the dial never resolves it again', () => {
    const tested = step(confirmPin(step(setPin(opened(0), at(12))).room)).room;
    for (const x of [6, 14, 20]) {
      const turned = step(setDial(tested, x));
      expect(turned.events.map((event) => event.type)).not.toContain('PredictionMade');
      expect(turned.room.stage.pin).toEqual(tested.stage.pin);
    }
    expect(step(setDial(tested, 14)).events).toEqual([
      { type: 'DialNotch', x: 14 },
      { type: 'PansLevel', roomId: 'r03', stage: 0, x: 14 },
    ]);
  });

  it('weighs a pin beyond the dial at its own x, right or wrong, and leaves the dial where it is', () => {
    const room4: RoomSpec = {
      ...r03,
      stages: [
        {
          ...levelStage,
          machines: [{ equation: '2x + 5 = 23' }],
          dial: { min: 0, max: 6, step: 1 },
          pokeNotches: 4,
          pin: { kind: 'level-x', beyondDial: true },
        },
      ],
    };
    const poking = step(setDial(step(touchMachine(enterRoom(room4).room)).room, 2)).room;
    const right = step(confirmPin(step(setPin(poking, at(9))).room));
    expect(right.events).toEqual([
      { type: 'PredictionMade', roomId: 'r03', stage: 0, right: true },
    ]);
    expect(right.room.stage.dialX).toBe(2);
    expect(pinRevealX(right.room)).toBe(9);
    expect(pinRevealView(right.room)).toMatchObject({ x: 9, tilt: 0, level: true });
    const wrong = step(confirmPin(step(setPin(poking, at(11))).room));
    expect(wrong.events.at(-1)).toMatchObject({ right: false });
    expect(wrong.room.stage.dialX).toBe(2);
    expect(pinRevealView(wrong.room)).toMatchObject({ x: 11, level: false });
    expect(scaleView(wrong.room).x).toBe(2);
  });

  it('turns the dial up 3 notches for a direction pin: up is right for 20 − x', () => {
    expect(tuning.pinEffectTestNotches).toBe(3);
    const right = step(confirmPin(step(setPin(opened(1), choice(1))).room));
    expect(right.events).toEqual([
      { type: 'PredictionMade', roomId: 'r03', stage: 1, right: true },
    ]);
    expect(right.room.stage.dialX).toBe(3);
    expect(pinView(right.room)?.result).toBe('right');
    const wrong = step(confirmPin(step(setPin(opened(1), choice(0))).room));
    expect(wrong.events.at(-1)).toMatchObject({ type: 'PredictionMade', right: false });
    expect(pinView(wrong.room)?.result).toBe('wrong');
    expect(pinRevealX(wrong.room)).toBeNull();
    expect(pinRevealView(wrong.room)).toBeNull();
    const next = step(setDial(right.room, 4));
    expect(next.events).toEqual([{ type: 'DialNotch', x: 4 }]);
  });

  it("raises x's spring pan as the machine turns the dial: 20 − x = 6", () => {
    const pinned = step(setPin(opened(1), choice(1))).room;
    const after = step(confirmPin(pinned)).room;
    expect(scaleView(after).tilt).toBeLessThan(scaleView(pinned).tilt);
  });

  it('turns a direction pin only as far as the dial goes', () => {
    const spec = effectStage;
    expect(machineTestX(spec, 0, choice(0))).toBe(3);
    expect(machineTestX(spec, 18, choice(1))).toBe(20);
    expect(machineTestX(spec, 20, choice(1))).toBe(20);
    const division: StageSpec = { ...spec, dial: { min: 0, max: 30, step: 3 } };
    expect(machineTestX(division, 6, choice(0))).toBe(15);
    expect(machineTestX(levelStage, 7, at(14))).toBe(14);
    expect(machineTestX({ ...levelStage, dial: { min: 0, max: 6, step: 1 } }, 2, at(9))).toBe(2);
  });

  it('fires nothing more when the stage locks, since the pin resolved on confirm', () => {
    const tested = step(confirmPin(step(setPin(opened(0), at(12))).room)).room;
    const solved = solveWith(tested, ['1', '4']);
    expect(solved.events.map((event) => event.type)).toEqual(['LineAccepted', 'StageLocked']);
  });

  it('still resolves a pin left unresolved when the stage locks, as a safety', () => {
    const tested = step(confirmPin(step(setPin(opened(0), at(12))).room)).room;
    const pin = tested.stage.pin;
    if (!pin) throw new Error('no pin');
    const unresolved = { ...tested, stage: { ...tested.stage, pin: { ...pin, resolved: false } } };
    const solved = solveWith(unresolved, ['1', '4']);
    expect(solved.events.map((event) => event.type)).toEqual([
      'LineAccepted',
      'StageLocked',
      'PredictionMade',
    ]);
    expect(solved.events.at(-1)).toMatchObject({ right: false });
  });

  it('resolves nothing without a locked pin, or once it has resolved', () => {
    expect(resolvePin(opened(0))).toBeNull();
    expect(resolvePin(step(setPin(opened(0), at(14))).room)).toBeNull();
    expect(resolvePin(lockedAt(14))).toBeNull();
    expect(resolvePin(lockedOn(1))).toBeNull();
  });
});

describe('tiltAsXGrows and pinRight', () => {
  // Story 1.15 rewrites 1.14's "which way the pan holding x goes" (pan-down / pan-up): the
  // direction pin now asks which way the whole scale tilts, toward the side that gets heavier.
  it('says which way the whole scale tilts as x grows: toward the side x makes heavier', () => {
    expect(tiltAsXGrows(equation('20 − x = 6'))).toBe('tilt-right');
    expect(tiltAsXGrows(equation('x − 6 = 8'))).toBe('tilt-left');
    expect(tiltAsXGrows(equation('2x + 5 = 23'))).toBe('tilt-left');
    expect(tiltAsXGrows(equation('6 = 20 − x'))).toBe('tilt-left');
    expect(tiltAsXGrows(equation('23 = 2x + 5'))).toBe('tilt-right');
    expect(tiltAsXGrows(equation('135 − 5x = 100'))).toBe('tilt-right');
  });

  it('weighs x on both sides by what is left of it', () => {
    expect(tiltAsXGrows(equation('3x + 1 = x + 9'))).toBe('tilt-left');
    expect(tiltAsXGrows(equation('x + 9 = 3x + 1'))).toBe('tilt-right');
    expect(() => tiltAsXGrows(equation('x + 1 = x + 2'))).toThrow();
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
      question: 'level-x',
      asks: true,
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
      asks: true,
      movable: true,
      confirmable: true,
    });
    const locked = step(confirmPin(pinned)).room;
    expect(pinView(locked)).toMatchObject({
      slot: 6,
      label: '12',
      asks: false,
      movable: false,
      confirmable: false,
      locked: true,
      result: 'wrong',
      wiggle: false,
    });
  });

  it("shows a choice pin's option", () => {
    const pinned = step(setPin(opened(1), choice(1))).room;
    expect(pinView(pinned)).toMatchObject({
      kind: 'choice',
      question: 'effect',
      asks: true,
      slots: 2,
      slot: 1,
      label: null,
      option: 'tilt-right',
    });
  });
});
