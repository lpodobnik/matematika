import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import { r01 } from '@/content/rooms/r01-door-lift';
import { r04 } from '@/content/rooms/r04-water-wheel';
import type { Equation } from '@/math/expr';
import { formatEquation, formatLine, formatTokens } from '@/math/format';
import { parse } from '@/math/parse';
import { tokenize } from '@/math/tokens';
import { setDial } from '@/room/dial';
import { meetControls, offeredControls } from '@/room/first-use';
import { machineView } from '@/room/machine';
import { enterLine, typeToken } from '@/room/notebook';
import { resetStage, touchMachine } from '@/room/phases';
import { panPieces } from '@/room/pieces';
import { setPin } from '@/room/pin';
import { enterRoom, type RoomStep } from '@/room/room';
import { scaleView } from '@/room/scale';
import {
  canStepParts,
  rememberSplitter,
  splitBothPans,
  splitGroups,
  splitOutcome,
  splitterOffered,
  splitterView,
  splitterWorks,
  stepSplitter,
} from '@/room/splitter';
import { dropOnScale, rememberTray, stepTray } from '@/room/tray';
import type { FadingMode, RoomSpec, RoomState, StageSpec, ToolId, TrayKind } from '@/room/types';

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

/**
 * Room 4, open, with the dial at 6; the tray is offered from the start (story 1.16). Story
 * 1.16 took its pin away (until then this locked the pin at 9 first).
 */
function waterWheel(): RoomState {
  const open = step(touchMachine(enterRoom(r04).room)).room;
  return step(setDial(open, 6)).room;
}

/**
 * Room 4 with the dial of 0–6, the pin beyond it and the poke window it had until story
 * 1.16, for the phases before open.
 */
const pinnedWheel: RoomSpec = {
  ...r04,
  stages: [
    {
      ...(r04.stages[0] as StageSpec),
      dial: { min: 0, max: 6, step: 1 },
      pokeNotches: 4,
      pin: { kind: 'level-x', beyondDial: true },
    },
  ],
};

/**
 * A one-stage room with no pin, open after his first touch, with the tray offered as in a
 * stage after the one where he met it.
 */
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
  return rememberTray(step(touchMachine(enterRoom(spec).room)).room, ['tray']);
}

/** The stage as if a side had held only x pieces earlier in it, so the splitter stays offered. */
function seen(room: RoomState): RoomState {
  return {
    ...room,
    stage: { ...room.stage, balance: { ...room.stage.balance, splitterSeen: true } },
  };
}

/** Drops the tray's weight or float, numbered `value`, over the scale. */
function drop(room: RoomState, kind: TrayKind, value: number): RoomStep {
  let current = room;
  while (current.stage.tray[kind] < value) current = step(stepTray(current, balance, kind, 1)).room;
  return step(dropOnScale(current, balance, kind));
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
const labels = (pieces: readonly { label: string }[]) => pieces.map((piece) => piece.label);
/** The lines with blanks left to fill, as the notebook writes them. */
const toFill = (room: RoomState) =>
  room.stage.templates.map((line) =>
    formatLine(line)
      .map((segment) => (segment.kind === 'blank' ? '☐' : segment.text))
      .join(''),
  );

/** Room 4 after a float of 5 over the scale: `2x + 5 − 5 = 23 − 5` and `2x = 18` are written. */
function atTwoXEighteen(): RoomState {
  return drop(waterWheel(), 'float', 5).room;
}

describe('when the splitter is offered (story 1.15: one tool at a time)', () => {
  it('needs Balance and an open stage: not in arrive, poke or pin, nor once the stage locks', () => {
    const arriving = enterRoom(pinnedWheel).room;
    const poking = step(touchMachine(arriving)).room;
    const pinning = step(setPin(poking, { kind: 'x', x: 9 })).room;
    for (const room of [arriving, poking, pinning, enterRoom(r04).room]) {
      expect(splitterOffered(room, balance)).toBe(false);
      expect(splitterView(room, balance)).toBeNull();
    }
    expect(splitterOffered(atTwoXEighteen(), balance)).toBe(true);
    expect(splitterOffered(atTwoXEighteen(), [])).toBe(false);
    expect(splitBothPans(atTwoXEighteen(), [])).toBeNull();
    // `2x = 18` is simplified, so x = 9 may be written; the check line is then a blank (1.16).
    const answered = write(atTwoXEighteen(), 'x = 9').room;
    const locked = write(answered, '9').room;
    expect(locked.stage.phase).toBe('locked');
    expect(splitterOffered(locked, balance)).toBe(false);
  });

  it('waits until one side holds only x pieces, more than one x', () => {
    expect(splitterOffered(waterWheel(), balance)).toBe(false);
    expect(splitterView(waterWheel(), balance)).toBeNull();
    expect(splitBothPans(waterWheel(), balance)).toBeNull();
    // A stage that starts that way offers it at once; x alone doesn't.
    expect(splitterOffered(openRoom('3x = 12'), balance)).toBe(true);
    expect(splitterOffered(openRoom('x + 4 = 9'), balance)).toBe(false);
    expect(splitterOffered(openRoom('x : 3 = 5'), balance)).toBe(false);
    // A line he writes counts too.
    expect(splitterOffered(write(waterWheel(), '2x = 18').room, balance)).toBe(true);
  });

  it('stays for the rest of the stage: after x = 9 is written, after more moves, after a reset', () => {
    const room = atTwoXEighteen();
    expect(splitterOffered(write(room, 'x = 9').room, balance)).toBe(true);
    const plusTwo = drop(room, 'weight', 2).room;
    expect(shown(plusTwo)).toBe('2x + 2 = 20');
    expect(splitterOffered(plusTwo, balance)).toBe(true);
    expect(splitterOffered(step(resetStage(plusTwo)).room, balance)).toBe(true);
    // With Balance blank nothing is written, so the stage remembers it.
    const blank = drop(openRoom('2x + 5 = 23', 'blank'), 'float', 5).room;
    expect(blank.stage.balance.splitterSeen).toBe(true);
    const moved = drop(blank, 'weight', 1).room;
    expect(shown(moved)).toBe('2x + 1 = 19');
    expect(splitterOffered(moved, balance)).toBe(true);
  });

  // Story 1.15 review: only Balance moves remembered it, so a typed `2x = 18` offered it
  // until a reset took the line away. The root reducer remembers it whenever it is offered.
  it('stays after a reset when a typed line offered it: 2x = 18, then reset', () => {
    const typedLine = write(waterWheel(), '2x = 18').room;
    expect(typedLine.stage.balance.splitterSeen).toBe(false);
    const remembered = rememberSplitter(typedLine, balance);
    expect(remembered.stage.balance.splitterSeen).toBe(true);
    expect(splitterOffered(step(resetStage(remembered)).room, balance)).toBe(true);
    // Not offered, or already remembered: the same room, untouched.
    const notOffered = waterWheel();
    expect(rememberSplitter(notOffered, balance)).toBe(notOffered);
    expect(rememberSplitter(typedLine, [])).toBe(typedLine);
    expect(rememberSplitter(remembered, balance)).toBe(remembered);
  });

  it('shows 2 parts as it appears, and nothing with no room', () => {
    expect(splitterView(null, balance)).toBeNull();
    expect(splitterView(atTwoXEighteen(), [])).toBeNull();
    expect(splitterView(atTwoXEighteen(), balance)).toEqual({
      parts: 2,
      works: true,
      wiggle: false,
    });
  });

  it('is offered but does nothing while a wrong line jams the machine', () => {
    const jammed = write(atTwoXEighteen(), 'x = 8').room;
    expect(jammed.stage.jam).toEqual({ kind: 'line' });
    expect(splitterOffered(jammed, balance)).toBe(true);
    expect(splitterWorks(jammed, balance)).toBe(false);
    expect(splitterView(jammed, balance)).toMatchObject({ works: false });
    expect(stepSplitter(jammed, balance, 1)).toBeNull();
    expect(splitBothPans(jammed, balance)).toBeNull();
  });

  it('wiggles once when it is first offered (hint level 1), after the tray, and never again', () => {
    const room = atTwoXEighteen();
    expect(offeredControls(room, balance)).toEqual(['tray', 'splitter']);
    const alone = meetControls(room, ['pin', 'tray'], balance);
    expect(alone?.met).toEqual(['pin', 'tray', 'splitter']);
    expect(splitterView(alone?.room ?? null, balance)?.wiggle).toBe(true);
    expect(meetControls(room, ['pin', 'tray', 'splitter'], balance)).toBeNull();
  });
});

describe('setting the parts', () => {
  it('sets 2–9 parts, one step at a time, and stops at either end', () => {
    expect(tuning.splitterMinParts).toBe(2);
    expect(tuning.splitterMaxParts).toBe(9);
    let room = atTwoXEighteen();
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
    const room = atTwoXEighteen();
    expect(step(stepSplitter(room, balance, 1)).room.stage.pans).toBe(room.stage.pans);
    expect(stepSplitter(room, [], 1)).toBeNull();
  });

  it('keeps its parts when the stage is reset; the next stage arrives with 2', () => {
    const set = parts(atTwoXEighteen(), 6);
    const reset = step(resetStage(set)).room;
    expect(reset.stage.splitter).toBe(6);
    expect(splitterView(reset, balance)?.parts).toBe(6);
    expect(enterRoom(r04).room.stage.splitter).toBe(2);
  });
});

describe('a split over the scale (story 1.15)', () => {
  it('room 4: 2x = 18 split by 2 writes 2x : 2 = 18 : 2, shows x = 9, and leaves x = 9 to him', () => {
    const room = atTwoXEighteen();
    const result = split(room, 2);
    expect(shown(result.room)).toBe('x = 9');
    expect(written(result.room).slice(3)).toEqual(['2x : 2 = 18 : 2']);
    expect(result.events).toEqual([
      { type: 'WayUsed', roomId: 'r04', stage: 0, way: 'balance' },
      { type: 'LineAccepted', roomId: 'r04', stage: 0, source: 'balance', progress: true },
    ]);
    expect(result.room.stage.lines.at(-1)).toMatchObject({
      source: 'balance',
      verdict: { kind: 'valid', move: { kind: 'split-both', parts: 2 } },
    });
    expect(result.room.stage.machineProgress).toEqual([0.4]);
    expect(result.room.stage.jam).toBeNull();
    expect(panPieces(result.room.stage.pans).left.map((piece) => piece.kind)).toEqual(['gear']);
  });

  // Story 1.16: x alone brings up `x = ☐` and then `2 · ☐ + 5 = 23`; he fills in 9 twice
  // (he typed both lines out until then).
  it('room 4: he then fills x = ☐ and 2 · ☐ + 5 = 23 with 9, and the machine locks', () => {
    const halved = split(atTwoXEighteen(), 2).room;
    expect(toFill(halved)).toEqual(['x = ☐', '2 · ☐ + 5 = 23']);
    const answered = write(halved, '9');
    expect(answered.room.stage.lines.at(-1)?.verdict.kind).toBe('answer');
    expect(formatTokens(answered.room.stage.lines.at(-1)?.tokens ?? [])).toBe('x = 9');
    const locked = write(answered.room, '9');
    expect(formatTokens(locked.room.stage.lines.at(-1)?.tokens ?? [])).toBe('2 · 9 + 5 = 23');
    expect(locked.room.stage.phase).toBe('locked');
    expect(locked.events.map((event) => event.type)).toContain('StageLocked');
  });

  it('divides a written-out side as it shows: after a typed 2x = 23 − 5, it writes (23 − 5) : 2', () => {
    const typedLine = write(waterWheel(), '2x = 23 − 5').room;
    expect(panPieces(typedLine.stage.pans).right.map((piece) => piece.kind)).toEqual([
      'weight',
      'float',
    ]);
    const result = split(typedLine, 2);
    expect(shown(result.room)).toBe('x = 9');
    expect(written(result.room).at(-1)).toBe('2x : 2 = (23 − 5) : 2');
  });

  // Story 1.16: 1.15 acted a split out at the true x (level, no readouts).
  it('stays at the dial’s x, like any Balance move; the dial stays where it was', () => {
    const turned = step(setDial(write(waterWheel(), '2x = 18').room, 3)).room;
    const halved = split(turned, 2).room;
    expect(halved.stage.dialX).toBe(3);
    expect(scaleView(halved)).toMatchObject({
      x: 3,
      level: false,
      readouts: { left: '3', right: '9' },
    });
  });

  it('writes the result too when it isn’t x = n: 4x + 8 = 20 by 4 is x + 2 = 5', () => {
    // 4x = 12 offers the splitter; a weight of 8 gives 4x + 8 = 20, and it stays offered.
    const eight = drop(openRoom('4x = 12'), 'weight', 8).room;
    expect(shown(eight)).toBe('4x + 8 = 20');
    const result = split(eight, 4);
    expect(shown(result.room)).toBe('x + 2 = 5');
    expect(written(result.room).slice(3)).toEqual(['(4x + 8) : 4 = 20 : 4', 'x + 2 = 5']);
    expect(result.room.stage.lines.slice(3).map((line) => line.source)).toEqual([
      'balance',
      'balance',
    ]);
    expect(result.events.map((event) => event.type)).toEqual([
      'WayUsed',
      'LineAccepted',
      'LineAccepted',
    ]);
  });

  it('writes nothing with Balance blank, though the pans split and WayUsed fires', () => {
    const result = split(seen(openRoom('4x + 8 = 20', 'blank')), 2);
    expect(shown(result.room)).toBe('2x + 4 = 10');
    expect(written(result.room)).toEqual(['4x + 8 = 20']);
    expect(result.events).toEqual([{ type: 'WayUsed', roomId: 'r01', stage: 0, way: 'balance' }]);
  });

  it('splits springs and the number they lift: 20 − 2x = 6 by 2 is 10 − x = 3', () => {
    expect(shown(split(seen(openRoom('20 − 2x = 6')), 2).room)).toBe('10 − x = 3');
  });

  it('splits gears on a divider by their count: 2x : 3 = 4 by 2 is x : 3 = 2', () => {
    const result = split(openRoom('2x : 3 = 4'), 2);
    expect(shown(result.room)).toBe('x : 3 = 2');
    expect(written(result.room).slice(1)).toEqual(['2x : 3 : 2 = 4 : 2', 'x : 3 = 2']);
  });

  it('separates each side into equal groups, one of which is the result', () => {
    const groups = splitGroups(equation('2x = 18'), 2);
    expect(groups.even).toBe(true);
    expect(groups.left.groups.map(labels)).toEqual([['x'], ['x']]);
    expect(groups.right.groups.map(labels)).toEqual([['9'], ['9']]);
    expect(groups.left.leftover).toEqual([]);
    expect(groups.right.leftover).toEqual([]);
    const keys = groups.left.groups.flat().map((piece) => piece.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('a split that doesn’t divide evenly is refused (story 1.15)', () => {
  it('changes nothing and writes nothing: the splitter goes back to its place', () => {
    const room = atTwoXEighteen();
    expect(splitBothPans(parts(room, 4), balance)).toBeNull();
    const four = parts(room, 4);
    expect(four.stage.jam).toBeNull();
    expect(machineView(four)?.jammed).toBe(false);
    expect(splitterView(four, balance)).toEqual({ parts: 4, works: true, wiggle: false });
    // He can split again at once.
    expect(shown(split(four, 2).room)).toBe('x = 9');
  });

  it('is uneven when a gear count doesn’t divide (2x + 6 = 24 by 3), or a number (2x = 23 by 2)', () => {
    expect(splitOutcome(equation('2x + 6 = 24'), 3)).toEqual({ kind: 'uneven' });
    expect(splitOutcome(equation('2x = 23'), 2)).toEqual({ kind: 'uneven' });
    expect(splitOutcome(equation('x : 3 = 5'), 2)).toEqual({ kind: 'uneven' });
    expect(splitOutcome(equation('2x = 18'), 2)).toEqual({
      kind: 'even',
      line: equation('2x : 2 = 18 : 2'),
      pans: equation('x = 9'),
    });
  });

  it('shows what is left over: 2x = 23 by 2 leaves a weight of 1, 3x = 18 by 2 a gear', () => {
    const odd = splitGroups(equation('2x = 23'), 2);
    expect(odd.even).toBe(false);
    expect(odd.right.groups.map(labels)).toEqual([['11'], ['11']]);
    expect(labels(odd.right.leftover)).toEqual(['1']);
    expect(odd.left.leftover).toEqual([]);
    const gears = splitGroups(equation('3x = 18'), 2);
    expect(gears.left.groups.map(labels)).toEqual([['x'], ['x']]);
    expect(labels(gears.left.leftover)).toEqual(['x']);
    const springs = splitGroups(equation('20 − 3x = 2'), 2);
    expect(springs.left.groups.map(labels)).toEqual([
      ['10', '−x'],
      ['10', '−x'],
    ]);
    expect(labels(springs.left.leftover)).toEqual(['−x']);
  });

  it('never jams: no jam kind is left for a split, and the dial and tray still work', () => {
    const four = parts(atTwoXEighteen(), 4);
    expect(splitBothPans(four, balance)).toBeNull();
    expect(setDial(four, 1)).not.toBeNull();
    expect(dropOnScale(four, balance, 'weight')).not.toBeNull();
  });
});
