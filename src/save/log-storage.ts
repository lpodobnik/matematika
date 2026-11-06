// The play log on the device (story 2.11; architecture, Data Persistence: `matematika:log`,
// append-only, capped at 20,000 events, oldest dropped first). Separate from the save: the
// backup link never carries it. Read leniently: entries that don't read are left out.

import { recordError } from '@/lib/error-log';
import { appended, type PlayLogEvent } from '@/playlog/log';
import type { KeyValueStorage } from '@/save/storage';

export const logKey = 'matematika:log';

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
): LogStorage {
  let cache: PlayLogEvent[] | null = null;
  /** The device's log couldn't be read: it is never written over (story 2.11 review). */
  let unreadable = false;
  let waiting = false;

  function reach(): KeyValueStorage | null {
    try {
      return storage();
    } catch {
      return null;
    }
  }

  function read(): PlayLogEvent[] {
    if (cache) return cache;
    let raw: string | null = null;
    try {
      raw = reach()?.getItem(logKey) ?? null;
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
    if (unreadable || !cache) return;
    try {
      reach()?.setItem(logKey, JSON.stringify(cache));
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
