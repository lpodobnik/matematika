// Story 2.2: the map through the real store. He leaves a room halfway and comes back to its
// lines (FR26), travels only to rooms he can reach (FR27), and a reload keeps both.

import { describe, expect, it } from 'vitest';
import { tokenFromChar } from '@/math/tokens';
import type { RoomState } from '@/room/types';
import { decodeSave } from '@/save/decode';
import type { Action } from '@/store/actions';
import type { DomainEvent } from '@/store/events';
import { fromSaveV1, newSave, toSaveV1 } from '@/store/persist';
import { createGameStore } from '@/store/store';
import type { GameState } from '@/store/types';

const at = '2026-11-06T10:00:00.000Z';

function game(roomsDone: GameState['save']['progress']['roomsDone'] = ['r01', 'r02']) {
  const clock = { now: 1_000 };
  const seen: DomainEvent[] = [];
  const store = createGameStore({
    makeCtx: () => ({ now: clock.now, rng: { next: () => 0.5 } }),
    effects: [(event) => seen.push(event)],
  });
  const save = newSave(at);
  store.getState().dispatch({
    type: 'boot/start',
    save: { ...save, progress: { ...save.progress, roomsDone, onMap: true } },
    room: null,
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
  return { store, seen, act, write };
}

function reload(state: GameState): GameState {
  const decoded = decodeSave(JSON.parse(JSON.stringify(toSaveV1(state, at))), at);
  if (!decoded) throw new Error('the save did not decode');
  const { save, room } = fromSaveV1(decoded);
  const store = createGameStore({ effects: [] });
  store.getState().dispatch({ type: 'boot/start', save, room });
  return store.getState();
}

const lines = (room: RoomState | null) => room?.stage.lines.map((line) => line.tokens.join(''));

describe('the map (story 2.2)', () => {
  it('starts on the map once he has finished a room', () => {
    const g = game();
    expect(g.store.getState().ui.screen).toBe('map');
    expect(g.store.getState().room).toBeNull();
  });

  it('travels at once to a room he can reach, and ignores the rest', () => {
    const g = game();
    for (const node of ['r04', 'r05', 'lair-20', 'workshop', 'foundry'] as const) {
      g.act({ type: 'map/travel', node });
      expect(g.store.getState().ui.screen, node).toBe('map');
    }
    g.act({ type: 'map/travel', node: 'r03' });
    expect(g.store.getState().ui.screen).toBe('room');
    expect(g.store.getState().room?.spec.id).toBe('r03');
  });

  it('plays a finished room again from the start', () => {
    const g = game();
    g.act({ type: 'map/travel', node: 'r01' });
    expect(g.store.getState().room?.spec.id).toBe('r01');
    expect(g.store.getState().room?.stage.phase).toBe('arrive');
  });

  it('keeps a room he leaves halfway, and resumes it after his last line (FR26)', () => {
    const g = game();
    g.act({ type: 'map/travel', node: 'r03' });
    g.act({ type: 'machine/touch' });
    g.act({ type: 'pin/set', value: { kind: 'x', x: 14 } });
    g.act({ type: 'pin/confirm' });
    g.write('14');
    const before = g.store.getState().room;
    g.seen.length = 0;
    g.act({ type: 'map/open' });
    expect(g.store.getState().ui.screen).toBe('map');
    expect(g.store.getState().room).toBeNull();
    expect(g.store.getState().save.progress.started).toEqual([
      expect.objectContaining({ id: 'r03', stage: 0, pin: { kind: 'x', x: 14 } }),
    ]);
    expect(g.seen.map((event) => event.type)).toEqual(['RoomLeft', 'SaveChanged']);
    g.act({ type: 'map/travel', node: 'r03' });
    const back = g.store.getState().room;
    expect(lines(back)).toEqual(lines(before));
    expect(back?.stage.pin).toEqual(before?.stage.pin);
    expect(back?.stage.phase).toBe('open');
    // The room in play is the room in progress, so it is off the list.
    expect(g.store.getState().save.progress.started).toEqual([]);
    // Paid once: coming back doesn't pay the pin again.
    expect(g.store.getState().save.economy.parts).toBe(2);
  });

  it('keeps a left room through a reload, and comes back to the map', () => {
    const g = game();
    g.act({ type: 'map/travel', node: 'r03' });
    g.act({ type: 'machine/touch' });
    g.act({ type: 'pin/set', value: { kind: 'x', x: 14 } });
    g.act({ type: 'pin/confirm' });
    g.write('14');
    g.act({ type: 'map/open' });
    const state = reload(g.store.getState());
    expect(state.ui.screen).toBe('map');
    expect(state.save.progress.started.map((room) => room.id)).toEqual(['r03']);
  });

  it('keeps a room left at its second stage, before its first line there', () => {
    const g = game(['r01']);
    g.act({ type: 'map/travel', node: 'r02' });
    g.act({ type: 'machine/touch' });
    g.act({ type: 'dial/set', x: 4 });
    g.write('4');
    g.write('4');
    g.act({ type: 'presentation/done', roomId: 'r02', stage: 0, phase: 'locked' });
    expect(g.store.getState().room?.stageIndex).toBe(1);
    g.act({ type: 'map/open' });
    expect(g.store.getState().save.progress.started).toEqual([
      expect.objectContaining({ id: 'r02', stage: 1, lines: [] }),
    ]);
    g.act({ type: 'map/travel', node: 'r02' });
    expect(g.store.getState().room?.stageIndex).toBe(1);
  });

  it('keeps room 1 left halfway on a first play, through a reload on the map', () => {
    const g = game([]);
    g.act({ type: 'map/travel', node: 'r01' });
    g.act({ type: 'machine/touch' });
    for (const x of [1, 2, 3, 4, 5]) g.act({ type: 'dial/set', x });
    g.write('5');
    const before = lines(g.store.getState().room);
    g.act({ type: 'map/open' });
    const state = reload(g.store.getState());
    expect(state.ui.screen).toBe('map');
    expect(state.save.progress.started.map((room) => room.id)).toEqual(['r01']);
    const back = createGameStore({ effects: [] });
    back.getState().dispatch({ type: 'boot/start', save: state.save, room: null });
    back.getState().dispatch({ type: 'map/travel', node: 'r01' });
    expect(lines(back.getState().room)).toEqual(before);
  });

  it('comes back to the map after he left room 1 with nothing written, on a first play', () => {
    const g = game([]);
    g.act({ type: 'map/travel', node: 'r01' });
    g.act({ type: 'machine/touch' });
    g.act({ type: 'map/open' });
    expect(g.store.getState().save.progress).toMatchObject({ started: [], onMap: true });
    expect(reload(g.store.getState()).ui.screen).toBe('map');
  });

  it('a new game from the dev panel forgets the room that just bloomed', () => {
    const g = game(['r01', 'r02', 'r03', 'r04']);
    g.act({ type: 'map/travel', node: 'r01' });
    g.act({ type: 'machine/touch' });
    for (const x of [1, 2, 3, 4, 5]) g.act({ type: 'dial/set', x });
    g.write('5');
    g.write('5');
    g.act({ type: 'presentation/done', roomId: 'r01', stage: 0, phase: 'locked' });
    g.act({ type: 'presentation/done', roomId: 'r01', stage: 0, phase: 'restart' });
    expect(g.store.getState().ui).toMatchObject({ screen: 'map', fresh: 'r01' });
    g.act({ type: 'dev/new-game' });
    expect(g.store.getState().ui.fresh).toBeNull();
  });

  it('keeps nothing for a room he leaves before writing anything', () => {
    const g = game();
    g.act({ type: 'map/travel', node: 'r03' });
    g.act({ type: 'machine/touch' });
    g.act({ type: 'dial/set', x: 7 });
    g.act({ type: 'map/open' });
    expect(g.store.getState().ui.screen).toBe('map');
    expect(g.store.getState().save.progress.started).toEqual([]);
  });

  it('can’t leave once the stage locks: the map comes when the restart ends', () => {
    const g = game(['r01']);
    g.act({ type: 'map/travel', node: 'r02' });
    g.act({ type: 'machine/touch' });
    g.act({ type: 'dial/set', x: 4 });
    g.write('4');
    g.write('4');
    expect(g.store.getState().room?.stage.phase).toBe('locked');
    g.act({ type: 'map/open' });
    expect(g.store.getState().ui.screen).toBe('room');
  });

  it('goes on to the next room after a restart, resuming it if he left it halfway', () => {
    const g = game();
    g.act({ type: 'map/travel', node: 'r03' });
    g.act({ type: 'machine/touch' });
    g.act({ type: 'pin/set', value: { kind: 'x', x: 14 } });
    g.act({ type: 'pin/confirm' });
    g.write('14');
    g.act({ type: 'map/open' });
    // He replays room 2; when its restart ends, room 3 comes back where he left it.
    g.act({ type: 'map/travel', node: 'r02' });
    g.act({ type: 'machine/touch' });
    g.write('4');
    g.write('4');
    g.act({ type: 'presentation/done', roomId: 'r02', stage: 0, phase: 'locked' });
    g.act({ type: 'machine/touch' });
    g.write('15');
    g.write('15');
    g.act({ type: 'presentation/done', roomId: 'r02', stage: 1, phase: 'locked' });
    g.act({ type: 'presentation/done', roomId: 'r02', stage: 1, phase: 'restart' });
    const room = g.store.getState().room;
    expect(g.store.getState().ui.screen).toBe('room');
    expect(room?.spec.id).toBe('r03');
    expect(lines(room)).toEqual(['x−6=8', 'x=14']);
    expect(g.store.getState().save.progress.started).toEqual([]);
  });

  it('ignores a tap on the map while he is in a room', () => {
    const g = game();
    g.act({ type: 'map/travel', node: 'r03' });
    const room = g.store.getState().room;
    g.act({ type: 'map/travel', node: 'r01' });
    expect(g.store.getState().room).toBe(room);
  });
});
