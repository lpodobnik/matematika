// Content tests for every room (architecture, Room Data). Story 1.4 checks what room 1
// needs; later stories add the GDD-table checks (dial ranges, poke windows, the tilt clamp,
// fading, ways that can finish, paper-test equations) as their rooms arrive.

import { describe, expect, it } from 'vitest';
import { rooms } from '@/content/rooms';
import { check, stageSolution } from '@/math/check';
import { solve } from '@/math/linear';
import { parse } from '@/math/parse';
import * as q from '@/math/rational';
import { fillBlanks, tokenize } from '@/math/tokens';
import { dialValue, notchCount } from '@/room/dial';
import { openingTemplates } from '@/room/fading';
import { panPieces } from '@/room/pieces';
import { sideValues } from '@/room/tilt';

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
