import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import { r01 } from '@/content/rooms/r01-door-lift';
import { r04 } from '@/content/rooms/r04-water-wheel';
import type { Equation } from '@/math/expr';
import { formatEquation, formatTokens } from '@/math/format';
import { parse } from '@/math/parse';
import { tokenize } from '@/math/tokens';
import { setDial } from '@/room/dial';
import { meetControls, offeredControls } from '@/room/first-use';
import { machineView } from '@/room/machine';
import { enterLine, typeToken } from '@/room/notebook';
import { resetStage, touchMachine } from '@/room/phases';
import { panPieces } from '@/room/pieces';
import { confirmPin, setPin } from '@/room/pin';
import { enterRoom, type RoomStep } from '@/room/room';
import { scaleView } from '@/room/scale';
import {
  canStepParts,
  liftSplitter,
  splitBothPans,
  splitOutcome,
  splitterOffered,
  splitterView,
  splitterWorks,
  stepSplitter,
} from '@/room/splitter';
import { dropOnPan, stepTray } from '@/room/tray';
import type { FadingMode, RoomSpec, RoomState, ToolId, TrayKind } from '@/room/types';

const balance: ToolId[] = ['balance'];

function step(result: RoomStep | null): RoomStep {
  if (!result) throw new Error('the action was ignored');
  return result;
}

function equation(text: string): Equation {
  const result = parse(text);
  if (!result.ok) throw new Error(`"${text}" did not parse`);
  return result.equation;
}

/** Room 4 with its pin locked at 9, so the stage is open. */
function waterWheel(): RoomState {
  const poking = step(touchMachine(enterRoom(r04).room)).room;
  return step(confirmPin(step(setPin(poking, { kind: 'x', x: 9 })).room)).room;
}

/** A one-stage room with no pin, open after his first touch. */
function openRoom(text: string, fading: FadingMode = 'auto'): RoomState {
  const spec: RoomSpec = {
    ...r01,
    stages: [
      {
        type: 'solve',
        machines: [{ equation: text }],
        dial: { min: 0, max: 20, step: 1 },
        readouts: true,
        ways: ['balance'],
        fading: { try: 'blank', balance: fading },
      },
    ],
  };
  return step(touchMachine(enterRoom(spec).room)).room;
}

/** Drops the tray's weight or float, numbered `value`, on a pan. */
function drop(room: RoomState, side: 'left' | 'right', kind: TrayKind, value: number): RoomStep {
  let current = room;
  while (current.stage.tray[kind] < value) current = step(stepTray(current, balance, kind, 1)).room;
  return step(dropOnPan(current, balance, side, kind));
}

/** Sets the splitter's parts, through the stepper. */
function parts(room: RoomState, value: number): RoomState {
  let current = room;
  while (current.stage.splitter < value) current = step(stepSplitter(current, balance, 1)).room;
  while (current.stage.splitter > value) current = step(stepSplitter(current, balance, -1)).room;
  return current;
}

function split(room: RoomState, value: number): RoomStep {
  return step(splitBothPans(parts(room, value), balance));
}

function typed(room: RoomState, text: string): RoomState {
  const result = tokenize(text);
  if (!result.ok) throw new Error(`"${text}" isn't in pad tokens`);
  let current = room;
  for (const token of result.tokens) current = step(typeToken(current, token)).room;
  return current;
}

function write(room: RoomState, text: string): RoomStep {
  return step(enterLine(typed(room, text), 0));
}

const shown = (room: RoomState) => formatEquation(room.stage.pans);
const written = (room: RoomState) => room.stage.lines.map((line) => formatTokens(line.tokens));

/** Room 4 after a float of 5 on each pan: `2x = 18` is written. */
function atTwoXEighteen(): RoomState {
  const left = drop(waterWheel(), 'left', 'float', 5).room;
  return drop(left, 'right', 'float', 5).room;
}

describe('when the splitter is offered', () => {
  it('needs Balance and an open stage: not in arrive, poke or pin, nor once the stage locks', () => {
    const arriving = enterRoom(r04).room;
    const poking = step(touchMachine(arriving)).room;
    const pinning = step(setPin(poking, { kind: 'x', x: 9 })).room;
    for (const room of [arriving, poking, pinning]) {
      expect(splitterOffered(room, balance)).toBe(false);
      expect(splitterView(room, balance)).toBeNull();
    }
    expect(splitterOffered(waterWheel(), balance)).toBe(true);
    expect(splitterOffered(waterWheel(), [])).toBe(false);
    expect(splitBothPans(waterWheel(), [])).toBeNull();
    const answered = write(waterWheel(), 'x = 9').room;
    const locked = write(answered, '2 · 9 + 5 = 23').room;
    expect(locked.stage.phase).toBe('locked');
    expect(splitterOffered(locked, balance)).toBe(false);
  });

  it('shows 2 parts as the stage arrives, in its holder, and nothing with no room', () => {
    expect(splitterView(null, balance)).toBeNull();
    expect(splitterView(waterWheel(), [])).toBeNull();
    expect(splitterView(waterWheel(), balance)).toEqual({
      parts: 2,
      works: true,
      onPans: false,
      wiggle: false,
    });
  });

  it('is offered but does nothing while a wrong line jams the machine', () => {
    const jammed = write(waterWheel(), 'x = 8').room;
    expect(jammed.stage.jam).toEqual({ kind: 'line' });
    expect(splitterOffered(jammed, balance)).toBe(true);
    expect(splitterWorks(jammed, balance)).toBe(false);
    expect(splitterView(jammed, balance)).toMatchObject({ works: false, onPans: false });
    expect(stepSplitter(jammed, balance, 1)).toBeNull();
    expect(splitBothPans(jammed, balance)).toBeNull();
    // Only an edit clears a line jam: dragging the splitter off is for a split jam.
    expect(liftSplitter(jammed)).toBeNull();
  });

  it('wiggles once when it is first available (hint level 1), with the tray, and never again', () => {
    const room = waterWheel();
    expect(offeredControls(room, balance)).toEqual(['tray', 'splitter']);
    const met = meetControls(room, ['pin'], balance);
    expect(met?.met).toEqual(['pin', 'tray', 'splitter']);
    expect(splitterView(met?.room ?? null, balance)?.wiggle).toBe(true);
    // Met already, it doesn't raise the hint level again…
    expect(meetControls(room, ['pin', 'tray', 'splitter'], balance)).toBeNull();
    // …and met alone, after the tray, it still wiggles the first time.
    const alone = meetControls(room, ['pin', 'tray'], balance);
    expect(alone?.met).toEqual(['pin', 'tray', 'splitter']);
    expect(splitterView(alone?.room ?? null, balance)?.wiggle).toBe(true);
  });
});

describe('setting the parts', () => {
  it('sets 2–9 parts, one step at a time, and stops at either end', () => {
    expect(tuning.splitterMinParts).toBe(2);
    expect(tuning.splitterMaxParts).toBe(9);
    let room = waterWheel();
    expect(stepSplitter(room, balance, -1)).toBeNull();
    const seen: number[] = [room.stage.splitter];
    for (let i = 0; i < 7; i += 1) {
      const next = step(stepSplitter(room, balance, 1));
      expect(next.events).toEqual([]);
      room = next.room;
      seen.push(room.stage.splitter);
    }
    expect(seen).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
    expect(stepSplitter(room, balance, 1)).toBeNull();
    expect(step(stepSplitter(room, balance, -1)).room.stage.splitter).toBe(8);
    expect(canStepParts(2, -1)).toBe(false);
    expect(canStepParts(2, 1)).toBe(true);
    expect(canStepParts(9, 1)).toBe(false);
    expect(canStepParts(9, -1)).toBe(true);
  });

  it("doesn't touch the pans, and is ignored without Balance", () => {
    const room = waterWheel();
    expect(step(stepSplitter(room, balance, 1)).room.stage.pans).toBe(room.stage.pans);
    expect(stepSplitter(room, [], 1)).toBeNull();
  });

  it('keeps its parts when the stage is reset; the next stage arrives with 2', () => {
    const set = parts(waterWheel(), 6);
    const reset = step(resetStage(set)).room;
    expect(reset.stage.splitter).toBe(6);
    expect(splitterView(reset, balance)?.parts).toBe(6);
    expect(enterRoom(r04).room.stage.splitter).toBe(2);
  });
});

describe('a split across both pans', () => {
  it('room 4: 2x = 18 split by 2 shows x = 9 on the pans, and nothing is written', () => {
    const room = atTwoXEighteen();
    expect(written(room)).toEqual(['2x + 5 = 23', '2x = 18']);
    const result = split(room, 2);
    expect(shown(result.room)).toBe('x = 9');
    expect(written(result.room)).toEqual(['2x + 5 = 23', '2x = 18']);
    // The move completes like any balance move; the answer line is his to write.
    expect(result.events).toEqual([{ type: 'WayUsed', roomId: 'r04', stage: 0, way: 'balance' }]);
    expect(result.room.stage.jam).toBeNull();
    expect(panPieces(result.room.stage.pans).left.map((piece) => piece.kind)).toEqual(['gear']);
  });

  it('room 4: he then writes x = 9 and 2 · 9 + 5 = 23, and the machine locks', () => {
    const halved = split(atTwoXEighteen(), 2).room;
    const answered = write(halved, 'x = 9');
    expect(answered.room.stage.lines.at(-1)?.verdict.kind).toBe('answer');
    const locked = write(answered.room, '2 · 9 + 5 = 23');
    expect(locked.room.stage.phase).toBe('locked');
    expect(locked.events.map((event) => event.type)).toContain('StageLocked');
  });

  it('combines each pan’s numbers first: after a typed 2x = 23 − 5, a split by 2 gives x = 9', () => {
    const typedLine = write(waterWheel(), '2x = 23 − 5').room;
    expect(panPieces(typedLine.stage.pans).right.map((piece) => piece.kind)).toEqual([
      'weight',
      'float',
    ]);
    const result = split(typedLine, 2);
    expect(result.room.stage.jam).toBeNull();
    expect(shown(result.room)).toBe('x = 9');
    expect(result.events).toEqual([{ type: 'WayUsed', roomId: 'r04', stage: 0, way: 'balance' }]);
  });

  it('is exploring: it ends acting out, and the pans are weighed at the dial’s x', () => {
    const typedLine = write(waterWheel(), '2x = 23 − 5').room;
    expect(typedLine.stage.actingOut).toBe(true);
    const turned = step(setDial(typedLine, 3)).room;
    const actedOut = write(turned, '2x = 18').room;
    expect(actedOut.stage.actingOut).toBe(true);
    const halved = split(actedOut, 2).room;
    expect(halved.stage.actingOut).toBe(false);
    expect(halved.stage.dialX).toBe(3);
    expect(scaleView(halved)).toMatchObject({ x: 3, actingOut: false });
    expect(scaleView(halved).left.value).toEqual({ n: 3n, d: 1n });
    expect(scaleView(halved).right.value).toEqual({ n: 9n, d: 1n });
  });

  it('divides gear counts and numbers, and with Balance auto writes a line that isn’t x = n', () => {
    const room = openRoom('4x + 8 = 20');
    const result = split(room, 4);
    expect(shown(result.room)).toBe('x + 2 = 5');
    expect(written(result.room)).toEqual(['4x + 8 = 20', 'x + 2 = 5']);
    expect(result.room.stage.lines.at(-1)?.source).toBe('balance');
    expect(result.events).toEqual([
      { type: 'WayUsed', roomId: 'r01', stage: 0, way: 'balance' },
      { type: 'LineAccepted', roomId: 'r01', stage: 0, source: 'balance', progress: true },
    ]);
  });

  it('writes nothing with Balance blank, though the move completes', () => {
    const result = split(openRoom('4x + 8 = 20', 'blank'), 2);
    expect(shown(result.room)).toBe('2x + 4 = 10');
    expect(written(result.room)).toEqual(['4x + 8 = 20']);
    expect(result.events).toEqual([{ type: 'WayUsed', roomId: 'r01', stage: 0, way: 'balance' }]);
  });

  it('splits springs and the number they lift: 20 − 2x = 6 by 2 is 10 − x = 3', () => {
    expect(shown(split(openRoom('20 − 2x = 6'), 2).room)).toBe('10 − x = 3');
  });

  it('splits gears on a divider by their count: 2x : 3 = 4 by 2 is x : 3 = 2', () => {
    expect(shown(split(openRoom('2x : 3 = 4'), 2).room)).toBe('x : 3 = 2');
  });

  it('after a change to one pan only, tips at the dial’s x and writes nothing', () => {
    // 2x + 4 = 20 (x = 8) with a float of 4 on the left only: 2x = 20, then split by 2.
    const changed = drop(openRoom('2x + 4 = 20'), 'left', 'float', 4).room;
    expect(shown(changed)).toBe('2x = 20');
    const result = split(changed, 2);
    expect(shown(result.room)).toBe('x = 10');
    expect(result.events).toEqual([]);
    expect(written(result.room)).toEqual(['2x + 4 = 20']);
    expect(scaleView(result.room)).toMatchObject({ x: 0, actingOut: false, level: false });
  });
});

describe('a split that doesn’t divide evenly', () => {
  it('jams the machine (kind split) and keeps the pans as they were', () => {
    const room = atTwoXEighteen();
    const result = split(room, 4);
    expect(result.events).toEqual([{ type: 'MachineJammed', roomId: 'r04', kind: 'split' }]);
    expect(result.room.stage.jam).toEqual({ kind: 'split', parts: 4 });
    expect(result.room.stage.pans).toBe(room.stage.pans);
    expect(written(result.room)).toEqual(written(room));
    expect(result.room.stage.jamsInARow).toBe(room.stage.jamsInARow + 1);
    expect(machineView(result.room)?.jammed).toBe(true);
    expect(scaleView(result.room)).toMatchObject({ x: 0, actingOut: false });
    expect(splitterView(result.room, balance)).toEqual({
      parts: 4,
      works: false,
      onPans: true,
      wiggle: false,
    });
  });

  it('jams when a gear count doesn’t divide (2x + 6 = 24 by 3), or a number (2x = 23 by 2)', () => {
    expect(splitOutcome(equation('2x + 6 = 24'), 3)).toEqual({ kind: 'uneven' });
    expect(splitOutcome(equation('2x = 23'), 2)).toEqual({ kind: 'uneven' });
    expect(splitOutcome(equation('x : 3 = 5'), 2)).toEqual({ kind: 'uneven' });
    expect(splitOutcome(equation('2x = 18'), 2)).toEqual({
      kind: 'even',
      pans: equation('x = 9'),
    });
    const tipped = drop(waterWheel(), 'left', 'float', 5).room;
    expect(shown(tipped)).toBe('2x = 23');
    const jammed = split(tipped, 2);
    expect(jammed.room.stage.jam).toEqual({ kind: 'split', parts: 2 });
  });

  it('lets him do nothing but edit the draft, drag the splitter off or reset while jammed', () => {
    const jammed = split(atTwoXEighteen(), 4).room;
    expect(setDial(jammed, 1)).toBeNull();
    expect(dropOnPan(jammed, balance, 'left', 'weight')).toBeNull();
    expect(stepTray(jammed, balance, 'weight', 1)).toBeNull();
    expect(stepSplitter(jammed, balance, 1)).toBeNull();
    expect(splitBothPans(jammed, balance)).toBeNull();
    const edited = step(typeToken(jammed, 'x')).room;
    expect(edited.stage.jam).toEqual({ kind: 'split', parts: 4 });
    expect(enterLine(typed(jammed, 'x = 9'), 0)).toBeNull();
  });

  it('clears when he drags the splitter off: the pans are as before, and it works again', () => {
    const room = atTwoXEighteen();
    const jammed = split(room, 4).room;
    const lifted = step(liftSplitter(jammed));
    expect(lifted.events).toEqual([]);
    expect(lifted.room.stage.jam).toBeNull();
    expect(lifted.room.stage.pans).toBe(room.stage.pans);
    expect(splitterView(lifted.room, balance)).toMatchObject({
      parts: 4,
      works: true,
      onPans: false,
    });
    expect(machineView(lifted.room)?.jammed).toBe(false);
    const halved = split(lifted.room, 2);
    expect(shown(halved.room)).toBe('x = 9');
    expect(liftSplitter(waterWheel())).toBeNull();
  });

  it('clears on reset too, which keeps the parts', () => {
    const jammed = split(atTwoXEighteen(), 4).room;
    const reset = step(resetStage(jammed)).room;
    expect(reset.stage.jam).toBeNull();
    expect(reset.stage.splitter).toBe(4);
    expect(shown(reset)).toBe('2x + 5 = 23');
  });

  it('counts as a jam until a line is committed', () => {
    const twice = split(step(liftSplitter(split(atTwoXEighteen(), 4).room)).room, 5).room;
    expect(twice.stage.jamsInARow).toBe(2);
    const lifted = step(liftSplitter(twice)).room;
    expect(write(lifted, 'x = 9').room.stage.jamsInARow).toBe(0);
  });
});
