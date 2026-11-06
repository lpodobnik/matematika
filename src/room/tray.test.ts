import { describe, expect, it } from 'vitest';
import { tuning } from '@/config/tuning';
import { r01 } from '@/content/rooms/r01-door-lift';
import { r04 } from '@/content/rooms/r04-water-wheel';
import { type Equation, sameEquation } from '@/math/expr';
import { formatEquation, formatTokens } from '@/math/format';
import { parse } from '@/math/parse';
import * as q from '@/math/rational';
import { tokenize } from '@/math/tokens';
import { setDial } from '@/room/dial';
import { meetControls, offeredControls } from '@/room/first-use';
import { deleteToken, enterLine, typeToken } from '@/room/notebook';
import { resetStage, touchMachine } from '@/room/phases';
import { panPieces } from '@/room/pieces';
import { confirmPin, setPin } from '@/room/pin';
import { enterRoom, type RoomStep } from '@/room/room';
import { scaleView } from '@/room/scale';
import { splitBothPans } from '@/room/splitter';
import {
  balanceFading,
  canStep,
  dropOnScale,
  onBothSides,
  readyToSplit,
  rememberTray,
  sameLayout,
  sideExpr,
  stepTray,
  takeOffPan,
  trayOffered,
  trayPiece,
  trayView,
  trayWorks,
} from '@/room/tray';
import type {
  DialSpec,
  FadingMode,
  RoomSpec,
  RoomState,
  StageSpec,
  ToolId,
  TrayKind,
} from '@/room/types';

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

/** Room 4 with its pin locked at 9, so the stage is open; the tray isn't offered yet. */
function lockedPin(): RoomState {
  const poking = step(touchMachine(enterRoom(r04).room)).room;
  return step(confirmPin(step(setPin(poking, { kind: 'x', x: 9 })).room)).room;
}

/** Room 4, open, with the dial pushed to its maximum (6), which can't level it: the tray is offered. */
function waterWheel(): RoomState {
  return step(setDial(lockedPin(), 6)).room;
}

/** A one-stage room with no pin, open after his first touch; 'none' lists no Balance mode. */
function openStage(
  text: string,
  fading: FadingMode | 'none' = 'auto',
  dial: DialSpec = { min: 0, max: 20, step: 1 },
): RoomState {
  const spec: RoomSpec = {
    ...r01,
    stages: [
      {
        type: 'solve',
        machines: [{ equation: text }],
        dial,
        readouts: true,
        ways: ['balance'],
        fading: fading === 'none' ? { try: 'blank' } : { try: 'blank', balance: fading },
      },
    ],
  };
  return step(touchMachine(enterRoom(spec).room)).room;
}

/** The same, with the tray offered at once, as in a stage after the one where he met it. */
function openRoom(text: string, fading: FadingMode | 'none' = 'auto'): RoomState {
  return rememberTray(openStage(text, fading), ['tray']);
}

/** Sets the tray's number for a kind, through the stepper. */
function set(room: RoomState, kind: TrayKind, value: number): RoomState {
  let current = room;
  while (current.stage.tray[kind] < value) current = step(stepTray(current, balance, kind, 1)).room;
  while (current.stage.tray[kind] > value)
    current = step(stepTray(current, balance, kind, -1)).room;
  return current;
}

function drop(room: RoomState, kind: TrayKind, value: number): RoomStep {
  return step(dropOnScale(set(room, kind, value), balance, kind));
}

function typed(room: RoomState, text: string): RoomState {
  const result = tokenize(text);
  if (!result.ok) throw new Error(`"${text}" isn't in pad tokens`);
  let current = room;
  for (const token of result.tokens) current = step(typeToken(current, token)).room;
  return current;
}

const shown = (room: RoomState) => formatEquation(room.stage.pans);
const written = (room: RoomState) => room.stage.lines.map((line) => formatTokens(line.tokens));

describe('when the tray is offered (story 1.15: one tool at a time)', () => {
  it('needs Balance and an open stage: not in arrive, poke or pin, nor once the stage locks', () => {
    const arriving = enterRoom(r04).room;
    const poking = step(touchMachine(arriving)).room;
    const pinning = step(setPin(poking, { kind: 'x', x: 9 })).room;
    for (const room of [arriving, poking, pinning]) {
      expect(trayOffered(rememberTray(room, ['tray']), balance)).toBe(false);
    }
    expect(trayOffered(waterWheel(), balance)).toBe(true);
    expect(trayOffered(waterWheel(), [])).toBe(false);
    let room = typed(waterWheel(), 'x = 9');
    room = step(enterLine(room, 0)).room;
    room = step(enterLine(typed(room, '2 · 9 + 5 = 23'), 0)).room;
    expect(room.stage.phase).toBe('locked');
    expect(trayOffered(room, balance)).toBe(false);
  });

  it('waits in a fresh stage until his dial has been at its maximum without levelling the pans', () => {
    const open = lockedPin();
    expect(trayOffered(open, balance)).toBe(false);
    expect(trayView(open, balance)).toBeNull();
    expect(dropOnScale(open, balance, 'float')).toBeNull();
    const five = step(setDial(open, 5)).room;
    expect(trayOffered(five, balance)).toBe(false);
    const six = step(setDial(five, 6)).room;
    expect(six.stage.balance.dialMaxed).toBe(true);
    expect(trayOffered(six, balance)).toBe(true);
    // A dial whose maximum levels the pans never offers it: he solves it with the dial.
    const reachable = openStage('x + 4 = 9', 'auto', { min: 0, max: 5, step: 1 });
    const levelled = step(setDial(reachable, 5)).room;
    expect(levelled.stage.balance.dialMaxed).toBe(false);
    expect(trayOffered(levelled, balance)).toBe(false);
  });

  // Story 1.15 review: a pin at 6 has the machine park the dial at its maximum itself, and
  // his grab there sends `dial/set 6`, which the dial already has, so it was never maxed.
  it("is offered when the machine's pin test leaves the dial at its maximum with the pans tipped", () => {
    const poking = step(touchMachine(enterRoom(r04).room)).room;
    const atSix = step(confirmPin(step(setPin(poking, { kind: 'x', x: 6 })).room)).room;
    expect(atSix.stage.dialX).toBe(6);
    expect(atSix.stage.balance.dialMaxed).toBe(true);
    expect(trayOffered(atSix, balance)).toBe(true);
    expect(setDial(atSix, 6)).toBeNull();
    // A test that stops short of the maximum, or weighs a pin beyond the dial, doesn't.
    const atFive = step(confirmPin(step(setPin(poking, { kind: 'x', x: 5 })).room)).room;
    expect(atFive.stage.balance.dialMaxed).toBe(false);
    expect(trayOffered(lockedPin(), balance)).toBe(false);
    // Nor does one that levels the pans at the maximum: the dial solves it there.
    const reachable: RoomSpec = {
      ...r04,
      stages: [{ ...(r04.stages[0] as StageSpec), dial: { min: 0, max: 9, step: 1 } }],
    };
    const levelling = step(touchMachine(enterRoom(reachable).room)).room;
    const atNine = step(confirmPin(step(setPin(levelling, { kind: 'x', x: 9 })).room)).room;
    expect(atNine.stage.dialX).toBe(9);
    expect(atNine.stage.balance.dialMaxed).toBe(false);
  });

  it('stays for the rest of the stage: the dial back down, or a reset, keeps it', () => {
    const back = step(setDial(waterWheel(), 2)).room;
    expect(trayOffered(back, balance)).toBe(true);
    expect(trayOffered(step(resetStage(back)).room, balance)).toBe(true);
  });

  it('is offered at once in a stage after the one where he met it', () => {
    const open = lockedPin();
    const remembered = rememberTray(open, ['pin', 'tray']);
    expect(remembered.stage.balance.trayMet).toBe(true);
    expect(trayOffered(remembered, balance)).toBe(true);
    // Not met yet, or already remembered: the same room, untouched.
    expect(rememberTray(open, ['pin'])).toBe(open);
    expect(rememberTray(remembered, ['pin', 'tray'])).toBe(remembered);
  });

  it('is offered once a Balance move was made this stage, even by the splitter', () => {
    const fresh = openStage('2x = 18');
    expect(trayOffered(fresh, balance)).toBe(false);
    const halved = step(splitBothPans(fresh, balance)).room;
    expect(halved.stage.balance.moves).toBe(1);
    expect(trayOffered(halved, balance)).toBe(true);
  });

  it('is offered but does nothing while the machine is jammed', () => {
    const jammed = step(enterLine(typed(waterWheel(), 'x = 8'), 0)).room;
    expect(jammed.stage.jam).toEqual({ kind: 'line' });
    expect(trayOffered(jammed, balance)).toBe(true);
    expect(trayWorks(jammed, balance)).toBe(false);
    expect(trayView(jammed, balance)?.works).toBe(false);
    expect(dropOnScale(jammed, balance, 'float')).toBeNull();
    expect(takeOffPan(jammed, balance, 'left', 'left-weight-0')).toBeNull();
    expect(stepTray(jammed, balance, 'float', 1)).toBeNull();
  });

  it('shows a weight and a float numbered 1 as the stage arrives, and nothing before it is offered', () => {
    expect(trayView(enterRoom(r04).room, balance)).toBeNull();
    expect(trayView(waterWheel(), [])).toBeNull();
    expect(trayView(null, balance)).toBeNull();
    expect(trayView(waterWheel(), balance)).toEqual({
      weight: 1,
      float: 1,
      works: true,
      wiggle: false,
    });
  });

  it('wiggles once on first use, alone: the splitter comes later', () => {
    const room = waterWheel();
    expect(offeredControls(room, balance)).toEqual(['tray']);
    expect(offeredControls(room, [])).toEqual([]);
    const met = meetControls(room, ['pin'], balance);
    expect(met?.met).toEqual(['pin', 'tray']);
    expect(trayView(met?.room ?? null, balance)?.wiggle).toBe(true);
    expect(meetControls(room, ['pin', 'tray'], balance)).toBeNull();
    // After 2x = 18 the splitter joins it, and wiggles on its own.
    const eighteen = drop(room, 'float', 5).room;
    expect(offeredControls(eighteen, balance)).toEqual(['tray', 'splitter']);
    expect(meetControls(eighteen, ['pin', 'tray'], balance)?.met).toEqual([
      'pin',
      'tray',
      'splitter',
    ]);
  });

  it('holds weights and floats only: its pieces are drawn as the scale draws them', () => {
    expect(trayPiece('weight', 5)).toEqual({
      key: 'tray-weight',
      kind: 'weight',
      value: q.rational(5),
      label: '5',
      divisorLabel: null,
    });
    // Story 1.14: a float shows its number with the school minus, on the tray as on a pan.
    expect(trayPiece('float', 99)).toMatchObject({ kind: 'float', label: '−99' });
  });
});

describe('the stepper', () => {
  it('numbers each piece 1–99, one step at a time', () => {
    let room = waterWheel();
    room = step(stepTray(room, balance, 'float', 1)).room;
    room = step(stepTray(room, balance, 'float', 1)).room;
    expect(room.stage.tray).toEqual({ weight: 1, float: 3 });
    expect(stepTray(room, balance, 'weight', -1)).toBeNull();
    room = set(room, 'weight', tuning.trayMaxNumber);
    expect(room.stage.tray.weight).toBe(99);
    expect(stepTray(room, balance, 'weight', 1)).toBeNull();
    expect(canStep(1, -1)).toBe(false);
    expect(canStep(1, 1)).toBe(true);
    expect(canStep(99, 1)).toBe(false);
    expect(canStep(99, -1)).toBe(true);
  });

  it("doesn't touch the pans, and is ignored without Balance or before the tray is offered", () => {
    const room = waterWheel();
    const stepped = step(stepTray(room, balance, 'weight', 1));
    expect(stepped.room.stage.pans).toBe(room.stage.pans);
    expect(stepped.events).toEqual([]);
    expect(stepTray(room, [], 'weight', 1)).toBeNull();
    expect(stepTray(lockedPin(), balance, 'weight', 1)).toBeNull();
  });

  it('keeps its numbers when the stage is reset', () => {
    const room = set(set(waterWheel(), 'float', 5), 'weight', 7);
    const reset = step(resetStage(drop(room, 'float', 5).room)).room;
    expect(reset.stage.tray).toEqual({ weight: 7, float: 5 });
  });
});

describe('a drop over the scale puts one copy on each side (Balance moves, story 1.15)', () => {
  it('room 4: a float of 5 writes 2x + 5 − 5 = 23 − 5, then 2x = 18, both from balance', () => {
    const { room, events } = drop(waterWheel(), 'float', 5);
    expect(written(room)).toEqual(['2x + 5 = 23', '2x + 5 − 5 = 23 − 5', '2x = 18']);
    expect(events).toEqual([
      { type: 'WayUsed', roomId: 'r04', stage: 0, way: 'balance' },
      { type: 'LineAccepted', roomId: 'r04', stage: 0, source: 'balance', progress: false },
      { type: 'LineAccepted', roomId: 'r04', stage: 0, source: 'balance', progress: true },
    ]);
    expect(room.stage.lines.slice(1).map((line) => line.source)).toEqual(['balance', 'balance']);
    expect(room.stage.lines[1]?.verdict).toMatchObject({
      kind: 'valid',
      move: { kind: 'add-both', term: { kind: 'num', value: 5, sign: -1 } },
      progress: false,
    });
    expect(room.stage.machineProgress).toEqual([0.2]);
    expect(sameEquation(room.stage.pans, equation('2x = 18'))).toBe(true);
    expect(room.stage.balance.moves).toBe(1);
  });

  it('combines each side into one piece: 2x + 5 with a weight of 3 is 2x + 8 = 26, one weight each', () => {
    const { room, events } = drop(waterWheel(), 'weight', 3);
    expect(written(room)).toEqual(['2x + 5 = 23', '2x + 5 + 3 = 23 + 3', '2x + 8 = 26']);
    expect(shown(room)).toBe('2x + 8 = 26');
    const pieces = panPieces(room.stage.pans);
    expect(pieces.left.map((p) => p.kind)).toEqual(['gear', 'gear', 'weight']);
    expect(pieces.right).toEqual([
      { key: 'right-weight-0', kind: 'weight', value: q.rational(26) },
    ]);
    // Judged against the line before the move, a move that simplifies nothing moves no machine.
    expect(events.filter((event) => event.type === 'LineAccepted')).toEqual([
      { type: 'LineAccepted', roomId: 'r04', stage: 0, source: 'balance', progress: false },
      { type: 'LineAccepted', roomId: 'r04', stage: 0, source: 'balance', progress: false },
    ]);
    expect(room.stage.machineProgress).toEqual([0]);
  });

  it('leaves a float on a side with x when its sum is below 0: a float of 7 gives 2x − 2 = 16', () => {
    const { room } = drop(waterWheel(), 'float', 7);
    expect(shown(room)).toBe('2x − 2 = 16');
    expect(panPieces(room.stage.pans).left.at(-1)).toMatchObject({
      kind: 'float',
      value: q.rational(2),
    });
  });

  it('refuses a move that would leave a side with no x pieces below 0, and lets it reach 0', () => {
    const room = waterWheel();
    expect(dropOnScale(set(room, 'float', 24), balance, 'float')).toBeNull();
    const emptied = drop(room, 'float', 23).room;
    expect(written(emptied).slice(1)).toEqual(['2x + 5 − 23 = 23 − 23', '2x − 18 = 0']);
    expect(panPieces(emptied.stage.pans).right).toEqual([]);
  });

  it('writes springs after the number they lift: 20 − x = 6 with a weight of 3 is 23 − x = 9', () => {
    const room = drop(openRoom('20 − x = 6'), 'weight', 3).room;
    expect(written(room).slice(1)).toEqual(['20 − x + 3 = 6 + 3', '23 − x = 9']);
    // A float of 20 would leave the right side below 0; one of 6 empties it.
    expect(dropOnScale(set(openRoom('20 − x = 6'), 'float', 20), balance, 'float')).toBeNull();
    expect(shown(drop(openRoom('20 − x = 6'), 'float', 6).room)).toBe('14 − x = 0');
  });

  it('appends to a written-out side as it shows: 2x = 23 − 5 with a weight of 5', () => {
    let room = step(enterLine(typed(waterWheel(), '2x = 23 − 5'), 0)).room;
    expect(panPieces(room.stage.pans).right.map((p) => p.kind)).toEqual(['weight', 'float']);
    room = drop(room, 'weight', 5).room;
    expect(written(room).slice(2)).toEqual(['2x + 5 = 23 − 5 + 5', '2x + 5 = 23']);
  });

  it('leaves x = n for him to write: the move is written, its result is not', () => {
    const { room, events } = drop(openRoom('x + 4 = 9'), 'float', 4);
    expect(events.map((event) => event.type)).toEqual(['WayUsed', 'LineAccepted']);
    expect(written(room)).toEqual(['x + 4 = 9', 'x + 4 − 4 = 9 − 4']);
    expect(shown(room)).toBe('x = 5');
    expect(enterLine(typed(room, 'x = 5'), 0)?.verdict).toEqual({ kind: 'answer' });
  });

  it('writes nothing with Balance blank (or no Balance mode), though the pans move and WayUsed fires', () => {
    for (const fading of ['blank', 'none'] as const) {
      const { room, events } = drop(openRoom('2x + 5 = 23', fading), 'float', 5);
      expect(events).toEqual([{ type: 'WayUsed', roomId: 'r01', stage: 0, way: 'balance' }]);
      expect(written(room)).toEqual(['2x + 5 = 23']);
      expect(shown(room)).toBe('2x = 18');
      expect(scaleView(room)).toMatchObject({ actingOut: true, level: true });
    }
    expect(balanceFading(r04.stages[0] as StageSpec)).toBe('auto');
    expect(balanceFading(r01.stages[0] as StageSpec)).toBe('blank');
  });

  it('then judges the next move against the lines it wrote', () => {
    const eighteen = drop(waterWheel(), 'float', 5).room;
    const again = drop(eighteen, 'weight', 2).room;
    expect(written(again).slice(3)).toEqual(['2x + 2 = 18 + 2', '2x + 2 = 20']);
  });

  it('writes the move from the pans and the result combined, refusing numbers too long for a line', () => {
    expect(onBothSides(equation('2x + 5 = 23'), q.rational(-5))).toEqual({
      line: equation('2x + 5 − 5 = 23 − 5'),
      pans: equation('2x = 18'),
    });
    expect(onBothSides(equation('x = 9 999 999'), q.rational(1))).toBeNull();
    expect(onBothSides(equation('x = 4'), q.rational(-5))).toBeNull();
  });
});

describe('dragging a piece off a side (story 1.15)', () => {
  it('takes the same number off both sides: the weight of 5 off 2x + 5 = 23 is a float of 5', () => {
    const took = step(takeOffPan(waterWheel(), balance, 'left', 'left-weight-0'));
    const dropped = drop(waterWheel(), 'float', 5);
    expect(written(took.room)).toEqual(written(dropped.room));
    expect(took.events).toEqual(dropped.events);
  });

  it('a float taken off adds its number to both sides', () => {
    const typedLine = step(enterLine(typed(waterWheel(), '2x = 23 − 5'), 0)).room;
    const tookFloat = step(takeOffPan(typedLine, balance, 'right', 'right-float-0')).room;
    expect(written(tookFloat).slice(2)).toEqual(['2x + 5 = 23 − 5 + 5', '2x + 5 = 23']);
  });

  it("can't take x-gears or springs, nor a piece the side doesn't have", () => {
    const room = waterWheel();
    expect(takeOffPan(room, balance, 'left', 'left-gear-0')).toBeNull();
    expect(takeOffPan(openRoom('20 − x = 6'), balance, 'left', 'left-spring-0')).toBeNull();
    expect(takeOffPan(room, balance, 'right', 'right-weight-1')).toBeNull();
    expect(takeOffPan(room, balance, 'right', 'left-weight-0')).toBeNull();
    expect(takeOffPan(room, [], 'left', 'left-weight-0')).toBeNull();
  });

  it('refuses to leave a side with no x pieces below 0: the weight of 23 stays on 23 − 5', () => {
    const typedLine = step(enterLine(typed(waterWheel(), '2x = 23 − 5'), 0)).room;
    expect(takeOffPan(typedLine, balance, 'right', 'right-weight-0')).toBeNull();
  });
});

describe('the scale acts out at the true x during Balance (story 1.15)', () => {
  it('from his first move the pans are weighed at the stage’s solution: level, no readouts', () => {
    const before = scaleView(waterWheel());
    expect(before).toMatchObject({ actingOut: false, x: 6, level: false });
    const room = drop(waterWheel(), 'float', 5).room;
    expect(room.stage.actingOut).toBe(true);
    expect(scaleView(room)).toMatchObject({
      actingOut: true,
      x: 9,
      tilt: 0,
      level: true,
      readouts: null,
    });
    // A move never touches the dial.
    expect(room.stage.dialX).toBe(6);
  });

  it('any dial move returns to exploring, at the dial’s x, with the pans as they are', () => {
    const room = drop(waterWheel(), 'float', 5).room;
    const turned = step(setDial(room, 4)).room;
    expect(turned.stage.actingOut).toBe(false);
    expect(shown(turned)).toBe('2x = 18');
    expect(scaleView(turned)).toMatchObject({ actingOut: false, x: 4, level: false });
    expect(scaleView(turned).readouts).toEqual({ left: '8', right: '18' });
  });

  it('goes back on reset, to line 0, exploring', () => {
    const reset = step(resetStage(drop(waterWheel(), 'float', 5).room)).room;
    expect(shown(reset)).toBe('2x + 5 = 23');
    expect(reset.stage.actingOut).toBe(false);
  });

  it('is replaced by the layout of a line he writes', () => {
    const moved = drop(waterWheel(), 'float', 5).room;
    const wrote = step(enterLine(typed(moved, 'x = 9'), 0)).room;
    expect(shown(wrote)).toBe('x = 9');
    expect(wrote.stage.actingOut).toBe(true);
  });

  it('a jam cleared goes back to the last committed line', () => {
    const moved = drop(waterWheel(), 'float', 5).room;
    const jammed = step(enterLine(typed(moved, 'x = 8'), 0)).room;
    expect(scaleView(jammed).level).toBe(false);
    const edited = step(deleteToken(jammed)).room;
    expect(shown(edited)).toBe('2x = 18');
  });

  it('remembers that a side came to hold only x pieces: the splitter’s moment', () => {
    expect(readyToSplit(equation('2x = 18'))).toBe(true);
    expect(readyToSplit(equation('18 = 27x'))).toBe(true);
    expect(readyToSplit(equation('2x + 5 = 23'))).toBe(false);
    expect(readyToSplit(equation('x = 9'))).toBe(false);
    expect(readyToSplit(equation('x : 3 = 5'))).toBe(false);
    expect(readyToSplit(equation('2x : 3 = 4'))).toBe(true);
    expect(drop(waterWheel(), 'float', 5).room.stage.balance.splitterSeen).toBe(true);
    expect(drop(waterWheel(), 'weight', 1).room.stage.balance.splitterSeen).toBe(false);
  });
});

describe('writing a pan from its pieces', () => {
  const r = (n: number, d = 1) => q.rational(n, d);
  const text = (a: q.Rational, b: q.Rational) => {
    const expr = sideExpr(a, b);
    return expr ? formatEquation({ left: expr, right: expr }).split(' = ')[0] : null;
  };

  it('writes x pieces first, then one number', () => {
    expect(text(r(2), r(8))).toBe('2x + 8');
    expect(text(r(2), r(-2))).toBe('2x − 2');
    expect(text(r(1), r(0))).toBe('x');
    expect(text(r(1, 3), r(4))).toBe('x : 3 + 4');
    expect(text(r(2, 3), r(0))).toBe('2x : 3');
    expect(text(r(0), r(18))).toBe('18');
    expect(text(r(0), r(0))).toBe('0');
    expect(text(r(1), r(5, 2))).toBe('x + 5 : 2');
  });

  it('writes springs after the number, and 0 before them when there is none', () => {
    expect(text(r(-1), r(23))).toBe('23 − x');
    expect(text(r(-5), r(0))).toBe('0 − 5x');
    expect(text(r(-1), r(-4))).toBe('0 − x − 4');
  });

  it('refuses a number too long for a line', () => {
    expect(sideExpr(r(1), r(10_000_000))).toBeNull();
    expect(sideExpr(r(10_000_000), r(0))).toBeNull();
  });

  it('round-trips through the parser, so a written line is the pans', () => {
    for (const [a, b] of [
      [r(2), r(18)],
      [r(-3), r(40)],
      [r(1, 3), r(-4)],
    ] as const) {
      const expr = sideExpr(a, b);
      if (!expr) throw new Error('too big');
      const eq = { left: expr, right: expr };
      expect(parse(formatEquation(eq))).toEqual({ ok: true, equation: eq });
    }
  });

  it('compares layouts by pieces, however they are written', () => {
    expect(sameLayout(equation('x + x + 5 = 23'), equation('2x + 5 = 23'))).toBe(true);
    expect(sameLayout(equation('2x + 5 = 23'), equation('23 = 2x + 5'))).toBe(false);
    expect(sameLayout(equation('2x = 23 − 5'), equation('2x = 18'))).toBe(true);
  });
});
