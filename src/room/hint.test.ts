import { describe, expect, it } from 'vitest';
import { r01 } from '@/content/rooms/r01-door-lift';
import { r03 } from '@/content/rooms/r03-sluice-gate';
import { r05 as r05Bridge } from '@/content/rooms/r05-bridge';
import { formatEquation } from '@/math/format';
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
import { deleteToken, enterLine, typeToken } from '@/room/notebook';
import { touchMachine } from '@/room/phases';
import { enterRoom, type RoomStep } from '@/room/room';
import { splitBothPans, stepSplitter } from '@/room/splitter';
import { dropOnScale, stepTray, trayOffered } from '@/room/tray';
import type { RoomSpec, RoomState, StageSpec, ToolId, TrayKind, WayId } from '@/room/types';

const balance: ToolId[] = ['balance'];

function step(result: RoomStep | null): RoomStep {
  if (!result) throw new Error('the action was ignored');
  return result;
}

/**
 * A Balance stage like room 4's, with no pin (story 1.16 takes room 4's away), for
 * `equation`, on a dial of 0–6 (room 4's until Luka ran it past the answer).
 */
function balanceRoom(equation: string, max = 6, ways: WayId[] = ['balance']): RoomSpec {
  const stage: StageSpec = {
    type: 'solve',
    machines: [{ equation }],
    dial: { min: 0, max, step: 1 },
    tiltPerUnit: 0.75,
    readouts: true,
    ways,
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

/** The tray's piece set to n and dropped over the scale. */
function dropPiece(room: RoomState, kind: TrayKind, n: number): RoomState {
  let current = room;
  while (current.stage.tray[kind] !== n) {
    const by = current.stage.tray[kind] < n ? 1 : -1;
    current = step(stepTray(current, balance, kind, by)).room;
  }
  return step(dropOnScale(current, balance, kind)).room;
}

/** The tray's float set to n and dropped over the scale. */
function dropFloat(room: RoomState, n: number): RoomState {
  return dropPiece(room, 'float', n);
}

/** The balance room opened, with the dial at its end; Try values can't finish it, so the tray is offered. */
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
    // Room 1's check line is a template, `☐ + 4 = 9` (story 1.16 review: `template`).
    expect(nextMove(answered, [])).toEqual({ kind: 'check', x: 5, template: true });
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

  // Story 1.16: only where Try values could finish but the dial stops short of x, so the
  // tray waits for the dial's end; where they can't, the tray is offered from the start.
  it('slides toward the dial’s end in a Balance stage until the tray is offered', () => {
    const room = opened(enterRoom(balanceRoom('2x + 5 = 23', 6, ['try', 'balance'])).room);
    expect(trayOffered(room, balance)).toBe(false);
    expect(nextMove(room, balance)).toEqual({ kind: 'slide', direction: 1 });
    const balanceOnly = opened(enterRoom(balanceRoom('2x + 5 = 23')).room);
    expect(trayOffered(balanceOnly, balance)).toBe(true);
    expect(nextMove(balanceOnly, balance)).toEqual({ kind: 'tray', piece: 'float', amount: 5 });
    // Without Balance earned there is no way to finish, and no move to show.
    expect(nextMove(balanceOnly, [])).toBeNull();
  });

  it('shows the pin’s question while the pin is offered: a prediction has no next move', () => {
    const poking = opened(enterRoom(r03).room);
    expect(poking.stage.phase).toBe('poke');
    expect(nextMove(poking, [])).toEqual({ kind: 'pin' });
    expect(hintStep(poking, [])).toBe('pin');
  });

  it('puts the answer and the check line in the notebook, the rest in the scene', () => {
    expect(inNotebook({ kind: 'answer', x: 9 })).toBe(true);
    expect(inNotebook({ kind: 'check', x: 9, template: true })).toBe(true);
    expect(inNotebook({ kind: 'jam' })).toBe(true);
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

  // Story 1.16 review: 1.16 showed the step of the next move during a jam (`write`, or
  // the slider's), whose control is frozen then; a jam is its own step now.
  it('is the jam while the machine is jammed', () => {
    const jammed = write(dialTo(opened(enterRoom(r01).room), 5), '4');
    expect(jammed.stage.jam).toEqual({ kind: 'line' });
    expect(hintStep(jammed, [])).toBe('jam');
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
    expect(hintView(room, [], first)).toEqual({
      level: 1,
      step: 'dial',
      move: null,
      presses: 1,
      example: null,
    });
    expect(hintView(room, [], pressHint(first))).toEqual({
      level: 2,
      step: 'dial',
      move: { kind: 'slide', direction: 1 },
      presses: 2,
      example: null,
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

describe('the hint after the review of story 1.16', () => {
  /** The balance room after −5 and the split: `x = ☐` waits. */
  const split = () => step(splitBothPans(dropFloat(wheel(), 5), balance)).room;

  // Bug: it decided the answer on the literal `x = 9`, so the split's own line,
  // `2x : 2 = 18 : 2` (one gear against a 9), asked to split by 1.
  it('asks for x once x is alone on the pans, also on the split’s line after a deleted jam', () => {
    const jammed = write(split(), '6');
    expect(jammed.stage.jam).toEqual({ kind: 'line' });
    const deleted = step(deleteToken(jammed)).room;
    expect(deleted.stage.jam).toBeNull();
    expect(formatEquation(deleted.stage.pans)).toBe('2x : 2 = 18 : 2');
    expect(nextMove(deleted, balance)).toEqual({ kind: 'answer', x: 9 });
    expect(hintStep(deleted, balance)).toBe('answer');
  });

  it('never splits by fewer than 2 parts', () => {
    const deleted = step(deleteToken(write(split(), '6'))).room;
    const typed = write(write(wheel(), '2x = 18'), 'x = 23 − 14');
    const rooms = [wheel(), dropFloat(wheel(), 5), split(), deleted, typed];
    for (const room of rooms) {
      const move = nextMove(room, balance);
      if (move?.kind === 'split') expect(move.parts).toBeGreaterThanOrEqual(2);
    }
  });

  // Bug: during a jam the hint named a frozen control (the slider, the tray) or a line
  // that his blank, still holding the jammed number, would have read as 89.
  it('is the jam while the machine is jammed: in room 1, in room 4, and on a jammed blank', () => {
    const roomOne = write(opened(enterRoom(r01).room), '4');
    const roomFour = write(wheel(), 'x = 8');
    const blank = write(split(), '8');
    for (const jammed of [roomOne, roomFour, blank]) {
      expect(jammed.stage.jam).toEqual({ kind: 'line' });
      expect(hintStep(jammed, balance)).toBe('jam');
      expect(nextMove(jammed, balance)).toEqual({ kind: 'jam' });
      expect(hintView(jammed, balance, { level: 1, presses: 1 })).toEqual({
        level: 1,
        step: 'jam',
        move: null,
        presses: 1,
        example: null,
      });
      expect(hintView(jammed, balance, { level: 2, presses: 2 })?.move).toEqual({ kind: 'jam' });
      // Deleting the line ends the jam, and the hint goes back to the way he was on.
      expect(hintStep(step(deleteToken(jammed)).room, balance)).not.toBe('jam');
    }
  });

  // Bug 3's other half: with one rule for x alone, `x = 23 − 14` is not alone, and no split
  // is left. The hint clears a number piece off with the tray until the pans are simple.
  it('leads from x = 23 − 14 to x alone with the tray, as any tray move combines the numbers', () => {
    const typed = write(wheel(), 'x = 23 − 14');
    expect(typed.stage.templates).toEqual([]);
    expect(nextMove(typed, balance)).toEqual({ kind: 'tray', piece: 'weight', amount: 14 });
    const plus = dropPiece(typed, 'weight', 14);
    expect(nextMove(plus, balance)).toEqual({ kind: 'tray', piece: 'float', amount: 14 });
    const alone = dropFloat(plus, 14);
    expect(alone.stage.templates).toHaveLength(2);
    expect(nextMove(alone, balance)).toEqual({ kind: 'answer', x: 9 });
    // Weights only: the smallest comes off as a balloon.
    const weights = write(wheel(), 'x = 4 + 5');
    expect(nextMove(weights, balance)).toEqual({ kind: 'tray', piece: 'float', amount: 4 });
  });

  // Bug: the check hint said "copy the first equation" also where the check line is a
  // template with x blanked, as in every room 1–4.
  it('says only what goes in the blank when the check line is a template', () => {
    const answered = write(dialTo(opened(enterRoom(r01).room), 5), '5');
    expect(nextMove(answered, [])).toEqual({ kind: 'check', x: 5, template: true });
    const balanced = write(split(), '9');
    expect(nextMove(balanced, balance)).toEqual({ kind: 'check', x: 9, template: true });
    const first = r01.stages[0] as StageSpec;
    const blankPage: RoomSpec = { ...r01, stages: [{ ...first, fading: { try: 'blank' } }] };
    // On a blank page too: he never copies the whole equation out again.
    const free = write(dialTo(opened(enterRoom(blankPage).room), 5), 'x = 5');
    expect(nextMove(free, [])).toEqual({ kind: 'check', x: 5, template: true });
  });
});

describe('the hint in a room with both ways (room 5, story 2.8 review)', () => {
  it('goes on with Balance once he has made a Balance move, though the slider reaches x', () => {
    let room = touchMachine(enterRoom(r05Bridge, 1).room)?.room as RoomState;
    room = { ...room, stage: { ...room.stage, phase: 'open', pin: null } };
    expect(nextMove(room, balance)?.kind).toBe('slide');
    const moved = {
      ...room,
      stage: { ...room.stage, balance: { ...room.stage.balance, moves: 1 } },
    };
    expect(nextMove(moved, balance)?.kind).not.toBe('slide');
  });
});
