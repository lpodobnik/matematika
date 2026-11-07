// Story 6.2: what each domain event sounds like, and which machine loops play where.

import { describe, expect, it } from 'vitest';
import type { LoopLevels, SoundId } from '@/audio/index';
import { createAudioEffect, type SoundOut, soundOf } from '@/store/effects/audio';
import type { DomainEvent } from '@/store/events';
import { initialGameState } from '@/store/reducer';
import { createGameStore } from '@/store/store';
import type { GameState } from '@/store/types';

function recorder() {
  const played: SoundId[] = [];
  const loops: LoopLevels[] = [];
  const muted: boolean[] = [];
  const out: SoundOut = {
    play: (sound) => played.push(sound),
    setLoops: (levels) => loops.push(levels),
    setMuted: (m) => muted.push(m),
  };
  return { out, played, loops, muted };
}

function onScreen(
  screen: GameState['ui']['screen'],
  done: GameState['save']['progress']['roomsDone'] = [],
) {
  const s = initialGameState();
  return {
    ...s,
    save: { ...s.save, progress: { ...s.save.progress, roomsDone: done } },
    ui: { ...s.ui, screen },
  };
}

describe('the sound of each event (story 6.2)', () => {
  it.each<[DomainEvent, SoundId | null]>([
    [{ type: 'DialNotch', x: 3 }, 'tick'],
    [{ type: 'PansLevel', roomId: 'r01', stage: 0, x: 9 }, 'thunk'],
    [{ type: 'MachineJammed', roomId: 'r01', kind: 'line' }, 'hiss'],
    [{ type: 'StageLocked', roomId: 'r01', stage: 0 }, 'latch'],
    [{ type: 'RoomRestarted', roomId: 'r01' }, 'restart'],
    [{ type: 'PredictionMade', roomId: 'r03', stage: 0, right: true }, 'chime'],
    [{ type: 'PredictionMade', roomId: 'r03', stage: 0, right: false }, null],
    [{ type: 'DiceRolled', lairId: 'lair-20', dice: [1, 2] }, 'rattle'],
    [{ type: 'FightEnded', lairId: 'lair-20', won: true, parts: 3 }, 'chime'],
    [{ type: 'FightEnded', lairId: 'lair-20', won: false, parts: 0 }, 'hiss'],
    [{ type: 'LineAccepted', roomId: 'r01', stage: 0, source: 'typed', progress: true }, null],
    [{ type: 'SaveChanged' }, null],
    [{ type: 'TownAreaShown', area: 'square' }, null],
  ])('%o plays %s', (event, sound) => {
    expect(soundOf(event)).toBe(sound);
  });
});

describe('the audio effect (story 6.2)', () => {
  it('follows the mute setting on every event, even while loading, and plays nothing then', () => {
    const r = recorder();
    const effect = createAudioEffect(r.out);
    const loading = initialGameState();
    effect({ type: 'DialNotch', x: 1 }, loading);
    expect(r.played).toEqual([]);
    const mutedRoom = onScreen('room');
    mutedRoom.save = { ...mutedRoom.save, settings: { muted: true, quality: null } };
    effect({ type: 'SaveChanged' }, mutedRoom);
    expect(r.muted).toEqual([false, true]);
  });

  it('plays the street’s machines in the town, and stops them as the town goes', () => {
    const r = recorder();
    const effect = createAudioEffect(r.out);
    const town = onScreen('map', ['r01', 'r02', 'r03']);
    effect({ type: 'TownAreaShown', area: 'canal' }, town);
    expect(r.loops.at(-1)?.r03).toBe(1);
    expect(r.loops.at(-1)?.r01).toBeLessThan(0.5);
    // The same street again tells the engine nothing new.
    effect({ type: 'TownAreaShown', area: 'canal' }, town);
    expect(r.loops).toHaveLength(1);
    effect({ type: 'TownAreaShown', area: null }, onScreen('room', ['r01', 'r02', 'r03']));
    expect(r.loops.at(-1)).toEqual({});
  });

  it('brings the restarting room’s loop forward through its card, until the town takes over', () => {
    const r = recorder();
    const effect = createAudioEffect(r.out);
    effect(
      { type: 'RoomRestarted', roomId: 'r04' },
      onScreen('room', ['r01', 'r02', 'r03', 'r04']),
    );
    expect(r.played).toEqual(['restart']);
    expect(r.loops.at(-1)).toEqual({ r04: 1 });
    effect({ type: 'SaveChanged' }, onScreen('story', ['r01', 'r02', 'r03', 'r04']));
    expect(r.loops).toHaveLength(1);
    effect({ type: 'TownAreaShown', area: 'mill' }, onScreen('map', ['r01', 'r02', 'r03', 'r04']));
    expect(r.loops.at(-1)?.r04).toBe(1);
    expect(r.loops.at(-1)?.r01).toBeGreaterThan(0);
  });

  it('plays every machine together when room 13 restarts', () => {
    const r = recorder();
    const effect = createAudioEffect(r.out);
    effect({ type: 'RoomRestarted', roomId: 'r13' }, onScreen('room'));
    expect(Object.keys(r.loops.at(-1) ?? {})).toHaveLength(13);
  });

  it('goes quiet when he walks into a room', () => {
    const r = recorder();
    const effect = createAudioEffect(r.out);
    effect({ type: 'RoomRestarted', roomId: 'r02' }, onScreen('room', ['r01', 'r02']));
    effect({ type: 'StageArrived', roomId: 'r03', stage: 0 }, onScreen('room', ['r01', 'r02']));
    expect(r.loops.at(-1)).toEqual({});
  });
});

describe('the mute control and the town street in the store (story 6.2)', () => {
  it('keeps mute in the saved settings, and writes the save', () => {
    const events: DomainEvent[] = [];
    const store = createGameStore({ effects: [(event) => events.push(event)] });
    store.getState().dispatch({ type: 'boot/start', save: null, room: null });
    events.length = 0;
    store.getState().dispatch({ type: 'settings/mute', muted: true });
    expect(store.getState().save.settings.muted).toBe(true);
    expect(events).toEqual([{ type: 'SaveChanged' }]);
    // Muting again changes nothing.
    store.getState().dispatch({ type: 'settings/mute', muted: true });
    expect(events).toHaveLength(1);
    store.getState().dispatch({ type: 'settings/mute', muted: false });
    expect(store.getState().save.settings.muted).toBe(false);
  });

  it('tells the effects which street the town shows, changing no state', () => {
    const events: DomainEvent[] = [];
    const store = createGameStore({ effects: [(event) => events.push(event)] });
    const before = store.getState().save;
    store.getState().dispatch({ type: 'town/area', area: 'yard' });
    expect(events).toEqual([{ type: 'TownAreaShown', area: 'yard' }]);
    expect(store.getState().save).toBe(before);
  });
});
