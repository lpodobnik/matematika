import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { r01 } from '@/content/rooms/r01-door-lift';
import { r03 } from '@/content/rooms/r03-sluice-gate';
import * as q from '@/math/rational';
import {
  type DialStep,
  dialTurnsIn,
  dialValue,
  dialView,
  isOnDial,
  notchCount,
  notchOf,
  setDial,
} from '@/room/dial';
import { enterRoom } from '@/room/room';
import { scaleView } from '@/room/scale';
import type { DialSpec, Phase, RoomState, StageSpec } from '@/room/types';

const roomOneStage = r01.stages[0] as StageSpec;

function roomWith(equation: string, extra: Partial<StageSpec> = {}): RoomState {
  return enterRoom({ ...r01, stages: [{ ...roomOneStage, machines: [{ equation }], ...extra }] })
    .room;
}

/** The test fixture from the acceptance criteria: room 2's second stage. */
const thirds = (): RoomState => roomWith('x : 3 = 5', { dial: { min: 0, max: 30, step: 3 } });

function inPhase(room: RoomState, phase: Phase): RoomState {
  return { ...room, stage: { ...room.stage, phase } };
}

/** Turns the dial to each x in turn, as a drag would, and keeps every step's events. */
function turn(room: RoomState, xs: number[]): { room: RoomState; steps: (DialStep | null)[] } {
  let current = room;
  const taken: (DialStep | null)[] = [];
  for (const x of xs) {
    const step = setDial(current, x);
    taken.push(step);
    if (step) current = step.room;
  }
  return { room: current, steps: taken };
}

/** left − right at each notch of the stage's dial. */
function differences(room: RoomState): q.Rational[] {
  const dial = dialView(room);
  if (!dial) throw new Error('no dial');
  return Array.from({ length: notchCount(dial) + 1 }, (_, notch) => {
    const view = scaleView({ ...room, stage: { ...room.stage, dialX: dialValue(dial, notch) } });
    return q.sub(view.left.value, view.right.value);
  });
}

function changes(values: q.Rational[]): q.Rational[] {
  return values.slice(1).map((value, i) => q.sub(value, values[i] as q.Rational));
}

describe('the dial values', () => {
  const roomOne: DialSpec = { min: 0, max: 10, step: 1 };
  const threes: DialSpec = { min: 0, max: 30, step: 3 };

  it('counts notches from the minimum, one per step', () => {
    expect(notchCount(roomOne)).toBe(10);
    expect(notchCount(threes)).toBe(10);
    expect(notchCount({ min: 6, max: 20, step: 1 })).toBe(14);
  });

  it('turns a notch into x and back', () => {
    expect(dialValue(roomOne, 5)).toBe(5);
    expect(dialValue(threes, 5)).toBe(15);
    expect(dialValue({ min: 6, max: 20, step: 1 }, 0)).toBe(6);
    expect(notchOf(threes, 15)).toBe(5);
  });

  it('holds whole numbers on its notches only, within its range', () => {
    expect([0, 5, 10].map((x) => isOnDial(roomOne, x))).toEqual([true, true, true]);
    expect([-1, 11, 2.5, Number.NaN].map((x) => isOnDial(roomOne, x))).toEqual([
      false,
      false,
      false,
      false,
    ]);
    expect([3, 15, 30].every((x) => isOnDial(threes, x))).toBe(true);
    expect([1, 4, 31].some((x) => isOnDial(threes, x))).toBe(false);
  });
});

describe('dialView', () => {
  it("shows room 1's dial: 0–10 in ones, all of it open, at 0, turning", () => {
    expect(dialView(enterRoom(r01).room)).toEqual({
      min: 0,
      max: 10,
      step: 1,
      openMin: 0,
      openMax: 10,
      x: 0,
      turns: true,
    });
  });

  it('has nothing to show with no room or a locked dial', () => {
    expect(dialView(null)).toBeNull();
    expect(dialView(roomWith('3x − 1 = 17', { dial: 'locked' }))).toBeNull();
  });

  it('turns in arrive, poke and open, and holds still from locked on', () => {
    const stage = roomOneStage;
    const turning = (['arrive', 'poke', 'open'] as const).map((p) => dialTurnsIn(stage, p));
    const still = (['locked', 'restart', 'done'] as const).map((p) => dialTurnsIn(stage, p));
    expect(turning).toEqual([true, true, true]);
    expect(still).toEqual([false, false, false]);
  });

  // Story 1.14 replaces "the pin freezes the dial": in pin the dial keeps turning inside its
  // poke window. Only a stage with a pin and no poke window holds it still until confirm.
  it('turns in pin inside a poke window, and holds still in pin without one', () => {
    const [withWindow, withoutWindow] = r03.stages as [StageSpec, StageSpec];
    expect(dialTurnsIn(withWindow, 'pin')).toBe(true);
    expect(dialTurnsIn(withoutWindow, 'pin')).toBe(false);
    expect(dialTurnsIn(withoutWindow, 'arrive')).toBe(false);
    expect(dialTurnsIn(roomOneStage, 'pin')).toBe(false);
    expect(dialView(inPhase(enterRoom(r03).room, 'pin'))?.turns).toBe(true);
    expect(dialView(inPhase(enterRoom(r03, 1).room, 'pin'))?.turns).toBe(false);
  });
});

describe('setDial', () => {
  it('moves the dial to a new notch and fires DialNotch', () => {
    const step = setDial(enterRoom(r01).room, 1);
    expect(step?.room.stage.dialX).toBe(1);
    expect(step?.events).toEqual([{ type: 'DialNotch', x: 1 }]);
  });

  it('shows the new x on the x-gear', () => {
    const step = setDial(enterRoom(r01).room, 7);
    if (!step) throw new Error('ignored');
    expect(scaleView(step.room).left.pieces[0]).toMatchObject({ kind: 'gear', label: '7' });
  });

  it('levels the pans where the sides are equal, and fires PansLevel', () => {
    const { room, steps: taken } = turn(enterRoom(r01).room, [4, 5]);
    expect(taken[1]?.events).toEqual([
      { type: 'DialNotch', x: 5 },
      { type: 'PansLevel', roomId: 'r01', stage: 0, x: 5 },
    ]);
    expect(scaleView(room).level).toBe(true);
    expect(scaleView(room).tilt).toBe(0);
  });

  it('fires PansLevel again each time a notch lands on level, and never off it', () => {
    const { steps: taken } = turn(enterRoom(r01).room, [5, 6, 5, 4]);
    const levels = taken.map((step) => step?.events.some((e) => e.type === 'PansLevel'));
    expect(levels).toEqual([true, false, true, false]);
  });

  it('ignores the notch it is already on, so the store changes only with the notch', () => {
    const room = enterRoom(r01).room;
    expect(setDial(room, 0)).toBeNull();
    const at3 = setDial(room, 3)?.room;
    if (!at3) throw new Error('ignored');
    expect(setDial(at3, 3)).toBeNull();
  });

  it('stops at either end of its range and refuses anything off its notches', () => {
    const room = enterRoom(r01).room;
    for (const x of [-1, 11, 100, 2.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(setDial(room, x), String(x)).toBeNull();
    }
    expect(setDial(room, 10)?.room.stage.dialX).toBe(10);
  });

  it('keeps to the open part of the dial', () => {
    const room = enterRoom(r01).room;
    const poked = { ...room, stage: { ...room.stage, dialOpen: { min: 0, max: 3 } } };
    expect(setDial(poked, 3)?.room.stage.dialX).toBe(3);
    expect(setDial(poked, 4)).toBeNull();
  });

  it('holds still from locked on, and turns in arrive, poke and open', () => {
    const room = enterRoom(r01).room;
    for (const phase of ['locked', 'restart', 'done'] as const) {
      expect(setDial(inPhase(room, phase), 5), phase).toBeNull();
    }
    for (const phase of ['arrive', 'poke', 'open'] as const) {
      expect(setDial(inPhase(room, phase), 5)?.room.stage.dialX, phase).toBe(5);
    }
  });

  it('turns in pin inside the poke window, firing its events as in poke (story 1.14)', () => {
    const pinning = inPhase(enterRoom(r03).room, 'pin');
    const step = setDial(pinning, 8);
    expect(step?.room.stage.dialX).toBe(8);
    expect(step?.room.stage.phase).toBe('pin');
    expect(step?.events).toEqual([{ type: 'DialNotch', x: 8 }]);
    expect(setDial(pinning, 10)).toBeNull();
    expect(setDial(inPhase(enterRoom(r03, 1).room, 'pin'), 1)).toBeNull();
  });

  it('never moves a locked dial', () => {
    expect(setDial(roomWith('3x − 1 = 17', { dial: 'locked' }), 6)).toBeNull();
  });

  it('leaves the room it was given untouched', () => {
    const room = enterRoom(r01).room;
    const before = structuredClone(room);
    setDial(room, 5);
    expect(room).toEqual(before);
  });

  describe('the fixture x : 3 = 5, dial 0–30 in 3s', () => {
    it('steps in 3s', () => {
      const { room, steps: taken } = turn(thirds(), [3, 6, 9]);
      expect(room.stage.dialX).toBe(9);
      expect(taken.map((step) => step?.events[0])).toEqual([
        { type: 'DialNotch', x: 3 },
        { type: 'DialNotch', x: 6 },
        { type: 'DialNotch', x: 9 },
      ]);
      expect(setDial(room, 10)).toBeNull();
      expect(setDial(room, 8)).toBeNull();
    });

    it('levels at 15, with the gear’s slice tagged : 3', () => {
      const step = setDial(thirds(), 15);
      expect(step?.events).toContainEqual({ type: 'PansLevel', roomId: 'r01', stage: 0, x: 15 });
      if (!step) return;
      expect(scaleView(step.room).left.pieces[0]).toMatchObject({
        kind: 'gear',
        label: '15',
        divisorLabel: ': 3',
      });
    });
  });
});

describe('every notch changes the difference between the sides by the same amount', () => {
  it.each([
    ['x + 4 = 9', { min: 0, max: 10, step: 1 }, 1],
    ['3x = 12', { min: 0, max: 10, step: 1 }, 3],
    ['x : 3 = 5', { min: 0, max: 30, step: 3 }, 1],
    ['2x + 5 = 23', { min: 0, max: 6, step: 1 }, 2],
    ['20 − x = 6', { min: 0, max: 20, step: 1 }, -1],
  ])('%s on %o: %d per notch', (equation, dial, per) => {
    const diffs = changes(differences(roomWith(equation, { dial })));
    expect(diffs.length).toBeGreaterThan(0);
    for (const diff of diffs) expect(diff).toEqual(q.rational(per));
  });

  it('holds for any ax + b = c on any dial', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }),
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 0, max: 900 }),
        fc.integer({ min: 0, max: 20 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1, max: 5 }),
        (a, b, c, min, notches, step) => {
          const equation = `${a}x + ${b} = ${c}`;
          const dial = { min, max: min + notches * step, step };
          const diffs = changes(differences(roomWith(equation, { dial })));
          return diffs.every((diff) => q.equals(diff, q.rational(a * step)));
        },
      ),
    );
  });

  it("tips room 1's pans by the same angle each notch, from −5° to 5°", () => {
    const room = enterRoom(r01).room;
    const tilts = Array.from(
      { length: 11 },
      (_, x) => scaleView({ ...room, stage: { ...room.stage, dialX: x } }).tilt,
    );
    expect(tilts).toEqual([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]);
  });
});
