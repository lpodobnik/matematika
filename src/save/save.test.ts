// Story 2.1: the save on the device. The decoder keeps what it can, migrations run in order,
// and the storage adapter never overwrites a save before reading it, keeps an unreadable
// save aside, never writes over a newer version's save, and keeps the game running when
// storage fails.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { errorLogKey } from '@/lib/error-log';
import { decodeSave } from '@/save/decode';
import { migrate } from '@/save/migrate';
import { corruptKeyPrefix, currentVersion, type SaveV1, saveKey } from '@/save/schema';
import { createSaveStorage } from '@/save/storage';

const now = '2026-11-06T10:00:00.000Z';

function memoryStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      items.set(key, value);
    },
  };
}

const sample: SaveV1 = {
  v: 1,
  createdAt: '2026-11-01T08:00:00.000Z',
  character: { name: 'Ivan', look: 'look-2' },
  progress: {
    roomsDone: ['r01', 'r02'],
    tools: [],
    started: [],
    onMap: false,
    firstUse: ['pin', 'handover-dial'],
    room: {
      id: 'r03',
      stage: 0,
      lines: [{ text: 'x=14', source: 'typed', progress: true }],
      pin: { kind: 'x', x: 14 },
      splitterSeen: false,
    },
  },
  economy: { parts: 2, upgrades: [], paidPredictions: ['r03:0'], piles: {}, lairs: {} },
  settings: { muted: false, quality: 'medium' },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('decodeSave', () => {
  it('reads a save back as it was written', () => {
    expect(decodeSave(JSON.parse(JSON.stringify(sample)), now)).toEqual(sample);
  });

  it('gives every missing field its default, so later fields need no new version', () => {
    expect(decodeSave({ v: 1 }, now)).toEqual({
      v: 1,
      createdAt: now,
      character: { name: null, look: null },
      progress: { roomsDone: [], tools: [], firstUse: [], room: null, started: [], onMap: false },
      economy: { parts: 0, upgrades: [], paidPredictions: [], piles: {}, lairs: {} },
      settings: { muted: false, quality: null },
    });
  });

  it('drops what it doesn’t know, field by field, and keeps the rest', () => {
    const decoded = decodeSave(
      {
        ...sample,
        progress: {
          ...sample.progress,
          roomsDone: ['r01', 'r99', 7, 'r01'],
          tools: ['balance', 'laser'],
          firstUse: ['pin', 'handover-nope'],
        },
        economy: { parts: -3, upgrades: ['steam', 'rocket'], paidPredictions: ['r03:0', 'x'] },
        settings: { muted: 'yes', quality: 'ultra' },
        character: { name: '   ', look: 5 },
      },
      now,
    );
    expect(decoded?.progress).toMatchObject({
      roomsDone: ['r01'],
      tools: ['balance'],
      firstUse: ['pin'],
    });
    expect(decoded?.economy).toMatchObject({
      parts: 0,
      upgrades: ['steam'],
      paidPredictions: ['r03:0'],
    });
    expect(decoded?.settings).toEqual({ muted: false, quality: null });
    expect(decoded?.character).toEqual({ name: null, look: null });
  });

  it('drops a room in progress that doesn’t fit, and keeps the rest of the save', () => {
    const bad = [
      { ...sample.progress.room, id: 'r99' },
      { ...sample.progress.room, stage: 1.5 },
      { ...sample.progress.room, lines: [{ text: '', source: 'typed', progress: true }] },
      { ...sample.progress.room, lines: [{ text: 'x=1', source: 'magic', progress: true }] },
      { ...sample.progress.room, pin: { kind: 'x', x: 'far' } },
    ];
    for (const room of bad) {
      const decoded = decodeSave({ ...sample, progress: { ...sample.progress, room } }, now);
      expect(decoded?.progress.room).toBeNull();
      expect(decoded?.progress.roomsDone).toEqual(['r01', 'r02']);
    }
  });

  it('trims a name and cuts it to 24 letters', () => {
    const decoded = decodeSave({ v: 1, character: { name: `  ${'a'.repeat(30)} ` } }, now);
    expect(decoded?.character.name).toBe('a'.repeat(24));
  });

  it('refuses only a value that isn’t an object', () => {
    for (const value of [null, 3, 'save', [1, 2]]) expect(decodeSave(value, now)).toBeNull();
  });
});

describe('migrate', () => {
  it('has no migrations yet: v1 is the first version', () => {
    expect(currentVersion).toBe(1);
    expect(migrate({ v: 1, a: 1 })).toEqual({ kind: 'current', save: { v: 1, a: 1 }, from: 1 });
  });

  it('runs the migrations in order from the save’s version to the current one', () => {
    const table = {
      1: (save: Record<string, unknown>) => ({ ...save, b: 'from v1' }),
      2: (save: Record<string, unknown>) => ({ ...save, c: `${save.b} then v2` }),
    };
    expect(migrate({ v: 1 }, table, 3)).toEqual({
      kind: 'current',
      save: { v: 3, b: 'from v1', c: 'from v1 then v2' },
      from: 1,
    });
    expect(migrate({ v: 2, b: 'old' }, table, 3)).toMatchObject({
      save: { v: 3, c: 'old then v2' },
    });
  });

  it('reads a save from a newer version as newer', () => {
    expect(migrate({ v: 4 }, {}, 3)).toEqual({ kind: 'newer', save: { v: 4 }, v: 4 });
  });

  it('finds unreadable: no version, a missing migration, or one that throws', () => {
    expect(migrate({})).toEqual({ kind: 'unreadable' });
    expect(migrate({ v: 0 })).toEqual({ kind: 'unreadable' });
    expect(migrate({ v: 1 }, {}, 2)).toEqual({ kind: 'unreadable' });
    const throws = {
      1: () => {
        throw new Error('broken');
      },
    };
    expect(migrate({ v: 1 }, throws, 2)).toEqual({ kind: 'unreadable' });
  });
});

describe('the save storage', () => {
  it('writes nothing before the save is read, so a launch never overwrites it', () => {
    const store = memoryStorage({ [saveKey]: JSON.stringify(sample) });
    const storage = createSaveStorage({ storage: () => store, persist: () => undefined });
    expect(storage.write({ ...sample, progress: { ...sample.progress, roomsDone: [] } })).toBe(
      false,
    );
    expect(JSON.parse(store.getItem(saveKey) ?? '')).toEqual(sample);
  });

  it('starts fresh on the first launch, asks the browser to keep the data, then writes', () => {
    const store = memoryStorage();
    const persist = vi.fn();
    const storage = createSaveStorage({ storage: () => store, persist });
    expect(storage.load(now)).toEqual({ save: null, status: 'fresh', saving: true });
    expect(persist).toHaveBeenCalledOnce();
    expect(storage.write(sample)).toBe(true);
    expect(JSON.parse(store.getItem(saveKey) ?? '')).toEqual(sample);
  });

  it('loads a save of this version, and asks nothing', () => {
    const store = memoryStorage({ [saveKey]: JSON.stringify(sample) });
    const persist = vi.fn();
    const storage = createSaveStorage({ storage: () => store, persist });
    expect(storage.load(now)).toEqual({ save: sample, status: 'loaded', saving: true });
    expect(persist).not.toHaveBeenCalled();
  });

  it('brings an older save up to this version through the migrations', () => {
    const store = memoryStorage({ [saveKey]: JSON.stringify({ v: 1, settings: { muted: 1 } }) });
    const storage = createSaveStorage({
      storage: () => store,
      persist: () => undefined,
      migrations: { 1: (save) => ({ ...save, settings: { muted: save.settings !== undefined } }) },
      version: 2,
    });
    const loaded = storage.load(now);
    expect(loaded.status).toBe('migrated');
    expect(loaded.save?.settings.muted).toBe(true);
  });

  it('keeps aside a save no migration reaches', () => {
    const store = memoryStorage({ [saveKey]: JSON.stringify({ v: 0 }) });
    expect(
      createSaveStorage({ storage: () => store, persist: () => undefined }).load(now).status,
    ).toBe('recovered');
  });

  it('keeps a save it can’t read aside, under the corrupt key, and starts fresh', () => {
    for (const raw of ['{not json', '[1,2]', '"text"', JSON.stringify({ progress: {} })]) {
      const store = memoryStorage({ [saveKey]: raw });
      const storage = createSaveStorage({ storage: () => store, persist: () => undefined });
      expect(storage.load(now)).toEqual({ save: null, status: 'recovered', saving: true });
      expect(store.getItem(`${corruptKeyPrefix}${now}`)).toBe(raw);
      expect(storage.write(sample)).toBe(true);
    }
  });

  it('reads a newer version’s save as far as it can, and never writes over it', () => {
    const raw = JSON.stringify({ ...sample, v: 9, future: 'field' });
    const store = memoryStorage({ [saveKey]: raw });
    const storage = createSaveStorage({ storage: () => store, persist: () => undefined });
    const loaded = storage.load(now);
    expect(loaded.status).toBe('read-only');
    expect(loaded.save?.progress.roomsDone).toEqual(['r01', 'r02']);
    expect(storage.write(sample)).toBe(false);
    expect(store.getItem(saveKey)).toBe(raw);
  });

  it('keeps the game running when storage can’t be reached or written', () => {
    const throwing = createSaveStorage({
      storage: () => {
        throw new Error('SecurityError');
      },
    });
    expect(throwing.load(now)).toEqual({ save: null, status: 'unavailable', saving: false });
    expect(throwing.write(sample)).toBe(false);

    const log = memoryStorage();
    vi.stubGlobal('localStorage', log);
    const full = createSaveStorage({
      storage: () => ({
        getItem: () => null,
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
      }),
      persist: () => undefined,
    });
    full.load(now);
    expect(full.write(sample)).toBe(false);
    expect(log.getItem(errorLogKey)).toContain('QuotaExceededError');
  });

  it('writes nothing all session after a read that failed, so a fresh game never replaces his save', () => {
    const store = memoryStorage({ [saveKey]: JSON.stringify(sample) });
    let failOnce = true;
    const flaky = {
      getItem: (key: string) => {
        if (failOnce) {
          failOnce = false;
          throw new Error('busy');
        }
        return store.getItem(key);
      },
      setItem: store.setItem,
    };
    vi.stubGlobal('localStorage', memoryStorage());
    const storage = createSaveStorage({ storage: () => flaky, persist: () => undefined });
    expect(storage.load(now)).toEqual({ save: null, status: 'unavailable', saving: false });
    expect(storage.write({ ...sample, progress: { ...sample.progress, roomsDone: [] } })).toBe(
      false,
    );
    expect(JSON.parse(store.getItem(saveKey) ?? '')).toEqual(sample);
  });

  it('never writes over an unreadable save it couldn’t keep aside', () => {
    const items = new Map([[saveKey, '{broken']]);
    vi.stubGlobal('localStorage', memoryStorage());
    const full = {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    const storage = createSaveStorage({ storage: () => full, persist: () => undefined });
    expect(storage.load(now)).toEqual({ save: null, status: 'recovered', saving: false });
    expect(storage.write(sample)).toBe(false);
    expect(items.get(saveKey)).toBe('{broken');
  });

  it('keeps the fields this build doesn’t know when it writes', () => {
    const later = {
      ...sample,
      cityLog: [{ at: now, roomId: 'r01' }],
      fight: { lairId: 'lair-20' },
      progress: { ...sample.progress, seen: ['lair-20'], at: 'r03' },
      settings: { ...sample.settings, volume: 0.4 },
    };
    const store = memoryStorage({ [saveKey]: JSON.stringify(later) });
    const storage = createSaveStorage({ storage: () => store, persist: () => undefined });
    const loaded = storage.load(now);
    if (!loaded.save) throw new Error('no save');
    storage.write({ ...loaded.save, progress: { ...loaded.save.progress, roomsDone: ['r01'] } });
    const written = JSON.parse(store.getItem(saveKey) ?? '');
    expect(written).toMatchObject({
      cityLog: later.cityLog,
      fight: later.fight,
      progress: { seen: ['lair-20'], at: 'r03', roomsDone: ['r01'] },
      settings: { volume: 0.4, quality: 'medium' },
    });
  });

  it('skips a write that is the same as the last one', () => {
    const store = memoryStorage();
    const setItem = vi.spyOn(store, 'setItem');
    const storage = createSaveStorage({ storage: () => store, persist: () => undefined });
    storage.load(now);
    storage.write(sample);
    storage.write(sample);
    expect(setItem).toHaveBeenCalledOnce();
  });
});
