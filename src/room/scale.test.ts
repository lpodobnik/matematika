import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import { r01 } from '@/content/rooms/r01-door-lift';
import * as q from '@/math/rational';
import { tokenize } from '@/math/tokens';
import { setDial } from '@/room/dial';
import { deleteToken, enterLine, typeToken } from '@/room/notebook';
import { enterRoom } from '@/room/room';
import { hiddenXLabel, readoutLabel, scaleView, showsReadouts, stageX } from '@/room/scale';
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

/** Types a line on a blank page and presses enter. */
function write(room: RoomState, text: string): RoomState {
  const result = tokenize(text);
  if (!result.ok) throw new Error(text);
  const typed = result.tokens.reduce((current, token) => {
    const next = typeToken(current, token);
    if (!next) throw new Error(`"${token}" was ignored`);
    return next.room;
  }, room);
  const entered = enterLine(typed);
  if (!entered) throw new Error('enter was ignored');
  return entered.room;
}

const blankPage = (equation: string, extra: Partial<RoomSpec['stages'][number]> = {}) =>
  roomWith(equation, { fading: { try: 'blank' }, dial: { min: 0, max: 10, step: 1 }, ...extra });

describe('acting out a written line (story 1.7)', () => {
  it("weighs a committed line at the stage's solution, with ? on the gears and no readouts", () => {
    const explored = setDial(blankPage('2x + 7 = 25'), 3)?.room as RoomState;
    const view = scaleView(write(explored, '2x = 25 − 7'));
    expect(view.actingOut).toBe(true);
    expect(view.x).toBe(9);
    expect(view.left.pieces.map((p) => [p.kind, p.label])).toEqual([
      ['gear', hiddenXLabel],
      ['gear', hiddenXLabel],
    ]);
    expect(view.right.pieces.map((p) => [p.kind, p.label])).toEqual([
      ['weight', '25'],
      ['float', '7'],
    ]);
    expect(view.readouts).toBeNull();
    expect(view.tilt).toBe(0);
    expect(view.level).toBe(true);
  });

  it('keeps the count on a large gear and the size on a divider: only x is hidden', () => {
    const view = scaleView(write(blankPage('27x + 5 = 5 405'), '27x = 5 400'));
    expect(view.left.pieces.map((p) => p.label)).toEqual(['27x']);
    const divided = scaleView(
      write(blankPage('x : 3 = 5', { dial: { min: 0, max: 30, step: 3 } }), 'x : 3 = 10 − 5'),
    );
    expect(divided.left.pieces.map((p) => [p.label, p.divisorLabel])).toEqual([['?', '3']]);
  });

  it("goes back to the dial's x, its label and the readouts on the dial's next notch", () => {
    const acted = write(blankPage('x + 4 = 9'), 'x = 9 − 4');
    const turned = setDial(acted, 2)?.room as RoomState;
    const view = scaleView(turned);
    expect(view.actingOut).toBe(false);
    expect(view.x).toBe(2);
    expect(view.left.pieces.map((p) => [p.kind, p.label])).toEqual([['gear', '2']]);
    expect(view.right.pieces.map((p) => [p.kind, p.label])).toEqual([
      ['weight', '9'],
      ['float', '4'],
    ]);
    expect(view.readouts).toEqual({ left: '2', right: '5' });
  });

  it('acts out the check line as weights of its numbers, level', () => {
    const answered = write(blankPage('x + 4 = 9'), 'x = 5');
    const view = scaleView(write(answered, '5 + 4 = 9'));
    expect(view.left.pieces.map((p) => [p.kind, p.label])).toEqual([
      ['weight', '5'],
      ['weight', '4'],
    ]);
    expect(view.right.pieces.map((p) => [p.kind, p.label])).toEqual([['weight', '9']]);
    expect(view.level).toBe(true);
  });

  it(`acts out a wrong line at the solution, tipped at least ${tuning.jamMinTilt}°`, () => {
    const jammed = write(blankPage('x + 4 = 9'), 'x = 6');
    const view = scaleView(jammed);
    expect(view.actingOut).toBe(true);
    expect(view.x).toBe(5);
    expect(view.left.pieces.map((p) => [p.kind, p.label])).toEqual([['gear', '?']]);
    expect(view.right.pieces.map((p) => [p.kind, p.label])).toEqual([['weight', '6']]);
    expect(view.tilt).toBe(-tuning.jamMinTilt);
    expect(view.level).toBe(false);
    expect(view.readouts).toBeNull();
    const far = scaleView(write(blankPage('2x + 7 = 25'), '2x = 32'));
    expect(far.tilt).toBe(-14);
  });

  it('returns to what the pans showed before, once the wrong line is edited', () => {
    const explored = setDial(blankPage('x + 4 = 9'), 7)?.room as RoomState;
    const jammed = write(explored, 'x = 7');
    const edited = deleteToken(jammed)?.room as RoomState;
    expect(scaleView(edited)).toEqual(scaleView(explored));
  });

  it("finds the stage's solution for acting out", () => {
    expect(stageX(blankPage('2x + 7 = 25'))).toBe(9);
    expect(stageX(enterRoom(r01).room)).toBe(5);
  });
});
