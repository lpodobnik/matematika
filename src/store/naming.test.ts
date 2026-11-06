// Story 2.4: the naming after room 1, through the real store. Room 1's restart ends on the
// naming; his name and look are saved and the next room follows; a reload comes back to it.

import { describe, expect, it } from 'vitest';
import { tokenFromChar } from '@/math/tokens';
import { decodeSave } from '@/save/decode';
import type { Action } from '@/store/actions';
import type { DomainEvent } from '@/store/events';
import { fromSaveV1, newSave, toSaveV1 } from '@/store/persist';
import { createGameStore } from '@/store/store';
import type { GameState, SaveState } from '@/store/types';

const at = '2026-11-06T10:00:00.000Z';

function game(save: SaveState | null = null) {
  const clock = { now: 1_000 };
  const seen: DomainEvent[] = [];
  const store = createGameStore({
    makeCtx: () => ({ now: clock.now, rng: { next: () => 0.5 } }),
    effects: [(event) => seen.push(event)],
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
  /** Room 1 from the start, to the end of its restart. */
  const playRoomOne = () => {
    act({ type: 'machine/touch' });
    for (const x of [1, 2, 3, 4, 5]) act({ type: 'dial/set', x });
    write('5');
    write('5');
    act({ type: 'presentation/done', roomId: 'r01', stage: 0, phase: 'locked' });
    act({ type: 'presentation/done', roomId: 'r01', stage: 0, phase: 'restart' });
    // Room 1's story card first (story 2.5).
    act({ type: 'story/next' });
  };
  return { store, seen, act, write, playRoomOne };
}

function reload(state: GameState): GameState {
  const decoded = decodeSave(JSON.parse(JSON.stringify(toSaveV1(state, at))), at);
  if (!decoded) throw new Error('the save did not decode');
  const { save, room } = fromSaveV1(decoded);
  const store = createGameStore({ effects: [] });
  store.getState().dispatch({ type: 'boot/start', save, room });
  return store.getState();
}

describe('the naming after room 1 (story 2.4)', () => {
  it('comes when room 1’s restart ends, before room 2', () => {
    const g = game();
    expect(g.store.getState().room?.spec.id).toBe('r01');
    g.playRoomOne();
    expect(g.store.getState().ui.screen).toBe('naming');
    expect(g.store.getState().room).toBeNull();
    expect(g.store.getState().save.progress.roomsDone).toEqual(['r01']);
  });

  it('saves his name and look, then room 2 follows', () => {
    const g = game();
    g.playRoomOne();
    g.seen.length = 0;
    g.act({ type: 'character/set', name: '  Ivo   Horvat ', look: 'look-4' });
    const state = g.store.getState();
    expect(state.save.character).toEqual({ name: 'Ivo Horvat', look: 'look-4' });
    expect(state.ui.screen).toBe('room');
    expect(state.room?.spec.id).toBe('r02');
    expect(g.seen.map((event) => event.type)).toEqual(['StageArrived', 'SaveChanged']);
  });

  it('keeps the name and look through a reload, and never asks again', () => {
    const g = game();
    g.playRoomOne();
    g.act({ type: 'character/set', name: 'Lana', look: 'look-2' });
    const state = reload(g.store.getState());
    expect(state.save.character).toEqual({ name: 'Lana', look: 'look-2' });
    expect(state.ui.screen).toBe('room');
    expect(state.room?.spec.id).toBe('r02');
  });

  it('refuses an empty name, an unknown look, and a naming outside the naming screen', () => {
    const g = game();
    // In room 1, before the naming: nothing happens.
    g.act({ type: 'character/set', name: 'Ivo', look: 'look-1' });
    expect(g.store.getState().save.character).toEqual({ name: null, look: null });
    expect(g.store.getState().room?.spec.id).toBe('r01');
    g.playRoomOne();
    const before = g.store.getState();
    g.act({ type: 'character/set', name: '   ', look: 'look-1' });
    g.act({ type: 'character/set', name: 'Ivo', look: 'look-9' as never });
    const after = g.store.getState();
    expect(after.save).toBe(before.save);
    expect(after.ui).toBe(before.ui);
    expect(after.room).toBeNull();
  });

  it('comes back after a reload on the naming, or in room 1’s restart', () => {
    const g = game();
    g.act({ type: 'machine/touch' });
    for (const x of [1, 2, 3, 4, 5]) g.act({ type: 'dial/set', x });
    g.write('5');
    g.write('5');
    g.act({ type: 'presentation/done', roomId: 'r01', stage: 0, phase: 'locked' });
    expect(g.store.getState().room?.stage.phase).toBe('restart');
    // Room 1's story card comes first (story 2.5), then the naming.
    expect(reload(g.store.getState()).ui.screen).toBe('story');
    g.act({ type: 'presentation/done', roomId: 'r01', stage: 0, phase: 'restart' });
    expect(reload(g.store.getState()).ui.screen).toBe('story');
    g.act({ type: 'story/next' });
    expect(reload(g.store.getState()).ui.screen).toBe('naming');
  });

  it('asks a save from before the naming first, even with a room in progress, then resumes it', () => {
    const save = newSave(at);
    const g = game();
    g.store.getState().dispatch({
      type: 'boot/start',
      save: { ...save, progress: { ...save.progress, roomsDone: ['r01'], told: ['r01'] } },
      room: { id: 'r02', stage: 1, lines: [], pin: null, splitterSeen: false },
    });
    // The room waits under the naming, and is still saved as the room in progress.
    expect(g.store.getState().ui.screen).toBe('naming');
    expect(g.store.getState().room?.spec.id).toBe('r02');
    expect(reload(g.store.getState()).ui.screen).toBe('naming');
    g.act({ type: 'character/set', name: 'Ivo', look: 'look-1' });
    expect(g.store.getState().ui.screen).toBe('room');
    expect(g.store.getState().room?.spec.id).toBe('r02');
    expect(g.store.getState().room?.stageIndex).toBe(1);
    expect(g.store.getState().save.progress.started).toEqual([]);
  });

  it('asks a save from before the naming once, then shows the map when no room is left', () => {
    const save = newSave(at);
    const g = game({
      ...save,
      progress: {
        ...save.progress,
        roomsDone: ['r01', 'r02', 'r03', 'r04'],
        told: ['r01', 'r02', 'r03', 'r04'],
        tools: ['balance'],
      },
    });
    expect(g.store.getState().ui.screen).toBe('naming');
    g.act({ type: 'character/set', name: 'Ivo', look: 'look-1' });
    expect(g.store.getState().ui.screen).toBe('map');
    expect(g.store.getState().save.character.name).toBe('Ivo');
  });
});
