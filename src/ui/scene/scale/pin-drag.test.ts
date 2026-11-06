import { describe, expect, it } from 'vitest';
import { r03 } from '@/content/rooms/r03-sluice-gate';
import { pinTrack, pinView, slotValue } from '@/room/pin';
import { currentStageSpec } from '@/room/room';
import type { DomainEvent } from '@/store/events';
import { createGameStore } from '@/store/store';
import { type DialPointerEvent, dialPointerHandlers } from '@/ui/scene/scale/dial-drag';
import { createPinDrag } from '@/ui/scene/scale/pin-drag';

const slotPx = 24;
const holderPx = -72;

function pointer(x: number, pointerId = 1, button = 0): DialPointerEvent {
  return { pointerId, button, global: { x } };
}

/** The pin as Pin.tsx wires it: places dispatch `pin/set`, and the store syncs back. */
function wiredPin(stage = 0) {
  const events: DomainEvent[] = [];
  const store = createGameStore({ effects: [(event) => events.push(event)] });
  store.getState().dispatch({ type: 'room/enter', roomId: 'r03', stage });
  store.getState().dispatch({ type: 'machine/touch' });
  const positions: number[] = [];
  const drag = createPinDrag({
    slotPx: stage === 0 ? slotPx : 160,
    holderPx: stage === 0 ? holderPx : -120,
    onPin: (px) => positions.push(px),
    onPlace: (slot) => {
      const room = store.getState().room;
      const track = room ? pinTrack(currentStageSpec(room)) : null;
      if (track) store.getState().dispatch({ type: 'pin/set', value: slotValue(track, slot) });
    },
  });
  const sync = () => {
    const view = pinView(store.getState().room);
    drag.sync({
      slot: view?.slot ?? null,
      slots: view?.slots ?? 1,
      enabled: view?.movable ?? false,
    });
  };
  store.subscribe(sync);
  sync();
  const stageNow = () => store.getState().room?.stage;
  return { store, drag, handlers: dialPointerHandlers(drag), positions, events, stageNow };
}

describe('dragging the pin in room 3', () => {
  it('waits in its holder, then slides out onto the track, where the stage goes to pin', () => {
    const pin = wiredPin();
    expect(pin.positions.at(-1)).toBe(holderPx);
    pin.handlers.onPointerDown(pointer(100));
    pin.handlers.onGlobalPointerMove(pointer(100 + 40));
    expect(pin.positions.at(-1)).toBe(holderPx + 40);
    expect(pin.stageNow()?.phase).toBe('poke');
    pin.handlers.onGlobalPointerMove(pointer(100 + 72));
    expect(pin.stageNow()?.phase).toBe('pin');
    expect(pin.stageNow()?.pin?.value).toEqual({ kind: 'x', x: 6 });
  });

  it('moves one place per 24 CSS px, sending the store only new places', () => {
    const pin = wiredPin();
    pin.handlers.onPointerDown(pointer(0));
    for (let px = 1; px <= 72 + 8 * 24; px += 1) pin.handlers.onGlobalPointerMove(pointer(px));
    expect(pin.stageNow()?.pin?.value).toEqual({ kind: 'x', x: 14 });
    pin.handlers.onPointerUp(pointer(72 + 8 * 24));
    expect(pin.positions.at(-1)).toBe(8 * 24);
    expect(pin.drag.dragging()).toBe(false);
  });

  it('moves on a second drag, and never back into the holder once placed', () => {
    const pin = wiredPin();
    pin.handlers.onPointerDown(pointer(0));
    pin.handlers.onGlobalPointerMove(pointer(72 + 5 * 24));
    pin.handlers.onPointerUp(pointer(72 + 5 * 24));
    expect(pin.stageNow()?.pin?.value).toEqual({ kind: 'x', x: 11 });
    pin.handlers.onPointerDown(pointer(500));
    pin.handlers.onGlobalPointerMove(pointer(500 - 1000));
    expect(pin.positions.at(-1)).toBe(0);
    expect(pin.stageNow()?.pin?.value).toEqual({ kind: 'x', x: 6 });
    pin.handlers.onGlobalPointerMove(pointer(500 + 1000));
    expect(pin.positions.at(-1)).toBe(14 * 24);
    expect(pin.stageNow()?.pin?.value).toEqual({ kind: 'x', x: 20 });
  });

  it.each(['onPointerUp', 'onPointerUpOutside', 'onPointerCancel'] as const)(
    'ends cleanly on %s, settling the pin on its place',
    (ending) => {
      const pin = wiredPin();
      pin.handlers.onPointerDown(pointer(0));
      pin.handlers.onGlobalPointerMove(pointer(72 + 3 * 24 + 10));
      pin.handlers[ending](pointer(0));
      expect(pin.drag.dragging()).toBe(false);
      expect(pin.positions.at(-1)).toBe(3 * 24);
      pin.handlers.onGlobalPointerMove(pointer(400));
      expect(pin.stageNow()?.pin?.value).toEqual({ kind: 'x', x: 9 });
    },
  );

  it('goes back to the holder if released before reaching the track', () => {
    const pin = wiredPin();
    pin.handlers.onPointerDown(pointer(0));
    pin.handlers.onGlobalPointerMove(pointer(30));
    pin.handlers.onPointerUp(pointer(30));
    expect(pin.positions.at(-1)).toBe(holderPx);
    expect(pin.stageNow()).toMatchObject({ phase: 'poke', pin: null });
  });

  it('stops moving once the pin is confirmed', () => {
    const pin = wiredPin();
    pin.handlers.onPointerDown(pointer(0));
    pin.handlers.onGlobalPointerMove(pointer(72 + 8 * 24));
    pin.handlers.onPointerUp(pointer(0));
    pin.store.getState().dispatch({ type: 'pin/confirm' });
    expect(pin.handlers.onPointerDown(pointer(0))).toBeUndefined();
    expect(pin.drag.dragging()).toBe(false);
    pin.handlers.onGlobalPointerMove(pointer(-500));
    expect(pin.stageNow()?.pin?.value).toEqual({ kind: 'x', x: 14 });
  });

  it("ignores a mouse's other buttons and other fingers", () => {
    const pin = wiredPin();
    pin.handlers.onPointerDown(pointer(0, 1, 2));
    expect(pin.drag.dragging()).toBe(false);
    pin.handlers.onPointerDown(pointer(0, 1));
    pin.handlers.onGlobalPointerMove(pointer(400, 2));
    expect(pin.stageNow()?.pin).toBeNull();
    pin.handlers.onPointerUp(pointer(0, 2));
    expect(pin.drag.dragging()).toBe(true);
  });

  it('drags a choice pin between its two options (stage 2)', () => {
    const pin = wiredPin(1);
    expect(pin.stageNow()?.phase).toBe('pin');
    pin.handlers.onPointerDown(pointer(0));
    pin.handlers.onGlobalPointerMove(pointer(120));
    expect(pin.stageNow()?.pin?.value).toEqual({ kind: 'choice', index: 0 });
    pin.handlers.onGlobalPointerMove(pointer(120 + 160));
    expect(pin.stageNow()?.pin?.value).toEqual({ kind: 'choice', index: 1 });
    pin.handlers.onGlobalPointerMove(pointer(2000));
    expect(pin.positions.at(-1)).toBe(160);
  });
});

describe('createPinDrag on its own', () => {
  it("doesn't start while disabled, and settles wherever the store says", () => {
    const positions: number[] = [];
    const drag = createPinDrag({
      slotPx,
      holderPx,
      onPin: (px) => positions.push(px),
      onPlace: () => {},
    });
    expect(drag.start(1, 0)).toBe(false);
    drag.sync({ slot: 4, slots: 15, enabled: true });
    expect(positions.at(-1)).toBe(96);
    expect(drag.start(1, 0)).toBe(true);
    expect(drag.start(2, 0)).toBe(false);
    drag.sync({ slot: 5, slots: 15, enabled: true });
    expect(positions.at(-1)).toBe(96);
    drag.cancel();
    expect(positions.at(-1)).toBe(120);
    expect(r03.stages).toHaveLength(2);
  });
});
