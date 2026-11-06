import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { formatEquation, formatTokens } from '@/math/format';
import { splitGroups, splitterWorks } from '@/room/splitter';
import type { RoomState } from '@/room/types';
import type { Action } from '@/store/actions';
import type { DomainEvent } from '@/store/events';
import { initialGameState } from '@/store/reducer';
import { createGameStore } from '@/store/store';
import { watchDragCancel } from '@/ui/scene/scale/dial-drag';
import { labelFontSize } from '@/ui/scene/scale/layout';
import { createSplitShow } from '@/ui/scene/scale/split-show';
import {
  createSplitterDrag,
  type SplitterCarry,
  splitterAction,
  splitterCancelWatch,
  splitterTakes,
} from '@/ui/scene/scale/splitter-drag';
import { splitterLayout } from '@/ui/scene/scale/splitter-layout';

const layout = splitterLayout(0.54, labelFontSize(0.54));
const home = layout.frame;
const grabAt = { x: home.x + 40, y: home.y + 20 };
/** Over each pan, over the beam between them, and below the stand (over the dial). */
const overLeft = { x: 300, y: 500 };
const overRight = { x: 1300, y: 500 };
const between = { x: 800, y: 600 };
const overDial = { x: 800, y: 930 };

describe('createSplitterDrag', () => {
  it('carries the frame from where it stood, keeping where he grabbed it', () => {
    const drag = createSplitterDrag();
    const moves: { x: number; y: number }[] = [];
    drag.setMoveListener((at) => moves.push(at));
    expect(drag.start(1, home, 2, grabAt)).toBe(true);
    expect(drag.carry()).toEqual({ home, grabbedAt: grabAt, parts: 2, phase: 'held' });
    drag.move(1, { x: grabAt.x + 100, y: grabAt.y + 50 });
    expect(moves.at(-1)).toEqual({ x: home.x + 100, y: home.y + 50 });
    expect(drag.position()).toEqual({ x: home.x + 100, y: home.y + 50 });
    // Another finger is ignored, and can't start a second carry.
    drag.move(2, { x: 0, y: 0 });
    expect(drag.position()).toEqual({ x: home.x + 100, y: home.y + 50 });
    expect(drag.start(2, home, 2, grabAt)).toBe(false);
  });

  it('hands the release where he let go, and lands when it is taken', () => {
    const drag = createSplitterDrag();
    const release = vi.fn(() => true);
    drag.setReleaseHandler(release);
    drag.start(1, home, 3, grabAt);
    drag.move(1, overRight);
    drag.move(1, between);
    drag.end(2);
    expect(release).not.toHaveBeenCalled();
    drag.end(1);
    expect(release).toHaveBeenCalledWith(expect.objectContaining({ phase: 'held' }), between);
    expect(drag.carry()?.phase).toBe('landing');
  });

  it('goes back when the release handler refuses, and settles after', () => {
    const drag = createSplitterDrag();
    const seen: (SplitterCarry | null)[] = [];
    drag.subscribe(() => seen.push(drag.carry()));
    drag.setReleaseHandler(() => false);
    drag.start(1, home, 2, grabAt);
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

  it('goes back without asking on abort (its own pointer only) and cancel', () => {
    const drag = createSplitterDrag();
    const release = vi.fn(() => true);
    drag.setReleaseHandler(release);
    drag.start(4, home, 2, grabAt);
    drag.abort(5);
    expect(drag.carry()?.phase).toBe('held');
    drag.abort(4);
    expect(drag.carry()?.phase).toBe('returning');
    drag.settle();
    drag.start(4, home, 4, grabAt);
    drag.cancel();
    expect(drag.carry()?.phase).toBe('returning');
    expect(release).not.toHaveBeenCalled();
    // settle does nothing while a frame is held.
    drag.start(6, home, 2, grabAt);
    drag.settle();
    expect(drag.carry()?.phase).toBe('held');
  });
});

describe('splitterAction (story 1.15: anywhere over the scale)', () => {
  it('splits when let go anywhere over the scale: either pan, or the beam between', () => {
    for (const at of [overLeft, overRight, between]) {
      expect(splitterAction(at, layout)).toEqual({ type: 'splitter/split' });
    }
  });

  it('asks for nothing let go back over the holder, or off the scale', () => {
    expect(splitterAction(grabAt, layout)).toBeNull();
    expect(splitterAction(overDial, layout)).toBeNull();
    expect(splitterAction({ x: 800, y: 100 }, layout)).toBeNull();
  });
});

/** Room 4, open, with Balance, at `2x = 18`: the drag wired to the store as Splitter.tsx wires it. */
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
  act({ type: 'dial/set', x: 6 });
  for (let i = 0; i < 4; i += 1) act({ type: 'tray/step', kind: 'float', by: 1 });
  act({ type: 'tray/drop', kind: 'float' });
  const drag = createSplitterDrag();
  const show = createSplitShow();
  const release = vi.fn((_held: SplitterCarry, at: { x: number; y: number }) => {
    const { room, save } = store.getState();
    const action = splitterAction(at, layout);
    if (!action || !room || !splitterWorks(room, save.progress.tools)) return false;
    const groups = splitGroups(room.stage.pans, room.stage.splitter);
    const takes = groups.even && splitterTakes(room, save.progress.tools, action);
    if (takes || !groups.even) show.play(groups);
    if (!takes) return false;
    act(action);
    return true;
  });
  drag.setReleaseHandler(release);
  const room = () => store.getState().room as RoomState;
  return { store, events, act, drag, show, room, release };
}

describe('the splitter drag, wired to the store', () => {
  it('room 4: let go over the beam at 2 parts, it writes 2x : 2 = 18 : 2 and shows the groups', () => {
    const { drag, room, events, show } = wiredSplitter();
    expect(formatEquation(room().stage.pans)).toBe('2x = 18');
    events.length = 0;
    drag.start(1, home, 2, grabAt);
    drag.move(1, between);
    drag.end(1);
    expect(drag.carry()?.phase).toBe('landing');
    expect(formatEquation(room().stage.pans)).toBe('x = 9');
    expect(
      room()
        .stage.lines.map((line) => formatTokens(line.tokens))
        .at(-1),
    ).toBe('2x : 2 = 18 : 2');
    expect(events.map((event) => event.type)).toEqual(['WayUsed', 'LineAccepted']);
    // The pans show the split from 2x = 18: two groups of x against two groups of 9.
    expect(show.current()?.groups).toMatchObject({ parts: 2, even: true });
    expect(show.current()?.groups.right.groups.map((group) => group.map((p) => p.label))).toEqual([
      ['9'],
      ['9'],
    ]);
  });

  it('refuses an uneven split: the frame goes back, the pans show it sliding back, nothing changes', () => {
    const { drag, room, events, act, show } = wiredSplitter();
    act({ type: 'splitter/step', by: 1 });
    act({ type: 'splitter/step', by: 1 });
    const before = room();
    events.length = 0;
    drag.start(1, home, 4, grabAt);
    drag.move(1, overLeft);
    drag.end(1);
    expect(drag.carry()?.phase).toBe('returning');
    expect(room()).toBe(before);
    expect(events).toEqual([]);
    const shown = show.current();
    expect(shown?.groups.even).toBe(false);
    // 2x by 4 and 18 by 4: no gear in a group, two left over; 4 in each, 2 left over.
    expect(shown?.groups.left.leftover.map((p) => p.label)).toEqual(['x', 'x']);
    expect(shown?.groups.right.leftover.map((p) => p.label)).toEqual(['2']);
    if (shown) show.end(shown.id);
    expect(show.current()).toBeNull();
  });

  it('goes back from off the scale, and the store is untouched and nothing shows', () => {
    const { drag, room, show } = wiredSplitter();
    const before = room();
    drag.start(1, home, 2, grabAt);
    drag.move(1, overDial);
    drag.end(1);
    expect(drag.carry()?.phase).toBe('returning');
    expect(room()).toBe(before);
    expect(show.current()).toBeNull();
  });

  it('goes back when the DOM cancels its pointer or the window loses focus: no split', () => {
    const { drag, room, release } = wiredSplitter();
    const win = new EventTarget();
    const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' });
    const stop = watchDragCancel(win, doc, splitterCancelWatch(drag));
    const before = room();
    drag.start(7, home, 2, grabAt);
    drag.move(7, between);
    win.dispatchEvent(Object.assign(new Event('pointercancel'), { pointerId: 8 }));
    expect(drag.carry()?.phase).toBe('held');
    win.dispatchEvent(Object.assign(new Event('pointercancel'), { pointerId: 7 }));
    expect(release).not.toHaveBeenCalled();
    expect(drag.carry()?.phase).toBe('returning');
    drag.settle();
    drag.start(7, home, 2, grabAt);
    drag.move(7, between);
    win.dispatchEvent(new Event('blur'));
    expect(drag.carry()?.phase).toBe('returning');
    expect(room()).toBe(before);
    stop();
  });

  it('asks the store only about a split, and nothing without a room', () => {
    const { room } = wiredSplitter();
    expect(splitterTakes(null, ['balance'], { type: 'splitter/split' })).toBe(false);
    expect(splitterTakes(room(), ['balance'], null)).toBe(false);
    expect(splitterTakes(room(), ['balance'], { type: 'machine/touch' })).toBe(false);
    expect(splitterTakes(room(), [], { type: 'splitter/split' })).toBe(false);
    expect(splitterTakes(room(), ['balance'], { type: 'splitter/split' })).toBe(true);
  });
});

describe('Splitter.tsx', () => {
  const splitter = readFileSync(new URL('./Splitter.tsx', import.meta.url), 'utf8');
  const scene = readFileSync(new URL('../SceneRoot.tsx', import.meta.url), 'utf8');

  it('is in the scene, with its own drag, and shows its splits through the scale', () => {
    expect(scene).toContain('createSplitterDrag()');
    expect(scene).toContain('<Splitter');
    expect(scene).toContain('splitShow={splitShow}');
    expect(scene).toContain('show={splitShow}');
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

  it('hides a carried or returning frame where it was without unmounting it, so it can be grabbed again', () => {
    expect(splitter).toContain('hidden={carried(carry)}');
    expect(splitter).toContain('<pixiContainer visible={!hidden}>');
  });

  it('shows its number as `: n` in school notation, and never a jam (story 1.15)', () => {
    expect(splitter).toContain('divisorLabel(BigInt(parts))');
    expect(splitter).not.toContain('palette.jam');
    expect(splitter).not.toContain('splitter/lift');
  });
});
