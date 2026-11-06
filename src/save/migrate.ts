// Migrations (story 2.1; architecture, Data Persistence): every save carries `v`, and on
// load the migrations run in order from its version to the current one (`migrations[1]`
// turns v1 into v2, and so on). v1 is the first version, so the table is empty; the next
// change an old save can't read adds `migrations[1]`, and a test with a fixture of v1.

import { isObject } from '@/save/decode';
import { currentVersion } from '@/save/schema';

type Json = Record<string, unknown>;

/** Turns a save of version n into version n + 1. */
export type Migration = (save: Json) => Json;

export const migrations: Readonly<Record<number, Migration>> = {};

export type Migrated =
  /** At the current version: from the version it was, which is the current one if none ran. */
  | { kind: 'current'; save: Json; from: number }
  /** From a newer version of the game: read as far as it can be, never written over. */
  | { kind: 'newer'; save: Json; v: number }
  /** Not a save, or a version no migration reaches. */
  | { kind: 'unreadable' };

/** A save brought to the current version, or what stops it. Never throws. */
export function migrate(
  value: unknown,
  table: Readonly<Record<number, Migration>> = migrations,
  current: number = currentVersion,
): Migrated {
  if (!isObject(value)) return { kind: 'unreadable' };
  const { v } = value;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1) return { kind: 'unreadable' };
  if (v > current) return { kind: 'newer', save: value, v };
  let save = value;
  for (let version = v; version < current; version += 1) {
    const step = table[version];
    if (!step) return { kind: 'unreadable' };
    try {
      save = { ...step(save), v: version + 1 };
    } catch {
      return { kind: 'unreadable' };
    }
  }
  return { kind: 'current', save, from: v };
}
