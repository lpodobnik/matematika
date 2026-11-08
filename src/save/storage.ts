// The save's storage adapter (story 2.1; architecture, Data Persistence): `localStorage`,
// synchronous, one JSON value per player (lib/player.ts names the keys; the first player's is
// `matematika:save`). It is the only code that reads or writes the game in play. `load` ties
// the session to the player who is active then, so it can never write to another. Nothing is written before the save has been read at launch (`load`), so
// a launch can never overwrite his progress with a fresh game; a save from a newer version
// of the game is never written over. A failure to read or write never stops the game: it
// keeps running in memory, and the failure goes to the error log.

import { recordError } from '@/lib/error-log';
import { activePlayer, type PlayerKeys, playerKeys } from '@/lib/player';
import { decodeSave, isObject } from '@/save/decode';
import { type Migration, migrate, migrations } from '@/save/migrate';
import { currentVersion, type SaveV1 } from '@/save/schema';

export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;
type Json = Record<string, unknown>;

/**
 * What loading found:
 * - `fresh`: no save yet, the first launch;
 * - `loaded`: a save of this version;
 * - `migrated`: an older save, brought up to this version;
 * - `recovered`: a save that couldn't be read, kept aside; the game starts fresh;
 * - `read-only`: a save from a newer version, read as far as it could be, never written over;
 * - `unavailable`: storage can't be reached (private mode, blocked); the game runs in memory.
 */
export type LoadStatus =
  | 'fresh'
  | 'loaded'
  | 'migrated'
  | 'recovered'
  | 'read-only'
  | 'unavailable';

export interface LoadResult {
  /** The save to start from, or null to start a new game. */
  save: SaveV1 | null;
  status: LoadStatus;
  /**
   * Whether this session writes the save. False when writing could lose something: storage
   * couldn't be read, the save is a newer version's, or an unreadable save couldn't be kept
   * aside. The game then runs in memory; the map (2.2) and Luka's view (2.11) say so.
   */
  saving: boolean;
}

export interface SaveStorage {
  /**
   * Reads the save once, at launch; until then, and after a read that leaves something to
   * lose, `write` writes nothing. `now` is ISO 8601.
   */
  load(now: string): LoadResult;
  /** Writes the save, when this session writes (`LoadResult.saving`). True when it is on the device. */
  write(save: SaveV1): boolean;
  /**
   * The save as it is stored after `load`, with fields this build doesn't know (story 2.11:
   * a backup carries them); null when there is none, or it couldn't be read.
   */
  stored(): Record<string, unknown> | null;
  /**
   * Replaces the save whole with `json`, when this session writes (a restored backup,
   * story 2.11): nothing of the save before it is kept. True when it is on the device.
   */
  replace(json: Record<string, unknown>): boolean;
}

export interface SaveStorageOptions {
  /** The storage to use; null or throwing when there is none (tests bring their own). */
  storage?: () => KeyValueStorage | null;
  /** Asks the browser to keep the data (`navigator.storage.persist()`), on the first launch. */
  persist?: () => void;
  /** The migrations and the version they lead to (tests bring their own). */
  migrations?: Readonly<Record<number, Migration>>;
  version?: number;
  /** Whose keys to use, asked at `load`: the active player's, unless a test brings its own. */
  keys?: () => Pick<PlayerKeys, 'save' | 'corruptPrefix'>;
}

function browserStorage(): KeyValueStorage | null {
  return globalThis.localStorage ?? null;
}

function askToPersist(): void {
  try {
    void globalThis.navigator?.storage?.persist?.().catch(() => undefined);
  } catch {
    // An old browser without the storage manager: the data is kept as the browser decides.
  }
}

function parsed(raw: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false };
  }
}

/**
 * The loaded save with what this build wrote laid over it, one level deep: fields this
 * build doesn't know (a newer build's, or a later story's on an older branch) are kept, so
 * a launch never drops them (story 2.1 review).
 */
function overKept(kept: Json | null, save: SaveV1): Json {
  if (!kept) return { ...save };
  const merged: Json = { ...kept };
  for (const [key, value] of Object.entries(save)) {
    const old = kept[key];
    merged[key] = isObject(old) && isObject(value) ? { ...old, ...value } : value;
  }
  return merged;
}

export function createSaveStorage(options: SaveStorageOptions = {}): SaveStorage {
  const {
    storage = browserStorage,
    persist = askToPersist,
    keys = () => playerKeys(activePlayer()),
  } = options;
  const table = options.migrations ?? migrations;
  const version = options.version ?? currentVersion;
  /**
   * Whether this session writes: only after a read that leaves nothing to lose. A failed
   * read, a newer version's save, or an unreadable save that couldn't be kept aside keep
   * the game in memory for the session (story 2.1 review).
   */
  let writable = false;
  /** The save as read, so fields this build doesn't know are written back (`overKept`). */
  let kept: Json | null = null;
  let lastWritten: string | null = null;
  /** The player this session plays as, from `load` on. */
  let at: Pick<PlayerKeys, 'save' | 'corruptPrefix'> = keys();

  function reach(): KeyValueStorage | null {
    try {
      return storage();
    } catch {
      return null;
    }
  }

  /**
   * Keeps a save that can't be read under its own key, so Luka can recover it by hand.
   * False when it couldn't be kept: then the original must not be written over.
   */
  function keepAside(store: KeyValueStorage, raw: string, now: string): boolean {
    try {
      store.setItem(`${at.corruptPrefix}${now}`, raw);
      return true;
    } catch (error) {
      recordError('save', error);
      return false;
    }
  }

  function read(now: string): LoadResult {
    at = keys();
    const store = reach();
    if (!store) return { save: null, status: 'unavailable', saving: false };
    let raw: string | null;
    try {
      raw = store.getItem(at.save);
    } catch (error) {
      recordError('save', error);
      return { save: null, status: 'unavailable', saving: false };
    }
    if (raw === null) {
      persist();
      writable = true;
      return { save: null, status: 'fresh', saving: true };
    }
    const json = parsed(raw);
    const migrated = json.ok
      ? migrate(json.value, table, version)
      : ({ kind: 'unreadable' } as const);
    const save = migrated.kind === 'unreadable' ? null : decodeSave(migrated.save, now);
    if (migrated.kind === 'unreadable' || !save) {
      writable = keepAside(store, raw, now);
      return { save: null, status: 'recovered', saving: writable };
    }
    if (migrated.kind === 'newer') return { save, status: 'read-only', saving: false };
    writable = true;
    kept = migrated.save;
    const current = migrated.from === version;
    lastWritten = current ? raw : null;
    return { save, status: current ? 'loaded' : 'migrated', saving: true };
  }

  return {
    load(now) {
      return read(now);
    },
    stored() {
      return kept;
    },
    replace(json) {
      if (!writable) return false;
      const store = reach();
      if (!store) return false;
      try {
        const text = JSON.stringify(json);
        store.setItem(at.save, text);
        kept = json;
        lastWritten = text;
        return true;
      } catch (error) {
        recordError('save', error);
        return false;
      }
    },
    write(save) {
      if (!writable) return false;
      const text = JSON.stringify(overKept(kept, save));
      if (text === lastWritten) return true;
      const store = reach();
      if (!store) return false;
      try {
        store.setItem(at.save, text);
        lastWritten = text;
        return true;
      } catch (error) {
        recordError('save', error);
        return false;
      }
    },
  };
}

/** The game's save storage, on the browser's `localStorage`. */
export const saveStorage: SaveStorage = createSaveStorage();
