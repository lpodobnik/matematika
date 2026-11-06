// The one union of domain events (architecture, Pattern 4). Each pure folder defines the
// events its reducers return, since it can't import the store; this file joins them.
// Effects (saving, audio, the play log) listen to these and never to raw state changes.

import type { RoomEvent } from '@/room/events';
import type { RoomSpec } from '@/room/types';

/**
 * The root reducer's own events. `SaveChanged` (story 2.1): the saved slice changed (a tool,
 * a first use, the economy, a setting, a new game, a room left halfway), so the save is
 * written. `RoomLeft` (story 2.2): he left a room for the map before finishing it.
 */
export type StoreEvent = { type: 'SaveChanged' } | { type: 'RoomLeft'; roomId: RoomSpec['id'] };

export type DomainEvent = RoomEvent | StoreEvent;
export type DomainEventType = DomainEvent['type'];

/** Whether an event is the room's own rather than the store's (`SaveChanged`). */
export function isRoomEvent(event: DomainEvent): event is RoomEvent {
  return event.type !== 'SaveChanged' && event.type !== 'RoomLeft';
}
