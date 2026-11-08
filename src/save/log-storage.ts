// The play log on the device (story 2.11; architecture, Data Persistence: `matematika:log`,
// append-only, capped at 20,000 events, oldest dropped first), one per player (lib/player.ts).
// Separate from the save: the backup link never carries it. Read leniently: entries that don't
// read are left out.

import { recordError } from '@/lib/error-log';
import { activePlayer, firstPlayer, playerKeys } from '@/lib/player';
import { appended, type PlayLogEvent } from '@/playlog/log';
import type { KeyValueStorage } from '@/save/storage';

/** The first player's log; each other player has their own (lib/player.ts). */
export const logKey = playerKeys(firstPlayer).log;

export interface LogStorage {
  /** The log as it is on the device, oldest first; empty when there is none. */
  read(): PlayLogEvent[];
  /**
   * Adds entries to the end, dropping the oldest past the cap. The device is written a
   * moment later, once for a burst of entries (story 2.11 review: a full log is about 1.7M
   * characters, too much to write on every move), and at once when the page hides.
   */
  append(entries: readonly PlayLogEvent[]): void;
  /** Writes what is waiting now. */
  flush(): void;
}

/** How long after an entry the log is written, so a burst of entries writes once. */
export const logWriteDelayMs = 2000;

const isEntry = (value: unknown): value is PlayLogEvent =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { type?: unknown }).type === 'string' &&
  typeof (value as { at?: unknown }).at === 'string';

export function createLogStorage(
  storage: () => KeyValueStorage | null = () => globalThis.localStorage ?? null,
  schedule: (write: () => void) => void = (write) => {
    globalThis.setTimeout?.(write, logWriteDelayMs);
  },
  keyOf: () => string = () => playerKeys(activePlayer()).log,
): LogStorage {
  let cache: PlayLogEvent[] | null = null;
  /** The device's log couldn't be read: it is never written over (story 2.11 review). */
  let unreadable = false;
  let waiting = false;
  /** Whose log this is, from the first read on: entries never reach another player's. */
  let key: string | null = null;

  function reach(): KeyValueStorage | null {
    try {
      return storage();
    } catch {
      return null;
    }
  }

  function read(): PlayLogEvent[] {
    if (cache) return cache;
    key ??= keyOf();
    let raw: string | null = null;
    try {
      raw = reach()?.getItem(key) ?? null;
    } catch (error) {
      recordError('save', error);
      unreadable = true;
      return [];
    }
    let entries: PlayLogEvent[] = [];
    if (raw) {
      try {
        const parsed: unknown = JSON.parse(raw);
        entries = Array.isArray(parsed) ? parsed.filter(isEntry) : [];
      } catch {
        entries = [];
      }
    }
    // Read after all: whatever failed before, the log on the device is in hand now.
    unreadable = false;
    cache = entries;
    return entries;
  }

  function flush(): void {
    waiting = false;
    if (unreadable || !cache || !key) return;
    try {
      reach()?.setItem(key, JSON.stringify(cache));
    } catch (error) {
      recordError('save', error);
    }
  }

  return {
    read,
    flush,
    append(entries) {
      if (entries.length === 0) return;
      cache = appended(read(), entries);
      if (unreadable || waiting) return;
      waiting = true;
      schedule(flush);
    },
  };
}

/** The game's play log, on the browser's `localStorage`, written at once as the page hides. */
export const logStorage: LogStorage = createLogStorage();
globalThis.addEventListener?.('pagehide', () => logStorage.flush());
globalThis.document?.addEventListener?.('visibilitychange', () => {
  if (globalThis.document.visibilityState === 'hidden') logStorage.flush();
});
