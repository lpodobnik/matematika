import { describe, expect, it } from 'vitest';
import { r01 } from '@/content/rooms/r01-door-lift';
import * as q from '@/math/rational';
import { enterRoom } from '@/room/room';
import { readoutLabel, scaleView, showsReadouts } from '@/room/scale';
import type { RoomSpec, RoomState } from '@/room/types';

function roomWith(equation: string, extra: Partial<RoomSpec['stages'][number]> = {}): RoomState {
  const first = r01.stages[0];
  if (!first) throw new Error('room 1 has no stage');
  return enterRoom({ ...r01, stages: [{ ...first, machines: [{ equation }], ...extra }] }).room;
}

describe('scaleView', () => {
  it('shows room 1 at the dial x: a gear and a 4 against a 9, tipped 5° to the right', () => {
    const view = scaleView(enterRoom(r01).room);
    expect(view.x).toBe(0);
    expect(view.left.pieces.map((p) => [p.kind, p.label])).toEqual([
      ['gear', '0'],
      ['weight', '4'],
    ]);
    expect(view.right.pieces.map((p) => [p.kind, p.label])).toEqual([['weight', '9']]);
    expect(view.left.value).toEqual(q.rational(4));
    expect(view.right.value).toEqual(q.rational(9));
    expect(view.tilt).toBe(-5);
    expect(view.level).toBe(false);
  });

  it("weighs the pans at the dial's x and shows it on the small gears", () => {
    const room = enterRoom(r01).room;
    const at5 = scaleView({ ...room, stage: { ...room.stage, dialX: 5 } });
    expect(at5.left.pieces[0]?.label).toBe('5');
    expect(at5.tilt).toBe(0);
    expect(at5.level).toBe(true);
  });

  it('labels large gears with their count and dividers with their size', () => {
    const view = scaleView(roomWith('27x + x : 3 = 5 905'));
    expect(view.left.pieces.map((p) => [p.kind, p.label, p.divisorLabel])).toEqual([
      ['gear', '27x', null],
      ['gear', '0', '3'],
    ]);
    expect(view.right.pieces[0]?.label).toBe('5\u202f905');
  });

  it("uses the stage's tilt per unit when it has one", () => {
    expect(scaleView(roomWith('2x + 5 = 23', { tiltPerUnit: 0.75 })).tilt).toBeCloseTo(-13.5);
    expect(scaleView(roomWith('2x + 5 = 23')).tilt).toBe(-15);
  });

  describe('readouts', () => {
    it("show both sides' values at the dial's x in room 1", () => {
      const room = enterRoom(r01).room;
      expect(scaleView(room).readouts).toEqual({ left: '4', right: '9' });
      const at5 = scaleView({ ...room, stage: { ...room.stage, dialX: 5 } });
      expect(at5.readouts).toEqual({ left: '9', right: '9' });
    });

    it('are hidden in a stage with readouts: false, or with the readouts blind', () => {
      expect(scaleView(roomWith('x + 56 = 58 + 27', { readouts: false })).readouts).toBeNull();
      expect(scaleView(roomWith('x + 4 = 9', { blinds: { readouts: true } })).readouts).toBeNull();
      const stage = r01.stages[0];
      if (!stage) throw new Error('room 1 has no stage');
      expect(showsReadouts(stage)).toBe(true);
      expect(showsReadouts({ ...stage, readouts: false })).toBe(false);
      expect(showsReadouts({ ...stage, blinds: { readouts: true } })).toBe(false);
    });

    it('write numbers in school notation', () => {
      expect(scaleView(roomWith('27x + 5 = 5 905')).readouts).toEqual({
        left: '5',
        right: '5\u202f905',
      });
      expect(readoutLabel(q.rational(5, 3))).toBe('5 : 3');
    });
  });
});
