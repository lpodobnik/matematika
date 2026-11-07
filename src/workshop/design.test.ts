import { describe, expect, it } from 'vitest';
import { stageSolution } from '@/math/check';
import { parse } from '@/math/parse';
import { isOnDial } from '@/room/dial';
import { enterRoom } from '@/room/room';
import {
  answerOf,
  checkDesign,
  checkSolution,
  costOf,
  dialFor,
  equations,
  introSpec,
  newDesign,
  plantWorks,
  type RoomDesign,
  roomSpecOf,
} from '@/workshop/design';
import { fedTemplate, formIds, formPattern, forms, formsMet } from '@/workshop/forms';

const all = ['r01', 'r02', 'r03', 'r04', 'r05', 'r06', 'r07', 'r08', 'r09', 'r10', 'r11', 'r12'];
const toSix = ['r01', 'r02', 'r03', 'r04', 'r05', 'r06'];

function design(
  form: RoomDesign['machines'][number]['form'],
  a: number,
  b: number,
  c: number,
  d = 1,
) {
  return { ...newDesign(form), machines: [{ form, numbers: { a, b, c, d } }] };
}

describe('the forms he can build', () => {
  it('writes each form with letters and with numbers', () => {
    expect(formPattern('ax+b')).toBe('ax + b = c');
    expect(formPattern('b-ax')).toBe('b − ax = c');
    expect(forms['x:a'].write({ a: 3, b: 0, c: 5, d: 0 })).toBe('x : 3 = 5');
  });

  it('offers only the forms of rooms he has done (FR44)', () => {
    expect(formsMet(['r01'])).toEqual(['x+b']);
    expect(formsMet(toSix)).toEqual(['x+b', 'ax', 'x:a', 'x-b', 'b-x', 'ax+b', 'x+b=c+d']);
    expect(formsMet(all)).toEqual([...formIds]);
  });

  it('puts the answer fed in where b goes, or c for a form without b', () => {
    expect(fedTemplate('ax+b', { a: 3, b: 4, c: 19, d: 0 })).toBe('3x + ☐ = 19');
    expect(fedTemplate('ax', { a: 3, b: 0, c: 12, d: 0 })).toBe('3x = ☐');
  });
});

describe('the builder’s rules', () => {
  it('allows a machine whose answer is a whole number', () => {
    expect(checkDesign(design('ax+b', 2, 5, 23), toSix)).toEqual({
      ok: true,
      machines: [null],
      room: null,
    });
    expect(answerOf('ax+b', { a: 2, b: 5, c: 23, d: 0 })).toBe(9);
  });

  it('refuses a machine that would never level: x is not whole', () => {
    expect(checkDesign(design('ax+b', 2, 5, 24), toSix).machines).toEqual(['fraction']);
  });

  it('refuses an answer under 1 or over 9 999', () => {
    expect(checkDesign(design('x+b', 1, 9, 9), toSix).machines).toEqual(['small']);
    expect(checkDesign(design('b-x', 1, 5, 9), toSix).machines).toEqual(['small']);
    expect(checkDesign(design('x+b=c+d', 1, 1, 9999, 9999), toSix).machines).toEqual(['big']);
  });

  it('keeps coefficients to 2–99 and numbers to 9 999', () => {
    expect(checkDesign(design('ax+b', 100, 5, 205), toSix).machines).toEqual(['limits']);
    expect(checkDesign(design('ax+b', 1, 5, 23), toSix).machines).toEqual(['limits']);
    expect(checkDesign(design('x+b', 1, 10000, 10005), toSix).machines).toEqual(['limits']);
    expect(checkDesign(design('ax+b', 99, 9999, 9999 + 99 * 2), toSix).machines).toEqual([
      'limits',
    ]);
    expect(checkDesign(design('x+b', 1, 2.5, 7), toSix).machines).toEqual(['limits']);
  });

  it('refuses a form or an option he has not met', () => {
    expect(checkDesign(design('b-ax', 5, 135, 100), toSix).machines).toEqual(['form']);
    const planted = { ...design('ax+b', 2, 5, 23), plant: true };
    expect(checkDesign(planted, toSix).room).toBe('option');
    expect(checkDesign(planted, [...toSix, 'r07']).ok).toBe(true);
    const linked = {
      ...design('ax+b', 2, 3, 11),
      machines: [
        { form: 'ax+b' as const, numbers: { a: 2, b: 3, c: 11, d: 1 } },
        { form: 'ax+b' as const, numbers: { a: 3, b: 0, c: 19, d: 1 } },
      ],
    };
    expect(checkDesign(linked, toSix).room).toBe('option');
    expect(checkDesign(linked, all).ok).toBe(true);
  });

  it('feeds each machine the answer of the one before (room 12)', () => {
    const linked: RoomDesign = {
      ...newDesign('ax+b'),
      machines: [
        { form: 'ax+b', numbers: { a: 2, b: 3, c: 11, d: 1 } },
        { form: 'ax+b', numbers: { a: 3, b: 77, c: 19, d: 1 } },
      ],
    };
    expect(equations(linked)).toEqual(['2x + 3 = 11', '3x + 4 = 19']);
  });

  it('needs room for a short dial: x at least 4 notches', () => {
    const short = { ...design('x+b', 1, 1, 3), blinds: { readouts: false, shortDial: true } };
    expect(checkDesign(short, toSix).machines).toEqual(['short']);
  });
});

describe('what a room costs (FR46)', () => {
  it('charges each piece, blind, planted line and extra machine', () => {
    // 2x + 5 = 23: an x-gear (2) and two weights (1 + 1).
    expect(costOf(design('ax+b', 2, 5, 23))).toBe(4);
    // 135 − 5x = 100: a weight, a spring and a weight.
    expect(costOf(design('b-ax', 5, 135, 100))).toBe(4);
    // x − 6 = 8: an x-gear, a float, a weight.
    expect(costOf(design('x-b', 1, 6, 8))).toBe(5);
    const everything: RoomDesign = {
      machines: [
        { form: 'ax+b', numbers: { a: 2, b: 3, c: 11, d: 1 } },
        { form: 'ax+b', numbers: { a: 3, b: 4, c: 19, d: 1 } },
      ],
      blinds: { readouts: true, shortDial: true },
      plant: true,
    };
    expect(costOf(everything)).toBe(4 + 4 + 5 + 5 + 5 + 15);
  });
});

describe('the dial', () => {
  it('runs past x with room to spare, so the answer is not its end', () => {
    expect(dialFor(5, 1, false)).toEqual({ min: 0, max: 10, step: 1 });
    expect(dialFor(9, 1, false)).toEqual({ min: 0, max: 20, step: 1 });
    expect(dialFor(15, 3, false)).toEqual({ min: 0, max: 30, step: 3 });
  });

  it('goes coarse for a big x, ending on a notch past it', () => {
    const dial = dialFor(207, 1, false);
    expect(dial).toEqual({ min: 0, max: 210, step: 1, coarse: 10 }); // room 11's own dial
    expect(isOnDial(dial, 207)).toBe(true);
    const huge = dialFor(9999, 1, false);
    expect(huge.max).toBeGreaterThanOrEqual(9999);
    expect((huge.max - huge.min) / (huge.coarse ?? 1)).toBeLessThanOrEqual(30);
  });

  it('stops short of x with a short dial', () => {
    expect(dialFor(9, 1, true)).toEqual({ min: 0, max: 4, step: 1 });
    expect(dialFor(207, 1, true).max).toBeLessThan(207);
  });
});

describe('the room the engine plays', () => {
  it('plays every legal machine: equations parse, x is on the dial, the stage enters', () => {
    for (const form of formIds) {
      for (const [a, b, c, d] of [
        [2, 5, 23, 4],
        [7, 40, 390, 9],
        [99, 9999, 9999, 9999],
        [3, 1, 0, 1],
      ] as const) {
        const one = design(form, a, b, c, d);
        if (!checkDesign(one, all).ok) continue;
        const spec = roomSpecOf(one, 'friend', 'built-x');
        const stage = spec.stages[0];
        if (!stage || stage.dial === 'locked') throw new Error('no stage');
        const eq = parse(stage.machines[0]?.equation ?? '');
        if (!eq.ok) throw new Error(`does not parse: ${form}`);
        expect(isOnDial(stage.dial, stageSolution(eq.equation)), form).toBe(true);
        expect(stage.ways).toEqual(['try', 'balance', 'undo']);
        expect(() => enterRoom(spec)).not.toThrow();
      }
    }
  });

  it('hides the readouts and shortens the dial as blinds', () => {
    const blind = { ...design('ax+b', 2, 5, 23), blinds: { readouts: true, shortDial: true } };
    const stage = roomSpecOf(blind, 'friend', 'built-x').stages[0];
    expect(stage?.readouts).toBe(false);
    expect(stage?.dial).toEqual({ min: 0, max: 4, step: 1 });
  });

  it('gives the friend the planted line as a find-the-mistake stage (room 7)', () => {
    const one = { ...design('ax-b', 3, 1, 17), plant: true };
    const solution = [['3x = 18', 'x = 6', '3 · 6 − 1 = 17']];
    const planted = { stage: 0, line: 1, text: 'x = 15' };
    expect(plantWorks(one, solution, planted)).toBe(true);
    const stage = roomSpecOf(one, 'friend', 'built-x', { planted, solution }).stages[0];
    expect(stage).toMatchObject({
      type: 'mistake',
      pin: { kind: 'wrong-line' },
      presetLines: ['3x = 18', 'x = 15'],
    });
    const room = enterRoom(roomSpecOf(one, 'friend', 'built-x', { planted, solution })).room;
    expect(room.stage.planted?.line).toBe(2);
    // He solves the plain machine himself.
    expect(roomSpecOf(one, 'builder', 'built-draft', { planted, solution }).stages[0]?.type).toBe(
      'solve',
    );
  });

  it('refuses a planted line that is still right, or the check line', () => {
    const one = design('ax-b', 3, 1, 17);
    const solution = [['3x = 18', 'x = 6', '3 · 6 − 1 = 17']];
    expect(plantWorks(one, solution, { stage: 0, line: 0, text: '3x = 17 + 1' })).toBe(false);
    expect(plantWorks(one, solution, { stage: 0, line: 2, text: '3 · 6 − 1 = 18' })).toBe(false);
    expect(plantWorks(one, solution, { stage: 0, line: 0, text: '3x = 16' })).toBe(true);
  });

  it('starts the friend on a guided 2x = 6', () => {
    expect(introSpec.stages[0]?.machines[0]?.equation).toBe('2x = 6');
    expect(() => enterRoom(introSpec)).not.toThrow();
  });
});

describe('his solution', () => {
  const one = design('ax+b', 2, 5, 23);

  it('must solve the machine and end on the check line', () => {
    expect(checkSolution(one, [['x = 9', '2 · 9 + 5 = 23']])).toBeNull();
    expect(checkSolution(one, [['2x = 18', 'x = 9', '2 · 9 + 5 = 23']])).toBeNull();
    expect(checkSolution(one, [['x = 9']])).toBe('unsolved');
    expect(checkSolution(one, [['x = 8', '2 · 8 + 5 = 23']])).toBe('unsolved');
    expect(checkSolution(one, [])).toBe('unsolved');
  });

  it('keeps to 12 lines a machine', () => {
    const many = [...Array.from({ length: 11 }, () => '2x = 18'), 'x = 9', '2 · 9 + 5 = 23'];
    expect(checkSolution(one, [many])).toBe('lines');
  });
});
