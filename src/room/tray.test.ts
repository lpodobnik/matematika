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
import {
  balanceFading,
  canStep,
  dropOnPan,
  sameLayout,
  sideExpr,
  stepTray,
  takeOffPan,
  trayOffered,
  trayPiece,
  trayView,
  trayWorks,
} from '@/room/tray';
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

/** Room 4 with its pin locked at 9, so the stage is open. */
function waterWheel(): RoomState {
  const poking = step(touchMachine(enterRoom(r04).room)).room;
  return step(confirmPin(step(setPin(poking, { kind: 'x', x: 9 })).room)).room;
}

/** A one-stage room with no pin, open after his first touch; 'none' lists no Balance mode. */
function openRoom(text: string, fading: FadingMode | 'none' = 'auto'): RoomState {
  const spec: RoomSpec = {
    ...r01,
    stages: [
      {
        type: 'solve',
        machines: [{ equation: text }],
        dial: { min: 0, max: 20, step: 1 },
        readouts: true,
        ways: ['balance'],
        fading: fading === 'none' ? { try: 'blank' } : { try: 'blank', balance: fading },
      },
    ],
  };
  return step(touchMachine(enterRoom(spec).room)).room;
}

/** Sets the tray's number for a kind, through the stepper. */
function set(room: RoomState, kind: TrayKind, value: number): RoomState {
  let current = room;
  while (current.stage.tray[kind] < value) current = step(stepTray(current, balance, kind, 1)).room;
  while (current.stage.tray[kind] > value)
    current = step(stepTray(current, balance, kind, -1)).room;
  return current;
}

function drop(room: RoomState, side: 'left' | 'right', kind: TrayKind, value: number): RoomStep {
  return step(dropOnPan(set(room, kind, value), balance, side, kind));
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

describe('when the tray is offered', () => {
  it('needs Balance and an open stage: not in arrive, poke or pin, nor once the stage locks', () => {
    const arriving = enterRoom(r04).room;
    const poking = step(touchMachine(arriving)).room;
    const pinning = step(setPin(poking, { kind: 'x', x: 9 })).room;
    for (const room of [arriving, poking, pinning]) expect(trayOffered(room, balance)).toBe(false);
    expect(trayOffered(waterWheel(), balance)).toBe(true);
    expect(trayOffered(waterWheel(), [])).toBe(false);
    let room = typed(waterWheel(), 'x = 9');
    room = step(enterLine(room, 0)).room;
    room = step(enterLine(typed(room, '2 · 9 + 5 = 23'), 0)).room;
    expect(room.stage.phase).toBe('locked');
    expect(trayOffered(room, balance)).toBe(false);
  });

  it('is offered but does nothing while the machine is jammed', () => {
    const jammed = step(enterLine(typed(waterWheel(), 'x = 8'), 0)).room;
    expect(jammed.stage.jam).toEqual({ kind: 'line' });
    expect(trayOffered(jammed, balance)).toBe(true);
    expect(trayWorks(jammed, balance)).toBe(false);
    expect(trayView(jammed, balance)?.works).toBe(false);
    expect(dropOnPan(jammed, balance, 'left', 'float')).toBeNull();
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

  it('wiggles once on first use: the first offer raises the hint level to 1, and never again', () => {
    const room = waterWheel();
    // The splitter (story 1.11) is offered with the tray.
    expect(offeredControls(room, balance)).toEqual(['tray', 'splitter']);
    expect(offeredControls(room, [])).toEqual([]);
    const met = meetControls(room, ['pin'], balance);
    expect(met?.met).toEqual(['pin', 'tray', 'splitter']);
    expect(trayView(met?.room ?? null, balance)?.wiggle).toBe(true);
    expect(meetControls(room, ['pin', 'tray', 'splitter'], balance)).toBeNull();
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

  it("doesn't touch the pans, and is ignored without Balance", () => {
    const room = waterWheel();
    const stepped = step(stepTray(room, balance, 'weight', 1));
    expect(stepped.room.stage.pans).toBe(room.stage.pans);
    expect(stepped.events).toEqual([]);
    expect(stepTray(room, [], 'weight', 1)).toBeNull();
  });

  it('keeps its numbers when the stage is reset', () => {
    const room = set(set(waterWheel(), 'float', 5), 'weight', 7);
    const reset = step(resetStage(drop(room, 'left', 'float', 5).room)).room;
    expect(reset.stage.tray).toEqual({ weight: 7, float: 5 });
  });
});

describe('a drop combines the number pieces on its pan (Balance moves)', () => {
  it('adds a weight: 2x + 5 with a weight of 3 is 2x + 8, one weight of 8', () => {
    const { room, events } = drop(waterWheel(), 'left', 'weight', 3);
    expect(shown(room)).toBe('2x + 8 = 23');
    expect(
      panPieces(room.stage.pans).left.map((p) => [
        p.kind,
        p.kind === 'weight' && q.toText(p.value),
      ]),
    ).toEqual([
      ['gear', false],
      ['gear', false],
      ['weight', '8'],
    ]);
    expect(events).toEqual([]);
  });

  it('cancels to nothing at 0: a float of 5 on 2x + 5 leaves 2x', () => {
    const { room } = drop(waterWheel(), 'left', 'float', 5);
    expect(shown(room)).toBe('2x = 23');
    expect(panPieces(room.stage.pans).left.map((p) => p.kind)).toEqual(['gear', 'gear']);
  });

  it('leaves a float when the sum is below 0 on a pan with x: 2x + 5 with a float of 7 is 2x − 2', () => {
    const { room } = drop(waterWheel(), 'left', 'float', 7);
    expect(shown(room)).toBe('2x − 2 = 23');
    expect(panPieces(room.stage.pans).left.at(-1)).toMatchObject({
      kind: 'float',
      value: q.rational(2),
    });
  });

  it('refuses a drop that would leave a pan with no x pieces below 0, and lets it reach 0', () => {
    const room = waterWheel();
    expect(dropOnPan(set(room, 'float', 24), balance, 'right', 'float')).toBeNull();
    const emptied = drop(room, 'right', 'float', 23).room;
    expect(shown(emptied)).toBe('2x + 5 = 0');
    expect(panPieces(emptied.stage.pans).right).toEqual([]);
  });

  it('writes springs after the number they lift: 20 − x with a weight of 3 is 23 − x', () => {
    const room = drop(openRoom('20 − x = 6'), 'left', 'weight', 3).room;
    expect(shown(room)).toBe('23 − x = 6');
    const lifted = drop(openRoom('20 − x = 6'), 'left', 'float', 20).room;
    expect(shown(lifted)).toBe('0 − x = 6');
  });

  it('combines a written-out side into one piece: 2x = 23 − 5 with a weight of 5 on the right is 2x = 23', () => {
    let room = step(enterLine(typed(waterWheel(), '2x = 23 − 5'), 0)).room;
    expect(panPieces(room.stage.pans).right.map((p) => p.kind)).toEqual(['weight', 'float']);
    room = drop(room, 'right', 'weight', 5).room;
    expect(shown(room)).toBe('2x = 23');
  });
});

describe('dragging a piece off a pan into the tray', () => {
  it('takes a weight or a float off, and the rest combine', () => {
    const typedLine = step(enterLine(typed(waterWheel(), '2x = 23 − 5'), 0)).room;
    const tookFloat = step(takeOffPan(typedLine, balance, 'right', 'right-float-0')).room;
    expect(shown(tookFloat)).toBe('2x = 23');
    const tookWeight = step(takeOffPan(waterWheel(), balance, 'left', 'left-weight-0')).room;
    expect(shown(tookWeight)).toBe('2x = 23');
  });

  it("can't take x-gears or springs, nor a piece the pan doesn't have", () => {
    const room = waterWheel();
    expect(takeOffPan(room, balance, 'left', 'left-gear-0')).toBeNull();
    expect(takeOffPan(openRoom('20 − x = 6'), balance, 'left', 'left-spring-0')).toBeNull();
    expect(takeOffPan(room, balance, 'right', 'right-weight-1')).toBeNull();
    expect(takeOffPan(room, balance, 'right', 'left-weight-0')).toBeNull();
    expect(takeOffPan(room, [], 'left', 'left-weight-0')).toBeNull();
  });

  it('refuses to leave a pan with no x pieces below 0: the weight of 23 stays on 23 − 5', () => {
    const typedLine = step(enterLine(typed(waterWheel(), '2x = 23 − 5'), 0)).room;
    expect(takeOffPan(typedLine, balance, 'right', 'right-weight-0')).toBeNull();
  });
});

describe('a change to one pan, then the same change to the other (room 4)', () => {
  it('tips at the dial’s x and writes nothing after a float of 5 on the left', () => {
    const before = waterWheel();
    const { room, events } = drop(before, 'left', 'float', 5);
    expect(shown(room)).toBe('2x = 23');
    expect(events).toEqual([]);
    expect(room.stage.lines).toHaveLength(1);
    const view = scaleView(room);
    expect(view.actingOut).toBe(false);
    expect(view.x).toBe(0);
    expect(view.tilt).toBe(-15); // 0 against 23, clamped
    expect(view.readouts).toEqual({ left: '0', right: '23' });
  });

  it('writes 2x = 18 after a float of 5 on the right: WayUsed with balance, then the line', () => {
    const left = drop(waterWheel(), 'left', 'float', 5).room;
    const { room, events } = drop(left, 'right', 'float', 5);
    expect(events).toEqual([
      { type: 'WayUsed', roomId: 'r04', stage: 0, way: 'balance' },
      { type: 'LineAccepted', roomId: 'r04', stage: 0, source: 'balance', progress: true },
    ]);
    expect(written(room)).toEqual(['2x + 5 = 23', '2x = 18']);
    expect(room.stage.lines[1]).toMatchObject({
      source: 'balance',
      verdict: {
        kind: 'valid',
        move: { kind: 'add-both', term: { kind: 'num', value: 5, sign: -1 } },
        progress: true,
      },
    });
    expect(room.stage.machineProgress).toEqual([0.2]);
    expect(sameEquation(room.stage.pans, equation('2x = 18'))).toBe(true);
    // The pans stay exploring, at the dial's x: 0 against 18 tips as 5 against 23 did.
    expect(scaleView(room)).toMatchObject({ actingOut: false, x: 0, tilt: -13.5 });
  });

  it('completes in either order and with pieces split over several drops', () => {
    let room = drop(waterWheel(), 'right', 'float', 2).room;
    room = drop(room, 'right', 'float', 3).room;
    expect(written(room)).toEqual(['2x + 5 = 23']);
    const done = drop(room, 'left', 'float', 5);
    expect(done.events.map((event) => event.type)).toEqual(['WayUsed', 'LineAccepted']);
    expect(written(done.room)).toEqual(['2x + 5 = 23', '2x = 18']);
  });

  it('writes a balanced line without progress, as 2x + 8 = 26, without moving the machine', () => {
    const left = drop(waterWheel(), 'left', 'weight', 3).room;
    const { room, events } = drop(left, 'right', 'weight', 3);
    expect(written(room)).toEqual(['2x + 5 = 23', '2x + 8 = 26']);
    expect(events.at(-1)).toMatchObject({ type: 'LineAccepted', progress: false });
    expect(room.stage.machineProgress).toEqual([0]);
  });

  it('then judges the next move against the line it wrote', () => {
    const left = drop(waterWheel(), 'left', 'float', 5).room;
    const eighteen = drop(left, 'right', 'float', 5).room;
    const again = drop(drop(eighteen, 'left', 'weight', 2).room, 'right', 'weight', 2).room;
    expect(written(again)).toEqual(['2x + 5 = 23', '2x = 18', '2x + 2 = 20']);
  });

  it('lets him write x = n himself: the move completes, but the answer line is not written', () => {
    const left = drop(openRoom('x + 4 = 9'), 'left', 'float', 4).room;
    const { room, events } = drop(left, 'right', 'float', 4);
    expect(events).toEqual([{ type: 'WayUsed', roomId: 'r01', stage: 0, way: 'balance' }]);
    expect(written(room)).toEqual(['x + 4 = 9']);
    expect(shown(room)).toBe('x = 5');
    expect(enterLine(typed(room, 'x = 5'), 0)?.verdict).toEqual({ kind: 'answer' });
  });

  it('writes nothing with Balance blank (or no Balance mode), though the move completes', () => {
    for (const fading of ['blank', 'none'] as const) {
      const left = drop(openRoom('2x + 5 = 23', fading), 'left', 'float', 5).room;
      const { room, events } = drop(left, 'right', 'float', 5);
      expect(events).toEqual([{ type: 'WayUsed', roomId: 'r01', stage: 0, way: 'balance' }]);
      expect(written(room)).toEqual(['2x + 5 = 23']);
      expect(shown(room)).toBe('2x = 18');
    }
    expect(balanceFading(r04.stages[0] as StageSpec)).toBe('auto');
    expect(balanceFading(r01.stages[0] as StageSpec)).toBe('blank');
  });
});

describe('exploratory moves are free and reversible', () => {
  it('goes back when he drags a piece back: the pan shows the written side again, and nothing fires', () => {
    const restored = drop(
      drop(openRoom('x + x + 5 = 23'), 'left', 'weight', 3).room,
      'left',
      'float',
      3,
    );
    expect(shown(restored.room)).toBe('x + x + 5 = 23');
    const room = waterWheel();
    const heavier = drop(room, 'left', 'weight', 3).room;
    const { room: back, events } = drop(heavier, 'left', 'float', 3);
    expect(back.stage.pans.left).toEqual(room.stage.pans.left);
    expect(events).toEqual([]);
    expect(written(back)).toEqual(['2x + 5 = 23']);
  });

  it('goes back on reset, to line 0', () => {
    const moved = drop(waterWheel(), 'left', 'float', 5).room;
    const reset = step(resetStage(moved)).room;
    expect(shown(reset)).toBe('2x + 5 = 23');
  });

  it('is replaced by the layout of a line he writes', () => {
    const moved = drop(waterWheel(), 'left', 'float', 5).room;
    const wrote = step(enterLine(typed(moved, '2x = 18'), 0)).room;
    expect(shown(wrote)).toBe('2x = 18');
    expect(wrote.stage.actingOut).toBe(true);
  });

  it('is dropped when a jam is cleared, back to the last committed line', () => {
    const moved = drop(waterWheel(), 'left', 'float', 5).room;
    const jammed = step(enterLine(typed(moved, 'x = 8'), 0)).room;
    const edited = step(deleteToken(jammed)).room;
    expect(shown(edited)).toBe('2x + 5 = 23');
  });

  it('ends acting out: the pans go back to the dial’s x, with numbers on the gears', () => {
    const wrote = step(enterLine(typed(waterWheel(), '2x = 23 − 5'), 0)).room;
    expect(scaleView(wrote).actingOut).toBe(true);
    const moved = drop(wrote, 'left', 'weight', 1).room;
    expect(moved.stage.actingOut).toBe(false);
    expect(scaleView(moved)).toMatchObject({ actingOut: false, x: 0 });
  });

  it('is weighed by the dial like any layout', () => {
    const moved = drop(waterWheel(), 'right', 'float', 18).room;
    const turned = step(setDial(moved, 0 + 1));
    expect(shown(turned.room)).toBe('2x + 5 = 5');
    const level = step(setDial(turned.room, 0));
    expect(level.events).toContainEqual({ type: 'PansLevel', roomId: 'r04', stage: 0, x: 0 });
    // The pin resolved when he confirmed it (story 1.14): levelling the pans never does.
    expect(level.events.map((event) => event.type)).not.toContain('PredictionMade');
    expect(level.room.stage.pin).toEqual(waterWheel().stage.pin);
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
