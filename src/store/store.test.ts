import { describe, expect, it, vi } from 'vitest';
import { tuning } from '@/config/tuning';
import { r01 } from '@/content/rooms/r01-door-lift';
import { r04 } from '@/content/rooms/r04-water-wheel';
import { createEconomy } from '@/economy/parts';
import { tokenFromChar } from '@/math/tokens';
import { dialView } from '@/room/dial';
import { machineView } from '@/room/machine';
import { panPieces } from '@/room/pieces';
import { pinView } from '@/room/pin';
import { scaleView } from '@/room/scale';
import { splitterOffered } from '@/room/splitter';
import type { FirstUseId, RoomSpec, RoomState, StageSpec } from '@/room/types';
import type { Action } from '@/store/actions';
import { effects, runEffects } from '@/store/effects';
import { type DomainEvent, isRoomEvent } from '@/store/events';
import { initialQuality, qualityInUse } from '@/store/quality';
import { createReducer, initialGameState, reduce } from '@/store/reducer';
import { createGameStore, gameStore } from '@/store/store';
import type { Ctx } from '@/store/types';

const fixedCtx: Ctx = { now: 1_000, rng: { next: () => 0.5 } };

describe('the store', () => {
  it('starts with no room, on the loading screen (story 2.1)', () => {
    const store = createGameStore();
    expect(store.getState().room).toBeNull();
    expect(store.getState().ui).toEqual({
      screen: 'loading',
      loaded: 0,
      fresh: null,
      notebookAside: false,
      quality: { measured: null, measuredMs: null, forced: null },
      copies: 1,
      hint: null,
    });
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
      effects: [(event, state) => isRoomEvent(event) && seen.push([event, state.room?.spec.id])],
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
    expect(Object.keys(reduceSpy.mock.calls[0]?.[0] ?? {}).sort()).toEqual(['room', 'save', 'ui']);
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
      effects: [(event) => isRoomEvent(event) && seen.push(event)],
    });
    store.getState().dispatch({ type: 'room/enter', roomId: 'r01' });
    seen.length = 0;
    return { store, seen };
  }

  it('turns the dial a notch, fires DialNotch, and weighs the pans there; the gear shows x', () => {
    const { store, seen } = storeInRoomOne();
    store.getState().dispatch({ type: 'dial/set', x: 3 });
    expect(store.getState().room?.stage.dialX).toBe(3);
    expect(seen).toEqual([{ type: 'DialNotch', x: 3 }]);
    const room = store.getState().room;
    // Story 1.15: the dial's value shows on the slider, never on the gears.
    if (room)
      expect(scaleView(room)).toMatchObject({ x: 3, left: { pieces: [{ label: 'x' }, {}] } });
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

// Room 1 with a blank page, so he writes whole lines (room 1 itself fills blanks).
const firstStage = r01.stages[0] as StageSpec;
const freeRoomOne: RoomSpec = { ...r01, stages: [{ ...firstStage, fading: { try: 'blank' } }] };

describe('notebook actions', () => {
  function roomOneStore(seen: DomainEvent[] = [], list: readonly RoomSpec[] = [freeRoomOne]) {
    const store = createGameStore({
      makeCtx: () => fixedCtx,
      reduce: createReducer(list),
      effects: [(e) => isRoomEvent(e) && seen.push(e)],
    });
    store.getState().dispatch({ type: 'room/enter', roomId: 'r01' });
    store.getState().dispatch({ type: 'machine/touch' });
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
    expect(seen).toEqual([
      { type: 'LineWrong', roomId: 'r01', stage: 0, line: 'x = 6' },
      { type: 'MachineJammed', roomId: 'r01', kind: 'line' },
    ]);
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

describe('written lines drive the machine (story 1.7)', () => {
  function roomOne(seen: DomainEvent[]) {
    const store = createGameStore({
      makeCtx: () => fixedCtx,
      effects: [(e) => isRoomEvent(e) && seen.push(e)],
    });
    store.getState().dispatch({ type: 'room/enter', roomId: 'r01' });
    store.getState().dispatch({ type: 'machine/touch' });
    seen.length = 0;
    return store;
  }

  it('plays room 1 with its blanks: explore, jam, fix, then the answer and the check lock it', () => {
    const seen: DomainEvent[] = [];
    const store = roomOne(seen);
    const { dispatch } = store.getState();
    dispatch({ type: 'dial/set', x: 6 });
    dispatch({ type: 'notebook/type', token: '+' }); // only digits fill the blank
    dispatch({ type: 'notebook/type', token: '6' });
    dispatch({ type: 'notebook/enter' });
    // Story 1.16: the jammed line shows at the dial's 6, with readouts (1.7–1.15 hid them
    // and weighed it at the solution); it still tips, by at least the jam's tilt.
    const jammed = scaleView(store.getState().room as RoomState);
    expect(jammed).toMatchObject({ x: 6, level: false, readouts: { left: '6', right: '6' } });
    expect(Math.abs(jammed.tilt)).toBeGreaterThanOrEqual(tuning.jamMinTilt);
    dispatch({ type: 'notebook/delete' });
    dispatch({ type: 'dial/set', x: 5 });
    dispatch({ type: 'notebook/type', token: '5' });
    dispatch({ type: 'notebook/enter' });
    dispatch({ type: 'notebook/type', token: '5' });
    dispatch({ type: 'notebook/enter' });

    expect(seen).toEqual([
      { type: 'DialNotch', x: 6 },
      { type: 'LineWrong', roomId: 'r01', stage: 0, line: 'x = 6' },
      { type: 'MachineJammed', roomId: 'r01', kind: 'line' },
      { type: 'DialNotch', x: 5 },
      { type: 'PansLevel', roomId: 'r01', stage: 0, x: 5 },
      { type: 'LineAccepted', roomId: 'r01', stage: 0, source: 'typed', progress: true },
      { type: 'LineAccepted', roomId: 'r01', stage: 0, source: 'typed', progress: true },
      { type: 'StageLocked', roomId: 'r01', stage: 0 },
    ]);
    const room = store.getState().room as RoomState;
    expect(room.stage.phase).toBe('locked');
    expect(room.stage.machineProgress).toEqual([1]);
    expect(room.stage.lines.map((line) => line.tokens.join(''))).toEqual(['x+4=9', 'x=5', '5+4=9']);
    const view = scaleView(room);
    expect(view.left.pieces.map((p) => [p.kind, p.label])).toEqual([
      ['weight', '5'],
      ['weight', '4'],
    ]);
    expect(view.level).toBe(true);
  });

  it('ignores the dial and the notebook once the stage is locked', () => {
    const seen: DomainEvent[] = [];
    const store = roomOne(seen);
    const { dispatch } = store.getState();
    for (const token of ['5', '5'] as const) {
      dispatch({ type: 'notebook/type', token });
      dispatch({ type: 'notebook/enter' });
    }
    const locked = store.getState().room;
    dispatch({ type: 'dial/set', x: 3 });
    dispatch({ type: 'notebook/type', token: '1' });
    dispatch({ type: 'notebook/enter' });
    expect(store.getState().room).toBe(locked);
  });
});

describe('a room from arrival to restart (story 1.8)', () => {
  /** A store whose clock can be moved on, recording every event and the phase after each act. */
  function playing(list?: readonly RoomSpec[]) {
    const clock = { now: 0 };
    const seen: DomainEvent[] = [];
    const store = createGameStore({
      makeCtx: () => ({ now: clock.now, rng: { next: () => 0.5 } }),
      effects: [(event) => isRoomEvent(event) && seen.push(event)],
      ...(list ? { reduce: createReducer(list) } : {}),
      // Named already, so room 2 follows room 1 (the naming has its own tests, naming.test.ts).
      initialState: {
        ...initialGameState(),
        save: { ...initialGameState().save, character: { name: 'Ivo', look: 'look-1' as const } },
      },
    });
    const phases: string[] = [];
    const act = (action: Action) => {
      store.getState().dispatch(action);
      // A story card between rooms (story 2.5, its own tests in story.test.ts) is tapped on.
      if (store.getState().ui.screen === 'story') store.getState().dispatch({ type: 'story/next' });
      const room = store.getState().room;
      phases.push(room ? `${room.spec.id}.${room.stageIndex}:${room.stage.phase}` : 'none');
    };
    /** Fills the stage's two blanks with the answer, a digit at a time. */
    const solve = (answer: string) => {
      for (let line = 0; line < 2; line += 1) {
        for (const char of answer) {
          const token = tokenFromChar(char);
          if (token) store.getState().dispatch({ type: 'notebook/type', token });
        }
        act({ type: 'notebook/enter' });
      }
    };
    /** The UI reports the presentation playing now done. */
    const presented = () => {
      const room = store.getState().room as RoomState;
      const { phase } = room.stage;
      if (phase !== 'locked' && phase !== 'restart') throw new Error(`nothing plays in ${phase}`);
      act({ type: 'presentation/done', roomId: room.spec.id, stage: room.stageIndex, phase });
    };
    return { store, clock, seen, phases, act, solve, presented };
  }

  it('runs room 1 arrive → open → locked → restart → done, with no instruction screen', () => {
    const game = playing([r01]);
    game.act({ type: 'room/enter', roomId: 'r01' });
    game.act({ type: 'machine/touch' });
    game.solve('5');
    game.presented();
    expect(game.store.getState().ui.screen).toBe('room');
    game.presented();
    expect(game.phases).toEqual([
      'r01.0:arrive',
      'r01.0:open',
      'r01.0:open',
      'r01.0:locked',
      'r01.0:restart',
      // Story 2.2: the restart ends on the map.
      'none',
    ]);
    expect(game.seen.map((event) => event.type)).toEqual([
      'StageArrived',
      'LineAccepted',
      'LineAccepted',
      'StageLocked',
      'RoomRestarted',
    ]);
    // The map, never a success screen (story 2.2), with room 1's change playing on it.
    expect(game.store.getState().ui).toMatchObject({ screen: 'map', fresh: 'r01' });
  });

  it('keeps the notebook off until his first touch on the machine', () => {
    const game = playing();
    game.act({ type: 'room/enter', roomId: 'r01' });
    game.store.getState().dispatch({ type: 'notebook/type', token: '5' });
    expect(game.store.getState().room?.stage.draft).toEqual([]);
    game.act({ type: 'machine/touch' });
    game.store.getState().dispatch({ type: 'notebook/type', token: '5' });
    expect(game.store.getState().room?.stage.draft).toEqual(['5']);
  });

  it('loads the next room when a restart ends: room 1, then room 2', () => {
    const game = playing();
    game.act({ type: 'room/enter', roomId: 'r01' });
    game.act({ type: 'machine/touch' });
    game.solve('5');
    game.presented();
    game.seen.length = 0;
    game.presented();
    expect(game.store.getState().ui.screen).toBe('room');
    const room = game.store.getState().room as RoomState;
    expect(room.spec.id).toBe('r02');
    expect(room.stageIndex).toBe(0);
    expect(room.stage.phase).toBe('arrive');
    expect(game.seen).toEqual([{ type: 'StageArrived', roomId: 'r02', stage: 0 }]);
  });

  it('plays room 2: the first lamp lights, the second stage arrives, the machine restarts, then room 3', () => {
    const game = playing();
    game.act({ type: 'room/enter', roomId: 'r02' });
    game.act({ type: 'machine/touch' });
    game.act({ type: 'dial/set', x: 4 });
    game.solve('4');
    expect(machineView(game.store.getState().room)).toMatchObject({ parts: 2, partsStarted: 1 });
    game.presented();
    let room = game.store.getState().room as RoomState;
    expect(room.stageIndex).toBe(1);
    expect(room.stage.phase).toBe('arrive');
    expect(dialView(room)).toMatchObject({ min: 0, max: 30, step: 3, x: 0 });
    expect(room.stage.lines.map((line) => line.tokens.join(''))).toEqual(['x:3=5']);
    game.act({ type: 'machine/touch' });
    game.act({ type: 'dial/set', x: 15 });
    game.solve('15');
    game.presented();
    expect(game.store.getState().room?.stage.phase).toBe('restart');
    game.presented();
    room = game.store.getState().room as RoomState;
    expect(room.spec.id).toBe('r03');
    expect(room.stage.phase).toBe('arrive');
    expect(game.seen.filter((event) => event.type !== 'DialNotch')).toEqual([
      { type: 'StageArrived', roomId: 'r02', stage: 0 },
      { type: 'PansLevel', roomId: 'r02', stage: 0, x: 4 },
      { type: 'LineAccepted', roomId: 'r02', stage: 0, source: 'typed', progress: true },
      { type: 'LineAccepted', roomId: 'r02', stage: 0, source: 'typed', progress: true },
      { type: 'StageLocked', roomId: 'r02', stage: 0 },
      { type: 'StageArrived', roomId: 'r02', stage: 1 },
      { type: 'PansLevel', roomId: 'r02', stage: 1, x: 15 },
      { type: 'LineAccepted', roomId: 'r02', stage: 1, source: 'typed', progress: true },
      { type: 'LineAccepted', roomId: 'r02', stage: 1, source: 'typed', progress: true },
      { type: 'StageLocked', roomId: 'r02', stage: 1 },
      { type: 'RoomRestarted', roomId: 'r02' },
      { type: 'StageArrived', roomId: 'r03', stage: 0 },
    ]);
  });

  it('ends the lock and the restart on the clock when the UI never reports them', () => {
    const game = playing();
    game.act({ type: 'room/enter', roomId: 'r01' });
    game.act({ type: 'machine/touch' });
    game.clock.now = 10_000;
    game.solve('5');
    game.clock.now += tuning.presentationTimeoutMs - 1_000;
    game.act({ type: 'clock/tick' });
    game.clock.now += 1_000;
    game.act({ type: 'clock/tick' });
    game.clock.now += tuning.presentationTimeoutMs;
    game.act({ type: 'clock/tick' });
    expect(game.phases.slice(-4)).toEqual([
      'r01.0:locked',
      'r01.0:locked',
      'r01.0:restart',
      'r02.0:arrive',
    ]);
  });

  it('ignores a late report after the clock moved on', () => {
    const game = playing();
    game.act({ type: 'room/enter', roomId: 'r01' });
    game.act({ type: 'machine/touch' });
    game.solve('5');
    game.clock.now += tuning.presentationTimeoutMs;
    game.act({ type: 'clock/tick' });
    const restarting = game.store.getState().room;
    expect(restarting?.stage.phase).toBe('restart');
    game.act({ type: 'presentation/done', roomId: 'r01', stage: 0, phase: 'locked' });
    expect(game.store.getState().room).toBe(restarting);
  });

  it('leaves the state alone on a tick or a touch that does nothing', () => {
    const game = playing();
    game.act({ type: 'room/enter', roomId: 'r01' });
    game.act({ type: 'machine/touch' });
    const before = game.store.getState().room;
    game.act({ type: 'clock/tick' });
    game.act({ type: 'machine/touch' });
    expect(game.store.getState().room).toBe(before);
    for (const action of [
      { type: 'clock/tick' },
      { type: 'machine/touch' },
      { type: 'stage/reset' },
      { type: 'presentation/done', roomId: 'r01', stage: 0, phase: 'locked' },
    ] as const) {
      const { state, events } = reduce(initialGameState(), action, fixedCtx);
      expect(state).toEqual(initialGameState());
      expect(events).toEqual([]);
    }
  });

  it('resets the stage in play through dispatch, and not once it is locked', () => {
    const game = playing();
    game.act({ type: 'room/enter', roomId: 'r02', stage: 1 });
    game.act({ type: 'machine/touch' });
    game.act({ type: 'dial/set', x: 9 });
    game.solve('9'); // a wrong answer jams the machine
    expect(game.store.getState().room?.stage.jam).toEqual({ kind: 'line' });
    game.seen.length = 0;
    game.act({ type: 'stage/reset' });
    const room = game.store.getState().room as RoomState;
    expect(room.stageIndex).toBe(1);
    expect(room.stage).toMatchObject({ phase: 'open', dialX: 0, jam: null, machineProgress: [0] });
    expect(room.stage.lines).toHaveLength(1);
    expect(game.seen).toEqual([{ type: 'StageReset', roomId: 'r02', stage: 1 }]);
    game.solve('15');
    const locked = game.store.getState().room;
    expect(locked?.stage.phase).toBe('locked');
    game.act({ type: 'stage/reset' });
    expect(game.store.getState().room).toBe(locked);
  });

  it('enters any room at any stage (the dev panel)', () => {
    const game = playing();
    game.act({ type: 'room/enter', roomId: 'r02', stage: 1 });
    expect(game.phases).toEqual(['r02.1:arrive']);
    expect(game.seen).toEqual([{ type: 'StageArrived', roomId: 'r02', stage: 1 }]);
    expect(machineView(game.store.getState().room)?.partsStarted).toBe(1);
  });
});

describe('predict before the dial opens (story 1.9)', () => {
  function inRoomThree(stage = 0) {
    const seen: DomainEvent[] = [];
    const store = createGameStore({
      makeCtx: () => fixedCtx,
      effects: [(event) => isRoomEvent(event) && seen.push(event)],
    });
    const act = (action: Action) => store.getState().dispatch(action);
    const solve = (answer: string) => {
      for (let line = 0; line < 2; line += 1) {
        for (const char of answer) {
          const token = tokenFromChar(char);
          if (token) act({ type: 'notebook/type', token });
        }
        act({ type: 'notebook/enter' });
      }
    };
    const presented = () => {
      const room = store.getState().room as RoomState;
      const { phase } = room.stage;
      if (phase !== 'locked' && phase !== 'restart') throw new Error(`nothing plays in ${phase}`);
      act({ type: 'presentation/done', roomId: room.spec.id, stage: room.stageIndex, phase });
    };
    act({ type: 'room/enter', roomId: 'r03', stage });
    return { store, seen, act, solve, presented, stage: () => store.getState().room?.stage };
  }

  it('pokes 6–9, pins, confirms, and the machine tests the pin at 14: room 3, stage 1', () => {
    const game = inRoomThree();
    game.act({ type: 'machine/touch' });
    expect(game.stage()?.phase).toBe('poke');
    for (const x of [7, 8, 9, 10, 14]) game.act({ type: 'dial/set', x });
    expect(game.stage()?.dialX).toBe(9);
    game.act({ type: 'notebook/type', token: '1' });
    expect(game.stage()?.draft).toEqual([]);
    game.act({ type: 'pin/set', value: { kind: 'x', x: 13 } });
    game.act({ type: 'pin/set', value: { kind: 'x', x: 14 } });
    expect(game.stage()).toMatchObject({ phase: 'pin', dialX: 9 });
    // Story 1.14: the dial keeps turning inside its window while he pins.
    game.act({ type: 'dial/set', x: 8 });
    game.act({ type: 'dial/set', x: 10 });
    expect(game.stage()?.dialX).toBe(8);
    game.seen.length = 0;
    game.act({ type: 'pin/confirm' });
    expect(game.stage()).toMatchObject({
      phase: 'open',
      dialOpen: { min: 6, max: 20 },
      dialX: 14,
    });
    expect(game.seen).toEqual([{ type: 'PredictionMade', roomId: 'r03', stage: 0, right: true }]);
    expect(game.store.getState().save.economy).toMatchObject({
      parts: tuning.predictionParts,
      paidPredictions: ['r03:0'],
    });
    game.seen.length = 0;
    game.act({ type: 'dial/set', x: 13 });
    game.act({ type: 'dial/set', x: 14 });
    expect(game.seen).toEqual([
      { type: 'DialNotch', x: 13 },
      { type: 'DialNotch', x: 14 },
      { type: 'PansLevel', roomId: 'r03', stage: 0, x: 14 },
    ]);
    game.solve('14');
    expect(game.stage()?.phase).toBe('locked');
    game.presented();
    expect(game.store.getState().room?.stageIndex).toBe(1);
  });

  it('wiggles the pin once, the first time the game offers it, and never again', () => {
    const game = inRoomThree();
    expect(
      game.store.getState().save.progress.firstUse.filter((id) => !id.startsWith('handover-')),
    ).toEqual([]);
    expect(game.stage()?.hintLevel).toBe(0);
    game.act({ type: 'machine/touch' });
    expect(game.stage()?.hintLevel).toBe(1);
    expect(pinView(game.store.getState().room)?.wiggle).toBe(true);
    expect(
      game.store.getState().save.progress.firstUse.filter((id) => !id.startsWith('handover-')),
    ).toEqual(['pin']);
    game.act({ type: 'stage/reset' });
    expect(
      game.store.getState().save.progress.firstUse.filter((id) => !id.startsWith('handover-')),
    ).toEqual(['pin']);
    game.act({ type: 'pin/set', value: { kind: 'x', x: 14 } });
    game.act({ type: 'pin/confirm' });
    expect(pinView(game.store.getState().room)?.wiggle).toBe(false);
    game.act({ type: 'dial/set', x: 14 });
    game.solve('14');
    game.presented();
    game.act({ type: 'machine/touch' });
    expect(game.stage()).toMatchObject({ phase: 'pin', hintLevel: 0 });
    expect(pinView(game.store.getState().room)?.wiggle).toBe(false);
  });

  it('keeps a locked pin on reset and opens the full dial, so he is never left with a short dial', () => {
    const game = inRoomThree();
    game.act({ type: 'machine/touch' });
    game.act({ type: 'pin/set', value: { kind: 'x', x: 11 } });
    game.act({ type: 'pin/confirm' });
    expect(game.seen.at(-1)).toEqual({
      type: 'PredictionMade',
      roomId: 'r03',
      stage: 0,
      right: false,
    });
    game.act({ type: 'dial/set', x: 12 });
    game.act({ type: 'stage/reset' });
    expect(game.stage()).toMatchObject({
      phase: 'open',
      dialX: 6,
      dialOpen: { min: 6, max: 20 },
      pin: { value: { kind: 'x', x: 11 }, locked: true, resolved: true },
    });
    game.act({ type: 'pin/set', value: { kind: 'x', x: 14 } });
    expect(game.stage()?.pin?.value).toEqual({ kind: 'x', x: 11 });
    game.seen.length = 0;
    game.act({ type: 'dial/set', x: 14 });
    expect(game.seen.map((event) => event.type)).toEqual(['DialNotch', 'PansLevel']);
    // A wrong pin costs nothing and pays nothing.
    expect(game.store.getState().save.economy.parts).toBe(0);
  });

  it("pins a direction before the dial moves in stage 2; the machine turns it to the dial's maximum", () => {
    const game = inRoomThree(1);
    game.act({ type: 'dial/set', x: 1 });
    expect(game.stage()?.dialX).toBe(0);
    game.act({ type: 'machine/touch' });
    expect(game.stage()?.phase).toBe('pin');
    game.act({ type: 'dial/set', x: 1 });
    expect(game.stage()?.dialX).toBe(0);
    game.act({ type: 'pin/set', value: { kind: 'choice', index: 1 } });
    game.act({ type: 'dial/set', x: 1 });
    expect(game.stage()?.dialX).toBe(0);
    game.seen.length = 0;
    game.act({ type: 'pin/confirm' });
    expect(game.seen).toEqual([{ type: 'PredictionMade', roomId: 'r03', stage: 1, right: true }]);
    expect(game.stage()).toMatchObject({ phase: 'open', dialX: 20 });
    game.seen.length = 0;
    game.act({ type: 'dial/set', x: 19 });
    expect(game.seen).toEqual([{ type: 'DialNotch', x: 19 }]);
  });

  it('pays 2 parts for a right pin once per stage, and nothing for a wrong one (story 1.14)', () => {
    const game = inRoomThree();
    const economy = () => game.store.getState().save.economy;
    expect(economy()).toEqual(createEconomy());
    game.act({ type: 'machine/touch' });
    game.act({ type: 'pin/set', value: { kind: 'x', x: 14 } });
    game.act({ type: 'pin/confirm' });
    expect(economy()).toMatchObject({ parts: 2, paidPredictions: ['r03:0'] });
    // Reset keeps the locked pin, so there is nothing to pin again in this stage…
    game.act({ type: 'stage/reset' });
    game.act({ type: 'pin/confirm' });
    expect(economy()).toMatchObject({ parts: 2, paidPredictions: ['r03:0'] });
    // …and entering the stage afresh and pinning right again earns nothing more.
    game.act({ type: 'room/enter', roomId: 'r03' });
    game.act({ type: 'machine/touch' });
    game.act({ type: 'pin/set', value: { kind: 'x', x: 14 } });
    game.act({ type: 'pin/confirm' });
    expect(economy()).toMatchObject({ parts: 2, paidPredictions: ['r03:0'] });
    // A wrong pin in the next stage changes nothing.
    game.act({ type: 'room/enter', roomId: 'r03', stage: 1 });
    game.act({ type: 'machine/touch' });
    game.act({ type: 'pin/set', value: { kind: 'choice', index: 0 } });
    const before = game.store.getState().save;
    game.act({ type: 'pin/confirm' });
    expect(game.store.getState().save).toBe(before);
  });

  it('earns Balance when room 3 restarts, held in memory until saving arrives', () => {
    const game = inRoomThree(1);
    game.act({ type: 'machine/touch' });
    game.act({ type: 'pin/set', value: { kind: 'choice', index: 0 } });
    game.act({ type: 'pin/confirm' });
    game.solve('14');
    expect(game.seen.filter((event) => event.type === 'PredictionMade')).toEqual([
      { type: 'PredictionMade', roomId: 'r03', stage: 1, right: false },
    ]);
    expect(game.store.getState().save.progress.tools).toEqual([]);
    game.presented();
    expect(game.stage()?.phase).toBe('restart');
    expect(game.store.getState().save.progress.tools).toEqual(['balance']);
    game.presented();
    // Room 3's story card (story 2.5), then room 4, the water wheel, with Balance kept.
    game.act({ type: 'story/next' });
    expect(game.store.getState().room?.spec.id).toBe('r04');
    expect(game.stage()?.phase).toBe('arrive');
    expect(game.store.getState().save.progress.tools).toEqual(['balance']);
  });

  it('leaves the state alone on a pin action that does nothing', () => {
    const game = inRoomThree();
    const before = game.store.getState();
    game.act({ type: 'pin/confirm' });
    game.act({ type: 'pin/set', value: { kind: 'x', x: 14 } });
    expect(game.store.getState().room).toBe(before.room);
    expect(game.store.getState().save).toBe(before.save);
  });
});

describe('balance with the tray (story 1.10; both sides at once, story 1.15)', () => {
  /**
   * Room 4 as a stage Try values could finish, on the dial of 0–6 it had until Luka ran it
   * past the answer: the tray waits there for the dial's end (story 1.15).
   */
  const triedWheel: RoomSpec = {
    ...r04,
    stages: [
      {
        ...(r04.stages[0] as StageSpec),
        dial: { min: 0, max: 6, step: 1 },
        ways: ['try', 'balance'],
      },
    ],
  };

  /**
   * Room 4 (or `spec` in its place) with Balance earned (as room 3 earns it), open after his
   * touch. Story 1.16 took its pin away (until then this locked the pin at 9 first).
   */
  function inRoomFour(firstUse: FirstUseId[] = ['pin'], spec?: RoomSpec) {
    const seen: DomainEvent[] = [];
    const initial = initialGameState();
    const store = createGameStore({
      makeCtx: () => fixedCtx,
      effects: [(event) => isRoomEvent(event) && seen.push(event)],
      ...(spec ? { reduce: createReducer([spec]) } : {}),
      initialState: {
        ...initial,
        save: {
          ...initialGameState().save,
          progress: {
            roomsDone: [],
            started: [],
            onMap: false,
            told: [],
            ideasSeen: [],
            tools: ['balance'],
            firstUse,
          },
        },
      },
    });
    const act = (action: Action) => store.getState().dispatch(action);
    const stage = () => store.getState().room?.stage;
    const lines = () => stage()?.lines.map((line) => line.tokens.join('')) ?? [];
    const type = (text: string) => {
      for (const char of text) {
        const token = tokenFromChar(char);
        if (token) act({ type: 'notebook/type', token });
      }
      act({ type: 'notebook/enter' });
    };
    act({ type: 'room/enter', roomId: 'r04' });
    act({ type: 'machine/touch' });
    return { store, seen, act, stage, lines, type };
  }

  // Story 1.16: only where Try values can finish; room 4 offers it from the start.
  it('offers the tray once his dial reaches its end, 6, without levelling the pans, and wiggles it then', () => {
    const game = inRoomFour(['pin'], triedWheel);
    expect(game.stage()?.phase).toBe('open');
    expect(
      game.store.getState().save.progress.firstUse.filter((id) => !id.startsWith('handover-')),
    ).toEqual(['pin']);
    for (const x of [4, 5]) game.act({ type: 'dial/set', x });
    expect(
      game.store.getState().save.progress.firstUse.filter((id) => !id.startsWith('handover-')),
    ).toEqual(['pin']);
    game.act({ type: 'dial/set', x: 6 });
    expect(
      game.store.getState().save.progress.firstUse.filter((id) => !id.startsWith('handover-')),
    ).toEqual(['pin', 'tray']);
    expect(game.stage()?.hintLevel).toBe(1);
    game.act({ type: 'stage/reset' });
    expect(
      game.store.getState().save.progress.firstUse.filter((id) => !id.startsWith('handover-')),
    ).toEqual(['pin', 'tray']);
  });

  it('offers room 4’s tray from the start, and wiggles it then (story 1.16)', () => {
    const game = inRoomFour();
    expect(game.stage()).toMatchObject({ phase: 'open', dialX: 0, hintLevel: 1 });
    expect(
      game.store.getState().save.progress.firstUse.filter((id) => !id.startsWith('handover-')),
    ).toEqual(['pin', 'tray']);
  });

  it('offers it at once in a stage after the one where he met it', () => {
    const game = inRoomFour(['pin', 'tray']);
    expect(game.stage()?.balance.trayMet).toBe(true);
    const before = game.store.getState().room;
    game.act({ type: 'tray/step', kind: 'float', by: 1 });
    expect(game.store.getState().room).not.toBe(before);
  });

  // Story 1.16 rewrote the scale's part: 1.15 weighed it at the true x, level, no readouts.
  it('plays room 4: a float of 5 writes the move, then 2x = 18, and the scale stays at 6', () => {
    const game = inRoomFour();
    game.act({ type: 'dial/set', x: 6 });
    for (let i = 0; i < 4; i += 1) game.act({ type: 'tray/step', kind: 'float', by: 1 });
    expect(game.stage()?.tray).toEqual({ weight: 1, float: 5 });
    game.seen.length = 0;
    game.act({ type: 'tray/drop', kind: 'float' });
    expect(game.lines()).toEqual(['2x+5=23', '2x+5−5=23−5', '2x=18']);
    expect(game.seen).toEqual([
      { type: 'WayUsed', roomId: 'r04', stage: 0, way: 'balance' },
      { type: 'LineAccepted', roomId: 'r04', stage: 0, source: 'balance', progress: false },
      { type: 'LineAccepted', roomId: 'r04', stage: 0, source: 'balance', progress: true },
    ]);
    const room = game.store.getState().room as RoomState;
    expect(scaleView(room)).toMatchObject({
      x: 6,
      level: false,
      readouts: { left: '12', right: '18' },
    });
    expect(
      game.store.getState().save.progress.firstUse.filter((id) => !id.startsWith('handover-')),
    ).toEqual(['pin', 'tray', 'splitter']);
    // 2x = 18 is simplified, so he may write x = 9; the check line is then a blank (1.16).
    game.type('x=9');
    game.type('9');
    expect(game.lines().at(-1)).toBe('2·9+5=23');
    expect(game.stage()?.phase).toBe('locked');
  });

  // Story 1.16 rewrote this test: until then he could lock room 4 by typing x = 9 and the
  // check line at once. Now the answer waits for the pans to be simplified. Since Luka ran
  // the dial to 0–12, the slider at 9 levels the scale, and x = 9 is still refused.
  it('refuses x = 9 until the pans are simplified, though the slider levels there; then it locks', () => {
    const game = inRoomFour();
    game.act({ type: 'dial/set', x: 9 });
    game.act({ type: 'dial/set', x: 13 });
    expect(game.stage()?.dialX).toBe(9);
    expect(scaleView(game.store.getState().room as RoomState)).toMatchObject({
      level: true,
      readouts: { left: '23', right: '23' },
    });
    game.seen.length = 0;
    game.type('x=9');
    expect(game.lines()).toEqual(['2x+5=23']);
    expect(game.stage()).toMatchObject({ refused: 1, refusal: 'simplify', jam: null });
    expect(game.seen).toEqual([]);
    game.act({ type: 'tray/take', side: 'left', key: 'left-weight-0' });
    expect(game.lines().at(-1)).toBe('2x=18');
    // The draft kept x = 9, and the pans are simplified now.
    game.act({ type: 'notebook/enter' });
    expect(game.lines().at(-1)).toBe('x=9');
    game.type('9');
    expect(game.stage()?.phase).toBe('locked');
  });

  it('takes a piece off both sides, and slides back (ignores) a move it refuses', () => {
    const game = inRoomFour();
    game.act({ type: 'dial/set', x: 6 });
    game.act({ type: 'tray/take', side: 'left', key: 'left-weight-0' });
    expect(game.lines()).toEqual(['2x+5=23', '2x+5−5=23−5', '2x=18']);
    const before = game.store.getState().room;
    game.act({ type: 'tray/take', side: 'left', key: 'left-gear-0' });
    for (let i = 0; i < 30; i += 1) game.act({ type: 'tray/step', kind: 'float', by: 1 });
    const stepped = game.store.getState().room;
    expect(stepped?.stage.tray.float).toBe(31);
    game.act({ type: 'tray/drop', kind: 'float' });
    expect(game.store.getState().room).toBe(stepped);
    expect(before?.stage.pans).toBe(stepped?.stage.pans);
  });

  it('keeps the tray away without Balance, and the dev panel can grant it', () => {
    const game = inRoomFour();
    game.act({ type: 'dial/set', x: 6 });
    game.act({ type: 'dev/set-tools', tools: [] });
    expect(game.store.getState().save.progress.tools).toEqual([]);
    const before = game.store.getState().room;
    game.act({ type: 'tray/drop', kind: 'weight' });
    expect(game.store.getState().room).toBe(before);
    game.act({ type: 'dev/set-tools', tools: ['balance', 'balance'] });
    expect(game.store.getState().save.progress.tools).toEqual(['balance']);
    game.act({ type: 'tray/drop', kind: 'weight' });
    expect(game.store.getState().room?.stage.pans).not.toBe(before?.stage.pans);
  });

  it('wiggles the tray when the dev panel grants Balance in a stage that offers it', () => {
    const store = createGameStore({ makeCtx: () => fixedCtx });
    const act = (action: Action) => store.getState().dispatch(action);
    act({ type: 'room/enter', roomId: 'r01' });
    act({ type: 'machine/touch' });
    act({ type: 'dev/set-tools', tools: ['balance'] });
    // Room 1 offers neither yet: x stands alone, and the dial hasn't been to 10.
    expect({
      ...store.getState().save.progress,
      firstUse: store.getState().save.progress.firstUse.filter((id) => !id.startsWith('handover-')),
    }).toEqual({
      roomsDone: [],
      started: [],
      onMap: false,
      told: [],
      ideasSeen: [],
      tools: ['balance'],
      firstUse: [],
    });
    act({ type: 'dial/set', x: 10 });
    expect({
      ...store.getState().save.progress,
      firstUse: store.getState().save.progress.firstUse.filter((id) => !id.startsWith('handover-')),
    }).toEqual({
      roomsDone: [],
      started: [],
      onMap: false,
      told: [],
      ideasSeen: [],
      tools: ['balance'],
      firstUse: ['tray'],
    });
    expect(store.getState().room?.stage.hintLevel).toBe(1);
    const empty = reduce(
      initialGameState(),
      { type: 'dev/set-tools', tools: ['balance'] },
      fixedCtx,
    );
    expect(empty.state.save.progress.tools).toEqual(['balance']);
    expect(empty.state.room).toBeNull();
  });
});

describe('split both pans (story 1.11; refused when uneven, story 1.15)', () => {
  /**
   * Room 4 with Balance earned and the pin and tray met, open after his touch (no pin since
   * story 1.16); the splitter is new.
   */
  function inRoomFour() {
    const seen: DomainEvent[] = [];
    const initial = initialGameState();
    const store = createGameStore({
      makeCtx: () => fixedCtx,
      effects: [(event) => isRoomEvent(event) && seen.push(event)],
      initialState: {
        ...initial,
        save: {
          ...initialGameState().save,
          progress: {
            roomsDone: [],
            started: [],
            onMap: false,
            told: [],
            ideasSeen: [],
            tools: ['balance'],
            firstUse: ['pin', 'tray'],
          },
        },
      },
    });
    const act = (action: Action) => store.getState().dispatch(action);
    const stage = () => store.getState().room?.stage;
    const lines = () => stage()?.lines.map((line) => line.tokens.join('')) ?? [];
    const type = (text: string) => {
      for (const char of text) {
        const token = tokenFromChar(char);
        if (token) act({ type: 'notebook/type', token });
      }
      act({ type: 'notebook/enter' });
    };
    act({ type: 'room/enter', roomId: 'r04' });
    act({ type: 'machine/touch' });
    return { store, seen, act, stage, lines, type };
  }

  /** A float of 5 over the scale: the move and `2x = 18` are written. */
  function toTwoXEighteen(game: ReturnType<typeof inRoomFour>) {
    for (let i = 0; i < 4; i += 1) game.act({ type: 'tray/step', kind: 'float', by: 1 });
    game.act({ type: 'tray/drop', kind: 'float' });
    expect(game.lines()).toEqual(['2x+5=23', '2x+5−5=23−5', '2x=18']);
  }

  it('wiggles the splitter the first time it is offered, after the tray, and records it as met', () => {
    const game = inRoomFour();
    expect(
      game.store.getState().save.progress.firstUse.filter((id) => !id.startsWith('handover-')),
    ).toEqual(['pin', 'tray']);
    toTwoXEighteen(game);
    expect(
      game.store.getState().save.progress.firstUse.filter((id) => !id.startsWith('handover-')),
    ).toEqual(['pin', 'tray', 'splitter']);
    expect(game.stage()?.hintLevel).toBe(1);
  });

  // Story 1.15 review: AC 10 offers it "for the rest of the stage", however it was offered.
  it('keeps offering the splitter after a reset when a typed 2x = 18 offered it', () => {
    const game = inRoomFour();
    const offered = () => {
      const { room, save } = game.store.getState();
      return room !== null && splitterOffered(room, save.progress.tools);
    };
    expect(offered()).toBe(false);
    game.type('2x = 18');
    expect(game.lines()).toEqual(['2x+5=23', '2x=18']);
    expect(offered()).toBe(true);
    game.act({ type: 'stage/reset' });
    expect(game.lines()).toEqual(['2x+5=23']);
    expect(game.stage()?.balance.splitterSeen).toBe(true);
    expect(offered()).toBe(true);
  });

  it('sets 2–9 parts with its stepper', () => {
    const game = inRoomFour();
    toTwoXEighteen(game);
    for (let i = 0; i < 10; i += 1) game.act({ type: 'splitter/step', by: 1 });
    expect(game.stage()?.splitter).toBe(9);
    for (let i = 0; i < 10; i += 1) game.act({ type: 'splitter/step', by: -1 });
    expect(game.stage()?.splitter).toBe(2);
  });

  it('plays room 4: split by 2 at 2x = 18 writes 2x : 2 = 18 : 2, shows x = 9, and he locks it', () => {
    const game = inRoomFour();
    toTwoXEighteen(game);
    game.seen.length = 0;
    game.act({ type: 'splitter/split' });
    expect(game.lines()).toEqual(['2x+5=23', '2x+5−5=23−5', '2x=18', '2x:2=18:2']);
    expect(game.seen).toEqual([
      { type: 'WayUsed', roomId: 'r04', stage: 0, way: 'balance' },
      { type: 'LineAccepted', roomId: 'r04', stage: 0, source: 'balance', progress: true },
    ]);
    const room = game.store.getState().room as RoomState;
    expect(panPieces(room.stage.pans).left.map((piece) => piece.kind)).toEqual(['gear']);
    expect(panPieces(room.stage.pans).right).toEqual([
      { key: 'right-weight-0', kind: 'weight', value: { n: 9n, d: 1n } },
    ]);
    // Story 1.16: x alone brings up x = ☐, then 2 · ☐ + 5 = 23; he fills in 9 each time.
    expect(room.stage.templates).toHaveLength(2);
    game.type('9');
    expect(game.lines().at(-1)).toBe('x=9');
    game.type('9');
    expect(game.lines().at(-1)).toBe('2·9+5=23');
    expect(game.stage()?.phase).toBe('locked');
  });

  it('refuses an uneven split: nothing changes, nothing fires, and he can go on', () => {
    const game = inRoomFour();
    toTwoXEighteen(game);
    game.act({ type: 'splitter/step', by: 1 });
    game.act({ type: 'splitter/step', by: 1 });
    const before = game.store.getState().room;
    game.seen.length = 0;
    game.act({ type: 'splitter/split' });
    expect(game.store.getState().room).toBe(before);
    expect(game.seen).toEqual([]);
    expect(game.stage()?.jam).toBeNull();
    game.act({ type: 'splitter/step', by: -1 });
    game.act({ type: 'splitter/step', by: -1 });
    game.act({ type: 'splitter/split' });
    expect(game.lines().at(-1)).toBe('2x:2=18:2');
  });

  it('keeps the splitter away without Balance', () => {
    const game = inRoomFour();
    toTwoXEighteen(game);
    game.act({ type: 'dev/set-tools', tools: [] });
    const before = game.store.getState().room;
    game.act({ type: 'splitter/step', by: 1 });
    game.act({ type: 'splitter/split' });
    expect(game.store.getState().room).toBe(before);
  });
});

describe('the quality setting (story 1.12)', () => {
  const slowFrames = Array(120).fill(30);
  const fastFrames = Array(120).fill(16);

  function roomOneStore() {
    const store = createGameStore({ makeCtx: () => fixedCtx });
    store.getState().dispatch({ type: 'room/enter', roomId: 'r01' });
    return store;
  }

  it('saves the frame-time test’s pick, with no room events and the room untouched (story 2.1)', () => {
    const seen: DomainEvent[] = [];
    const store = createGameStore({ makeCtx: () => fixedCtx, effects: [(e) => seen.push(e)] });
    store.getState().dispatch({ type: 'room/enter', roomId: 'r01' });
    seen.length = 0;
    const room = store.getState().room;
    store.getState().dispatch({ type: 'quality/measured', frameTimesMs: slowFrames });
    expect(store.getState().ui.quality).toEqual({ measured: 'low', measuredMs: 30, forced: null });
    expect(store.getState().save.settings.quality).toBe('low');
    expect(store.getState().room).toBe(room);
    expect(seen).toEqual([{ type: 'SaveChanged' }]);
  });

  it('never saves a forced setting', () => {
    const store = roomOneStore();
    store.getState().dispatch({ type: 'quality/measured', frameTimesMs: fastFrames });
    store.getState().dispatch({ type: 'quality/force', quality: 'low' });
    expect(store.getState().save.settings.quality).toBe('high');
  });

  it('takes the test once per launch', () => {
    const store = roomOneStore();
    store.getState().dispatch({ type: 'quality/measured', frameTimesMs: fastFrames });
    store.getState().dispatch({ type: 'quality/measured', frameTimesMs: slowFrames });
    expect(store.getState().ui.quality.measured).toBe('high');
  });

  it('lets the dev panel force a setting over the test’s pick, and hand back', () => {
    const store = roomOneStore();
    store.getState().dispatch({ type: 'quality/measured', frameTimesMs: fastFrames });
    store.getState().dispatch({ type: 'quality/force', quality: 'low' });
    expect(qualityInUse(store.getState().ui.quality)).toBe('low');
    store.getState().dispatch({ type: 'quality/force', quality: null });
    expect(qualityInUse(store.getState().ui.quality)).toBe('high');
  });

  it('forgets both on reload: a fresh store starts with the test pending and nothing forced', () => {
    const store = roomOneStore();
    store.getState().dispatch({ type: 'quality/measured', frameTimesMs: slowFrames });
    store.getState().dispatch({ type: 'quality/force', quality: 'medium' });
    expect(createGameStore().getState().ui.quality).toEqual(initialQuality);
  });

  it('keeps the setting across rooms and stage resets', () => {
    const store = roomOneStore();
    store.getState().dispatch({ type: 'quality/measured', frameTimesMs: slowFrames });
    store.getState().dispatch({ type: 'quality/force', quality: 'medium' });
    const quality = store.getState().ui.quality;
    store.getState().dispatch({ type: 'stage/reset' });
    store.getState().dispatch({ type: 'room/enter', roomId: 'r02' });
    expect(store.getState().ui.quality).toBe(quality);
  });
});

describe('the tablet profile (story 1.13)', () => {
  it('draws the scene three times side by side when the dev panel asks, and once again after', () => {
    const seen: DomainEvent[] = [];
    const store = createGameStore({
      makeCtx: () => fixedCtx,
      effects: [(event) => isRoomEvent(event) && seen.push(event)],
    });
    store.getState().dispatch({ type: 'room/enter', roomId: 'r04' });
    const room = store.getState().room;
    seen.length = 0;
    store.getState().dispatch({ type: 'dev/set-copies', copies: 3 });
    expect(store.getState().ui.copies).toBe(3);
    expect(store.getState().room).toBe(room);
    expect(seen).toEqual([]);
    store.getState().dispatch({ type: 'room/enter', roomId: 'r01' });
    expect(store.getState().ui.copies).toBe(3);
    store.getState().dispatch({ type: 'dev/set-copies', copies: 1 });
    expect(store.getState().ui.copies).toBe(1);
  });
});

describe('effects', () => {
  it('has two effects so far: saving (story 2.1) and the play log (story 2.11)', () => {
    expect(effects).toHaveLength(2);
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

describe('a tapped line and the tray (room 7, story 2.10 review)', () => {
  it('takes the tapped line off the scale before a move on the pans', () => {
    const store = createGameStore({
      effects: [],
      initialState: {
        ...initialGameState(),
        save: {
          ...initialGameState().save,
          progress: { ...initialGameState().save.progress, tools: ['balance'] },
        },
      },
    });
    const act = (action: Action) => store.getState().dispatch(action);
    act({ type: 'room/enter', roomId: 'r07' });
    act({ type: 'machine/touch' });
    act({ type: 'pin/set', value: { kind: 'line', index: 2 } });
    act({ type: 'pin/confirm' });
    expect(store.getState().room?.stage.shownLine).toBe(2);
    act({ type: 'tray/drop', kind: 'weight' });
    expect(store.getState().room?.stage.shownLine).toBeNull();
  });
});
