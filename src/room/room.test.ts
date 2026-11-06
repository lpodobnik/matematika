import { describe, expect, it } from 'vitest';
import { r01 } from '@/content/rooms/r01-door-lift';
import { r02 } from '@/content/rooms/r02-street-lamps';
import type { Equation } from '@/math/expr';
import { parse } from '@/math/parse';
import {
  arriveAtStage,
  currentStageSpec,
  enterRoom,
  givenLine,
  machineEquation,
} from '@/room/room';
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
      lines: [
        {
          tokens: ['x', '+', '4', '=', '9'],
          source: 'given',
          verdict: { kind: 'valid', move: { kind: 'none' }, progress: false },
        },
      ],
      draft: [],
      templates: [
        ['x', '=', '☐'],
        ['☐', '+', '4', '=', '9'],
      ],
      jam: null,
      refused: 0,
      jamsInARow: 0,
      machineProgress: [0],
      pans: equation('x + 4 = 9'),
      tray: { weight: 1, float: 1 },
      splitter: 2,
      actingOut: false,
      dialX: 0,
      dialOpen: { min: 0, max: 10 },
      pin: null,
      hintLevel: 0,
      // Story 1.15: the root reducer starts the idle clock as the stage arrives.
      lastActionAt: null,
      idle: false,
      presentedAt: null,
    });
    expect(events).toEqual([{ type: 'StageArrived', roomId: 'r01', stage: 0 }]);
  });

  it('waits in arrive, with no instruction screen: arrive is the first phase', () => {
    expect(enterRoom(r02).room.stage.phase).toBe('arrive');
  });

  it('enters at a later stage when asked (the dev panel), and StageArrived names it', () => {
    const { room, events } = enterRoom(r02, 1);
    expect(room.stageIndex).toBe(1);
    expect(room.stage.phase).toBe('arrive');
    expect(room.stage.pans).toEqual(equation('x : 3 = 5'));
    expect(room.stage.dialOpen).toEqual({ min: 0, max: 30 });
    expect(events).toEqual([{ type: 'StageArrived', roomId: 'r02', stage: 1 }]);
  });

  it('refuses a room with no stages, or a stage the room does not have', () => {
    const empty: RoomSpec = { ...r01, stages: [] };
    expect(() => enterRoom(empty)).toThrow(/no stages/);
    expect(() => enterRoom(r02, 2)).toThrow(/no stage 2/);
    expect(() => enterRoom(r02, -1)).toThrow(/no stage -1/);
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

  it('starts every machine stopped, exploring, with no jams counted (story 1.7)', () => {
    const arrived = arriveAtStage(stage);
    expect(arrived.machineProgress).toEqual([0]);
    expect(arrived.actingOut).toBe(false);
    expect(arrived.jamsInARow).toBe(0);
    const linked = {
      ...stage,
      machines: [{ equation: '2x + 3 = 11' }, { equation: '3x + 4 = 19' }],
    };
    expect(arriveAtStage(linked).machineProgress).toEqual([0, 0]);
  });

  it('opens with the Try values lines to fill only when Try values fades to blanks', () => {
    expect(arriveAtStage(stage).templates).toEqual([]);
    expect(arriveAtStage({ ...stage, fading: { try: 'blank' } }).templates).toEqual([]);
    expect(arriveAtStage({ ...stage, fading: { try: 'blanks' } }).templates).toEqual([
      ['x', '=', '☐'],
      ['2', '·', '☐', '+', '5', '=', '2', '3'],
    ]);
  });
});

describe('givenLine', () => {
  it("is line 0: the machine's equation as pad tokens, given", () => {
    expect(givenLine(stage, 0)).toEqual({
      tokens: ['2', 'x', '+', '5', '=', '2', '3'],
      source: 'given',
      verdict: { kind: 'valid', move: { kind: 'none' }, progress: false },
    });
  });

  it('turns school notation into the tokens the pad would type', () => {
    const room11 = { ...stage, machines: [{ equation: '5 905 − 27x = 316' }] };
    expect(givenLine(room11, 0).tokens.join('')).toBe('5905−27x=316');
    const timesAndDivide = { ...stage, machines: [{ equation: '2 · 9 + x : 3 = 21' }] };
    expect(givenLine(timesAndDivide, 0).tokens.join('')).toBe('2·9+x:3=21');
  });

  it('starts every stage with line 0 only, an empty draft and no jam', () => {
    const arrived = arriveAtStage(stage);
    expect(arrived.lines).toEqual([givenLine(stage, 0)]);
    expect(arrived.draft).toEqual([]);
    expect(arrived.jam).toBeNull();
    expect(arrived.refused).toBe(0);
    expect(arrived.presentedAt).toBeNull();
  });

  it('refuses a machine the stage does not have', () => {
    expect(() => givenLine(stage, 1)).toThrow(/no machine 1/);
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
