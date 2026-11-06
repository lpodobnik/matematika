import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { panPieces } from '@/room/pieces';
import { scaleView } from '@/room/scale';
import { trayPiece } from '@/room/tray';
import type { RoomState } from '@/room/types';
import type { Action } from '@/store/actions';
import type { DomainEvent } from '@/store/events';
import { initialGameState } from '@/store/reducer';
import { createGameStore } from '@/store/store';
import { watchDragCancel } from '@/ui/scene/scale/dial-drag';
import { labelFontSize } from '@/ui/scene/scale/layout';
import {
  type Carry,
  cancelWatch,
  createPieceDrag,
  type DragSource,
  releaseAction,
  storeTakes,
} from '@/ui/scene/scale/piece-drag';
import { dropTarget, trayLayout } from '@/ui/scene/scale/tray-layout';

const fromTray: DragSource = { from: 'tray', kind: 'float' };
const piece = trayPiece('float', 5);
const home = { x: 1200, y: 200 };

describe('createPieceDrag', () => {
  it('carries the piece from where it stood, keeping where he grabbed it', () => {
    const drag = createPieceDrag();
    const moves: { x: number; y: number }[] = [];
    drag.setMoveListener((at) => moves.push(at));
    expect(drag.start(1, fromTray, piece, home, { x: 1210, y: 180 })).toBe(true);
    expect(drag.carry()).toEqual({ source: fromTray, piece, home, phase: 'held' });
    expect(drag.position()).toEqual(home);
    drag.move(1, { x: 310, y: 480 });
    expect(drag.position()).toEqual({ x: 300, y: 500 });
    expect(moves).toEqual([home, { x: 300, y: 500 }]);
  });

  it('asks the release handler where he let go: landing when the store takes it, else returning', () => {
    const drag = createPieceDrag();
    const release = vi.fn((_carry: Carry, at: { x: number; y: number }) => at.x < 800);
    drag.setReleaseHandler(release);
    drag.start(1, fromTray, piece, home, home);
    drag.move(1, { x: 300, y: 500 });
    drag.end(1);
    expect(release).toHaveBeenCalledWith(expect.objectContaining({ phase: 'held' }), {
      x: 300,
      y: 500,
    });
    expect(drag.carry()?.phase).toBe('landing');
    drag.settle();
    expect(drag.carry()).toBeNull();
    expect(drag.position()).toBeNull();
    drag.start(2, fromTray, piece, home, home);
    drag.move(2, { x: 1300, y: 500 });
    drag.end(2);
    expect(drag.carry()?.phase).toBe('returning');
  });

  it('slides back with no release handler, and on cancel, without asking', () => {
    const drag = createPieceDrag();
    drag.start(1, fromTray, piece, home, home);
    drag.end(1);
    expect(drag.carry()?.phase).toBe('returning');
    const release = vi.fn(() => true);
    drag.setReleaseHandler(release);
    drag.start(1, fromTray, piece, home, home);
    drag.cancel();
    expect(drag.carry()?.phase).toBe('returning');
    expect(release).not.toHaveBeenCalled();
  });

  it('slides back a cancelled pointer’s piece without asking, wherever the finger was', () => {
    const drag = createPieceDrag();
    const release = vi.fn(() => true);
    drag.setReleaseHandler(release);
    drag.start(3, fromTray, piece, home, home);
    drag.move(3, { x: 1300, y: 450 });
    drag.abort(4);
    expect(drag.carry()?.phase).toBe('held');
    drag.abort(3);
    expect(drag.carry()?.phase).toBe('returning');
    expect(release).not.toHaveBeenCalled();
    drag.end(3);
    expect(release).not.toHaveBeenCalled();
    expect(drag.carry()?.phase).toBe('returning');
  });

  it('follows only the pointer that grabbed it, and one piece at a time', () => {
    const drag = createPieceDrag();
    drag.start(1, fromTray, piece, home, home);
    expect(drag.start(2, fromTray, piece, home, home)).toBe(false);
    drag.move(2, { x: 0, y: 0 });
    expect(drag.position()).toEqual(home);
    drag.end(2);
    expect(drag.carry()?.phase).toBe('held');
    drag.settle();
    expect(drag.carry()?.phase).toBe('held');
  });

  it('starts a new drag at once while the last one is still landing or sliding back', () => {
    const drag = createPieceDrag();
    drag.start(1, fromTray, piece, home, home);
    drag.end(1);
    const pan: DragSource = { from: 'pan', side: 'left', key: 'left-weight-0' };
    expect(drag.start(1, pan, piece, { x: 300, y: 560 }, { x: 300, y: 540 })).toBe(true);
    expect(drag.carry()).toMatchObject({ source: pan, phase: 'held' });
  });

  it('tells subscribers when a drag starts, is let go and settles, never on a move', () => {
    const drag = createPieceDrag();
    const listener = vi.fn();
    const unsubscribe = drag.subscribe(listener);
    drag.start(1, fromTray, piece, home, home);
    drag.move(1, { x: 1, y: 1 });
    drag.move(1, { x: 2, y: 2 });
    drag.end(1);
    drag.settle();
    expect(listener).toHaveBeenCalledTimes(3);
    unsubscribe();
    drag.start(1, fromTray, piece, home, home);
    expect(listener).toHaveBeenCalledTimes(3);
  });
});

describe('releaseAction (story 1.15: both sides at once)', () => {
  it('drops a tray piece over the scale, and takes a pan’s piece off anywhere off the scale', () => {
    expect(releaseAction(fromTray, 'scale')).toEqual({ type: 'tray/drop', kind: 'float' });
    expect(releaseAction({ from: 'tray', kind: 'weight' }, 'scale')).toEqual({
      type: 'tray/drop',
      kind: 'weight',
    });
    const pan: DragSource = { from: 'pan', side: 'right', key: 'right-weight-0' };
    const take = { type: 'tray/take', side: 'right', key: 'right-weight-0' };
    expect(releaseAction(pan, 'tray')).toEqual(take);
    expect(releaseAction(pan, null)).toEqual(take);
  });

  it('asks for nothing otherwise, so the piece slides back', () => {
    expect(releaseAction(fromTray, 'tray')).toBeNull();
    expect(releaseAction(fromTray, null)).toBeNull();
    const pan: DragSource = { from: 'pan', side: 'left', key: 'left-weight-0' };
    expect(releaseAction(pan, 'scale')).toBeNull();
  });
});

/** Room 4, open, with Balance: the drag wired to the store as Tray.tsx wires it. */
function wiredTray() {
  const events: DomainEvent[] = [];
  const store = createGameStore({
    effects: [(event) => events.push(event)],
    initialState: {
      ...initialGameState(),
      save: { ...initialGameState().save, progress: { tools: ['balance'], firstUse: [] } },
    },
  });
  const act = (action: Action) => store.getState().dispatch(action);
  act({ type: 'room/enter', roomId: 'r04' });
  act({ type: 'machine/touch' });
  act({ type: 'pin/set', value: { kind: 'x', x: 9 } });
  act({ type: 'pin/confirm' });
  // Story 1.15: the dial at 6 can't level the pans, so the tray is offered.
  act({ type: 'dial/set', x: 6 });
  for (let i = 0; i < 4; i += 1) act({ type: 'tray/step', kind: 'float', by: 1 });
  const layout = trayLayout(0.54, labelFontSize(0.54));
  const drag = createPieceDrag();
  const release = vi.fn((held: Carry, at: { x: number; y: number }) => {
    const { room, save } = store.getState();
    const action = releaseAction(held.source, dropTarget(at, layout));
    if (!action || !storeTakes(room, save.progress.tools, action)) return false;
    act(action);
    return true;
  });
  drag.setReleaseHandler(release);
  const room = () => store.getState().room as RoomState;
  return { store, events, drag, layout, room, release };
}

describe('the piece drag, wired to the store', () => {
  it('drops a float of 5 anywhere over the scale, the beam included: both sides lose 5', () => {
    for (const at of [
      { x: 300, y: 450 },
      { x: 800, y: 560 },
      { x: 1300, y: 450 },
    ]) {
      const { drag, layout, room, events } = wiredTray();
      const slot = layout.slots[1];
      if (!slot) throw new Error('no float slot');
      const float5 = trayPiece('float', room().stage.tray.float);
      drag.start(1, { from: 'tray', kind: 'float' }, float5, slot.piece, slot.piece);
      drag.move(1, at);
      drag.end(1);
      expect(drag.carry()?.phase).toBe('landing');
      expect(room().stage.lines.map((line) => line.tokens.join(''))).toEqual([
        '2x+5=23',
        '2x+5−5=23−5',
        '2x=18',
      ]);
      expect(events.map((event) => event.type)).toContain('WayUsed');
    }
  });

  it('takes the weight off the left pan into the tray: 5 comes off both sides', () => {
    const { drag, layout, room } = wiredTray();
    const [weight] = scaleView(room()).left.pieces.filter((p) => p.kind === 'weight');
    if (!weight) throw new Error('no weight');
    drag.start(
      1,
      { from: 'pan', side: 'left', key: weight.key },
      weight,
      { x: 300, y: 560 },
      { x: 300, y: 540 },
    );
    drag.move(1, { x: layout.box.x + 40, y: layout.box.y + 40 });
    drag.end(1);
    expect(drag.carry()?.phase).toBe('landing');
    expect(panPieces(room().stage.pans).left.map((p) => p.kind)).toEqual(['gear', 'gear']);
    expect(panPieces(room().stage.pans).right.map((p) => p.kind)).toEqual(['weight']);
  });

  it('slides back a drop the store refuses: the right pan has no x and can’t go below 0', () => {
    const { drag, room, store } = wiredTray();
    for (let i = 0; i < 30; i += 1) {
      store.getState().dispatch({ type: 'tray/step', kind: 'float', by: 1 });
    }
    const before = room();
    const float = trayPiece('float', before.stage.tray.float);
    drag.start(1, { from: 'tray', kind: 'float' }, float, { x: 1200, y: 200 }, { x: 1200, y: 200 });
    drag.move(1, { x: 1300, y: 450 });
    drag.end(1);
    expect(drag.carry()?.phase).toBe('returning');
    expect(room()).toBe(before);
  });

  it('slides back a pan’s piece let go over the scale, either pan, and asks the store nothing', () => {
    const { drag, room } = wiredTray();
    const before = room();
    drag.start(
      1,
      { from: 'pan', side: 'left', key: 'left-weight-0' },
      trayPiece('weight', 5),
      { x: 300, y: 560 },
      { x: 300, y: 540 },
    );
    drag.move(1, { x: 1300, y: 450 });
    drag.end(1);
    expect(drag.carry()?.phase).toBe('returning');
    expect(room()).toBe(before);
  });

  it('slides back a piece held over a pan when the DOM cancels its pointer: nothing is written', () => {
    const { drag, layout, room, events, release } = wiredTray();
    const win = new EventTarget();
    const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' });
    const stop = watchDragCancel(win, doc, cancelWatch(drag));
    const slot = layout.slots[1];
    if (!slot) throw new Error('no float slot');
    const before = room();
    const float5 = trayPiece('float', before.stage.tray.float);
    // Over the right pan, a let-go here would write 2x = 18 (the test above).
    drag.start(7, { from: 'tray', kind: 'float' }, float5, slot.piece, slot.piece);
    drag.move(7, { x: 1300, y: 450 });
    expect(dropTarget({ x: 1300, y: 450 }, layout)).toBe('scale');
    win.dispatchEvent(Object.assign(new Event('pointercancel'), { pointerId: 8 }));
    expect(drag.carry()?.phase).toBe('held');
    win.dispatchEvent(Object.assign(new Event('pointercancel'), { pointerId: 7 }));
    expect(release).not.toHaveBeenCalled();
    expect(drag.carry()?.phase).toBe('returning');
    expect(room()).toBe(before);
    expect(room().stage.lines).toHaveLength(1);
    expect(events.map((event) => event.type)).not.toContain('WayUsed');
    stop();
  });

  it('slides back a held piece when the window loses focus or the page is hidden', () => {
    const { drag, room } = wiredTray();
    const win = new EventTarget();
    const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' });
    const stop = watchDragCancel(win, doc, cancelWatch(drag));
    const before = room();
    const float5 = trayPiece('float', before.stage.tray.float);
    drag.start(1, { from: 'tray', kind: 'float' }, float5, home, home);
    drag.move(1, { x: 300, y: 450 });
    win.dispatchEvent(new Event('blur'));
    expect(drag.carry()?.phase).toBe('returning');
    drag.settle();
    drag.start(1, { from: 'tray', kind: 'float' }, float5, home, home);
    drag.move(1, { x: 300, y: 450 });
    doc.visibilityState = 'hidden';
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(drag.carry()?.phase).toBe('returning');
    expect(room()).toBe(before);
    stop();
  });

  it('asks the store only about tray actions, and nothing without a room', () => {
    const { room } = wiredTray();
    const drop = { type: 'tray/drop', kind: 'weight' } as const;
    expect(storeTakes(null, ['balance'], drop)).toBe(false);
    expect(storeTakes(room(), ['balance'], { type: 'machine/touch' })).toBe(false);
    expect(storeTakes(room(), ['balance'], null)).toBe(false);
    expect(storeTakes(room(), [], drop)).toBe(false);
    expect(storeTakes(room(), ['balance'], drop)).toBe(true);
  });
});

describe('Tray.tsx and the pans', () => {
  const tray = readFileSync(new URL('./Tray.tsx', import.meta.url), 'utf8');
  const piece = readFileSync(new URL('./Piece.tsx', import.meta.url), 'utf8');
  // The tray's − and + (and the splitter's) are StepButtons.
  const stepper = readFileSync(new URL('./StepButton.tsx', import.meta.url), 'utf8');

  it('follows a carry on the stage: every move, up and up outside, and cancel, blur or a hidden page', () => {
    for (const event of ["'globalpointermove'", "'pointerup'", "'pointerupoutside'"]) {
      expect(tray).toContain(`stage.on(${event}`);
    }
    // A cancelled pointer is not a drop: the carry is aborted, never ended (cancelWatch).
    expect(tray).toContain('watchDragCancel(window, document, cancelWatch(drag))');
    expect(tray).not.toContain('watchDragCancel(window, document, drag)');
  });

  it('ends a held stepper on up, up outside and cancel, and on blur or a hidden page', () => {
    for (const prop of [
      'onPointerUp={release}',
      'onPointerUpOutside={release}',
      'onPointerCancel={release}',
    ]) {
      expect(stepper).toContain(prop);
    }
    expect(stepper).toContain('watchDragCancel(window, document, {');
    expect(tray).toContain('<StepButton');
  });

  it('has no hover states: no over, enter, leave or out handlers, and no cursor', () => {
    for (const source of [tray, piece, stepper]) {
      expect(source).not.toMatch(/on(Pointer|Mouse)(Over|Enter|Leave|Out)\b|cursor/);
    }
  });

  it('never moves the shelf once it is destroyed (it unmounts when the stage locks, mid-wiggle or after)', () => {
    expect(tray).toContain('if (!node.destroyed) node.x = x;');
    expect(tray).not.toMatch(/node\.x = (pinWiggle|0)/);
  });
});
