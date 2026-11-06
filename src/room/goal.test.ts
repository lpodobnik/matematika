import { describe, expect, it } from 'vitest';
import { parse } from '@/math/parse';
import { tokenize } from '@/math/tokens';
import { setDial } from '@/room/dial';
import { goalView } from '@/room/goal';
import { enterLine, typeToken } from '@/room/notebook';
import { touchMachine } from '@/room/phases';
import { xAlone } from '@/room/pieces';
import { enterRoom, type RoomStep } from '@/room/room';
import { splitBothPans } from '@/room/splitter';
import { dropOnScale, stepTray } from '@/room/tray';
import type { RoomSpec, RoomState, ToolId } from '@/room/types';

const balance: ToolId[] = ['balance'];

function step(result: RoomStep | null): RoomStep {
  if (!result) throw new Error('the action was ignored');
  return result;
}

function equation(text: string) {
  const result = parse(text);
  if (!result.ok) throw new Error(`"${text}" did not parse`);
  return result.equation;
}

/** Room 4's equation in a Balance stage with no pin. */
const wheelSpec: RoomSpec = {
  id: 'built-goal',
  machine: 'water-wheel',
  xMeaning: 'test',
  stages: [
    {
      type: 'solve',
      machines: [{ equation: '2x + 5 = 23' }],
      dial: { min: 0, max: 6, step: 1 },
      tiltPerUnit: 0.75,
      readouts: true,
      ways: ['balance'],
      fading: { try: 'blank', balance: 'auto' },
    },
  ],
  earns: null,
  mapChange: null,
};

function opened(): RoomState {
  let room = step(touchMachine(enterRoom(wheelSpec).room)).room;
  for (let x = 1; x <= 6; x += 1) room = step(setDial(room, x)).room;
  return room;
}

describe('the goal card’s picture, x alone (story 1.16)', () => {
  it('matches one x by itself against one number piece, or nothing, on either side', () => {
    for (const text of ['x = 9', '9 = x', 'x = 0', 'x = 2 · 9', 'x = 9 − 0']) {
      expect(xAlone(equation(text)), text).toBe(true);
    }
  });

  it('does not match more x, numbers beside x, two number pieces, a divided x or a balloon x', () => {
    const texts = [
      '2x = 18',
      'x + 5 = 14',
      '18 = 2x',
      'x = 9 − 4',
      'x : 3 = 5',
      '20 − x = 6',
      'x = x',
    ];
    for (const text of texts) {
      expect(xAlone(equation(text)), text).toBe(false);
    }
  });
});

describe('the goal card in the stage (story 1.16)', () => {
  it('stands in the scene only while the tray is offered', () => {
    const arrived = enterRoom(wheelSpec).room;
    expect(goalView(arrived, balance)).toBeNull();
    expect(goalView(opened(), [])).toBeNull();
    expect(goalView(null, balance)).toBeNull();
    expect(goalView(opened(), balance)).toEqual({ matched: false });
  });

  it('lights once Balance leaves x alone, and goes when the stage locks', () => {
    let room = opened();
    for (let n = 1; n < 5; n += 1) room = step(stepTray(room, balance, 'float', 1)).room;
    const twoX = step(dropOnScale(room, balance, 'float')).room;
    expect(goalView(twoX, balance)).toEqual({ matched: false });
    const alone = step(splitBothPans(twoX, balance)).room;
    expect(goalView(alone, balance)).toEqual({ matched: true });
    // Story 1.16 lane A: once x is alone, room 4 offers its last two lines as blanks, so
    // he fills in 9 rather than typing the whole line.
    const typed = (r: RoomState, text: string) => {
      const tokens = tokenize(text);
      if (!tokens.ok) throw new Error(text);
      const filled = tokens.tokens.reduce((at, token) => step(typeToken(at, token)).room, r);
      return step(enterLine(filled, 0)).room;
    };
    const answered = typed(alone, '9');
    expect(goalView(answered, balance)).toEqual({ matched: true });
    const locked = typed(answered, '9');
    expect(locked.stage.phase).toBe('locked');
    expect(goalView(locked, balance)).toBeNull();
  });

  it('does not light for a wrong line the machine is jammed on', () => {
    const room = opened();
    const jammed: RoomState = {
      ...room,
      stage: { ...room.stage, pans: equation('x = 9'), jam: { kind: 'line' } },
    };
    expect(goalView(jammed, balance)).toEqual({ matched: false });
  });
});
