import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { tuning } from '@/config/tuning';
import { r01 } from '@/content/rooms/r01-door-lift';
import { type DialView, dialView } from '@/room/dial';
import type { RoomSpec, StageSpec } from '@/room/types';
import type { Action } from '@/store/actions';
import type { DomainEvent } from '@/store/events';
import { createReducer } from '@/store/reducer';
import { createGameStore } from '@/store/store';
import {
  createDialDrag,
  type DialPointerEvent,
  dialPointerHandlers,
  dialSync,
  notchAction,
  watchDragCancel,
} from '@/ui/scene/scale/dial-drag';

const roomOneStage = r01.stages[0] as StageSpec;

/** Room 2's second stage, as the acceptance criteria's fixture: x : 3 = 5, dial 0–30 in 3s. */
const thirdsRoom: RoomSpec = {
  ...r01,
  id: 'r02',
  stages: [
    { ...roomOneStage, machines: [{ equation: 'x : 3 = 5' }], dial: { min: 0, max: 30, step: 3 } },
  ],
};

/**
 * The dial as Dial.tsx wires it: the controller's notches dispatch to a real store, and
 * the store's dial is synced back after every dispatch.
 */
function wiredDial(room: RoomSpec = r01) {
  const events: DomainEvent[] = [];
  const store = createGameStore({
    reduce: createReducer([room]),
    effects: [(event) => events.push(event)],
  });
  store.getState().dispatch({ type: 'room/enter', roomId: room.id as 'r01' });
  events.length = 0;
  const dispatched: Action[] = [];
  const knob: number[] = [];
  const drag = createDialDrag({
    notchPx: tuning.dialNotchPx,
    onKnob: (px) => knob.push(px),
    onNotch: (notch) => {
      const view = dialView(store.getState().room);
      if (!view) return;
      const action = notchAction(view, notch);
      dispatched.push(action);
      store.getState().dispatch(action);
    },
  });
  const sync = () => drag.sync(dialSync(dialView(store.getState().room)));
  store.subscribe(sync);
  sync();
  const x = () => store.getState().room?.stage.dialX;
  return { store, drag, handlers: dialPointerHandlers(drag), events, dispatched, knob, x };
}

function pointer(x: number, pointerId = 1, button = 0): DialPointerEvent {
  return { pointerId, button, global: { x } };
}

describe('dragging the dial in room 1', () => {
  it('starts at 0 and moves one notch per 24 CSS px, to the nearest notch', () => {
    const dial = wiredDial();
    expect(tuning.dialNotchPx).toBe(24);
    expect(dial.x()).toBe(0);
    dial.handlers.onPointerDown(pointer(300));
    const changedAt: number[] = [];
    for (let px = 1; px <= 240; px += 1) {
      const before = dial.x();
      dial.handlers.onGlobalPointerMove(pointer(300 + px));
      if (dial.x() !== before) changedAt.push(px);
    }
    expect(dial.x()).toBe(10);
    expect(changedAt).toEqual([12, 36, 60, 84, 108, 132, 156, 180, 204, 228]);
    expect(changedAt.slice(1).map((px, i) => px - (changedAt[i] ?? 0))).toEqual(Array(9).fill(24));
  });

  it('moves the knob on every move, but sends the store only the new notches', () => {
    const dial = wiredDial();
    dial.knob.length = 0;
    dial.handlers.onPointerDown(pointer(0));
    for (let px = 1; px <= 100; px += 1) dial.handlers.onGlobalPointerMove(pointer(px));
    expect(dial.knob).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
    expect(dial.dispatched).toEqual([1, 2, 3, 4].map((x) => ({ type: 'dial/set', x })));
    expect(dial.events.filter((e) => e.type === 'DialNotch')).toHaveLength(4);
  });

  it('levels the pans at 5 and fires PansLevel there', () => {
    const dial = wiredDial();
    dial.handlers.onPointerDown(pointer(0));
    dial.handlers.onGlobalPointerMove(pointer(5 * 24));
    expect(dial.x()).toBe(5);
    expect(dial.events).toContainEqual({ type: 'PansLevel', roomId: 'r01', stage: 0, x: 5 });
  });

  it('stops at either end of its range', () => {
    const dial = wiredDial();
    dial.handlers.onPointerDown(pointer(500));
    dial.handlers.onGlobalPointerMove(pointer(500 + 1000));
    expect(dial.x()).toBe(10);
    expect(dial.knob.at(-1)).toBe(240);
    dial.handlers.onGlobalPointerMove(pointer(500 - 1000));
    expect(dial.x()).toBe(0);
    expect(dial.knob.at(-1)).toBe(0);
    dial.handlers.onGlobalPointerMove(pointer(500 - 2000));
    expect(dial.dispatched.at(-1)).toEqual({ type: 'dial/set', x: 0 });
    expect(dial.dispatched).toHaveLength(2);
  });

  it.each(['onPointerUp', 'onPointerUpOutside', 'onPointerCancel'] as const)(
    'ends cleanly on %s, settling the knob on its notch',
    (ending) => {
      const dial = wiredDial();
      dial.handlers.onPointerDown(pointer(0));
      dial.handlers.onGlobalPointerMove(pointer(80));
      expect(dial.x()).toBe(3);
      dial.handlers[ending](pointer(80));
      expect(dial.drag.dragging()).toBe(false);
      expect(dial.knob.at(-1)).toBe(72);
      dial.handlers.onGlobalPointerMove(pointer(200));
      expect(dial.x()).toBe(3);
    },
  );

  it('picks up from where the dial is, wherever on the track the next drag starts', () => {
    const dial = wiredDial();
    dial.handlers.onPointerDown(pointer(0));
    dial.handlers.onGlobalPointerMove(pointer(72));
    dial.handlers.onPointerUp(pointer(72));
    dial.handlers.onPointerDown(pointer(900));
    dial.handlers.onGlobalPointerMove(pointer(924));
    expect(dial.x()).toBe(4);
    dial.handlers.onGlobalPointerMove(pointer(900 - 72));
    expect(dial.x()).toBe(0);
  });

  it('follows only the finger that started the drag', () => {
    const dial = wiredDial();
    dial.handlers.onPointerDown(pointer(0, 1));
    dial.handlers.onPointerDown(pointer(500, 2));
    dial.handlers.onGlobalPointerMove(pointer(700, 2));
    expect(dial.x()).toBe(0);
    dial.handlers.onPointerUp(pointer(700, 2));
    expect(dial.drag.dragging()).toBe(true);
    dial.handlers.onGlobalPointerMove(pointer(48, 1));
    expect(dial.x()).toBe(2);
  });

  it('behaves the same for a mouse as for a finger, and only with the main button', () => {
    const run = (pointerId: number) => {
      const dial = wiredDial();
      dial.handlers.onPointerDown(pointer(10, pointerId));
      const xs = [30, 70, 130, 60].map((px) => {
        dial.handlers.onGlobalPointerMove(pointer(10 + px, pointerId));
        return dial.x();
      });
      dial.handlers.onPointerUp(pointer(70, pointerId));
      return xs;
    };
    // Pixi gives the mouse pointer id 1; touches get their own.
    expect(run(1)).toEqual(run(17));
    expect(run(1)).toEqual([1, 3, 5, 3]);
    const dial = wiredDial();
    dial.handlers.onPointerDown(pointer(0, 1, 2));
    expect(dial.drag.dragging()).toBe(false);
  });

  it('reacts to nothing but down, move, up, up outside and cancel: no hover states', () => {
    const dial = wiredDial();
    expect(Object.keys(dial.handlers).sort()).toEqual([
      'onGlobalPointerMove',
      'onPointerCancel',
      'onPointerDown',
      'onPointerUp',
      'onPointerUpOutside',
    ]);
  });
});

describe('the fixture x : 3 = 5 with dial 0–30, step 3', () => {
  it('steps in 3s', () => {
    const dial = wiredDial(thirdsRoom);
    dial.handlers.onPointerDown(pointer(0));
    const xs = [24, 48, 72, 96, 240, 300].map((px) => {
      dial.handlers.onGlobalPointerMove(pointer(px));
      return dial.x();
    });
    expect(xs).toEqual([3, 6, 9, 12, 30, 30]);
    expect(dial.dispatched.every((a) => a.type === 'dial/set' && a.x % 3 === 0)).toBe(true);
  });

  it('levels at 15', () => {
    const dial = wiredDial(thirdsRoom);
    dial.handlers.onPointerDown(pointer(0));
    dial.handlers.onGlobalPointerMove(pointer(5 * 24));
    expect(dial.x()).toBe(15);
    expect(dial.events).toContainEqual({ type: 'PansLevel', roomId: 'r02', stage: 0, x: 15 });
  });
});

describe('createDialDrag', () => {
  function controller() {
    const onKnob = vi.fn();
    const onNotch = vi.fn();
    const drag = createDialDrag({ notchPx: 24, onKnob, onNotch });
    return { drag, onKnob, onNotch };
  }

  it('settles the knob on the synced notch when not dragging', () => {
    const { drag, onKnob } = controller();
    drag.sync({ notch: 4, first: 0, last: 10, enabled: true });
    expect(onKnob).toHaveBeenLastCalledWith(96);
  });

  it('does not start while the dial holds still', () => {
    const { drag } = controller();
    drag.sync({ notch: 0, first: 0, last: 10, enabled: false });
    expect(drag.start(1, 0)).toBe(false);
    expect(drag.dragging()).toBe(false);
  });

  it('ends a drag when the dial stops turning mid-drag', () => {
    const { drag, onKnob, onNotch } = controller();
    drag.sync({ notch: 0, first: 0, last: 10, enabled: true });
    drag.start(1, 0);
    drag.move(1, 50);
    drag.sync({ notch: 2, first: 0, last: 10, enabled: false });
    expect(drag.dragging()).toBe(false);
    expect(onKnob).toHaveBeenLastCalledWith(48);
    drag.move(1, 200);
    expect(onNotch).toHaveBeenCalledTimes(1);
  });

  it('keeps the knob inside the reachable notches', () => {
    const { drag, onKnob } = controller();
    drag.sync({ notch: 0, first: 0, last: 3, enabled: true });
    drag.start(1, 0);
    drag.move(1, 500);
    expect(onKnob).toHaveBeenLastCalledWith(72);
  });

  it('keeps the knob with the finger while the store catches up', () => {
    const { drag, onKnob } = controller();
    drag.sync({ notch: 0, first: 0, last: 10, enabled: true });
    drag.start(1, 0);
    drag.move(1, 30);
    drag.sync({ notch: 1, first: 0, last: 10, enabled: true });
    expect(onKnob).toHaveBeenLastCalledWith(30);
  });

  it('settles on the store notch at the end, even if the store refused the last one', () => {
    const { drag, onKnob } = controller();
    drag.sync({ notch: 0, first: 0, last: 10, enabled: true });
    drag.start(1, 0);
    drag.move(1, 50);
    drag.end(1);
    expect(onKnob).toHaveBeenLastCalledWith(0);
  });

  it('cancels any drag', () => {
    const { drag } = controller();
    drag.sync({ notch: 0, first: 0, last: 10, enabled: true });
    drag.start(3, 0);
    drag.cancel();
    expect(drag.dragging()).toBe(false);
  });
});

describe('dialSync and notchAction', () => {
  it("read room 1's dial in notches, and turn a notch back into x", () => {
    const view: DialView = {
      min: 6,
      max: 20,
      step: 1,
      openMin: 6,
      openMax: 9,
      x: 8,
      turns: true,
      heldByPin: false,
    };
    expect(dialSync(view)).toEqual({ notch: 2, first: 0, last: 3, enabled: true });
    expect(notchAction(view, 3)).toEqual({ type: 'dial/set', x: 9 });
    expect(dialSync(null)).toEqual({ notch: 0, first: 0, last: 0, enabled: false });
  });
});

describe('watchDragCancel', () => {
  function setUp() {
    const win = new EventTarget();
    const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' });
    const drag = createDialDrag({ notchPx: 24, onKnob: () => {}, onNotch: () => {} });
    drag.sync({ notch: 0, first: 0, last: 10, enabled: true });
    const stop = watchDragCancel(win, doc, drag);
    return { win, doc, drag, stop };
  }

  function cancelEvent(pointerId: number): Event {
    return Object.assign(new Event('pointercancel'), { pointerId });
  }

  it("ends the drag on the DOM's pointercancel for its pointer, which Pixi never forwards", () => {
    const { win, drag } = setUp();
    drag.start(4, 0);
    win.dispatchEvent(cancelEvent(5));
    expect(drag.dragging()).toBe(true);
    win.dispatchEvent(cancelEvent(4));
    expect(drag.dragging()).toBe(false);
  });

  it('ends the drag when the window loses focus or the page is hidden', () => {
    const { win, doc, drag } = setUp();
    drag.start(1, 0);
    win.dispatchEvent(new Event('blur'));
    expect(drag.dragging()).toBe(false);
    drag.start(1, 0);
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(drag.dragging()).toBe(true);
    doc.visibilityState = 'hidden';
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(drag.dragging()).toBe(false);
  });

  it('stops listening when unsubscribed', () => {
    const { win, drag, stop } = setUp();
    stop();
    drag.start(1, 0);
    win.dispatchEvent(cancelEvent(1));
    win.dispatchEvent(new Event('blur'));
    expect(drag.dragging()).toBe(true);
  });
});

describe('Dial.tsx', () => {
  const source = readFileSync(new URL('./Dial.tsx', import.meta.url), 'utf8');

  it('wires the drag to down, global move, up, up outside and cancel', () => {
    for (const prop of [
      'onPointerDown',
      'onGlobalPointerMove',
      'onPointerUp',
      'onPointerUpOutside',
      'onPointerCancel',
    ]) {
      expect(source).toContain(`${prop}={handlers.${prop}}`);
    }
    expect(source).toContain('watchDragCancel(window, document, drag)');
  });

  it('has no hover states: no over, enter, leave or out handlers, and no cursor', () => {
    expect(source).not.toMatch(/on(Pointer|Mouse)(Over|Enter|Leave|Out)\b|cursor/);
  });
});

describe('a drag from between two notches (story 4.6 review)', () => {
  it('sends nothing until the knob has moved half a notch', () => {
    const notches: number[] = [];
    const drag = createDialDrag({
      notchPx: 24,
      onKnob: () => {},
      onNotch: (notch) => notches.push(notch),
    });
    drag.sync({ notch: 20.7, first: 0, last: 21, enabled: true });
    drag.start(1, 100);
    drag.move(1, 100);
    drag.move(1, 101);
    drag.move(1, 95);
    expect(notches).toEqual([]);
    drag.move(1, 86);
    expect(notches).toEqual([20]);
  });
});
