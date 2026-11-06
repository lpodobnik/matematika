import { describe, expect, it } from 'vitest';
import { r01 } from '@/content/rooms/r01-door-lift';
import { r03 } from '@/content/rooms/r03-sluice-gate';
import { tokenize } from '@/math/tokens';
import { setDial } from '@/room/dial';
import { handoverOrder } from '@/room/handover';
import {
  type HintState,
  hintAfter,
  hintStep,
  hintView,
  hintWorks,
  inNotebook,
  nextMove,
  pressHint,
} from '@/room/hint';
import { enterLine, typeToken } from '@/room/notebook';
import { touchMachine } from '@/room/phases';
import { enterRoom, type RoomStep } from '@/room/room';
import { splitBothPans, stepSplitter } from '@/room/splitter';
import { dropOnScale, stepTray, trayOffered } from '@/room/tray';
import type { RoomSpec, RoomState, StageSpec, ToolId } from '@/room/types';

const balance: ToolId[] = ['balance'];

function step(result: RoomStep | null): RoomStep {
  if (!result) throw new Error('the action was ignored');
  return result;
}

/** A Balance stage like room 4's, with no pin (story 1.16 takes room 4's away), for `equation`. */
function balanceRoom(equation: string, max = 6): RoomSpec {
  const stage: StageSpec = {
    type: 'solve',
    machines: [{ equation }],
    dial: { min: 0, max, step: 1 },
    tiltPerUnit: 0.75,
    readouts: true,
    ways: ['balance'],
    fading: { try: 'blank', balance: 'auto' },
  };
  return {
    id: 'built-hint',
    machine: 'water-wheel',
    xMeaning: 'test',
    stages: [stage],
    earns: null,
    mapChange: null,
  };
}

const opened = (room: RoomState): RoomState => step(touchMachine(room)).room;
const dialTo = (room: RoomState, x: number): RoomState => step(setDial(room, x)).room;

/** The dial turned notch by notch up to x. */
function dialUp(room: RoomState, x: number): RoomState {
  let current = room;
  for (let at = room.stage.dialX + 1; at <= x; at += 1) current = dialTo(current, at);
  return current;
}

/** Types a line (or a blank's digits) and enters it. */
function write(room: RoomState, text: string): RoomState {
  const tokens = tokenize(text);
  if (!tokens.ok) throw new Error(text);
  const typed = tokens.tokens.reduce(
    (current, token) => step(typeToken(current, token)).room,
    room,
  );
  return step(enterLine(typed, 0)).room;
}

/** The tray's float set to n and dropped over the scale. */
function dropFloat(room: RoomState, n: number): RoomState {
  let current = room;
  while (current.stage.tray.float !== n) {
    const by = current.stage.tray.float < n ? 1 : -1;
    current = step(stepTray(current, balance, 'float', by)).room;
  }
  return step(dropOnScale(current, balance, 'float')).room;
}

/** The balance room opened, with the dial at its end so the tray is offered. */
function wheel(equation = '2x + 5 = 23'): RoomState {
  return dialUp(opened(enterRoom(balanceRoom(equation)).room), 6);
}

describe('the next move (story 1.16)', () => {
  it('slides the dial toward the solution with Try values, then writes x', () => {
    const room = opened(enterRoom(r01).room);
    expect(nextMove(room, [])).toEqual({ kind: 'slide', direction: 1 });
    expect(nextMove(dialTo(room, 9), [])).toEqual({ kind: 'slide', direction: -1 });
    const level = dialTo(room, 5);
    expect(nextMove(level, [])).toEqual({ kind: 'answer', x: 5 });
    const answered = write(level, '5');
    expect(nextMove(answered, [])).toEqual({ kind: 'check', x: 5 });
    expect(nextMove(write(answered, '5'), [])).toBeNull();
  });

  it('takes the number beside x off both sides, splits by x’s count, then writes x', () => {
    const room = wheel();
    expect(trayOffered(room, balance)).toBe(true);
    expect(nextMove(room, balance)).toEqual({ kind: 'tray', piece: 'float', amount: 5 });
    const twoX = dropFloat(room, 5);
    expect(nextMove(twoX, balance)).toEqual({ kind: 'split', parts: 2 });
    const alone = step(splitBothPans(twoX, balance)).room;
    expect(nextMove(alone, balance)).toEqual({ kind: 'answer', x: 9 });
  });

  it('adds a weight where x has a number taken away', () => {
    expect(nextMove(wheel('2x − 5 = 13'), balance)).toEqual({
      kind: 'tray',
      piece: 'weight',
      amount: 5,
    });
  });

  it('names the move from where he is, not from the canonical lines', () => {
    // A float of 3 first leaves 2x + 2 = 20: the 2 comes off next.
    const room = dropFloat(wheel(), 3);
    expect(nextMove(room, balance)).toEqual({ kind: 'tray', piece: 'float', amount: 2 });
    // The splitter set to 3 doesn't change the move: split by 2.
    const twoX = dropFloat(room, 2);
    const atThree = step(stepSplitter(twoX, balance, 1)).room;
    expect(nextMove(atThree, balance)).toEqual({ kind: 'split', parts: 2 });
  });

  it('slides toward the dial’s end in a Balance stage until the tray is offered', () => {
    const room = opened(enterRoom(balanceRoom('2x + 5 = 23')).room);
    expect(trayOffered(room, balance)).toBe(false);
    expect(nextMove(room, balance)).toEqual({ kind: 'slide', direction: 1 });
    // Without Balance earned there is no way to finish, and no move to show.
    expect(nextMove(room, [])).toBeNull();
  });

  it('shows the pin’s question while the pin is offered: a prediction has no next move', () => {
    const poking = opened(enterRoom(r03).room);
    expect(poking.stage.phase).toBe('poke');
    expect(nextMove(poking, [])).toEqual({ kind: 'pin' });
    expect(hintStep(poking, [])).toBe('pin');
  });

  it('puts the answer and the check line in the notebook, the rest in the scene', () => {
    expect(inNotebook({ kind: 'answer', x: 9 })).toBe(true);
    expect(inNotebook({ kind: 'check', x: 9 })).toBe(true);
    expect(inNotebook({ kind: 'split', parts: 2 })).toBe(false);
    expect(inNotebook({ kind: 'slide', direction: 1 })).toBe(false);
  });
});

describe('the first press’s step (story 1.16)', () => {
  it('is the earliest handover step that applies, met or not', () => {
    const room = opened(enterRoom(r01).room);
    expect(hintStep(room, [])).toBe('dial');
    expect(hintStep(dialTo(room, 5), [])).toBe('write');
    expect(hintStep(write(dialTo(room, 5), '5'), [])).toBe('check');
  });

  it('follows Balance: the tray, the splitter, then the answer', () => {
    const room = wheel();
    expect(hintStep(room, balance)).toBe('tray');
    const twoX = dropFloat(room, 5);
    expect(hintStep(twoX, balance)).toBe('splitter');
    const alone = step(splitBothPans(twoX, balance)).room;
    // Lane A's `answer` handover, once it lands, takes the step from `write`.
    const answer = (handoverOrder as readonly string[]).includes('answer') ? 'answer' : 'write';
    expect(['write', answer]).toContain(hintStep(alone, balance));
  });

  it('is the step of the next move where no handover applies: a jam', () => {
    const jammed = write(dialTo(opened(enterRoom(r01).room), 5), '4');
    expect(jammed.stage.jam).toEqual({ kind: 'line' });
    expect(hintStep(jammed, [])).toBe('write');
    expect(hintWorks(jammed, [])).toBe(true);
  });

  it('works in every phase he can act in, and not once the stage locks', () => {
    const arrived = enterRoom(r01).room;
    expect(arrived.stage.phase).toBe('arrive');
    expect(hintWorks(arrived, [])).toBe(true);
    const level = dialTo(opened(arrived), 5);
    const locked = write(write(level, '5'), '5');
    expect(locked.stage.phase).toBe('locked');
    expect(hintWorks(locked, [])).toBe(false);
    expect(hintStep(locked, [])).toBeNull();
    expect(hintWorks(null, [])).toBe(false);
  });
});

describe('the presses (story 1.16)', () => {
  const room = opened(enterRoom(r01).room);
  const first: HintState = { level: 1, presses: 1 };

  it('shows the step first, then the move, and the move again on each press', () => {
    expect(pressHint(null)).toEqual(first);
    expect(pressHint(first)).toEqual({ level: 2, presses: 2 });
    expect(pressHint({ level: 2, presses: 2 })).toEqual({ level: 2, presses: 3 });
  });

  it('views the step on the first press and the move on the second', () => {
    expect(hintView(room, [], null)).toBeNull();
    expect(hintView(room, [], first)).toEqual({ level: 1, step: 'dial', move: null, presses: 1 });
    expect(hintView(room, [], pressHint(first))).toEqual({
      level: 2,
      step: 'dial',
      move: { kind: 'slide', direction: 1 },
      presses: 2,
    });
  });

  it('ends with an action of his, a new stage, or a stage he can no longer act in', () => {
    expect(hintAfter(null, 'press', room, room, [])).toEqual(first);
    expect(hintAfter(first, 'press', room, room, [])).toEqual({ level: 2, presses: 2 });
    expect(hintAfter(first, 'ends', room, room, [])).toBeNull();
    expect(hintAfter(first, 'other', room, room, [])).toBe(first);
    expect(hintAfter(null, 'other', room, room, [])).toBeNull();
    const next = enterRoom(r01).room;
    expect(hintAfter(first, 'other', room, { ...next, stageIndex: 1 }, [])).toBeNull();
    const locked = write(write(dialTo(room, 5), '5'), '5');
    expect(hintAfter(first, 'other', room, locked, [])).toBeNull();
    // A press where the button does nothing changes nothing.
    expect(hintAfter(null, 'press', locked, locked, [])).toBeNull();
  });
});
