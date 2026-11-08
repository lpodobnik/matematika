// The players on this device. There is no list to keep in step: a player is a save on the
// device (lib/player.ts names the keys), so the list is read off the keys themselves, nothing
// is written to bring an old save in, and two tabs can't overwrite each other's list. Which
// player a tab plays as is kept in that tab's `sessionStorage`: a reload stays with the same
// child, a new launch asks, and two tabs can play as two children.

import { isLookId, type LookId } from '@/city/character';
import { recordError } from '@/lib/error-log';
import { firstPlayer, playerKeys, playerOfSaveKey } from '@/lib/player';
import { isObject } from '@/save/decode';
import { currentVersion } from '@/save/schema';

/** The device's storage, as far as players need it. */
export type PlayerStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> &
  Partial<Pick<Storage, 'key' | 'length'>>;
export type TabStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface PlayerCard {
  id: string;
  /** Null until named at the naming, or when the save can't be read. */
  name: string | null;
  look: LookId | null;
}

export interface PlayersOptions {
  storage?: () => PlayerStorage | null;
  tab?: () => TabStorage | null;
  now?: () => string;
  makeId?: () => string;
}

const tabKey = 'matematika:player';

function resolved(options: PlayersOptions) {
  const reach = <T>(get: () => T | null): T | null => {
    try {
      return get();
    } catch {
      return null;
    }
  };
  return {
    store: reach(options.storage ?? (() => globalThis.localStorage ?? null)),
    tab: reach(options.tab ?? (() => globalThis.sessionStorage ?? null)),
    now: options.now ?? (() => new Date().toISOString()),
    makeId:
      options.makeId ??
      (() => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`),
  };
}

function readSave(store: PlayerStorage, id: string): Record<string, unknown> | null {
  try {
    const raw = store.getItem(playerKeys(id).save);
    const json: unknown = raw === null ? null : JSON.parse(raw);
    return isObject(json) ? json : null;
  } catch {
    return null;
  }
}

function idsOn(store: PlayerStorage): string[] {
  const ids = new Set<string>();
  try {
    if (store.getItem(playerKeys(firstPlayer).save) !== null) ids.add(firstPlayer);
    if (typeof store.key === 'function') {
      for (let i = 0; i < (store.length ?? 0); i += 1) {
        const id = playerOfSaveKey(store.key(i) ?? '');
        if (id) ids.add(id);
      }
    }
  } catch (error) {
    recordError('save', error);
  }
  return [...ids];
}

/**
 * The players on the device, oldest save first, so the order never changes and a save from
 * before there were players comes first. A save that can't be read is still somebody's: it
 * stays on the list, without a name, and the game keeps it aside when it is opened.
 */
export function listPlayers(options: PlayersOptions = {}): PlayerCard[] {
  const { store } = resolved(options);
  if (!store) return [];
  const rows = idsOn(store).map((id) => {
    const save = readSave(store, id);
    const character = save && isObject(save.character) ? save.character : {};
    const name =
      typeof character.name === 'string' && character.name !== '' ? character.name : null;
    return {
      card: { id, name, look: isLookId(character.look) ? character.look : null },
      createdAt: save && typeof save.createdAt === 'string' ? save.createdAt : '￿',
    };
  });
  rows.sort((a, b) => {
    if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
    if (a.card.id === firstPlayer) return -1;
    if (b.card.id === firstPlayer) return 1;
    return a.card.id < b.card.id ? -1 : 1;
  });
  return rows.map((row) => row.card);
}

/** The player this tab last played as, if the tab has one. */
export function rememberedPlayer(options: PlayersOptions = {}): string | null {
  const { tab } = resolved(options);
  try {
    const id = tab?.getItem(tabKey) ?? null;
    return id && /^[0-9a-z]+$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function rememberPlayer(id: string, options: PlayersOptions = {}): void {
  const { tab } = resolved(options);
  try {
    tab?.setItem(tabKey, id);
  } catch {
    // A private window: this tab asks again after a reload.
  }
}

/** Who starts when the game opens: the tab's player, the only player, or ask. */
export function startingPlayer(options: PlayersOptions = {}): string | null {
  const players = listPlayers(options);
  const remembered = rememberedPlayer(options);
  if (remembered && players.some((player) => player.id === remembered)) return remembered;
  if (players.length > 1) return null;
  return players[0]?.id ?? firstPlayer;
}

/** The id a new player takes: the first player's keys when nobody is left on the device. */
export function nextPlayerId(options: PlayersOptions = {}): string {
  const { makeId } = resolved(options);
  const players = listPlayers(options);
  if (players.length === 0) return firstPlayer;
  let id = makeId();
  while (id === firstPlayer || players.some((player) => player.id === id)) id = makeId();
  return id;
}

/** A save with only this much in it reads as a new game (save/decode.ts takes the defaults). */
function startingSave(
  createdAt: string,
  character: unknown = { name: null, look: null },
  settings?: unknown,
): string {
  return JSON.stringify({
    v: currentVersion,
    createdAt,
    character,
    ...(settings === undefined ? {} : { settings }),
  });
}

/**
 * A new player, with a save of their own from this moment: they are on the list at once, so
 * a reload before the game has written anything can't lose them.
 */
export function createPlayer(options: PlayersOptions = {}): string {
  const { store, now } = resolved(options);
  const id = nextPlayerId(options);
  try {
    store?.setItem(playerKeys(id).save, startingSave(now()));
  } catch (error) {
    // Full storage: the game still starts, in memory, as it does when a write fails.
    recordError('save', error);
  }
  return id;
}

function clearTown(id: string, store: PlayerStorage | null, tab: TabStorage | null): void {
  const keys = playerKeys(id);
  try {
    store?.removeItem(keys.met);
    tab?.removeItem(keys.where);
  } catch (error) {
    recordError('save', error);
  }
}

/**
 * Starts a player over: the same name, look and sound, and everything else new, with the
 * opening again. The play log stays, as Luka's record of what was played. True when done.
 */
export function restartPlayer(id: string, options: PlayersOptions = {}): boolean {
  const { store, tab, now } = resolved(options);
  if (!store) return false;
  const old = readSave(store, id);
  const createdAt = old && typeof old.createdAt === 'string' ? old.createdAt : now();
  try {
    store.setItem(playerKeys(id).save, startingSave(createdAt, old?.character, old?.settings));
  } catch (error) {
    recordError('save', error);
    return false;
  }
  clearTown(id, store, tab);
  return true;
}

/**
 * Removes a player: their save, log and town. A save kept aside as unreadable stays, for Luka
 * to recover by hand. True when done.
 */
export function deletePlayer(id: string, options: PlayersOptions = {}): boolean {
  const { store, tab } = resolved(options);
  if (!store) return false;
  const keys = playerKeys(id);
  try {
    store.removeItem(keys.save);
    store.removeItem(keys.log);
  } catch (error) {
    recordError('save', error);
    return false;
  }
  clearTown(id, store, tab);
  if (rememberedPlayer(options) === id) {
    try {
      tab?.removeItem(tabKey);
    } catch {
      // The tab's memory of a player who is gone: startingPlayer checks the list anyway.
    }
  }
  return true;
}

/**
 * Whose wall a room hangs on, for a reply link: the tab's player if it is theirs (two children
 * can send the same room), else the first on the list; null when it is nobody's.
 */
export function playerWithRoom(roomId: string, options: PlayersOptions = {}): string | null {
  const { store } = resolved(options);
  if (!store) return null;
  const owners = listPlayers(options)
    .map((player) => player.id)
    .filter((id) => {
      const workshop = readSave(store, id)?.workshop;
      const rooms = isObject(workshop) ? workshop.rooms : null;
      return Array.isArray(rooms) && rooms.some((room) => isObject(room) && room.id === roomId);
    });
  const remembered = rememberedPlayer(options);
  return remembered && owners.includes(remembered) ? remembered : (owners[0] ?? null);
}
