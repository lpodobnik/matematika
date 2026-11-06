import { describe, expect, it } from 'vitest';
import { createLogStorage, logKey } from '@/save/log-storage';
import { createPlayLogEffect } from '@/store/effects/playlog';
import { initialGameState } from '@/store/reducer';
import type { GameState } from '@/store/types';

function memory(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    storage: () => ({
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value);
      },
    }),
  };
}

const playing: GameState = {
  ...initialGameState(),
  ui: { ...initialGameState().ui, screen: 'room' },
};

describe('the play log effect (story 2.11)', () => {
  it('writes the room, way, prediction and wrong-line events to matematika:log', () => {
    const { data, storage } = memory();
    let minute = 0;
    const effect = createPlayLogEffect(
      createLogStorage(storage, (write) => write()),
      () => new Date(Date.UTC(2026, 10, 6, 10, minute++)).toISOString(),
    );
    effect({ type: 'StageArrived', roomId: 'r01', stage: 0 }, playing);
    effect({ type: 'DialNotch', x: 3 }, playing);
    effect({ type: 'LineWrong', roomId: 'r01', stage: 0, line: 'x = 4' }, playing);
    const log = JSON.parse(data.get(logKey) ?? '[]');
    expect(log.map((entry: { type: string }) => entry.type)).toEqual(['session', 'room', 'line']);
  });

  it('writes nothing on the loading screen', () => {
    const { data, storage } = memory();
    const effect = createPlayLogEffect(createLogStorage(storage, (write) => write()));
    effect({ type: 'StageArrived', roomId: 'r01', stage: 0 }, initialGameState());
    expect(data.has(logKey)).toBe(false);
  });

  it('reads a log leniently, and goes on from its last entry', () => {
    const at = new Date(Date.UTC(2026, 10, 6, 10, 0)).toISOString();
    const { data, storage } = memory({
      [logKey]: JSON.stringify([{ type: 'session', at }, { nonsense: true }, 7]),
    });
    const logs = createLogStorage(storage, (write) => write());
    expect(logs.read()).toEqual([{ type: 'session', at }]);
    const effect = createPlayLogEffect(logs, () =>
      new Date(Date.UTC(2026, 10, 6, 10, 5)).toISOString(),
    );
    effect({ type: 'RoomRestarted', roomId: 'r01' }, playing);
    // Five minutes after the last entry: no new session.
    expect(JSON.parse(data.get(logKey) ?? '[]').map((e: { type: string }) => e.type)).toEqual([
      'session',
      'room',
    ]);
    expect(createLogStorage(() => null).read()).toEqual([]);
  });
});

describe('the log on the device (story 2.11 review)', () => {
  it('never writes over a log it couldn’t read, and keeps it once it can', () => {
    const data = new Map([
      [logKey, JSON.stringify([{ type: 'session', at: '2026-11-06T10:00:00.000Z' }])],
    ]);
    let fail = true;
    const logs = createLogStorage(
      () => ({
        getItem: (key: string) => {
          if (fail) throw new Error('busy');
          return data.get(key) ?? null;
        },
        setItem: (key: string, value: string) => {
          data.set(key, value);
        },
      }),
      (write) => write(),
    );
    expect(logs.read()).toEqual([]);
    fail = false;
    logs.append([{ type: 'session', at: '2026-11-06T11:00:00.000Z' }]);
    // Read once it could be: the old entry is kept, and the new one joins it.
    expect(JSON.parse(data.get(logKey) ?? '[]')).toHaveLength(2);
  });

  it('writes a burst of entries once, later', () => {
    const { data, storage } = memory();
    const writes: (() => void)[] = [];
    const logs = createLogStorage(storage, (write) => writes.push(write));
    logs.append([{ type: 'session', at: '2026-11-06T10:00:00.000Z' }]);
    logs.append([{ type: 'room', roomId: 'r01', action: 'enter', at: '2026-11-06T10:00:01.000Z' }]);
    expect(writes).toHaveLength(1);
    expect(data.has(logKey)).toBe(false);
    writes[0]?.();
    expect(JSON.parse(data.get(logKey) ?? '[]')).toHaveLength(2);
  });
});
