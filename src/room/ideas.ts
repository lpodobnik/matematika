// The explanation cards' ideas (story 2.6, FR34). Pure: which of a room's ideas he hasn't had
// explained yet, and, for the city's log, which room explained each one.

import type { IdeaId, RoomSpec } from '@/room/types';

/** A room's ideas he hasn't had explained yet, each once, in the room's order. */
export function newIdeas(ideas: readonly IdeaId[], seen: readonly IdeaId[]): IdeaId[] {
  return ideas.filter((idea, index) => !seen.includes(idea) && ideas.indexOf(idea) === index);
}

/**
 * The ideas each told room explained, for the log: every idea he has seen belongs to the
 * first told room that uses it.
 */
export function ideasByRoom(
  told: readonly string[],
  seen: readonly IdeaId[],
  rooms: readonly Pick<RoomSpec, 'id' | 'ideas'>[],
): Map<string, IdeaId[]> {
  const byRoom = new Map<string, IdeaId[]>();
  const placed: IdeaId[] = [];
  for (const id of told) {
    const ideas = rooms.find((room) => room.id === id)?.ideas ?? [];
    const here = newIdeas(ideas, placed).filter((idea) => seen.includes(idea));
    placed.push(...here);
    byRoom.set(id, here);
  }
  return byRoom;
}
