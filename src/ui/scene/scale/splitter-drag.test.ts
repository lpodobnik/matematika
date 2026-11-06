import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { formatEquation } from '@/math/format';
import type { RoomState, Side } from '@/room/types';
import type { Action } from '@/store/actions';
import type { DomainEvent } from '@/store/events';
import { initialGameState } from '@/store/reducer';
import { createGameStore } from '@/store/store';
import { watchDragCancel } from '@/ui/scene/scale/dial-drag';
import { labelFontSize } from '@/ui/scene/scale/layout';
import {
  createSplitterDrag,
  type SplitterCarry,
  splitterAction,
  splitterCancelWatch,
  splitterTakes,
} from '@/ui/scene/scale/splitter-drag';
import { panUnder, splitterGeometry, splitterLayout } from '@/ui/scene/scale/splitter-layout';

const layout = splitterLayout(0.54, labelFontSize(0.54));
const home = layout.blade;
const grabAt = { x: home.x + 40, y: home.y + 20 };
/** Over each pan, and a point between them, under the machine. */
const overLeft = { x: 300, y: 500 };
const overRight = { x: 1300, y: 500 };
const between = { x: 800, y: 700 };

describe('createSplitterDrag', () => {
  it('carries the blade from where it stood, keeping where he grabbed it', () => {
    const drag = createSplitterDrag(panUnder);
    const moves: { x: number; y: number }[] = [];
    drag.setMoveListener((at) => moves.push(at));
    expect(drag.start(1, 'holder', home, 2, grabAt)).toBe(true);
    expect(drag.carry()).toEqual({
      from: 'holder',
      home,
      grabbedAt: grabAt,
      parts: 2,
      phase: 'held',
    });
    drag.move(1, { x: grabAt.x + 100, y: grabAt.y + 50 });
    expect(moves.at(-1)).toEqual({ x: home.x + 100, y: home.y + 50 });
    expect(drag.position()).toEqual({ x: home.x + 100, y: home.y + 50 });
    // Another finger is ignored, and can't start a second carry.
    drag.move(2, { x: 0, y: 0 });
    expect(drag.position()).toEqual({ x: home.x + 100, y: home.y + 50 });
    expect(drag.start(2, 'holder', home, 2, grabAt)).toBe(false);
  });

  it('notes the pans the finger passes over, and hands them to the release', () => {
    const drag = createSplitterDrag(panUnder);
    const release = vi.fn(() => true);
    drag.setReleaseHandler(release);
    drag.start(1, 'holder', home, 3, grabAt);
    expect(drag.crossed()).toEqual([]);
    drag.move(1, overRight);
    expect(drag.crossed()).toEqual(['right']);
    drag.move(1, between);
    drag.move(1, overLeft);
    expect(drag.crossed()).toEqual(['left', 'right']);
    drag.end(2);
    expect(release).not.toHaveBeenCalled();
    drag.end(1);
    expect(release).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'holder', phase: 'held' }),
      overLeft,
      ['left', 'right'],
    );
    expect(drag.carry()?.phase).toBe('landing');
    // A new drag starts with no pans crossed.
    drag.settle();
    drag.start(1, 'holder', home, 3, grabAt);
    expect(drag.crossed()).toEqual([]);
  });

  it('slides back when the release handler refuses, and settles after', () => {
    const drag = createSplitterDrag(panUnder);
    const seen: (SplitterCarry | null)[] = [];
    drag.subscribe(() => seen.push(drag.carry()));
    drag.setReleaseHandler(() => false);
    drag.start(1, 'holder', home, 2, grabAt);
    drag.move(1, overLeft);
    drag.move(1, overLeft);
    drag.end(1);
    expect(drag.carry()?.phase).toBe('returning');
    drag.settle();
    expect(drag.carry()).toBeNull();
    expect(drag.position()).toBeNull();
    // Start, release and settle only: never a notify per move.
    expect(seen.map((carry) => carry?.phase ?? null)).toEqual(['held', 'returning', null]);
  });

  it('slides back without asking on abort (its own pointer only) and cancel', () => {
    const drag = createSplitterDrag(panUnder);
    const release = vi.fn(() => true);
    drag.setReleaseHandler(release);
    drag.start(4, 'holder', home, 2, grabAt);
    drag.abort(5);
    expect(drag.carry()?.phase).toBe('held');
    drag.abort(4);
    expect(drag.carry()?.phase).toBe('returning');
    drag.settle();
    drag.start(4, 'pans', layout.onPans, 4, overLeft);
    drag.cancel();
    expect(drag.carry()?.phase).toBe('returning');
    expect(release).not.toHaveBeenCalled();
    // settle does nothing while a blade is held.
    drag.start(6, 'holder', home, 2, grabAt);
    drag.settle();
    expect(drag.carry()?.phase).toBe('held');
  });
});

describe('splitterAction', () => {
  const fromHolder = { from: 'holder' as const, grabbedAt: grabAt };
  const crossedBoth: Side[] = ['left', 'right'];

  it('splits once the finger has passed over both pans, let go anywhere but the holder', () => {
    expect(splitterAction(fromHolder, overRight, crossedBoth, layout)).toEqual({
      type: 'splitter/split',
    });
    expect(splitterAction(fromHolder, between, crossedBoth, layout)).toEqual({
      type: 'splitter/split',
    });
    expect(splitterAction(fromHolder, grabAt, crossedBoth, layout)).toBeNull();
    expect(splitterAction(fromHolder, overRight, ['right'], layout)).toBeNull();
    expect(splitterAction(fromHolder, overLeft, ['left'], layout)).toBeNull();
    expect(splitterAction(fromHolder, between, [], layout)).toBeNull();
  });

  it('takes it off the pans when let go over the holder, or far enough from where he grabbed it', () => {
    const grabbed = { x: 800, y: splitterGeometry.onPansY };
    const fromPans = { from: 'pans' as const, grabbedAt: grabbed };
    const lift = { type: 'splitter/lift' };
    expect(splitterAction(fromPans, { x: 800, y: 200 }, [], layout)).toEqual(lift);
    expect(splitterAction(fromPans, grabAt, [], layout)).toEqual(lift);
    const near = { x: grabbed.x + splitterGeometry.liftDistance - 1, y: grabbed.y };
    expect(splitterAction(fromPans, near, [], layout)).toBeNull();
    expect(splitterAction(fromPans, grabbed, crossedBoth, layout)).toBeNull();
  });
});

describe('panUnder', () => {
  it('finds each pan, with its pieces at any tilt, and nothing between them or above them', () => {
    expect(panUnder(overLeft)).toBe('left');
    expect(panUnder(overRight)).toBe('right');
    expect(panUnder({ x: 300, y: 300 })).toBe('left');
    expect(panUnder({ x: 1300, y: 760 })).toBe('right');
    expect(panUnder(between)).toBeNull();
    expect(panUnder({ x: 300, y: 100 })).toBeNull();
    expect(panUnder({ x: 300, y: 900 })).toBeNull();
    // The holder's blade is above the left pan's area.
    expect(panUnder(grabAt)).toBeNull();
  });
});

/** Room 4, open, with Balance: the drag wired to the store as Splitter.tsx wires it. */
function wiredSplitter() {
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
  for (let i = 0; i < 4; i += 1) act({ type: 'tray/step', kind: 'float', by: 1 });
  act({ type: 'tray/drop', side: 'left', kind: 'float' });
  act({ type: 'tray/drop', side: 'right', kind: 'float' });
  const drag = createSplitterDrag(panUnder);
  const release = vi.fn(
    (held: SplitterCarry, at: { x: number; y: number }, crossed: readonly Side[]) => {
      const { room, save } = store.getState();
      const action = splitterAction(held, at, crossed, layout);
      if (!action || !splitterTakes(room, save.progress.tools, action)) return false;
      act(action);
      return true;
    },
  );
  drag.setReleaseHandler(release);
  const room = () => store.getState().room as RoomState;
  return { store, events, act, drag, room, release };
}

describe('the splitter drag, wired to the store', () => {
  it('room 4: dragged across both pans at 2 parts, 2x = 18 shows x = 9 and nothing is written', () => {
    const { drag, room, events } = wiredSplitter();
    expect(formatEquation(room().stage.pans)).toBe('2x = 18');
    events.length = 0;
    drag.start(1, 'holder', home, 2, grabAt);
    drag.move(1, overLeft);
    drag.move(1, between);
    drag.move(1, overRight);
    drag.end(1);
    expect(drag.carry()?.phase).toBe('landing');
    expect(formatEquation(room().stage.pans)).toBe('x = 9');
    expect(room().stage.lines).toHaveLength(2);
    expect(events).toEqual([{ type: 'WayUsed', roomId: 'r04', stage: 0, way: 'balance' }]);
  });

  it('slides back from one pan only, and the store is untouched', () => {
    const { drag, room } = wiredSplitter();
    const before = room();
    drag.start(1, 'holder', home, 2, grabAt);
    drag.move(1, overLeft);
    drag.end(1);
    expect(drag.carry()?.phase).toBe('returning');
    expect(room()).toBe(before);
  });

  it('jams on an uneven split, stays on the pans, and comes off when dragged off', () => {
    const { drag, room, events, act } = wiredSplitter();
    act({ type: 'splitter/step', by: 1 });
    act({ type: 'splitter/step', by: 1 });
    events.length = 0;
    drag.start(1, 'holder', home, 4, grabAt);
    drag.move(1, overRight);
    drag.move(1, overLeft);
    drag.end(1);
    expect(drag.carry()?.phase).toBe('landing');
    expect(room().stage.jam).toEqual({ kind: 'split', parts: 4 });
    expect(events).toEqual([{ type: 'MachineJammed', roomId: 'r04', kind: 'split' }]);
    drag.settle();
    // A drag from the holder does nothing now: the splitter is on the pans.
    drag.start(1, 'holder', home, 4, grabAt);
    drag.move(1, overRight);
    drag.move(1, overLeft);
    drag.end(1);
    expect(drag.carry()?.phase).toBe('returning');
    drag.settle();
    // Nudged, it slides back onto the pans; dragged off, it clears the jam.
    const grabbed = { x: 800, y: splitterGeometry.onPansY };
    drag.start(1, 'pans', layout.onPans, 4, grabbed);
    drag.move(1, { x: grabbed.x + 20, y: grabbed.y });
    drag.end(1);
    expect(drag.carry()?.phase).toBe('returning');
    expect(room().stage.jam).toEqual({ kind: 'split', parts: 4 });
    drag.settle();
    drag.start(1, 'pans', layout.onPans, 4, grabbed);
    drag.move(1, { x: 800, y: 200 });
    drag.end(1);
    expect(drag.carry()?.phase).toBe('landing');
    expect(room().stage.jam).toBeNull();
    expect(formatEquation(room().stage.pans)).toBe('2x = 18');
  });

  it('slides back a blade held across both pans when the DOM cancels its pointer: no split', () => {
    const { drag, room, release } = wiredSplitter();
    const win = new EventTarget();
    const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' });
    const stop = watchDragCancel(win, doc, splitterCancelWatch(drag));
    const before = room();
    drag.start(7, 'holder', home, 2, grabAt);
    drag.move(7, overLeft);
    drag.move(7, overRight);
    win.dispatchEvent(Object.assign(new Event('pointercancel'), { pointerId: 8 }));
    expect(drag.carry()?.phase).toBe('held');
    win.dispatchEvent(Object.assign(new Event('pointercancel'), { pointerId: 7 }));
    expect(release).not.toHaveBeenCalled();
    expect(drag.carry()?.phase).toBe('returning');
    drag.settle();
    drag.start(7, 'holder', home, 2, grabAt);
    drag.move(7, overLeft);
    drag.move(7, overRight);
    win.dispatchEvent(new Event('blur'));
    expect(drag.carry()?.phase).toBe('returning');
    expect(room()).toBe(before);
    stop();
  });

  it('asks the store only about splitter actions, and nothing without a room', () => {
    const { room } = wiredSplitter();
    expect(splitterTakes(null, ['balance'], { type: 'splitter/split' })).toBe(false);
    expect(splitterTakes(room(), ['balance'], null)).toBe(false);
    expect(splitterTakes(room(), ['balance'], { type: 'machine/touch' })).toBe(false);
    expect(splitterTakes(room(), [], { type: 'splitter/split' })).toBe(false);
    expect(splitterTakes(room(), ['balance'], { type: 'splitter/split' })).toBe(true);
    expect(splitterTakes(room(), ['balance'], { type: 'splitter/lift' })).toBe(false);
  });
});

describe('Splitter.tsx', () => {
  const splitter = readFileSync(new URL('./Splitter.tsx', import.meta.url), 'utf8');
  const scene = readFileSync(new URL('../SceneRoot.tsx', import.meta.url), 'utf8');

  it('is in the scene, with its own drag that knows the pans', () => {
    expect(scene).toContain('createSplitterDrag(panUnder)');
    expect(scene).toContain('<Splitter ');
  });

  it('follows a drag on the stage: every move, up and up outside, and cancel, blur or a hidden page', () => {
    for (const event of ["'globalpointermove'", "'pointerup'", "'pointerupoutside'"]) {
      expect(splitter).toContain(`stage.on(${event}`);
    }
    // A cancelled pointer is not a release: the drag is aborted, never ended.
    expect(splitter).toContain('watchDragCancel(window, document, splitterCancelWatch(drag))');
  });

  it('sets the parts with StepButtons, which repeat while held', () => {
    expect(splitter.match(/<StepButton/g)).toHaveLength(2);
  });

  it('has no hover states: no over, enter, leave or out handlers, and no cursor', () => {
    expect(splitter).not.toMatch(/on(Pointer|Mouse)(Over|Enter|Leave|Out)\b|cursor/);
  });

  it('never moves the holder once it is destroyed (it unmounts when the stage locks)', () => {
    expect(splitter).toContain('if (!node.destroyed) node.x = x;');
    expect(splitter).not.toMatch(/node\.x = (pinWiggle|0)/);
  });

  it('hides a carried or returning blade where it was without unmounting it, so it can be grabbed again', () => {
    expect(splitter).toContain("hidden={carriedFrom(carry, 'holder')}");
    expect(splitter).toContain("hidden={carriedFrom(carry, 'pans')}");
    expect(splitter).toContain('<pixiContainer visible={!hidden}>');
  });

  it('shows the number of parts in school notation', () => {
    expect(splitter).toContain('formatNumber(parts)');
  });
});
