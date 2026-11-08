// Who is playing on this page, and where each player's things live on the device. The first
// player keeps the keys the game has always used, so a save from before there were players
// simply is the first player's: nothing is copied or moved, and an older build (or a tab left
// open on one) still reads and writes the same game. Every other player has keys of their own.

/** The player on the original keys. */
export const firstPlayer = 'first';

export interface PlayerKeys {
  save: string;
  /** A save that can't be read is kept under this prefix and the time, for Luka to recover. */
  corruptPrefix: string;
  log: string;
  /** The people met in the town, in `localStorage`. */
  met: string;
  /** Where the town was left, in `sessionStorage`. */
  where: string;
}

const prefix = 'matematika:player:';

export function playerKeys(id: string): PlayerKeys {
  if (id === firstPlayer) {
    return {
      save: 'matematika:save',
      corruptPrefix: 'matematika:save:corrupt:',
      log: 'matematika:log',
      met: 'matematika:town:met',
      where: 'matematika:town:where',
    };
  }
  const own = `${prefix}${id}:`;
  return {
    save: `${own}save`,
    corruptPrefix: `${own}save:corrupt:`,
    log: `${own}log`,
    met: `${own}town:met`,
    where: `${own}town:where`,
  };
}

/** The player whose save a storage key holds, or null for any other key. */
export function playerOfSaveKey(key: string): string | null {
  if (key === playerKeys(firstPlayer).save) return firstPlayer;
  const match = /^matematika:player:([0-9a-z]+):save$/.exec(key);
  return match?.[1] ?? null;
}

let active = firstPlayer;

/** The player this page plays as. Set once, before the save and the log are first read. */
export function activePlayer(): string {
  return active;
}

export function setActivePlayer(id: string): void {
  active = id;
}

/** The address that opens "Tko igra?" (main.tsx); a new address starts the page afresh. */
export const playersHash = '#igraci';
