// Room and reply links at launch (epic 5; architecture, src/main.tsx and Pattern 3). A
// friend's room link opens the game in friend mode: the save on the device is never read,
// so nothing the friend does is written over it; a device with no save at all is new to the
// game (no player at all) and gets the intro machine. A reply link opens his own game, stamps the room on the
// wall once the save is read, and then leaves the address (`#r` is removed after use).

import { replyOf } from '@/links/room-link';
import { listPlayers } from '@/save/players';
import type { Action } from '@/store/actions';

type Dispatch = (action: Action) => void;

/** Whether this device has a save of the game: a friend who has played it skips the intro. */
export function hasSave(): boolean {
  return listPlayers().length > 0;
}

/** A friend's room link: the friend's cards and the room, with nothing read or written. */
export function bootFriend(data: string, dispatch: Dispatch, newToGame = !hasSave()): void {
  dispatch({ type: 'friend/start', data, newToGame });
}

/**
 * A reply link, after the game has started from the save: the stamp, then the address
 * without the fragment, so a reload doesn't stamp it again.
 */
export function handleReply(hash: string, dispatch: Dispatch): void {
  const reply = replyOf(hash);
  if (reply) dispatch({ type: 'workshop/reply', id: reply.id, stamp: reply.stamp });
  try {
    history.replaceState(null, '', `${location.pathname}${location.search}`);
  } catch {
    // An address that can't be replaced keeps the fragment; a second stamp is the same stamp.
  }
}
