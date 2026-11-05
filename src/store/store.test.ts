import { describe, expect, it, vi } from 'vitest';
import { r01 } from '@/content/rooms/r01-door-lift';
import { tokenFromChar } from '@/math/tokens';
import { panPieces } from '@/room/pieces';
import { scaleView } from '@/room/scale';
import type { RoomSpec } from '@/room/types';
import { effects, runEffects } from '@/store/effects';
import type { DomainEvent } from '@/store/events';
import { createReducer, initialGameState, reduce } from '@/store/reducer';
import { createGameStore, gameStore } from '@/store/store';
import type { Ctx } from '@/store/types';

const fixedCtx: Ctx = { now: 1_000, rng: { next: () => 0.5 } };

describe('the store', () => {
  it('starts with no room', () => {
    const store = createGameStore();
    expect(store.getState().room).toBeNull();
    expect(store.getState().ui).toEqual({ screen: 'room', notebookAside: false });
  });

  it('loads room 1: one x-gear and a weight of 4 on the left, a weight of 9 on the right', () => {
    const store = createGameStore({ makeCtx: () => fixedCtx });
    store.getState().dispatch({ type: 'room/enter', roomId: 'r01' });
    const room = store.getState().room;
    expect(room?.spec.id).toBe('r01');
    if (!room) return;
    const pieces = panPieces(room.stage.pans);
    expect(pieces.left.map((p) => p.kind)).toEqual(['gear', 'weight']);
    expect(pieces.left[1]).toMatchObject({ kind: 'weight', value: { n: 4n, d: 1n } });
    expect(pieces.right).toEqual([
      { key: 'right-weight-0', kind: 'weight', value: { n: 9n, d: 1n } },
    ]);
    expect(scaleView(room).tilt).toBe(-5);
  });

  it('hands each domain event to the effects, after storing the new state', () => {
    const seen: [DomainEvent, string | undefined][] = [];
    const store = createGameStore({
      effects: [(event, state) => seen.push([event, state.room?.spec.id])],
    });
    store.getState().dispatch({ type: 'room/enter', roomId: 'r01' });
    expect(seen).toEqual([[{ type: 'StageArrived', roomId: 'r01', stage: 0 }, 'r01']]);
  });

  it('gives the reducer a fresh ctx on every dispatch', () => {
    const makeCtx = vi.fn(() => fixedCtx);
    const reduceSpy = vi.fn(reduce);
    const store = createGameStore({ makeCtx, reduce: reduceSpy });
    store.getState().dispatch({ type: 'room/enter', roomId: 'r01' });
    store.getState().dispatch({ type: 'room/enter', roomId: 'r01' });
    expect(makeCtx).toHaveBeenCalledTimes(2);
    expect(reduceSpy.mock.calls[0]?.[2]).toBe(fixedCtx);
  });

  it('keeps dispatch in the store and only game state in what the reducer sees', () => {
    const reduceSpy = vi.fn(reduce);
    const store = createGameStore({ reduce: reduceSpy });
    store.getState().dispatch({ type: 'room/enter', roomId: 'r01' });
    expect(Object.keys(reduceSpy.mock.calls[0]?.[0] ?? {}).sort()).toEqual(['room', 'ui']);
    expect(typeof store.getState().dispatch).toBe('function');
  });

  it('is one store for the game', () => {
    expect(gameStore.getState().room).toBeNull();
  });
});

describe('the root reducer', () => {
  it('is pure: the same state, action and ctx give the same result, and the input is untouched', () => {
    const state = initialGameState();
    const first = reduce(state, { type: 'room/enter', roomId: 'r01' }, fixedCtx);
    const second = reduce(state, { type: 'room/enter', roomId: 'r01' }, fixedCtx);
    expect(first).toEqual(second);
    expect(state).toEqual(initialGameState());
    expect(first.state).not.toBe(state);
  });

  it('enters a room from the list it was given', () => {
    const other: RoomSpec = {
      ...r01,
      id: 'r02',
      stages: r01.stages.map((stage) => ({ ...stage, machines: [{ equation: '3x = 12' }] })),
    };
    const { state, events } = createReducer([other])(
      initialGameState(),
      { type: 'room/enter', roomId: 'r02' },
      fixedCtx,
    );
    expect(state.room?.spec).toBe(other);
    expect(events).toEqual([{ type: 'StageArrived', roomId: 'r02', stage: 0 }]);
  });

  it('refuses a room that is not in content', () => {
    expect(() =>
      reduce(initialGameState(), { type: 'room/enter', roomId: 'r13' }, fixedCtx),
    ).toThrow(/no room r13/);
  });
});

describe('dial/set', () => {
  function storeInRoomOne() {
    const seen: DomainEvent[] = [];
    const store = createGameStore({
      makeCtx: () => fixedCtx,
      effects: [(event) => seen.push(event)],
    });
    store.getState().dispatch({ type: 'room/enter', roomId: 'r01' });
    seen.length = 0;
    return { store, seen };
  }

  it('turns the dial a notch, fires DialNotch, and the x-gear shows the new x', () => {
    const { store, seen } = storeInRoomOne();
    store.getState().dispatch({ type: 'dial/set', x: 3 });
    expect(store.getState().room?.stage.dialX).toBe(3);
    expect(seen).toEqual([{ type: 'DialNotch', x: 3 }]);
    const room = store.getState().room;
    if (room) expect(scaleView(room).left.pieces[0]?.label).toBe('3');
  });

  it('fires PansLevel when the notch levels the pans', () => {
    const { store, seen } = storeInRoomOne();
    store.getState().dispatch({ type: 'dial/set', x: 5 });
    expect(seen).toEqual([
      { type: 'DialNotch', x: 5 },
      { type: 'PansLevel', roomId: 'r01', stage: 0, x: 5 },
    ]);
  });

  it('changes nothing, and fires nothing, unless the notch changes', () => {
    const { store, seen } = storeInRoomOne();
    const before = store.getState().room;
    store.getState().dispatch({ type: 'dial/set', x: 0 });
    store.getState().dispatch({ type: 'dial/set', x: 11 });
    store.getState().dispatch({ type: 'dial/set', x: 2.5 });
    expect(store.getState().room).toBe(before);
    expect(seen).toEqual([]);
  });

  it('is ignored before a room is entered', () => {
    const { state, events } = reduce(initialGameState(), { type: 'dial/set', x: 3 }, fixedCtx);
    expect(state).toEqual(initialGameState());
    expect(events).toEqual([]);
  });
});

describe('notebook actions', () => {
  function roomOneStore(seen: DomainEvent[] = []) {
    const store = createGameStore({ makeCtx: () => fixedCtx, effects: [(e) => seen.push(e)] });
    store.getState().dispatch({ type: 'room/enter', roomId: 'r01' });
    seen.length = 0;
    return store;
  }

  function typeLine(store: ReturnType<typeof roomOneStore>, text: string): void {
    for (const char of text) {
      const token = tokenFromChar(char);
      if (token) store.getState().dispatch({ type: 'notebook/type', token });
    }
  }

  it('types, deletes from the end and enters through dispatch', () => {
    const seen: DomainEvent[] = [];
    const store = roomOneStore(seen);
    typeLine(store, 'x=55');
    store.getState().dispatch({ type: 'notebook/delete' });
    expect(store.getState().room?.stage.draft).toEqual(['x', '=', '5']);
    store.getState().dispatch({ type: 'notebook/enter' });
    const stage = store.getState().room?.stage;
    expect(stage?.lines.map((line) => line.tokens.join(''))).toEqual(['x+4=9', 'x=5']);
    expect(stage?.draft).toEqual([]);
    expect(seen).toEqual([
      { type: 'LineAccepted', roomId: 'r01', stage: 0, source: 'typed', progress: true },
    ]);
  });

  it('keeps a refused line in the draft and counts the wiggle', () => {
    const store = roomOneStore();
    typeLine(store, 'x+');
    store.getState().dispatch({ type: 'notebook/enter' });
    expect(store.getState().room?.stage.draft).toEqual(['x', '+']);
    expect(store.getState().room?.stage.refused).toBe(1);
  });

  it('marks a wrong line, holds the dial, and an edit clears the mark', () => {
    const seen: DomainEvent[] = [];
    const store = roomOneStore(seen);
    typeLine(store, 'x=6');
    store.getState().dispatch({ type: 'notebook/enter' });
    expect(store.getState().room?.stage.jam).toEqual({ kind: 'line' });
    expect(seen).toEqual([{ type: 'LineWrong', roomId: 'r01', stage: 0, line: 'x = 6' }]);
    const jammed = store.getState().room;
    store.getState().dispatch({ type: 'dial/set', x: 1 });
    expect(store.getState().room).toBe(jammed);
    store.getState().dispatch({ type: 'notebook/delete' });
    expect(store.getState().room?.stage.jam).toBeNull();
  });

  it('is ignored before a room is entered', () => {
    for (const action of [
      { type: 'notebook/type', token: '5' },
      { type: 'notebook/delete' },
      { type: 'notebook/enter' },
    ] as const) {
      const { state, events } = reduce(initialGameState(), action, fixedCtx);
      expect(state).toEqual(initialGameState());
      expect(events).toEqual([]);
    }
  });

  it('pushes the notebook aside and brings it back (the phone layout)', () => {
    const store = roomOneStore();
    const room = store.getState().room;
    store.getState().dispatch({ type: 'notebook/slide', aside: true });
    expect(store.getState().ui.notebookAside).toBe(true);
    store.getState().dispatch({ type: 'notebook/slide', aside: false });
    expect(store.getState().ui.notebookAside).toBe(false);
    expect(store.getState().room).toBe(room);
  });
});

describe('effects', () => {
  it('has no effects in epic 1', () => {
    expect(effects).toEqual([]);
  });

  it('runs events in order through effects in order', () => {
    const calls: string[] = [];
    const events: DomainEvent[] = [
      { type: 'StageArrived', roomId: 'r01', stage: 0 },
      { type: 'StageArrived', roomId: 'r01', stage: 1 },
    ];
    runEffects(events, initialGameState(), [
      (event) => calls.push(`a${event.type === 'StageArrived' ? event.stage : ''}`),
      (event) => calls.push(`b${event.type === 'StageArrived' ? event.stage : ''}`),
    ]);
    expect(calls).toEqual(['a0', 'b0', 'a1', 'b1']);
  });
});
