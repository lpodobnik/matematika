import { describe, expect, it, vi } from 'vitest';
import { tuning } from '@/config/tuning';
import { r01 } from '@/content/rooms/r01-door-lift';
import { tokenFromChar } from '@/math/tokens';
import { dialView } from '@/room/dial';
import { machineView } from '@/room/machine';
import { panPieces } from '@/room/pieces';
import { pinView } from '@/room/pin';
import { scaleView } from '@/room/scale';
import type { RoomSpec, RoomState, StageSpec } from '@/room/types';
import type { Action } from '@/store/actions';
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

// Room 1 with a blank page, so he writes whole lines (room 1 itself fills blanks).
const firstStage = r01.stages[0] as StageSpec;
const freeRoomOne: RoomSpec = { ...r01, stages: [{ ...firstStage, fading: { try: 'blank' } }] };

describe('notebook actions', () => {
  function roomOneStore(seen: DomainEvent[] = [], list: readonly RoomSpec[] = [freeRoomOne]) {
    const store = createGameStore({
      makeCtx: () => fixedCtx,
      reduce: createReducer(list),
      effects: [(e) => seen.push(e)],
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
    const store = createGameStore({ makeCtx: () => fixedCtx, effects: [(e) => seen.push(e)] });
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
    expect(scaleView(store.getState().room as RoomState).readouts).toBeNull();
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
      effects: [(event) => seen.push(event)],
      ...(list ? { reduce: createReducer(list) } : {}),
    });
    const phases: string[] = [];
    const act = (action: Action) => {
      store.getState().dispatch(action);
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
    game.presented();
    expect(game.phases).toEqual([
      'r01.0:arrive',
      'r01.0:open',
      'r01.0:open',
      'r01.0:locked',
      'r01.0:restart',
      'r01.0:done',
    ]);
    expect(game.seen.map((event) => event.type)).toEqual([
      'StageArrived',
      'LineAccepted',
      'LineAccepted',
      'StageLocked',
      'RoomRestarted',
    ]);
    expect(game.store.getState().ui.screen).toBe('room');
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

  it('loads the next room in content when a restart ends: room 1, then room 2', () => {
    const game = playing();
    game.act({ type: 'room/enter', roomId: 'r01' });
    game.act({ type: 'machine/touch' });
    game.solve('5');
    game.presented();
    game.seen.length = 0;
    game.presented();
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
      effects: [(event) => seen.push(event)],
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

  it('pokes 6–9, pins, confirms, levels the pans at 14 and locks: room 3, stage 1', () => {
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
    game.act({ type: 'dial/set', x: 8 });
    expect(game.stage()?.dialX).toBe(9);
    game.act({ type: 'pin/confirm' });
    expect(game.stage()).toMatchObject({ phase: 'open', dialOpen: { min: 6, max: 20 } });
    game.seen.length = 0;
    game.act({ type: 'dial/set', x: 14 });
    expect(game.seen).toEqual([
      { type: 'DialNotch', x: 14 },
      { type: 'PansLevel', roomId: 'r03', stage: 0, x: 14 },
      { type: 'PredictionMade', roomId: 'r03', stage: 0, right: true },
    ]);
    game.solve('14');
    expect(game.stage()?.phase).toBe('locked');
    game.presented();
    expect(game.store.getState().room?.stageIndex).toBe(1);
  });

  it('wiggles the pin once, the first time the game offers it, and never again', () => {
    const game = inRoomThree();
    expect(game.store.getState().save.progress.firstUse).toEqual([]);
    expect(game.stage()?.hintLevel).toBe(0);
    game.act({ type: 'machine/touch' });
    expect(game.stage()?.hintLevel).toBe(1);
    expect(pinView(game.store.getState().room)?.wiggle).toBe(true);
    expect(game.store.getState().save.progress.firstUse).toEqual(['pin']);
    game.act({ type: 'stage/reset' });
    expect(game.store.getState().save.progress.firstUse).toEqual(['pin']);
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
    game.act({ type: 'dial/set', x: 12 });
    game.act({ type: 'stage/reset' });
    expect(game.stage()).toMatchObject({
      phase: 'open',
      dialX: 6,
      dialOpen: { min: 6, max: 20 },
      pin: { value: { kind: 'x', x: 11 }, locked: true, resolved: false },
    });
    game.act({ type: 'pin/set', value: { kind: 'x', x: 14 } });
    expect(game.stage()?.pin?.value).toEqual({ kind: 'x', x: 11 });
    game.seen.length = 0;
    game.act({ type: 'dial/set', x: 14 });
    expect(game.seen.at(-1)).toEqual({
      type: 'PredictionMade',
      roomId: 'r03',
      stage: 0,
      right: false,
    });
  });

  it('pins a direction before the dial moves in stage 2, then resolves it on the first notch', () => {
    const game = inRoomThree(1);
    game.act({ type: 'dial/set', x: 1 });
    expect(game.stage()?.dialX).toBe(0);
    game.act({ type: 'machine/touch' });
    expect(game.stage()?.phase).toBe('pin');
    game.act({ type: 'dial/set', x: 1 });
    expect(game.stage()?.dialX).toBe(0);
    game.act({ type: 'pin/set', value: { kind: 'choice', index: 1 } });
    game.act({ type: 'pin/confirm' });
    game.seen.length = 0;
    game.act({ type: 'dial/set', x: 1 });
    expect(game.seen).toEqual([
      { type: 'DialNotch', x: 1 },
      { type: 'PredictionMade', roomId: 'r03', stage: 1, right: true },
    ]);
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
    // Room 4, the water wheel, loads next, with Balance kept.
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

describe('balance with the tray (story 1.10)', () => {
  /** Room 4 with Balance earned (as room 3 earns it), the pin locked at 9, so it is open. */
  function inRoomFour() {
    const seen: DomainEvent[] = [];
    const initial = initialGameState();
    const store = createGameStore({
      makeCtx: () => fixedCtx,
      effects: [(event) => seen.push(event)],
      initialState: {
        ...initial,
        save: { progress: { tools: ['balance'], firstUse: ['pin'] } },
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
    act({ type: 'pin/set', value: { kind: 'x', x: 9 } });
    act({ type: 'pin/confirm' });
    return { store, seen, act, stage, lines, type };
  }

  it('offers the tray once the stage opens, and wiggles it on first use', () => {
    const game = inRoomFour();
    expect(game.stage()?.phase).toBe('open');
    expect(game.store.getState().save.progress.firstUse).toEqual(['pin', 'tray', 'splitter']);
    expect(game.stage()?.hintLevel).toBe(1);
    game.act({ type: 'stage/reset' });
    expect(game.store.getState().save.progress.firstUse).toEqual(['pin', 'tray', 'splitter']);
  });

  it('plays room 4: a float of 5 on the left writes nothing, and on the right writes 2x = 18', () => {
    const game = inRoomFour();
    for (let i = 0; i < 4; i += 1) game.act({ type: 'tray/step', kind: 'float', by: 1 });
    expect(game.stage()?.tray).toEqual({ weight: 1, float: 5 });
    game.seen.length = 0;
    game.act({ type: 'tray/drop', side: 'left', kind: 'float' });
    expect(game.lines()).toEqual(['2x+5=23']);
    expect(game.seen).toEqual([]);
    const tipped = game.store.getState().room as RoomState;
    expect(scaleView(tipped)).toMatchObject({ x: 0, actingOut: false, tilt: -15 });
    game.act({ type: 'tray/drop', side: 'right', kind: 'float' });
    expect(game.lines()).toEqual(['2x+5=23', '2x=18']);
    expect(game.seen).toEqual([
      { type: 'WayUsed', roomId: 'r04', stage: 0, way: 'balance' },
      { type: 'LineAccepted', roomId: 'r04', stage: 0, source: 'balance', progress: true },
    ]);
    game.type('x=9');
    game.type('2·9+5=23');
    expect(game.stage()?.phase).toBe('locked');
  });

  it("locks when he types x = 9 and the check line, though the dial can't reach 9", () => {
    const game = inRoomFour();
    game.act({ type: 'dial/set', x: 6 });
    game.act({ type: 'dial/set', x: 7 });
    expect(game.stage()?.dialX).toBe(6);
    game.type('x=9');
    game.type('2·9+5=23');
    expect(game.stage()?.phase).toBe('locked');
  });

  it('takes a piece off a pan, and slides back (ignores) a drop it refuses', () => {
    const game = inRoomFour();
    game.act({ type: 'tray/take', side: 'left', key: 'left-weight-0' });
    expect(
      scaleView(game.store.getState().room as RoomState).left.pieces.map((p) => p.kind),
    ).toEqual(['gear', 'gear']);
    const before = game.store.getState().room;
    game.act({ type: 'tray/take', side: 'left', key: 'left-gear-0' });
    for (let i = 0; i < 30; i += 1) game.act({ type: 'tray/step', kind: 'float', by: 1 });
    const stepped = game.store.getState().room;
    expect(stepped?.stage.tray.float).toBe(31);
    game.act({ type: 'tray/drop', side: 'right', kind: 'float' });
    expect(game.store.getState().room).toBe(stepped);
    expect(before?.stage.pans).toBe(stepped?.stage.pans);
  });

  it('keeps the tray away without Balance, and the dev panel can grant it', () => {
    const game = inRoomFour();
    game.act({ type: 'dev/set-tools', tools: [] });
    expect(game.store.getState().save.progress.tools).toEqual([]);
    const before = game.store.getState().room;
    game.act({ type: 'tray/drop', side: 'left', kind: 'weight' });
    expect(game.store.getState().room).toBe(before);
    game.act({ type: 'dev/set-tools', tools: ['balance', 'balance'] });
    expect(game.store.getState().save.progress.tools).toEqual(['balance']);
    game.act({ type: 'tray/drop', side: 'left', kind: 'weight' });
    expect(game.store.getState().room?.stage.pans).not.toBe(before?.stage.pans);
  });

  it('wiggles the tray when the dev panel grants Balance in an open stage he has not met it in', () => {
    const store = createGameStore({ makeCtx: () => fixedCtx });
    const act = (action: Action) => store.getState().dispatch(action);
    act({ type: 'room/enter', roomId: 'r01' });
    act({ type: 'machine/touch' });
    act({ type: 'dev/set-tools', tools: ['balance'] });
    expect(store.getState().save.progress).toEqual({
      tools: ['balance'],
      firstUse: ['tray', 'splitter'],
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

describe('split both pans (story 1.11)', () => {
  /** Room 4 with Balance earned and the pin and tray met, open; the splitter is new. */
  function inRoomFour() {
    const seen: DomainEvent[] = [];
    const initial = initialGameState();
    const store = createGameStore({
      makeCtx: () => fixedCtx,
      effects: [(event) => seen.push(event)],
      initialState: {
        ...initial,
        save: { progress: { tools: ['balance'], firstUse: ['pin', 'tray'] } },
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
    act({ type: 'pin/set', value: { kind: 'x', x: 9 } });
    act({ type: 'pin/confirm' });
    return { store, seen, act, stage, lines, type };
  }

  /** A float of 5 on each pan: `2x = 18` is written. */
  function toTwoXEighteen(game: ReturnType<typeof inRoomFour>) {
    for (let i = 0; i < 4; i += 1) game.act({ type: 'tray/step', kind: 'float', by: 1 });
    game.act({ type: 'tray/drop', side: 'left', kind: 'float' });
    game.act({ type: 'tray/drop', side: 'right', kind: 'float' });
    expect(game.lines()).toEqual(['2x+5=23', '2x=18']);
  }

  it('wiggles the splitter the first time it is available, and records it as met', () => {
    const game = inRoomFour();
    expect(game.store.getState().save.progress.firstUse).toEqual(['pin', 'tray', 'splitter']);
    expect(game.stage()?.hintLevel).toBe(1);
  });

  it('sets 2–9 parts with its stepper', () => {
    const game = inRoomFour();
    for (let i = 0; i < 10; i += 1) game.act({ type: 'splitter/step', by: 1 });
    expect(game.stage()?.splitter).toBe(9);
    for (let i = 0; i < 10; i += 1) game.act({ type: 'splitter/step', by: -1 });
    expect(game.stage()?.splitter).toBe(2);
  });

  it('plays room 4: split by 2 at 2x = 18 shows x = 9, nothing is written, and he locks it', () => {
    const game = inRoomFour();
    toTwoXEighteen(game);
    game.seen.length = 0;
    game.act({ type: 'splitter/split' });
    expect(game.lines()).toEqual(['2x+5=23', '2x=18']);
    expect(game.seen).toEqual([{ type: 'WayUsed', roomId: 'r04', stage: 0, way: 'balance' }]);
    const room = game.store.getState().room as RoomState;
    expect(panPieces(room.stage.pans).left.map((piece) => piece.kind)).toEqual(['gear']);
    expect(panPieces(room.stage.pans).right).toEqual([
      { key: 'right-weight-0', kind: 'weight', value: { n: 9n, d: 1n } },
    ]);
    game.type('x=9');
    game.type('2·9+5=23');
    expect(game.stage()?.phase).toBe('locked');
  });

  it('jams on an uneven split until he drags the splitter off', () => {
    const game = inRoomFour();
    toTwoXEighteen(game);
    game.act({ type: 'splitter/step', by: 1 });
    game.act({ type: 'splitter/step', by: 1 });
    game.seen.length = 0;
    game.act({ type: 'splitter/split' });
    expect(game.stage()?.jam).toEqual({ kind: 'split', parts: 4 });
    expect(game.seen).toEqual([{ type: 'MachineJammed', roomId: 'r04', kind: 'split' }]);
    const jammed = game.store.getState().room;
    game.act({ type: 'dial/set', x: 1 });
    game.act({ type: 'tray/drop', side: 'left', kind: 'weight' });
    game.act({ type: 'splitter/step', by: -1 });
    game.act({ type: 'splitter/split' });
    expect(game.store.getState().room).toBe(jammed);
    game.act({ type: 'splitter/lift' });
    expect(game.stage()?.jam).toBeNull();
    expect(game.stage()?.pans).toBe(jammed?.stage.pans);
    const lifted = game.store.getState().room;
    game.act({ type: 'splitter/lift' });
    expect(game.store.getState().room).toBe(lifted);
  });

  it('keeps the splitter away without Balance', () => {
    const game = inRoomFour();
    game.act({ type: 'dev/set-tools', tools: [] });
    const before = game.store.getState().room;
    game.act({ type: 'splitter/step', by: 1 });
    game.act({ type: 'splitter/split' });
    expect(game.store.getState().room).toBe(before);
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
