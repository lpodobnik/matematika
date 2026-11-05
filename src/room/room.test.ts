import { describe, expect, it } from 'vitest';
import { r01 } from '@/content/rooms/r01-door-lift';
import type { Equation } from '@/math/expr';
import { parse } from '@/math/parse';
import { arriveAtStage, currentStageSpec, enterRoom, machineEquation } from '@/room/room';
import type { RoomSpec, StageSpec } from '@/room/types';

function equation(text: string): Equation {
  const result = parse(text);
  if (!result.ok) throw new Error(`"${text}" did not parse: ${result.reason}`);
  return result.equation;
}

const stage: StageSpec = {
  type: 'solve',
  machines: [{ equation: '2x + 5 = 23' }],
  dial: { min: 3, max: 6, step: 1 },
  readouts: true,
  ways: ['balance'],
  fading: { balance: 'auto' },
};

describe('enterRoom', () => {
  it("opens room 1's first stage with its equation on the pans and the dial at 0", () => {
    const { room, events } = enterRoom(r01);
    expect(room.spec).toBe(r01);
    expect(room.stageIndex).toBe(0);
    expect(room.stage).toEqual({
      phase: 'arrive',
      machine: 0,
      pans: equation('x + 4 = 9'),
      dialX: 0,
      dialOpen: { min: 0, max: 10 },
    });
    expect(events).toEqual([{ type: 'StageArrived', roomId: 'r01', stage: 0 }]);
  });

  it('refuses a room with no stages', () => {
    const empty: RoomSpec = { ...r01, stages: [] };
    expect(() => enterRoom(empty)).toThrow(/no stages/);
  });
});

describe('arriveAtStage', () => {
  it('starts the dial at its minimum, with its whole range open', () => {
    expect(arriveAtStage(stage).dialX).toBe(3);
    expect(arriveAtStage(stage).dialOpen).toEqual({ min: 3, max: 6 });
  });

  it('starts a locked dial at 0, with nothing open', () => {
    expect(arriveAtStage({ ...stage, dial: 'locked' }).dialX).toBe(0);
    expect(arriveAtStage({ ...stage, dial: 'locked' }).dialOpen).toEqual({ min: 0, max: 0 });
  });
});

describe('machineEquation', () => {
  it("parses a machine's equation", () => {
    expect(machineEquation(stage, 0)).toEqual(equation('2x + 5 = 23'));
  });

  it('refuses a missing machine or an equation that does not parse', () => {
    expect(() => machineEquation(stage, 1)).toThrow(/no machine 1/);
    expect(() => machineEquation({ ...stage, machines: [{ equation: '2x + = 5' }] }, 0)).toThrow(
      /doesn't parse/,
    );
  });
});

describe('currentStageSpec', () => {
  it('finds the stage in play', () => {
    const { room } = enterRoom(r01);
    expect(currentStageSpec(room)).toBe(r01.stages[0]);
    expect(() => currentStageSpec({ ...room, stageIndex: 3 })).toThrow(/no stage 3/);
  });
});
