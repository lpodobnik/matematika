// Story 2.1: the save effect writes after the events that change what is kept, and never
// for what he is only trying; and the game starts from the save (`boot/start`).

import { describe, expect, it } from 'vitest';
import { tokenFromChar } from '@/math/tokens';
import type { SaveV1 } from '@/save/schema';
import type { Action } from '@/store/actions';
import { createSaveEffect, SAVE_TRIGGERS } from '@/store/effects/save';
import { newSave } from '@/store/persist';
import { initialGameState } from '@/store/reducer';
import { createGameStore } from '@/store/store';

const at = '2026-11-06T10:00:00.000Z';

function savingGame() {
  const written: SaveV1[] = [];
  const effect = createSaveEffect({ write: (save) => written.push(save) > 0 }, () => at);
  const clock = { now: Date.parse(at) };
  const store = createGameStore({
    makeCtx: () => ({ now: clock.now, rng: { next: () => 0.5 } }),
    effects: [effect],
  });
  const act = (action: Action) => {
    clock.now += 500;
    store.getState().dispatch(action);
  };
  const write = (line: string) => {
    for (const char of line) {
      const token = tokenFromChar(char);
      if (!token) throw new Error(`no pad key for ${char}`);
      act({ type: 'notebook/type', token });
    }
    act({ type: 'notebook/enter' });
  };
  return { store, written, act, write };
}

describe('the save effect', () => {
  it('writes for the events that change what is kept, and nothing else', () => {
    expect([...SAVE_TRIGGERS].sort()).toEqual([
      'LineAccepted',
      'PredictionMade',
      'RoomLeft',
      'RoomRestarted',
      'SaveChanged',
      'StageArrived',
      'StageLocked',
      'StageReset',
    ]);
  });

  it('writes nothing while the game is still loading', () => {
    const written: SaveV1[] = [];
    const effect = createSaveEffect({ write: (save) => written.push(save) > 0 });
    effect({ type: 'SaveChanged' }, initialGameState());
    expect(written).toEqual([]);
  });

  it('writes as the game starts, after a committed line, and not for the dial or the draft', () => {
    const g = savingGame();
    g.act({ type: 'boot/start', save: null, room: null });
    expect(g.written).toHaveLength(1);
    expect(g.written[0]?.progress.room).toEqual({
      id: 'r01',
      stage: 0,
      lines: [],
      pin: null,
      splitterSeen: false,
    });
    expect(g.written[0]?.createdAt).toBe('2026-11-06T10:00:00.500Z');
    g.act({ type: 'machine/touch' });
    g.act({ type: 'dial/set', x: 1 });
    const afterFirstNotch = g.written.length;
    for (const x of [2, 3, 4, 5]) g.act({ type: 'dial/set', x });
    g.act({ type: 'notebook/type', token: '5' });
    expect(g.written).toHaveLength(afterFirstNotch);
    g.act({ type: 'notebook/enter' });
    expect(g.written.at(-1)?.progress.room?.lines).toEqual([
      { text: 'x=5', source: 'typed', progress: true },
    ]);
  });

  it('writes the room done and its tool when the restart begins, with no room in progress', () => {
    const g = savingGame();
    g.act({
      type: 'boot/start',
      save: null,
      room: { id: 'r03', stage: 1, lines: [], pin: null, splitterSeen: false },
    });
    g.act({ type: 'machine/touch' });
    g.act({ type: 'pin/set', value: { kind: 'choice', index: 1 } });
    g.act({ type: 'pin/confirm' });
    g.write('14');
    g.write('14');
    const room = g.store.getState().room;
    g.act({ type: 'presentation/done', roomId: 'r03', stage: 1, phase: 'locked' });
    expect(room?.stage.phase).toBe('locked');
    const last = g.written.at(-1);
    expect(last?.progress.roomsDone).toEqual(['r03']);
    expect(last?.progress.tools).toEqual(['balance']);
    expect(last?.progress.room).toBeNull();
    expect(last?.economy.paidPredictions).toEqual(['r03:1']);
  });
});

describe('starting the game (boot/start)', () => {
  it('starts a new game at room 1, stamped with the first launch', () => {
    const store = createGameStore({
      effects: [],
      makeCtx: () => ({ now: Date.parse(at), rng: { next: () => 0 } }),
    });
    store.getState().dispatch({ type: 'boot/start', save: null, room: null });
    expect(store.getState().ui.screen).toBe('room');
    expect(store.getState().room?.spec.id).toBe('r01');
    expect(store.getState().save.createdAt).toBe(at);
  });

  it('uses a saved quality pick, so the frame-time test doesn’t run again', () => {
    const store = createGameStore({ effects: [] });
    const save = { ...newSave(at), settings: { muted: false, quality: 'low' as const } };
    store.getState().dispatch({ type: 'boot/start', save, room: null });
    expect(store.getState().ui.quality.measured).toBe('low');
  });

  it('starts on the map when he left the game on the map (story 2.2)', () => {
    const store = createGameStore({ effects: [] });
    const save = newSave(at);
    store.getState().dispatch({
      type: 'boot/start',
      save: {
        ...save,
        character: { name: 'Ivo', look: 'look-1' as const },
        progress: {
          ...save.progress,
          roomsDone: ['r01', 'r02'],
          onMap: true,
          told: ['r01', 'r02'],
        },
      },
      room: null,
    });
    expect(store.getState().room).toBeNull();
    expect(store.getState().ui.screen).toBe('map');
  });

  it('shows the loading progress, clamped to 0–1', () => {
    const store = createGameStore({ effects: [] });
    store.getState().dispatch({ type: 'boot/progress', loaded: 0.4 });
    expect(store.getState().ui.loaded).toBe(0.4);
    store.getState().dispatch({ type: 'boot/progress', loaded: 3 });
    expect(store.getState().ui.loaded).toBe(1);
    expect(store.getState().ui.screen).toBe('loading');
  });
});

describe('a new game from the dev panel', () => {
  it('clears his progress, keeps the settings, and starts room 1', () => {
    const g = savingGame();
    const save = { ...newSave(at), settings: { muted: true, quality: 'medium' as const } };
    g.act({
      type: 'boot/start',
      save: { ...save, progress: { ...save.progress, roomsDone: ['r01'], tools: ['balance'] } },
      room: { id: 'r02', stage: 1, lines: [], pin: null, splitterSeen: false },
    });
    g.act({ type: 'dev/new-game' });
    const state = g.store.getState();
    expect(state.room?.spec.id).toBe('r01');
    expect(state.save.progress).toEqual({
      roomsDone: [],
      tools: [],
      firstUse: [],
      started: [],
      onMap: false,
      told: [],
      ideasSeen: [],
    });
    expect(state.save.settings).toEqual({ muted: true, quality: 'medium' });
    expect(g.written.at(-1)?.progress.room?.id).toBe('r01');
  });
});
