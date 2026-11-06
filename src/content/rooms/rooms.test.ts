// Content tests for every room (architecture, Room Data). Story 1.4 checks what room 1
// needs; later stories add the GDD-table checks (dial ranges, poke windows, the tilt clamp,
// fading, ways that can finish, paper-test equations) as their rooms arrive. Story 1.9 adds
// room 3 and the checks for poke windows and pins.

import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import { rooms } from '@/content/rooms';
import { hr } from '@/content/text/hr';
import { check, stageSolution } from '@/math/check';
import { solve } from '@/math/linear';
import { parse } from '@/math/parse';
import * as q from '@/math/rational';
import { fillBlanks, tokenize } from '@/math/tokens';
import { dialValue, notchCount } from '@/room/dial';
import { openingTemplates } from '@/room/fading';
import { panPieces } from '@/room/pieces';
import { pinSupported, pinTrack, slotCount, slotValue, xPanMotion } from '@/room/pin';
import { openingDial } from '@/room/room';
import { isLevel, sideValues, tiltFor } from '@/room/tilt';
import type { DialSpec, StageSpec } from '@/room/types';

function stageEquation(stage: StageSpec | undefined) {
  const parsed = parse(stage?.machines[0]?.equation ?? '');
  if (!parsed.ok) throw new Error('does not parse');
  return parsed.equation;
}

/** The x values the dial reaches before the pin is locked: the poke window. */
function pokeValues(stage: StageSpec): number[] {
  if (stage.dial === 'locked') return [];
  const { min, max } = openingDial(stage);
  const values: number[] = [];
  for (let x = min; x <= max; x += stage.dial.step) values.push(x);
  return values;
}

const machines = rooms.flatMap((room) =>
  room.stages.flatMap((stage, stageIndex) =>
    stage.machines.map((machine) => ({
      room: room.id,
      stage: stageIndex,
      dial: stage.dial,
      ...machine,
    })),
  ),
);

const stages = rooms.flatMap((room) =>
  room.stages.map((stage, index) => ({ room: room.id, index, stage })),
);

describe('rooms', () => {
  it('starts with room 1, the door lift', () => {
    expect(rooms[0]?.id).toBe('r01');
    expect(rooms[0]?.machine).toBe('door-lift');
    expect(rooms[0]?.stages[0]?.machines.map((m) => m.equation)).toEqual(['x + 4 = 9']);
  });

  it("gives room 1 the GDD's dial, 0–10 in ones, with readouts", () => {
    expect(rooms[0]?.stages[0]?.dial).toEqual({ min: 0, max: 10, step: 1 });
    expect(rooms[0]?.stages[0]?.readouts).toBe(true);
  });

  it('lists the rooms in play order: rooms 1, 2 and 3', () => {
    expect(rooms.map((room) => room.id)).toEqual(['r01', 'r02', 'r03']);
  });

  describe("room 3, the sluice gate (GDD's Puzzle Progression tables)", () => {
    const room = rooms[2];
    const [first, second] = room?.stages ?? [];

    it('has two stages, x − 6 = 8 on a dial of 6–20, then 20 − x = 6 on 0–20, and earns Balance', () => {
      expect(room?.id).toBe('r03');
      expect(room?.machine).toBe('sluice-gate');
      expect(room?.stages).toHaveLength(2);
      expect(first?.machines.map((m) => m.equation)).toEqual(['x − 6 = 8']);
      expect(first?.dial).toEqual({ min: 6, max: 20, step: 1 });
      expect(second?.machines.map((m) => m.equation)).toEqual(['20 − x = 6']);
      expect(second?.dial).toEqual({ min: 0, max: 20, step: 1 });
      for (const stage of [first, second]) {
        expect(stage?.readouts).toBe(true);
        expect(stage?.ways).toEqual(['try']);
        expect(stage?.fading).toEqual({ try: 'blanks' });
      }
      expect(room?.earns).toBe('balance');
    });

    it('answers 14 in both stages', () => {
      expect([first, second].map((stage) => stageSolution(stageEquation(stage)))).toEqual([14, 14]);
    });

    it('opens stage 1 with a poke window over 6, 7, 8 and 9, and a "where it levels" pin', () => {
      expect(first?.pokeNotches).toBe(4);
      expect(first?.pin).toEqual({ kind: 'level-x' });
      expect(pokeValues(first as StageSpec)).toEqual([6, 7, 8, 9]);
      const track = pinTrack(first as StageSpec);
      expect(track).toMatchObject({ kind: 'x', min: 6, max: 20, step: 1 });
    });

    it('gives stage 2 no poke window and a direction pin: x is a spring, so its pan goes up', () => {
      expect(second?.pokeNotches).toBeUndefined();
      expect(second?.pin).toEqual({
        kind: 'effect',
        options: ['pan-down', 'pan-up'],
        resolvesOn: 'first-notch',
      });
      expect(second?.type).toBe('predict');
      expect(panPieces(stageEquation(second)).left.map((piece) => piece.kind)).toEqual([
        'weight',
        'spring',
      ]);
      expect(xPanMotion(stageEquation(second))).toBe('pan-up');
    });
  });

  describe("room 2, the street lamps (GDD's Puzzle Progression tables)", () => {
    const room = rooms[1];
    const [first, second] = room?.stages ?? [];

    it('has two Solve stages, 3x = 12 on a dial of 0–10, then x : 3 = 5 on 0–30 in 3s', () => {
      expect(room?.machine).toBe('street-lamps');
      expect(room?.stages).toHaveLength(2);
      expect(first?.machines.map((m) => m.equation)).toEqual(['3x = 12']);
      expect(first?.dial).toEqual({ min: 0, max: 10, step: 1 });
      expect(second?.machines.map((m) => m.equation)).toEqual(['x : 3 = 5']);
      expect(second?.dial).toEqual({ min: 0, max: 30, step: 3 });
      for (const stage of [first, second]) {
        expect(stage?.type).toBe('solve');
        expect(stage?.readouts).toBe(true);
        expect(stage?.pokeNotches).toBeUndefined();
        expect(stage?.pin).toBeUndefined();
        expect(stage?.ways).toEqual(['try']);
        expect(stage?.fading).toEqual({ try: 'blanks' });
      }
      expect(room?.earns).toBeNull();
    });

    it('has the answers 4, then 15, both on the dial', () => {
      const answers = [first, second].map((stage) => {
        const parsed = parse(stage?.machines[0]?.equation ?? '');
        if (!parsed.ok) throw new Error('does not parse');
        return stageSolution(parsed.equation);
      });
      expect(answers).toEqual([4, 15]);
    });

    it('moves the pans by the same amount at every notch, so no notch hits the clamp', () => {
      for (const stage of [first, second]) {
        if (!stage || stage.dial === 'locked') throw new Error('no dial');
        const parsed = parse(stage.machines[0]?.equation ?? '');
        if (!parsed.ok) throw new Error('does not parse');
        const tilts = Array.from({ length: notchCount(stage.dial) + 1 }, (_, notch) =>
          tiltFor(
            sideValues(parsed.equation, q.rational(dialValue(stage.dial as DialSpec, notch))),
            stage.tiltPerUnit ?? tuning.tiltPerUnit,
          ),
        );
        const steps = tilts.slice(1).map((tilt, i) => tilt - (tilts[i] ?? 0));
        for (const change of steps) expect(change).toBeCloseTo(steps[0] ?? 0);
        expect(Math.max(...tilts.map(Math.abs))).toBeLessThan(tuning.tiltMax);
      }
    });
  });

  it('has one entry per room id', () => {
    const ids = rooms.map((room) => room.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  describe.each(rooms)('room $id', (room) => {
    it('has a machine, an xMeaning and a mapChange', () => {
      expect(room.machine).toMatch(/^[a-z]+(-[a-z]+)*$/);
      expect(room.xMeaning.trim().length).toBeGreaterThan(0);
      expect(room.mapChange?.trim().length ?? 0).toBeGreaterThan(0);
    });

    it('has at least one stage, each with 1–3 machines', () => {
      expect(room.stages.length).toBeGreaterThan(0);
      for (const stage of room.stages) {
        expect(stage.machines.length).toBeGreaterThanOrEqual(1);
        expect(stage.machines.length).toBeLessThanOrEqual(3);
      }
    });
  });

  describe.each(stages)('$room stage $index', ({ stage }) => {
    it('has a dial of whole numbers from 0 up, ending on a notch', () => {
      if (stage.dial === 'locked') return;
      const { min, max, step } = stage.dial;
      for (const value of [min, max, step]) expect(Number.isInteger(value)).toBe(true);
      expect(min).toBeGreaterThanOrEqual(0);
      expect(max).toBeGreaterThan(min);
      expect(step).toBeGreaterThanOrEqual(1);
      expect((max - min) % step).toBe(0);
    });

    it('opens a poke window of 3 or 4 notches (or all of them) only with a pin', () => {
      if (stage.pokeNotches === undefined) return;
      expect(stage.pin).toBeDefined();
      expect([3, 4, 'all']).toContain(stage.pokeNotches);
    });

    it('has only pins the engine can place and resolve, each with its answer on its track', () => {
      if (!stage.pin) return;
      expect(pinSupported(stage.pin)).toBe(true);
      const track = pinTrack(stage);
      if (!track) throw new Error('no track');
      const values = Array.from({ length: slotCount(track) }, (_, slot) => slotValue(track, slot));
      if (track.kind === 'x') {
        const answer = stageSolution(stageEquation(stage));
        expect(values).toContainEqual({ kind: 'x', x: answer });
      } else {
        expect(track.options).toContain(xPanMotion(stageEquation(stage)));
      }
    });

    it('gives every effect pin option its text, and x on one side only', () => {
      if (stage.pin?.kind !== 'effect') return;
      for (const option of stage.pin.options) expect(hr.pin.options[option]).toMatch(/\S/);
      const pieces = panPieces(stageEquation(stage));
      const holdsX = (side: typeof pieces.left) =>
        side.some((piece) => piece.kind === 'gear' || piece.kind === 'spring');
      expect([holdsX(pieces.left), holdsX(pieces.right)].filter(Boolean)).toHaveLength(1);
    });

    it("never levels the pans or hits the tilt clamp inside the poke window, so it can't give the answer away", () => {
      if (stage.pokeNotches === undefined) return;
      const equation = stageEquation(stage);
      for (const x of pokeValues(stage)) {
        const values = sideValues(equation, q.rational(x));
        expect(isLevel(values), `x = ${x}`).toBe(false);
        const tilt = tiltFor(values, stage.tiltPerUnit ?? tuning.tiltPerUnit);
        expect(Math.abs(tilt), `x = ${x}`).toBeLessThan(tuning.tiltMax);
      }
    });

    it('tilts by more than 0° per unit when it sets its own tilt', () => {
      if (stage.tiltPerUnit !== undefined) expect(stage.tiltPerUnit).toBeGreaterThan(0);
    });

    it('can be finished by filling its blanks with x, when Try values fades to blanks', () => {
      const templates = openingTemplates(stage, 0);
      if (stage.fading.try !== 'blanks') {
        expect(templates).toEqual([]);
        return;
      }
      const parsed = parse(stage.machines[0]?.equation ?? '');
      if (!parsed.ok) throw new Error('does not parse');
      const answer = tokenize(String(stageSolution(parsed.equation)));
      if (!answer.ok) throw new Error('no answer');
      const lines = [parsed.equation];
      const verdicts = templates.map((template) => {
        const line = fillBlanks(template, answer.tokens);
        const verdict = check(lines, line);
        const filled = parse(line);
        if (filled.ok) lines.push(filled.equation);
        return verdict.kind;
      });
      expect(verdicts).toEqual(['answer', 'check']);
    });
  });

  describe.each(machines)('$room stage $stage: $equation', ({ equation, dial }) => {
    it('weighs a whole number of 0 or more on each side at every notch, for the readouts', () => {
      if (dial === 'locked') return;
      const parsed = parse(equation);
      if (!parsed.ok) throw new Error(`does not parse: ${parsed.reason}`);
      for (let notch = 0; notch <= notchCount(dial); notch += 1) {
        const values = sideValues(parsed.equation, q.rational(dialValue(dial, notch)));
        for (const value of [values.left, values.right]) {
          expect(q.isInteger(value)).toBe(true);
          expect(q.compare(value, q.zero)).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('parses, with one solution, a whole number', () => {
      const parsed = parse(equation);
      expect(parsed.ok).toBe(true);
      if (!parsed.ok) return;
      const solution = solve(parsed.equation);
      expect(solution.kind).toBe('one');
      if (solution.kind !== 'one') return;
      expect(q.isInteger(solution.x)).toBe(true);
      expect(q.compare(solution.x, q.zero)).toBeGreaterThanOrEqual(0);
    });

    it('has pieces on both pans', () => {
      const parsed = parse(equation);
      if (!parsed.ok) throw new Error(`does not parse: ${parsed.reason}`);
      const pieces = panPieces(parsed.equation);
      expect(pieces.left.length).toBeGreaterThan(0);
      expect(pieces.right.length).toBeGreaterThan(0);
    });
  });
});
