// The full addresses of room and reply links (epic 5): this page's own address with the
// fragment, so a friend's reply comes back to the same game.

import { replyFragment, roomPrefix, type Stamp } from '@/links/room-link';

function here(): string {
  return `${location.origin}${location.pathname}${location.search}`;
}

/** The link that opens a room on a friend's device. */
export function roomUrl(data: string): string {
  return `${here()}${roomPrefix}${data}`;
}

/** The link a friend sends back. */
export function replyUrl(id: string, stamp: Stamp): string {
  return `${here()}${replyFragment({ id, stamp })}`;
}

/** The game with no fragment: a friend who wants to play it, from the start. */
export function gameUrl(): string {
  return here();
}
