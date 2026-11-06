// Story 2.5: a room's story card the first time its restart ends, through the real store.

import { describe, expect, it } from 'vitest';
import { tokenFromChar } from '@/math/tokens';
import { decodeSave } from '@/save/decode';
import type { Action } from '@/store/actions';
import { fromSaveV1, newSave, toSaveV1 } from '@/store/persist';
import { createGameStore } from '@/store/store';
import type { GameState, SaveState } from '@/store/types';

const at = '2026-11-06T10:00:00.000Z';

function game(save: SaveState | null = null) {
  const clock = { now: 1_000 };
  const store = createGameStore({
    makeCtx: () => ({ now: clock.now, rng: { next: () => 0.5 } }),
    effects: [],
  });
  store.getState().dispatch({ type: 'boot/start', save, room: null });
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
  const playRoomOne = () => {
    act({ type: 'machine/touch' });
    for (const x of [1, 2, 3, 4, 5]) act({ type: 'dial/set', x });
    write('5');
    write('5');
    act({ type: 'presentation/done', roomId: 'r01', stage: 0, phase: 'locked' });
    act({ type: 'presentation/done', roomId: 'r01', stage: 0, phase: 'restart' });
  };
  const playRoomTwo = () => {
    act({ type: 'machine/touch' });
    act({ type: 'dial/set', x: 4 });
    write('4');
    write('4');
    act({ type: 'presentation/done', roomId: 'r02', stage: 0, phase: 'locked' });
    act({ type: 'machine/touch' });
    write('15');
    write('15');
    act({ type: 'presentation/done', roomId: 'r02', stage: 1, phase: 'locked' });
    act({ type: 'presentation/done', roomId: 'r02', stage: 1, phase: 'restart' });
  };
  return { store, act, playRoomOne, playRoomTwo };
}

function reload(state: GameState): GameState {
  const decoded = decodeSave(JSON.parse(JSON.stringify(toSaveV1(state, at))), at);
  if (!decoded) throw new Error('the save did not decode');
  const { save, room } = fromSaveV1(decoded);
  const store = createGameStore({ effects: [] });
  store.getState().dispatch({ type: 'boot/start', save, room });
  return store.getState();
}

describe('the story card (story 2.5)', () => {
  it('tells room 1’s lines when its restart ends, then the naming, then room 2', () => {
    const g = game();
    g.playRoomOne();
    expect(g.store.getState().ui.screen).toBe('story');
    expect(g.store.getState().room).toBeNull();
    g.act({ type: 'story/next' });
    expect(g.store.getState().save.progress.told).toEqual(['r01']);
    expect(g.store.getState().ui.screen).toBe('naming');
    g.act({ type: 'character/set', name: 'Ivo', look: 'look-1' });
    expect(g.store.getState().room?.spec.id).toBe('r02');
  });

  it('tells room 2’s lines, then room 3 follows', () => {
    const g = game();
    g.playRoomOne();
    g.act({ type: 'story/next' });
    g.act({ type: 'character/set', name: 'Ivo', look: 'look-1' });
    g.playRoomTwo();
    expect(g.store.getState().ui.screen).toBe('story');
    g.act({ type: 'story/next' });
    expect(g.store.getState().save.progress.told).toEqual(['r01', 'r02']);
    expect(g.store.getState().room?.spec.id).toBe('r03');
  });

  it('tells a room once: a replay goes straight on', () => {
    const save = newSave(at);
    const g = game({
      ...save,
      character: { name: 'Ivo', look: 'look-1' },
      progress: { ...save.progress, roomsDone: ['r01'], told: ['r01'], onMap: true },
    });
    g.act({ type: 'map/travel', node: 'r01' });
    g.playRoomOne();
    // Room 2 is next, with no card for room 1 again.
    expect(g.store.getState().ui.screen).toBe('room');
    expect(g.store.getState().room?.spec.id).toBe('r02');
  });

  it('comes back to the card after a reload, and a tap on it is the only way on', () => {
    const g = game();
    g.playRoomOne();
    const state = reload(g.store.getState());
    expect(state.ui.screen).toBe('story');
    expect(state.save.progress.told).toEqual([]);
    for (const action of [
      { type: 'map/travel', node: 'r01' },
      { type: 'map/open' },
      { type: 'character/set', name: 'Ivo', look: 'look-1' },
    ] as const) {
      g.act(action);
      expect(g.store.getState().ui.screen, action.type).toBe('story');
    }
  });

  it('tells a save from before this story every finished room’s lines, in order, once', () => {
    const save = newSave(at);
    const g = game({
      ...save,
      character: { name: 'Ivo', look: 'look-1' },
      progress: { ...save.progress, roomsDone: ['r01', 'r02'], tools: [] },
    });
    expect(g.store.getState().ui.screen).toBe('story');
    g.act({ type: 'story/next' });
    expect(g.store.getState().ui.screen).toBe('story');
    g.act({ type: 'story/next' });
    expect(g.store.getState().save.progress.told).toEqual(['r01', 'r02']);
    expect(g.store.getState().room?.spec.id).toBe('r03');
  });

  it('brings a save from before this story back to the map after its cards, if he was there', () => {
    const save = newSave(at);
    const g = game({
      ...save,
      character: { name: 'Ivo', look: 'look-1' },
      progress: { ...save.progress, roomsDone: ['r01', 'r02'], onMap: true },
    });
    g.act({ type: 'story/next' });
    expect(reload(g.store.getState()).ui.screen).toBe('story');
    g.act({ type: 'story/next' });
    expect(g.store.getState().ui.screen).toBe('map');
    expect(g.store.getState().room).toBeNull();
  });

  it('brings a save from before this story back to the room he was in, after its cards', () => {
    const save = newSave(at);
    const g = game();
    g.store.getState().dispatch({
      type: 'boot/start',
      save: {
        ...save,
        character: { name: 'Ivo', look: 'look-1' },
        progress: { ...save.progress, roomsDone: ['r01', 'r02', 'r03'], tools: ['balance'] },
      },
      room: { id: 'r01', stage: 0, lines: [], pin: null, splitterSeen: false },
    });
    for (let card = 0; card < 3; card += 1) {
      expect(g.store.getState().ui.screen).toBe('story');
      g.act({ type: 'story/next' });
    }
    expect(g.store.getState().ui.screen).toBe('room');
    expect(g.store.getState().room?.spec.id).toBe('r01');
    expect(g.store.getState().save.progress.started).toEqual([]);
  });

  it('starts the log over with a new game from the dev panel', () => {
    const g = game();
    g.playRoomOne();
    g.act({ type: 'story/next' });
    g.act({ type: 'dev/new-game' });
    expect(g.store.getState().save.progress.told).toEqual([]);
    expect(g.store.getState().room?.spec.id).toBe('r01');
  });
});
