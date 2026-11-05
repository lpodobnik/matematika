// Content tests for every room (architecture, Room Data). Story 1.4 checks what room 1
// needs; later stories add the GDD-table checks (dial ranges, poke windows, the tilt clamp,
// fading, ways that can finish, paper-test equations) as their rooms arrive.

import { describe, expect, it } from 'vitest';
import { rooms } from '@/content/rooms';
import { solve } from '@/math/linear';
import { parse } from '@/math/parse';
import * as q from '@/math/rational';
import { panPieces } from '@/room/pieces';

const machines = rooms.flatMap((room) =>
  room.stages.flatMap((stage, stageIndex) =>
    stage.machines.map((machine) => ({ room: room.id, stage: stageIndex, ...machine })),
  ),
);

describe('rooms', () => {
  it('starts with room 1, the door lift', () => {
    expect(rooms[0]?.id).toBe('r01');
    expect(rooms[0]?.machine).toBe('door-lift');
    expect(rooms[0]?.stages[0]?.machines.map((m) => m.equation)).toEqual(['x + 4 = 9']);
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

  describe.each(machines)('$room stage $stage: $equation', ({ equation }) => {
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
