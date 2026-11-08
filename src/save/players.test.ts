import { describe, expect, it } from 'vitest';
import { firstPlayer, playerKeys, playerOfSaveKey, setActivePlayer } from '@/lib/player';
import { decodeSave } from '@/save/decode';
import { createLogStorage, logKey } from '@/save/log-storage';
import {
  createPlayer,
  deletePlayer,
  listPlayers,
  nextPlayerId,
  type PlayersOptions,
  playerWithRoom,
  rememberedPlayer,
  rememberPlayer,
  restartPlayer,
  startingPlayer,
} from '@/save/players';
import { corruptKeyPrefix, type SaveV1, saveKey } from '@/save/schema';
import { createSaveStorage } from '@/save/storage';
import { createPlayLogEffect } from '@/store/effects/playlog';
import { initialGameState } from '@/store/reducer';

/** A browser's storage, with `key` and `length` as `listPlayers` reads them. */
function memoryStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      items.set(key, value);
    },
    removeItem: (key: string) => {
      items.delete(key);
    },
    key: (index: number) => [...items.keys()][index] ?? null,
    get length() {
      return items.size;
    },
  };
}

const now = '2026-11-08T10:00:00.000Z';

function device(initial: Record<string, string> = {}) {
  const store = memoryStorage(initial);
  const tab = memoryStorage();
  let next = 0;
  const options: PlayersOptions = {
    storage: () => store,
    tab: () => tab,
    now: () => now,
    makeId: () => {
      next += 1;
      return `p${next}`;
    },
  };
  return { store, tab, options };
}

/** The son's save as the live site has it: played, named, with a room on the wall. */
const sonsSave = {
  v: 1,
  createdAt: '2026-11-01T08:00:00.000Z',
  character: { name: 'Ivo', look: 'look-3' },
  progress: {
    roomsDone: ['r01', 'r02'],
    tools: ['balance'],
    firstUse: [],
    room: null,
    started: [],
    onMap: true,
    told: ['r01', 'r02'],
    ideasSeen: [],
    tornPages: [],
    introSeen: true,
  },
  settings: { muted: true, quality: null },
  workshop: { rooms: [{ id: 'abc', payload: 'x', title: 1, stamp: null }] },
};

/** A storage adapter for this player, as a page playing as them would have. */
function storageFor(id: string, store: ReturnType<typeof memoryStorage>) {
  const storage = createSaveStorage({
    storage: () => store,
    persist: () => undefined,
    keys: () => playerKeys(id),
  });
  return storage;
}

describe('an existing save (migration)', () => {
  it('is the first player with nothing written to the device', () => {
    const raw = JSON.stringify(sonsSave);
    const { store, options } = device({ [saveKey]: raw });
    expect(listPlayers(options)).toEqual([{ id: firstPlayer, name: 'Ivo', look: 'look-3' }]);
    expect(startingPlayer(options)).toBe(firstPlayer);
    expect(store.items.size).toBe(1);
    expect(store.getItem(saveKey)).toBe(raw);
  });

  it('loads with all its progress and writes back to the same key', () => {
    const { store } = device({ [saveKey]: JSON.stringify(sonsSave) });
    const storage = storageFor(firstPlayer, store);
    const { save, status } = storage.load(now);
    expect(status).toBe('loaded');
    expect(save?.progress.roomsDone).toEqual(['r01', 'r02']);
    expect(save?.character.name).toBe('Ivo');
    storage.write({ ...(save as SaveV1), createdAt: 'later' });
    expect(JSON.parse(store.getItem(saveKey) ?? '').createdAt).toBe('later');
  });

  it('keeps the original keys for the first player: log, town and corrupt prefix', () => {
    expect(playerKeys(firstPlayer)).toEqual({
      save: 'matematika:save',
      corruptPrefix: 'matematika:save:corrupt:',
      log: 'matematika:log',
      met: 'matematika:town:met',
      where: 'matematika:town:where',
    });
    expect(saveKey).toBe('matematika:save');
    expect(logKey).toBe('matematika:log');
    expect(corruptKeyPrefix).toBe('matematika:save:corrupt:');
  });

  it('comes first on the list after a second player joins', () => {
    const { options, store } = device({ [saveKey]: JSON.stringify(sonsSave) });
    const id = createPlayer(options);
    expect(id).not.toBe(firstPlayer);
    expect(listPlayers(options).map((player) => player.id)).toEqual([firstPlayer, id]);
    expect(JSON.parse(store.getItem(saveKey) ?? '')).toEqual(sonsSave);
  });

  it('keeps an unreadable save as somebody, without a name, and leaves it alone', () => {
    const { options, store } = device({ [saveKey]: '{broken' });
    expect(listPlayers(options)).toEqual([{ id: firstPlayer, name: null, look: null }]);
    expect(store.getItem(saveKey)).toBe('{broken');
  });

  it('reads a save from a newer version for its name, and leaves it alone', () => {
    const raw = JSON.stringify({ ...sonsSave, v: 99 });
    const { options, store } = device({ [saveKey]: raw });
    expect(listPlayers(options)[0]?.name).toBe('Ivo');
    expect(store.getItem(saveKey)).toBe(raw);
  });
});

describe('players are kept apart', () => {
  it('gives each player keys of their own', () => {
    const a = Object.values(playerKeys(firstPlayer));
    const b = Object.values(playerKeys('abc'));
    const c = Object.values(playerKeys('xyz'));
    expect(new Set([...a, ...b, ...c]).size).toBe(a.length + b.length + c.length);
  });

  it('reads a save key back, and no other key', () => {
    expect(playerOfSaveKey(playerKeys('abc').save)).toBe('abc');
    expect(playerOfSaveKey(saveKey)).toBe(firstPlayer);
    expect(playerOfSaveKey(`${corruptKeyPrefix}${now}`)).toBeNull();
    expect(playerOfSaveKey(`${playerKeys('abc').corruptPrefix}${now}`)).toBeNull();
    expect(playerOfSaveKey(playerKeys('abc').log)).toBeNull();
  });

  it('lets each player save and load without touching the other', () => {
    const { store, options } = device({ [saveKey]: JSON.stringify(sonsSave) });
    const id = createPlayer(options);
    const second = storageFor(id, store);
    const fresh = second.load(now).save as SaveV1;
    expect(fresh.progress.roomsDone).toEqual([]);
    expect(fresh.character).toEqual({ name: null, look: null });
    second.write({
      ...fresh,
      character: { name: 'Ana', look: 'look-1' },
      progress: { ...fresh.progress, roomsDone: ['r01'] },
    });
    expect(JSON.parse(store.getItem(saveKey) ?? '')).toEqual(sonsSave);

    const first = storageFor(firstPlayer, store);
    const his = first.load(now).save as SaveV1;
    first.write({ ...his, progress: { ...his.progress, roomsDone: ['r01', 'r02', 'r03'] } });
    const hers = storageFor(id, store).load(now).save;
    expect(hers?.progress.roomsDone).toEqual(['r01']);
    expect(hers?.character.name).toBe('Ana');
    expect(listPlayers(options).map((player) => player.name)).toEqual(['Ivo', 'Ana']);
  });

  it('stays with the player it loaded as, whoever becomes active later', () => {
    const store = memoryStorage({ [saveKey]: JSON.stringify(sonsSave) });
    setActivePlayer('abc');
    try {
      const storage = createSaveStorage({ storage: () => store, persist: () => undefined });
      const fresh = storage.load(now);
      expect(fresh.status).toBe('fresh');
      setActivePlayer(firstPlayer);
      storage.write(decodeSave({ v: 1, createdAt: now }, now) as SaveV1);
      expect(store.getItem(playerKeys('abc').save)).not.toBeNull();
      expect(JSON.parse(store.getItem(saveKey) ?? '')).toEqual(sonsSave);
    } finally {
      setActivePlayer(firstPlayer);
    }
  });

  it('keeps an unreadable save aside under the player it belongs to', () => {
    const store = memoryStorage({ [playerKeys('abc').save]: '{broken' });
    const { status } = storageFor('abc', store).load(now);
    expect(status).toBe('recovered');
    expect(store.getItem(`${playerKeys('abc').corruptPrefix}${now}`)).toBe('{broken');
    expect(store.getItem(`${corruptKeyPrefix}${now}`)).toBeNull();
  });

  it('writes each player their own play log', () => {
    const store = memoryStorage();
    const entry = (at: string) => ({ type: 'session', at }) as const;
    const logOf = (id: string) =>
      createLogStorage(
        () => store,
        (write) => write(),
        () => playerKeys(id).log,
      );
    logOf(firstPlayer).append([entry('a')]);
    logOf('abc').append([entry('b')]);
    expect(JSON.parse(store.getItem(logKey) ?? '')).toEqual([entry('a')]);
    expect(JSON.parse(store.getItem(playerKeys('abc').log) ?? '')).toEqual([entry('b')]);
  });

  it('writes nothing of a friend to the play log', () => {
    const store = memoryStorage();
    const effect = createPlayLogEffect(
      createLogStorage(
        () => store,
        (write) => write(),
      ),
      () => now,
    );
    const base = initialGameState();
    const friend = {
      ...base,
      ui: {
        ...base.ui,
        screen: 'room' as const,
        friend: { step: 'play' as const, room: null, id: 'abc', newToGame: false },
      },
    };
    effect({ type: 'StageArrived', roomId: 'r01', stage: 0 }, friend);
    expect(store.items.size).toBe(0);
  });
});

describe('who starts', () => {
  it('is the first player on a new device, with nothing written', () => {
    const { options, store } = device();
    expect(listPlayers(options)).toEqual([]);
    expect(startingPlayer(options)).toBe(firstPlayer);
    expect(store.items.size).toBe(0);
  });

  it('asks when there are two and the tab has no player', () => {
    const { options } = device({ [saveKey]: JSON.stringify(sonsSave) });
    createPlayer(options);
    expect(startingPlayer(options)).toBeNull();
  });

  it("stays with the tab's player across a reload", () => {
    const { options } = device({ [saveKey]: JSON.stringify(sonsSave) });
    const id = createPlayer(options);
    rememberPlayer(id, options);
    expect(rememberedPlayer(options)).toBe(id);
    expect(startingPlayer(options)).toBe(id);
  });

  it('is the one left when the first player has been removed', () => {
    const { options } = device({ [saveKey]: JSON.stringify(sonsSave) });
    const id = createPlayer(options);
    rememberPlayer(firstPlayer, options);
    deletePlayer(firstPlayer, options);
    expect(startingPlayer(options)).toBe(id);
  });

  it('asks rather than trust a tab whose player has gone', () => {
    const { options, tab } = device({ [saveKey]: JSON.stringify(sonsSave) });
    createPlayer(options);
    tab.setItem('matematika:player', 'gone');
    expect(startingPlayer(options)).toBeNull();
  });

  it('ignores a tab value that could never be a player', () => {
    const { options, tab } = device();
    tab.setItem('matematika:player', '../../x');
    expect(rememberedPlayer(options)).toBeNull();
  });

  it("copes with storage that can't be reached", () => {
    const blocked: PlayersOptions = {
      storage: () => {
        throw new Error('blocked');
      },
      tab: () => null,
    };
    expect(listPlayers(blocked)).toEqual([]);
    expect(startingPlayer(blocked)).toBe(firstPlayer);
    expect(restartPlayer('abc', blocked)).toBe(false);
    expect(deletePlayer('abc', blocked)).toBe(false);
  });
});

describe('a new player', () => {
  it("is on the list at once, as a new game, so a reload can't lose them", () => {
    const { options, store } = device({ [saveKey]: JSON.stringify(sonsSave) });
    const id = createPlayer(options);
    expect(listPlayers(options).map((player) => player.id)).toContain(id);
    const { save, status } = storageFor(id, store).load(now);
    expect(status).toBe('loaded');
    expect(save?.progress.introSeen).toBe(false);
    expect(save?.createdAt).toBe(now);
  });

  it("takes the first player's keys when nobody is left", () => {
    const { options } = device();
    expect(nextPlayerId(options)).toBe(firstPlayer);
    expect(createPlayer(options)).toBe(firstPlayer);
  });

  it('never takes an id already on the device', () => {
    const { options } = device({
      [saveKey]: JSON.stringify(sonsSave),
      [playerKeys('p1').save]: JSON.stringify({ v: 1, createdAt: now }),
    });
    expect(nextPlayerId(options)).toBe('p2');
  });
});

describe('starting over and removing', () => {
  it('restarts a player: same name, look, sound and place on the list, the rest new', () => {
    const { options, store, tab } = device({ [saveKey]: JSON.stringify(sonsSave) });
    const met = playerKeys(firstPlayer).met;
    const where = playerKeys(firstPlayer).where;
    store.setItem(met, '["penkala"]');
    store.setItem(logKey, '[{"type":"session","at":"a"}]');
    tab.setItem(where, '{}');
    const other = createPlayer(options);
    expect(restartPlayer(firstPlayer, options)).toBe(true);
    const { save, status } = storageFor(firstPlayer, store).load(now);
    expect(status).toBe('loaded');
    expect(save?.character).toEqual({ name: 'Ivo', look: 'look-3' });
    expect(save?.settings.muted).toBe(true);
    expect(save?.createdAt).toBe(sonsSave.createdAt);
    expect(save?.progress.roomsDone).toEqual([]);
    expect(save?.progress.introSeen).toBe(false);
    expect(save?.workshop.rooms).toEqual([]);
    expect(store.getItem(met)).toBeNull();
    expect(tab.getItem(where)).toBeNull();
    // Luka's record stays.
    expect(store.getItem(logKey)).not.toBeNull();
    expect(listPlayers(options).map((player) => player.id)).toEqual([firstPlayer, other]);
  });

  it('removes one player and leaves the other whole', () => {
    const { options, store, tab } = device({ [saveKey]: JSON.stringify(sonsSave) });
    const id = createPlayer(options);
    const keys = playerKeys(id);
    store.setItem(keys.log, '[]');
    store.setItem(keys.met, '[]');
    tab.setItem(keys.where, '{}');
    rememberPlayer(id, options);
    store.setItem(playerKeys(firstPlayer).met, '["penkala"]');
    expect(deletePlayer(id, options)).toBe(true);
    for (const key of [keys.save, keys.log, keys.met]) expect(store.getItem(key)).toBeNull();
    expect(tab.getItem(keys.where)).toBeNull();
    expect(rememberedPlayer(options)).toBeNull();
    expect(JSON.parse(store.getItem(saveKey) ?? '')).toEqual(sonsSave);
    expect(store.getItem(playerKeys(firstPlayer).met)).toBe('["penkala"]');
    expect(listPlayers(options).map((player) => player.id)).toEqual([firstPlayer]);
  });

  it('removes the first player without touching the others, and keeps a save set aside', () => {
    const corrupt = `${corruptKeyPrefix}${now}`;
    const { options, store } = device({ [saveKey]: JSON.stringify(sonsSave), [corrupt]: 'old' });
    const id = createPlayer(options);
    deletePlayer(firstPlayer, options);
    expect(store.getItem(saveKey)).toBeNull();
    expect(store.getItem(corrupt)).toBe('old');
    expect(listPlayers(options).map((player) => player.id)).toEqual([id]);
  });
});

describe('a reply link', () => {
  const withRoom = (id: string, createdAt: string) =>
    JSON.stringify({ v: 1, createdAt, workshop: { rooms: [{ id, payload: 'x', title: 0 }] } });

  it('finds the player who sent the room, whoever else is on the device', () => {
    const { options } = device({
      [saveKey]: JSON.stringify(sonsSave),
      [playerKeys('ana').save]: withRoom('zzz', '2026-11-02T00:00:00.000Z'),
    });
    expect(playerWithRoom('zzz', options)).toBe('ana');
    expect(playerWithRoom('abc', options)).toBe(firstPlayer);
    expect(playerWithRoom('nobody', options)).toBeNull();
  });

  it("prefers the tab's player when both sent the same room", () => {
    const { options } = device({
      [saveKey]: JSON.stringify(sonsSave),
      [playerKeys('ana').save]: withRoom('abc', '2026-11-02T00:00:00.000Z'),
    });
    expect(playerWithRoom('abc', options)).toBe(firstPlayer);
    rememberPlayer('ana', options);
    expect(playerWithRoom('abc', options)).toBe('ana');
  });
});
